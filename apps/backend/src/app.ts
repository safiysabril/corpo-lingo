import express, { type Express, type Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import jwt from 'jsonwebtoken';

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

function getAuthUserId(req: Request): number | null {
  const token = (req as any).cookies?.token;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-in-production') as unknown as { sub: number };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

// 100 requests/day for authenticated users, 10/day for guests
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: (req) => (getAuthUserId(req) !== null ? 100 : 10),
  keyGenerator: (req) => {
    const userId = getAuthUserId(req);
    // ipKeyGenerator normalises IPv6 addresses to a subnet so guests can't
    // bypass the limit by hopping addresses (required by express-rate-limit v8).
    return userId !== null ? `user:${userId}` : `guest:${ipKeyGenerator(req.ip ?? '')}`;
  },
  message: { success: false, error: 'Too many requests, please try again later.' },
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
