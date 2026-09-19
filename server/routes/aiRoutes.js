import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Challenge from '../models/Challenge.js';
import Project from '../models/Project.js';

const router = express.Router();

function getSahayakApiUrl() {
  return (process.env.SAHAYAK_API_URL || 'http://localhost:8000').replace(/\/$/, '');
}

router.post('/detect-urgency', authMiddleware, async (req, res, next) => {
  const input = req.body || {};
  const fields = ['title', 'description', 'category', 'affected', 'expectedImpact', 'location'];
  if (!fields.every((field) => typeof input[field] === 'string')) {
    return res.status(400).json({ success: false, message: 'Problem details must be provided as text' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  try {
    const response = await fetch(`${getSahayakApiUrl()}/detect-urgency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fields.map((field) => [field, input[field].trim().slice(0, 2000)]))),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ success: false, message: data.detail || data.message || 'Urgency detection failed' });
    return res.json({ success: true, data });
  } catch (error) {
    if (error.name === 'AbortError') return res.status(504).json({ success: false, message: 'Urgency detection timed out' });
    return next(error);
  } finally {
    clearTimeout(timeout);
  }
});

router.post('/solution-recommendations', authMiddleware, async (req, res, next) => {
  try {
    const { challengeId } = req.body || {};
    if (typeof challengeId !== 'string' || !challengeId.trim()) {
      return res.status(400).json({ success: false, message: 'Challenge ID is required' });
    }

    const user = await User.findById(req.user.id).select('role institution universityDepartment universityRole');
    const challenge = await Challenge.findById(challengeId).lean();
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    if (!user || user.role !== 'university') {
      return res.status(403).json({ success: false, message: 'Only authorized University users can request solution recommendations' });
    }

    const assignedUniversity = challenge.assignedUniversity
      ? await User.findById(challenge.assignedUniversity).select('institution')
      : null;
    const sameUniversity = assignedUniversity?.institution && assignedUniversity.institution === user.institution;
    const isCoordinator = user.universityRole === 'innovation_coordinator';
    const isDepartmentUser = sameUniversity && user.universityDepartment && user.universityDepartment === challenge.department;
    const isMentor = challenge.departmentMentor?.toString() === req.user.id;
    if (!isCoordinator && !isDepartmentUser && !isMentor) {
      return res.status(403).json({ success: false, message: 'You do not have access to recommendations for this challenge' });
    }

    const candidates = await Project.find({
      status: { $in: ['deployed', 'completed'] },
      solutionStatus: 'submitted',
      challenge: { $exists: true }
    })
      .populate({
        path: 'challenge',
        match: { status: 'resolved' },
        select: 'title description category affected expectedImpact district villageOrCity department'
      })
      .select('title description solutionTitle solutionDescription solutionApproach technology implementationDetails expectedOutcome universityDepartment university challenge')
      .limit(20)
      .lean();
    const eligible = candidates.filter((project) => project.challenge);
    if (!eligible.length) return res.json({ success: true, data: { recommendations: [] } });

    const candidateContext = eligible.map((project) => ({
      solutionId: project._id.toString(),
      originalProblem: {
        title: project.challenge.title,
        description: project.challenge.description,
        category: project.challenge.category,
        affected: project.challenge.affected,
        expectedImpact: project.challenge.expectedImpact,
        district: project.challenge.district,
        department: project.challenge.department || project.universityDepartment
      },
      solution: {
        title: project.solutionTitle || project.title,
        description: project.solutionDescription,
        approach: project.solutionApproach,
        technology: project.technology,
        implementationDetails: project.implementationDetails,
        outcome: project.expectedOutcome
      }
    }));
    const context = {
      newProblem: {
        title: challenge.title, description: challenge.description, category: challenge.category,
        affected: challenge.affected, expectedImpact: challenge.expectedImpact,
        district: challenge.district, villageOrCity: challenge.villageOrCity, department: challenge.department
      },
      verifiedCandidates: candidateContext
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35_000);
    let response;
    try {
      response = await fetch(`${getSahayakApiUrl()}/solution-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
        signal: controller.signal
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        return res.status(503).json({ success: false, message: 'AI recommendations are temporarily unavailable. You can browse the Solution Library manually.' });
      }
      return res.status(503).json({ success: false, message: 'AI recommendations are temporarily unavailable. You can browse the Solution Library manually.' });
    } finally {
      clearTimeout(timeout);
    }
    const data = await response.json();
    if (!response.ok) return res.status(503).json({ success: false, message: 'AI recommendations are temporarily unavailable. You can browse the Solution Library manually.' });
    const raw = typeof data?.message === 'string' ? data.message : '';
    const jsonText = raw.match(/\{[\s\S]*\}/)?.[0];
    let parsed;
    try {
      parsed = jsonText ? JSON.parse(jsonText) : data?.recommendations ? data : null;
    } catch {
      parsed = null;
    }
    const candidateMap = new Map(eligible.map((project) => [project._id.toString(), project]));
    const recommendations = Array.isArray(parsed?.recommendations)
      ? parsed.recommendations.slice(0, 3).flatMap((item) => {
        const project = candidateMap.get(String(item?.solutionId || ''));
        if (!project || typeof item?.reason !== 'string' || !Array.isArray(item?.relevantAspects)) return [];
        return [{
          solutionId: project._id,
          reason: item.reason.trim().slice(0, 500),
          relevantAspects: item.relevantAspects.filter((aspect) => typeof aspect === 'string').slice(0, 5),
          solution: project
        }];
      })
      : [];
    return res.json({ success: true, data: { recommendations } });
  } catch (error) {
    if (error.name === 'AbortError') return res.status(503).json({ success: false, message: 'AI recommendations are temporarily unavailable. You can browse the Solution Library manually.' });
    next(error);
  }
});

export default router;
