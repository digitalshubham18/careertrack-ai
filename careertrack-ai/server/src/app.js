const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');

const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const resumeRoutes = require('./routes/resume.routes');
const jobRoutes = require('./routes/job.routes');
const jobListingRoutes = require('./routes/jobListing.routes');
const dsaRoutes = require('./routes/dsa.routes');
const companyRoutes = require('./routes/company.routes');
const careerScoreRoutes = require('./routes/careerScore.routes');
const atsRoutes = require('./routes/ats.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');

function createApp(io) {
  const app = express();
  app.set('trust proxy', 1);

  // --- Security middleware ---
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // No origin (e.g. curl, server-to-server, mobile apps) - allow.
        if (!origin) return callback(null, true);

        if (origin === env.clientUrl) return callback(null, true);

        // In non-production, allow any localhost/127.0.0.1 port so a Vite dev
        // server that fell back to a different port (5174, 5175, ...) still
        // works without editing .env every time.
        if (env.nodeEnv !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`CORS: origin ${origin} is not allowed`));
      },
      credentials: true,
    })
  );
  app.use(mongoSanitize()); // strips $ and . from user input to prevent NoSQL injection
  app.use(xss()); // sanitizes user input against XSS

  // --- Body parsing (with request size limits) ---
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // --- Static file serving for local (non-Cloudinary) resume storage ---
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // --- Logging ---
  if (env.nodeEnv !== 'test') {
    app.use(
      morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
      })
    );
  }

  // --- Attach io instance so controllers can emit real-time notifications ---
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  // --- Rate limiting on all /api routes ---
  app.use('/api', apiLimiter);

  app.get('/api/health', (req, res) => res.json({ success: true, message: 'CareerTrack AI API is running' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/job-board', jobListingRoutes);
  app.use('/api/dsa', dsaRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/career-score', careerScoreRoutes);
  app.use('/api/ats', atsRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
