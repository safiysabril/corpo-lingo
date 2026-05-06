import 'dotenv/config';
import app from './app';
import { initDb } from './db';

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
