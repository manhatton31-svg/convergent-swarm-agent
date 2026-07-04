import { config } from '../config';

const SCHEMA_BASE = `${config.publicUrl}/schemas`;

/** JSON Schema for POST /api/coordinated-workflow request body */
export const COORDINATED_WORKFLOW_INPUT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `${SCHEMA_BASE}/coordinated-workflow-request.json`,
  title: 'CSA Coordinated Workflow Request',
  description:
    'Request a multi-agent workflow plan — CSA decomposes the objective, matches collaborators from the stigmergic ledger, and estimates costs.',
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
      description: 'Identifier of the orchestrating agent submitting this workflow request',
    },
    task_type: {
      type: 'string',
      const: 'coordinated_workflow',
      description: 'Must be "coordinated_workflow"',
    },
    context: {
      type: 'object',
      required: ['objective'],
      properties: {
        objective: {
          type: 'string',
          minLength: 1,
          description: 'Main task or goal to decompose into coordinated subtasks',
        },
        business_name: { type: 'string', description: 'Business or client name' },
        industry: { type: 'string', description: 'Industry or vertical' },
        budget_usd: {
          type: 'number',
          minimum: 0,
          description: 'Optional total budget hint in USD for cost calibration',
        },
        constraints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Operational or business constraints',
        },
        goals: {
          type: 'array',
          items: { type: 'string' },
          description: 'Desired outcomes from the coordinated workflow',
        },
        additional_context: {
          type: 'string',
          description: 'Free-form context for workflow planning',
        },
        current_marketing_model: {
          type: 'string',
          description: 'Optional alias — used as objective supplement when provided',
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

/** JSON Schema for coordinated workflow artifact response */
export const COORDINATED_WORKFLOW_OUTPUT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `${SCHEMA_BASE}/coordinated-workflow-artifact.json`,
  title: 'CSA Coordinated Workflow Artifact',
  description:
    'Workflow plan with decomposed subtasks, ledger-matched agent team, cost estimates, and CSA coordination fee.',
  type: 'object',
  required: [
    'task_id',
    'generated_at',
    'requesting_agent',
    'agent_name',
    'agent_version',
    'skill',
    'principles_applied',
    'main_objective',
    'workflow_summary',
    'subtasks',
    'recommended_team',
    'cost_breakdown',
    'ledger_signals_used',
    'stigmergic_ledger_ref',
    'feedback_request',
  ],
  properties: {
    task_id: { type: 'string' },
    generated_at: { type: 'string', format: 'date-time' },
    requesting_agent: { type: 'string' },
    agent_name: { type: 'string' },
    agent_version: { type: 'string' },
    skill: { type: 'string', const: 'coordinated_workflow' },
    principles_applied: {
      type: 'array',
      items: { type: 'string', enum: ['stigmergy', 'first_principles', 'convergence'] },
      minItems: 2,
    },
    main_objective: { type: 'string' },
    workflow_summary: { type: 'string' },
    subtasks: {
      type: 'array',
      minItems: 2,
      items: {
        type: 'object',
        required: [
          'subtask_id',
          'sequence',
          'name',
          'description',
          'estimated_duration',
          'recommended_agent_id',
          'recommended_agent_name',
          'estimated_cost_usd',
          'match_rationale',
          'depends_on',
        ],
        properties: {
          subtask_id: { type: 'string' },
          sequence: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          description: { type: 'string' },
          estimated_duration: { type: 'string' },
          recommended_agent_id: { type: 'string' },
          recommended_agent_name: { type: 'string' },
          estimated_cost_usd: { type: 'number', minimum: 0 },
          match_rationale: { type: 'string' },
          depends_on: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    recommended_team: {
      type: 'array',
      minItems: 2,
      maxItems: 4,
      items: {
        type: 'object',
        required: [
          'agent_id',
          'display_name',
          'capabilities',
          'ledger_task_count',
          'average_satisfaction',
          'availability_signal',
          'estimated_total_cost_usd',
          'subtasks_assigned',
        ],
        properties: {
          agent_id: { type: 'string' },
          display_name: { type: 'string' },
          capabilities: { type: 'array', items: { type: 'string' } },
          ledger_task_count: { type: 'integer', minimum: 0 },
          average_satisfaction: { type: ['number', 'null'] },
          availability_signal: {
            type: 'string',
            enum: ['active_in_ledger', 'feedback_only', 'inferred_capability', 'registered'],
          },
          estimated_total_cost_usd: { type: 'number', minimum: 0 },
          subtasks_assigned: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    cost_breakdown: {
      type: 'object',
      required: [
        'subtasks_total_usd',
        'coordination_fee_usd',
        'coordination_fee_percent',
        'total_estimated_usd',
        'currency',
      ],
      properties: {
        subtasks_total_usd: { type: 'number', minimum: 0 },
        coordination_fee_usd: { type: 'number', minimum: 0 },
        coordination_fee_percent: { type: 'number', minimum: 5, maximum: 10 },
        total_estimated_usd: { type: 'number', minimum: 0 },
        currency: { type: 'string', const: 'USD' },
      },
    },
    ledger_signals_used: {
      type: 'integer',
      minimum: 0,
      description: 'Number of ledger entries consulted for agent matching',
    },
    stigmergic_ledger_ref: { type: 'string' },
    feedback_request: {
      type: 'object',
      required: ['required', 'message', 'questions', 'submit_endpoint'],
      properties: {
        required: { type: 'boolean', const: true },
        message: { type: 'string' },
        submit_endpoint: { type: 'string', format: 'uri' },
        questions: { type: 'array', minItems: 3, maxItems: 3 },
      },
    },
  },
} as const;