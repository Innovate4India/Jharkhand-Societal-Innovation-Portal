import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Jharkhand Innovation Portal API is running'
  });
});

export default router;
