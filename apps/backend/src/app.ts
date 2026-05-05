import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import translateRoutes from './routes/translate.routes';
import authRoutes from './routes/auth.routes';
import errorHandler from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app: Express = express();

// Trust proxy (Nginx in Docker, load balancer in prod)
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Corpo Lingo API is running.',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/translate', translateRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
