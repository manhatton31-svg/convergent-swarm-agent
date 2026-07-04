import { config } from '../config';

const SCHEMA_BASE = `${config.publicUrl}/schemas`;

/** JSON Schema for POST /api/task request body */
export const TASK_REQUEST_INPUT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `${SCHEMA_BASE}/task-request.json`,
  title: 'CSA Task Request',
  description:
    'Structured input for requesting a future-state transition, convergence analysis, or strategy evolution.',
  type: 'object',
  required: ['requesting_agent', 'task_type', 'context'],
  properties: {
    task_id: {
      type: 'string',
      description: 'Optional caller-provided task ID (UUID generated if omitted)',
    },
    requesting_agent: {
      type: 'string',
      minLength: 1,
      description: 'Identifier of the agent submitting this task',
    },
    task_type: {
      type: 'string',
      enum: ['future_state_transition', 'convergence_analysis', 'strategy_evolution'],
      description: 'Type of transition analysis to perform',
    },
    context: {
      type: 'object',
      required: ['current_marketing_model'],
      properties: {
        business_name: { type: 'string', description: 'Name of the business being analyzed' },
        industry: { type: 'string', description: 'Industry or vertical' },
        current_marketing_model: {
          type: 'string',
          minLength: 1,
          description: 'Description of the current marketing/business model',
        },
        current_channels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Active marketing channels',
        },
        target_audience: { type: 'string', description: 'Primary buyer or audience' },
        constraints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Business or operational constraints',
        },
        goals: {
          type: 'array',
          items: { type: 'string' },
          description: 'Desired outcomes from the transition',
        },
        approaches_to_converge: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
          minItems: 2,
          description: 'Two or more approaches to synthesize (recommended for convergence_analysis)',
        },
        additional_context: {
          type: 'string',
          description: 'Free-form context for the architect',
        },
      },
      additionalProperties: true,
    },
    metadata: {
      type: 'object',
      description: 'Optional caller metadata (priority, trace IDs, etc.)',
      additionalProperties: true,
    },
  },
  additionalProperties: true,
} as const;

/** JSON Schema for transition artifact returned by CSA */
export const TRANSITION_ARTIFACT_OUTPUT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `${SCHEMA_BASE}/transition-artifact.json`,
  title: 'CSA Transition Artifact',
  description:
    'Structured output artifact with current-state analysis, future-state recommendations, convergences, transition plan, and mandatory feedback request.',
  type: 'object',
  required: [
    'task_id',
    'generated_at',
    'requesting_agent',
    'agent_name',
    'agent_version',
    'task_type',
    'principles_applied',
    'current_state_analysis',
    'future_state_recommendations',
    'convergence_opportunities',
    'transition_steps',
    'estimated_impact',
    'stigmergic_ledger_ref',
    'feedback_request',
  ],
  properties: {
    task_id: { type: 'string' },
    generated_at: { type: 'string', format: 'date-time' },
    requesting_agent: { type: 'string' },
    agent_name: { type: 'string' },
    agent_version: { type: 'string' },
    task_type: {
      type: 'string',
      enum: ['future_state_transition', 'convergence_analysis', 'strategy_evolution'],
    },
    principles_applied: {
      type: 'array',
      items: { type: 'string', enum: ['stigmergy', 'first_principles', 'convergence'] },
      minItems: 3,
    },
    current_state_analysis: {
      type: 'object',
      required: [
        'summary',
        'marketing_model_assessment',
        'agent_economy_readiness_score',
        'strengths',
        'gaps',
        'first_principles_breakdown',
      ],
      properties: {
        summary: { type: 'string' },
        marketing_model_assessment: { type: 'string' },
        agent_economy_readiness_score: { type: 'integer', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        first_principles_breakdown: {
          type: 'object',
          required: ['fundamental_need', 'current_assumptions', 'constraints_to_remove'],
          properties: {
            fundamental_need: { type: 'string' },
            current_assumptions: { type: 'array', items: { type: 'string' } },
            constraints_to_remove: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    future_state_recommendations: {
      type: 'object',
      required: [
        'vision_statement',
        'target_state',
        'agent_economy_alignment',
        'recommended_capabilities',
        'business_model_shifts',
        'timeline_horizon',
      ],
      properties: {
        vision_statement: { type: 'string' },
        target_state: { type: 'string' },
        agent_economy_alignment: { type: 'string' },
        recommended_capabilities: { type: 'array', items: { type: 'string' } },
        business_model_shifts: { type: 'array', items: { type: 'string' } },
        timeline_horizon: { type: 'string' },
      },
    },
    convergence_opportunities: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: [
          'convergence_name',
          'approaches',
          'combined_strategy',
          'synergy_rationale',
          'expected_multiplier',
          'first_action',
        ],
        properties: {
          convergence_name: { type: 'string' },
          approaches: { type: 'array', items: { type: 'string' }, minItems: 2 },
          combined_strategy: { type: 'string' },
          synergy_rationale: { type: 'string' },
          expected_multiplier: { type: 'string' },
          first_action: { type: 'string' },
        },
      },
    },
    transition_steps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['phase', 'name', 'description', 'duration', 'dependencies', 'success_metrics'],
        properties: {
          phase: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          description: { type: 'string' },
          duration: { type: 'string' },
          dependencies: { type: 'array', items: { type: 'string' } },
          success_metrics: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    estimated_impact: {
      type: 'object',
      required: [
        'revenue_potential',
        'cost_efficiency',
        'speed_to_market',
        'competitive_advantage',
        'risk_level',
        'confidence_score',
      ],
      properties: {
        revenue_potential: { type: 'string' },
        cost_efficiency: { type: 'string' },
        speed_to_market: { type: 'string' },
        competitive_advantage: { type: 'string' },
        risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
        confidence_score: { type: 'integer', minimum: 0, maximum: 100 },
      },
    },
    stigmergic_ledger_ref: {
      type: 'string',
      description: 'URL or path to the shared stigmergic ledger',
    },
    feedback_request: {
      type: 'object',
      required: ['required', 'message', 'questions', 'submit_endpoint'],
      properties: {
        required: { type: 'boolean', const: true },
        message: { type: 'string' },
        submit_endpoint: { type: 'string', format: 'uri' },
        questions: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: {
            type: 'object',
            required: ['id', 'question', 'response_type'],
            properties: {
              id: { type: 'string' },
              question: { type: 'string' },
              response_type: { type: 'string', enum: ['number', 'text', 'text_with_principle'] },
            },
          },
        },
      },
    },
  },
} as const;

/** Feedback submission schema (POST /api/feedback) */
export const FEEDBACK_INPUT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `${SCHEMA_BASE}/feedback-submission.json`,
  title: 'CSA Feedback Submission',
  type: 'object',
  required: ['task_id', 'requesting_agent', 'responses'],
  properties: {
    task_id: { type: 'string', minLength: 1 },
    requesting_agent: { type: 'string', minLength: 1 },
    responses: {
      type: 'object',
      required: [
        'satisfaction_score',
        'improvement_suggestion',
        'roadmap_principle',
        'roadmap_principle_rationale',
      ],
      properties: {
        satisfaction_score: { type: 'integer', minimum: 1, maximum: 10 },
        improvement_suggestion: { type: 'string', minLength: 1 },
        roadmap_principle: {
          type: 'string',
          enum: [
            'auto_catalysis',
            'decentralization',
            'zero_marginal_cost',
            'exponential_economics',
            'adjacent_possible',
          ],
        },
        roadmap_principle_rationale: { type: 'string', minLength: 1 },
      },
    },
  },
} as const;