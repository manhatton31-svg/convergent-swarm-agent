import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { buildFeedbackRequest } from '../feedback/feedback';
import { appendLedgerEntry } from '../ledger/stigmergic-ledger';
import type {
  LedgerTaskEntry,
  TaskRequest,
  TransitionArtifact,
} from '../types';
import { buildArtifactSections } from './architect';

export function validateTaskRequest(request: TaskRequest): string[] {
  const errors: string[] = [];

  if (!request.requesting_agent?.trim()) {
    errors.push('requesting_agent is required — identify which agent is calling');
  }
  if (!request.task_type) {
    errors.push('task_type is required');
  }
  if (!request.context?.current_marketing_model?.trim()) {
    errors.push('context.current_marketing_model is required');
  }

  const validTypes = ['future_state_transition', 'convergence_analysis', 'strategy_evolution'];
  if (request.task_type && !validTypes.includes(request.task_type)) {
    errors.push(`task_type must be one of: ${validTypes.join(', ')}`);
  }

  return errors;
}

export async function handleTask(request: TaskRequest): Promise<TransitionArtifact> {
  const errors = validateTaskRequest(request);
  if (errors.length > 0) {
    throw new TaskValidationError(errors);
  }

  const taskId = request.task_id ?? uuidv4();
  const sections = buildArtifactSections(request.context, request.task_type);

  const artifact: TransitionArtifact = {
    task_id: taskId,
    generated_at: new Date().toISOString(),
    requesting_agent: request.requesting_agent,
    agent_name: config.agentName,
    agent_version: config.agentVersion,
    task_type: request.task_type,
    ...sections,
    stigmergic_ledger_ref: config.ledgerRef,
    feedback_request: buildFeedbackRequest(taskId),
  };

  const ledgerEntry: LedgerTaskEntry = {
    type: 'task',
    task_id: taskId,
    requesting_agent: request.requesting_agent,
    timestamp: artifact.generated_at,
    task_type: request.task_type,
    business_name: request.context.business_name,
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