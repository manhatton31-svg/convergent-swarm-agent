import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { buildFeedbackRequest } from '../feedback/feedback';
import { appendLedgerEntry } from '../ledger/stigmergic-ledger';
import type {
  LedgerTaskEntry,
  TaskRequest,
  TransitionArtifact,
} from '../types';
import { TASK_REQUEST_INPUT_SCHEMA } from '../schemas/task-schemas';
import { validateAgainstSchema } from '../schemas/validate';
import { buildArtifactSections } from './architect';

export function validateTaskRequest(request: unknown): string[] {
  const schemaErrors = validateAgainstSchema(TASK_REQUEST_INPUT_SCHEMA, request);
  if (schemaErrors.length > 0) {
    return schemaErrors.map((e) => `Schema: ${e}`);
  }

  const req = request as TaskRequest;
  const errors: string[] = [];

  if (!req.context?.current_marketing_model?.trim()) {
    errors.push('context.current_marketing_model must be a non-empty string');
  }

  if (
    req.task_type === 'convergence_analysis' &&
    req.context.approaches_to_converge &&
    req.context.approaches_to_converge.length < 2
  ) {
    errors.push('convergence_analysis requires approaches_to_converge with at least 2 items');
  }

  return errors;
}

export async function handleTask(request: unknown): Promise<TransitionArtifact> {
  const errors = validateTaskRequest(request);
  if (errors.length > 0) {
    throw new TaskValidationError(errors);
  }

  const req = request as TaskRequest;
  const taskId = req.task_id ?? uuidv4();
  const sections = buildArtifactSections(req.context, req.task_type);

  const artifact: TransitionArtifact = {
    task_id: taskId,
    generated_at: new Date().toISOString(),
    requesting_agent: req.requesting_agent,
    agent_name: config.agentName,
    agent_version: config.agentVersion,
    task_type: req.task_type,
    ...sections,
    stigmergic_ledger_ref: config.ledgerRef,
    feedback_request: buildFeedbackRequest(taskId),
  };

  const ledgerEntry: LedgerTaskEntry = {
    type: 'task',
    task_id: taskId,
    requesting_agent: req.requesting_agent,
    timestamp: artifact.generated_at,
    task_type: req.task_type,
    business_name: req.context.business_name,
    summary: sections.current_state_analysis.summary,
    readiness_score: sections.current_state_analysis.agent_economy_readiness_score,
  };

  await appendLedgerEntry(ledgerEntry);

  return artifact;
}

/** Parse natural-language or JSON chat messages from Agentverse */
export function parseChatToTask(
  message: string,
  requestingAgent = 'agentverse-chat-user'
): TaskRequest {
  const trimmed = message.trim();

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as TaskRequest;
      if (!parsed.requesting_agent) {
        parsed.requesting_agent = requestingAgent;
      }
      return parsed;
    } catch {
      // Fall through to text parsing
    }
  }

  return {
    requesting_agent: requestingAgent,
    task_type: 'future_state_transition',
    context: {
      business_name: extractField(trimmed, 'business') ?? 'Unknown Business',
      industry: extractField(trimmed, 'industry') ?? 'marketing',
      current_marketing_model: trimmed,
      goals: ['Transition toward agent-economy-ready marketing'],
    },
  };
}

function extractField(text: string, field: string): string | undefined {
  const regex = new RegExp(`${field}[:\\s]+([^.,;\\n]+)`, 'i');
  const match = text.match(regex);
  return match?.[1]?.trim();
}

export class TaskValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Invalid task request: ${errors.join('; ')}`);
    this.name = 'TaskValidationError';
  }
}