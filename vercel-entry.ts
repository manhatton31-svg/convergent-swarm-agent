/**
 * Vercel serverless entry — handles ALL routes including /api/task, /api/chat, etc.
 * Kept outside /api folder to avoid Vercel's per-file /api/* routing conflict.
 */
import { createServer } from './src/server';

export default createServer();