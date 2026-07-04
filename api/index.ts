/**
 * Vercel serverless entry point.
 * Exports the Express app so all routes work on Vercel's platform.
 */
import { createServer } from '../src/server';

export default createServer();