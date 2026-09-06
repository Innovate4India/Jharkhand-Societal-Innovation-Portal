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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sahayak', sahayakRoutes);

// 404 Middleware
app.use(notFound);

// Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
