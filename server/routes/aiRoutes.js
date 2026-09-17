import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';

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

export default router;
