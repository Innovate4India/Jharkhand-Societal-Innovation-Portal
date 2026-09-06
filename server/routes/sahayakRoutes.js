import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

function getSahayakApiUrl() {
  return (process.env.SAHAYAK_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
}

router.post('/chat', authMiddleware, async (req, res, next) => {
  const { problem, language } = req.body || {};
  if (typeof problem !== 'string' || !problem.trim()) {
    return res.status(400).json({ success: false, message: 'Problem text cannot be empty' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  try {
    const response = await fetch(`${getSahayakApiUrl()}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem: problem.trim(), language: language === 'hi' ? 'hi' : 'en' }),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ success: false, message: data.detail || data.message || 'Sahayak request failed' });
    return res.json({ success: true, data });
  } catch (error) {
    if (error.name === 'AbortError') return res.status(504).json({ success: false, message: 'Sahayak took too long to respond' });
    return next(error);
  } finally {
    clearTimeout(timeout);
  }
});

export default router;