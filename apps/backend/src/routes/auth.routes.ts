import { Router, type Router as ExpressRouter } from 'express';
import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';
import { register, login, logout, me, forgotPassword, resetPassword, googleAuth } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router: ExpressRouter = Router();

function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      error: 'Validation failed.',
      details: errors.array().map((e: any) => ({ field: e.path, message: e.msg })),
    });
    return;
  }
  next();
}

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  validate,
  register,
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login,
);

router.post('/logout', logout);
router.post('/google', googleAuth);
router.get('/me', authenticate, me);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required.')],
  validate,
  forgotPassword,
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  validate,
  resetPassword,
);

export default router;
