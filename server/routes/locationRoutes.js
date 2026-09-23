import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/reverse-geocode', authMiddleware, async (req, res, next) => {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const query = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: 'jsonv2',
      addressdetails: '1',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Jharkhand-Societal-Innovation-Portal/1.0' },
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ success: false, message: 'Reverse geocoding failed' });
    return res.json({
      success: true,
      data: {
        displayName: typeof data.display_name === 'string' ? data.display_name : '',
        village: data.address?.village || data.address?.locality || '',
        ward: data.address?.neighbourhood || data.address?.quarter || '',
        town: data.address?.town || '',
        city: data.address?.city || data.address?.municipality || '',
        district: data.address?.county || data.address?.state_district || '',
        state: data.address?.state || '',
        country: data.address?.country || '',
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') return res.status(504).json({ success: false, message: 'Reverse geocoding timed out' });
    return next(error);
  } finally {
    clearTimeout(timeout);
  }
});

export default router;
