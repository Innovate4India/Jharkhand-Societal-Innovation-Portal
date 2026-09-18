import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import sahayakRoutes from './routes/sahayakRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import industryRoutes from './routes/industryRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number.parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const configuredOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const developmentOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const allowedOrigins = configuredOrigins.length ? configuredOrigins : developmentOrigins;
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin is not allowed'));
  },
  credentials: true,
}));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sahayak', sahayakRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/clubs', clubRoutes);

// 404 Middleware
app.use(notFound);

// Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`\n✓ Server running on http://${HOST}:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
