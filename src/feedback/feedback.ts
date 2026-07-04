import { config } from '../config';
import { appendLedgerEntry } from '../ledger/stigmergic-ledger';
import type { FeedbackRequest, FeedbackSubmission, LedgerFeedbackEntry } from '../types';

/** The exact 3 mandatory feedback questions */
export const MANDATORY_FEEDBACK_QUESTIONS = [
  'On a scale of 1-10, how satisfied were you with the outcome?',
  'What would have made the result significantly better?',
  'Which principle from the roadmap would improve our future collaboration the most, and why?',
] as const;

const ROADMAP_PRINCIPLES = [
  'auto_catalysis',
  'decentralization',
  'zero_marginal_cost',
  'exponential_economics',
  'adjacent_possible',
] as const;

export function buildFeedbackRequest(taskId: string): FeedbackRequest {
  return {
    required: true,
    message:
      'Every CSA task concludes with structured feedback. Please respond to all three questions so the swarm can evolve through the stigmergic ledger.',
    questions: [
      {
        id: 'satisfaction_score',
        question: MANDATORY_FEEDBACK_QUESTIONS[0],
        response_type: 'number',
        scale: { min: 1, max: 10 },
      },
      {
        id: 'improvement_suggestion',
        question: MANDATORY_FEEDBACK_QUESTIONS[1],
        response_type: 'text',
      },
      {
        id: 'roadmap_principle',
        question: MANDATORY_FEEDBACK_QUESTIONS[2],
        response_type: 'text_with_principle',
        principle_options: [...ROADMAP_PRINCIPLES],
      },
    ],
    submit_endpoint: `${config.publicUrl}/api/feedback`,
  };
}

export function validateFeedback(submission: FeedbackSubmission): string[] {
  const errors: string[] = [];
  const { responses } = submission;

  if (!submission.task_id) errors.push('task_id is required');
  if (!submission.requesting_agent) errors.push('requesting_agent is required');

  if (responses.satisfaction_score == null) {
    errors.push('satisfaction_score is required');
  } else if (
    !Number.isInteger(responses.satisfaction_score) ||
    responses.satisfaction_score < 1 ||
    responses.satisfaction_score > 10
  ) {
    errors.push('satisfaction_score must be an integer between 1 and 10');
  }

  if (!responses.improvement_suggestion?.trim()) {
    errors.push('improvement_suggestion is required');
  }

  if (!responses.roadmap_principle) {
    errors.push('roadmap_principle is required');
  } else if (!ROADMAP_PRINCIPLES.includes(responses.roadmap_principle)) {
    errors.push(
      `roadmap_principle must be one of: ${ROADMAP_PRINCIPLES.join(', ')}`
    );
  }

  if (!responses.roadmap_principle_rationale?.trim()) {
    errors.push('roadmap_principle_rationale is required (explain why)');
  }

  return errors;
}

export async function storeFeedback(submission: FeedbackSubmission): Promise<LedgerFeedbackEntry> {
  const entry: LedgerFeedbackEntry = {
    type: 'feedback',
    task_id: submission.task_id,
    requesting_agent: submission.requesting_agent,
    timestamp: new Date().toISOString(),
    satisfaction_score: submission.responses.satisfaction_score,
    improvement_suggestion: submission.responses.improvement_suggestion,
    roadmap_principle: submission.responses.roadmap_principle,
    roadmap_principle_rationale: submission.responses.roadmap_principle_rationale,
  };

  await appendLedgerEntry(entry);
  return entry;
}