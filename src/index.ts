import { startServer } from './server';

startServer().catch((err) => {
  console.error('Failed to start Convergent Swarm Agent:', err);
  process.exit(1);
});