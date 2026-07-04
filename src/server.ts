import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { buildAgentCard } from './agent/agent-card';
import {
  FEEDBACK_INPUT_SCHEMA,
  TASK_REQUEST_INPUT_SCHEMA,
  TRANSITION_ARTIFACT_OUTPUT_SCHEMA,
} from './schemas/task-schemas';
import {
  COORDINATED_WORKFLOW_INPUT_SCHEMA,
  COORDINATED_WORKFLOW_OUTPUT_SCHEMA,
} from './schemas/workflow-schemas';
import { handleCoordinatedWorkflow } from './agent/coordinated-workflow';
import { handleTask, parseChatToTask } from './agent/task-handler';
import { config } from './config';
import { ErrorCode, handleRouteError, sendError } from './errors/api-error';
import { assertValidFeedback, storeFeedback } from './feedback/feedback';
import { getHealthStatus } from './health/health';
import { parseLedgerQuery, queryLedger } from './ledger/stigmergic-ledger';
import type { TaskRequest } from './types';

const LEDGER_QUERY_USAGE = {
  task_type:
    'future_state_transition | convergence_analysis | strategy_evolution | coordinated_workflow',
  principle:
    'auto_catalysis | decentralization | zero_marginal_cost | exponential_economics | adjacent_possible',
  requesting_agent: 'agent identifier string',
  since: 'ISO-8601 timestamp (entries on or after this time)',
  limit: 'positive integer, max 100 (default 50)',
};

export function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.text({ type: 'text/plain', limit: '1mb' }));

  const healthHandler = async (_req: Request, res: Response) => {
    try {
      const { body, httpStatus } = await getHealthStatus();
      res.status(httpStatus).json(body);
    } catch (err) {
      handleRouteError(res, err, 'Health check error');
    }
  };

  app.get('/health', healthHandler);
  app.get('/status', healthHandler);

  app.get('/.well-known/agent.json', async (_req: Request, res: Response) => {
    try {
      res.json(await buildAgentCard());
    } catch (err) {
      handleRouteError(res, err, 'Agent card error');
    }
  });

  app.get('/api/agent-card', async (_req: Request, res: Response) => {
    try {
      res.json(await buildAgentCard());
    } catch (err) {
      handleRouteError(res, err, 'Agent card error');
    }
  });

  app.get('/api/schemas', (_req: Request, res: Response) => {
    res.json({
      task_request: TASK_REQUEST_INPUT_SCHEMA,
      transition_artifact: TRANSITION_ARTIFACT_OUTPUT_SCHEMA,
      coordinated_workflow_request: COORDINATED_WORKFLOW_INPUT_SCHEMA,
      coordinated_workflow_artifact: COORDINATED_WORKFLOW_OUTPUT_SCHEMA,
      feedback_submission: FEEDBACK_INPUT_SCHEMA,
    });
  });

  app.get('/api/system-prompt', async (_req: Request, res: Response) => {
    try {
      const prompt = await fs.readFile(config.systemPromptPath, 'utf-8');
      res.type('text/plain').send(prompt);
    } catch {
      sendError(res, 404, ErrorCode.NOT_FOUND, 'system-prompt.txt not found');
    }
  });

  app.get('/changelog', async (_req: Request, res: Response) => {
    try {
      const changelog = await fs.readFile(config.changelogPath, 'utf-8');
      res.type('text/markdown').send(changelog);
    } catch {
      sendError(res, 404, ErrorCode.NOT_FOUND, 'CHANGELOG.md not found');
    }
  });

  app.get('/api/ledger', async (req: Request, res: Response) => {
    const { query, errors } = parseLedgerQuery(req.query as Record<string, unknown>);

    if (errors.length > 0) {
      sendError(
        res,
        400,
        ErrorCode.INVALID_LEDGER_QUERY,
        'Invalid ledger query parameters',
        { validation_errors: errors, usage: LEDGER_QUERY_USAGE }
      );
      return;
    }

    try {
      const result = await queryLedger(query);
      res.json(result);
    } catch (err) {
      handleRouteError(res, err, 'Ledger query error');
    }
  });

  app.post('/api/task', async (req: Request, res: Response) => {
    try {
      if (req.body?.task_type === 'coordinated_workflow') {
        const artifact = await handleCoordinatedWorkflow(req.body);
        res.status(200).json(artifact);
        return;
      }
      const artifact = await handleTask(req.body);
      res.status(200).json(artifact);
    } catch (err) {
      handleRouteError(res, err, 'Task error');
    }
  });

  app.post('/api/coordinated-workflow', async (req: Request, res: Response) => {
    try {
      const body =
        req.body?.task_type === 'coordinated_workflow'
          ? req.body
          : { ...req.body, task_type: 'coordinated_workflow' };
      const artifact = await handleCoordinatedWorkflow(body);
      res.status(200).json(artifact);
    } catch (err) {
      handleRouteError(res, err, 'Coordinated workflow error');
    }
  });

  app.post('/api/feedback', async (req: Request, res: Response) => {
    try {
      const submission = assertValidFeedback(req.body);
      const entry = await storeFeedback(submission);
      res.status(201).json({
        message: 'Feedback stored in stigmergic ledger',
        entry,
        ledger_path: config.ledgerRef,
      });
    } catch (err) {
      handleRouteError(res, err, 'Feedback error');
    }
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
        sendError(
          res,
          400,
          ErrorCode.INVALID_REQUEST,
          'Send { message: "..." } or a full TaskRequest JSON body'
        );
        return;
      }

      const artifact = await handleTask(task);
      res.status(200).json({
        success: true,
        response: artifact,
        text_summary: artifact.current_state_analysis.summary,
      });
    } catch (err) {
      handleRouteError(res, err, 'Chat error');
    }
  });

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      agent: config.agentName,
      version: config.agentVersion,
      description: 'Future-State Transition Architect for marketing',
      endpoints: {
        task: 'POST /api/task',
        coordinated_workflow: 'POST /api/coordinated-workflow',
        chat: 'POST /api/chat',
        feedback: 'POST /api/feedback',
        ledger: 'GET /api/ledger?task_type&principle&requesting_agent&since&limit',
        agent_card: 'GET /.well-known/agent.json',
        changelog: 'GET /changelog',
        health: 'GET /health',
        status: 'GET /status',
      },
      documentation: 'See README.md',
    });
  });

  app.use((_req: Request, res: Response) => {
    sendError(res, 404, ErrorCode.NOT_FOUND, 'Endpoint not found');
  });

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    if (err instanceof SyntaxError && err.message.includes('JSON')) {
      sendError(res, 400, ErrorCode.INVALID_REQUEST, 'Malformed JSON request body');
      return;
    }

    handleRouteError(res, err, 'Unhandled error');
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