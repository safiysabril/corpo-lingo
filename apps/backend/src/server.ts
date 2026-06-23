import 'dotenv/config';
import app from './app';
import { initDb } from './db';

// In production a real JWT secret is mandatory — never fall back to the dev default,
// which would let anyone forge session tokens. Fail fast at startup instead.
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-in-production')
) {
  console.error('FATAL: JWT_SECRET must be set to a strong, unique value in production.');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

async function start() {
  await initDb();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Corporate Translator API`);
    console.log(`   Server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${PORT}/health\n`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated.');
    });
  });

  process.on('unhandledRejection', (err: any) => {
    console.error('Unhandled Rejection:', err?.message);
    server.close(() => process.exit(1));
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
