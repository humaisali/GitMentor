import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import configurePassport from './src/config/passport.js';
import authRoutes from './src/routes/authRoutes.js';
import repositoryRoutes from './src/routes/repositoryRoutes.js';
import insightRoutes from './src/routes/insightRoutes.js';
import roadmapRoutes from './src/routes/roadmapRoutes.js';
import calendarRoutes from './src/routes/calendarRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Session (required by Passport for OAuth handshake)
app.use(session({
  secret: process.env.JWT_SECRET || 'gitmentor-dev-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'GitMentor API is running.',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/analytics', analyticsRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
