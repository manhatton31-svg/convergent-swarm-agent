import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { buildAgentCard } from './agent/agent-card';
import { handleTask, parseChatToTask, TaskValidationError } from './agent/task-handler';
import { config } from './config';
import { storeFeedback, validateFeedback } from './feedback/feedback';
import { readLedger } from './ledger/stigmergic-ledger';
import type { FeedbackSubmission, TaskRequest } from './types';

export function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.text({ type: 'text/plain', limit: '1mb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      agent: config.agentName,
      version: config.agentVersion,
      principles_active: ['stigmergy', 'first_principles', 'convergence'],
    });
  });

  app.get('/.well-known/agent.json', (_req: Request, res: Response) => {
    res.json(buildAgentCard());
  });

  app.get('/api/agent-card', (_req: Request, res: Response) => {
    res.json(buildAgentCard());
  });

  app.get('/api/system-prompt', async (_req: Request, res: Response) => {
    try {
      const prompt = await fs.readFile(config.systemPromptPath, 'utf-8');
      res.type('text/plain').send(prompt);
    } catch {
      res.status(404).json({ error: 'system-prompt.txt not found' });
    }
  });

  app.get('/api/ledger', async (_req: Request, res: Response) => {
    const ledger = await readLedger();
    res.json(ledger);
  });

  app.post('/api/task', async (req: Request, res: Response) => {
    try {
      const artifact = await handleTask(req.body as TaskRequest);
      res.status(200).json(artifact);
    } catch (err) {
      if (err instanceof TaskValidationError) {
        res.status(400).json({ error: 'Validation failed', details: err.errors });
        return;
      }
      console.error('Task error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/feedback', async (req: Request, res: Response) => {
    const submission = req.body as FeedbackSubmission;
    const errors = validateFeedback(submission);

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    const entry = await storeFeedback(submission);
    res.status(201).json({
      message: 'Feedback stored in stigmergic ledger',
      entry,
      ledger_path: config.ledgerPath,
    });
  });

  /** Agentverse / A2A-friendly chat endpoint — accepts JSON task or plain text */
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      let task: TaskRequest;

      if (typeof req.body === 'string') {
        task = parseChatToTask(req.body);
      } else if (req.body?.message) {
        task = parseChatToTask(
          String(req.body.message),
          req.body.requesting_agent ?? 'agentverse-chat-user'
        );
      } else if (req.body?.context) {
        task = req.body as TaskRequest;
      } else {
        res.status(400).json({
          error: 'Send { message: "..." } or a full TaskRequest JSON body',
        });
        return;
      }

      const artifact = await handleTask(task);
      res.status(200).json({
        success: true,
        response: artifact,
        text_summary: artifact.current_state_analysis.summary,
      });
    } catch (err) {
      if (err instanceof TaskValidationError) {
        res.status(400).json({ error: 'Validation failed', details: err.errors });
        return;
      }
      console.error('Chat error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      agent: config.agentName,
      version: config.agentVersion,
      description: 'Future-State Transition Architect for marketing',
      endpoints: {
        task: 'POST /api/task',
        chat: 'POST /api/chat',
        feedback: 'POST /api/feedback',
        ledger: 'GET /api/ledger',
        agent_card: 'GET /.well-known/agent.json',
        health: 'GET /health',
      },
      documentation: 'See README.md',
    });
  });

  return app;
}

export async function startServer() {
  const app = createServer();
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(config.port, config.host, () => {
      console.log(`\n🐝 ${config.agentName} v${config.agentVersion}`);
      console.log(`   Listening on http://${config.host}:${config.port}`);
      console.log(`   Agent card: ${config.publicUrl}/.well-known/agent.json`);
      console.log(`   Ledger: ${path.relative(process.cwd(), config.ledgerPath)}\n`);
      resolve(server);
    });
  });
}