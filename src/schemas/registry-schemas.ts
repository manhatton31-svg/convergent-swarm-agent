import { config } from '../config';

const SCHEMA_BASE = `${config.publicUrl}/schemas`;

/** JSON Schema for POST /api/register-agent request body */
export const AGENT_REGISTRATION_INPUT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `${SCHEMA_BASE}/agent-registration.json`,
  title: 'CSA Agent Registration',
  description:
    'Register or update an agent in the CSA stigmergic agent registry with skills, pricing, and availability.',
  type: 'object',
  required: ['agent_id', 'agent_name', 'skills', 'pricing', 'availability'],
  properties: {
    agent_id: {
      type: 'string',
      minLength: 1,
      description: 'Unique agent identifier (slug or A2A agent ID)',
    },
    agent_name: {
      type: 'string',
      minLength: 1,
      description: 'Human-readable display name',
    },
    skills: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 1,
      description: 'Skills this agent offers (e.g. convergence, strategy, content)',
    },
    pricing: {
      type: 'object',
      required: ['model', 'rate_usd'],
      properties: {
        model: {
          type: 'string',
          enum: ['hourly', 'per_task', 'fixed'],
          description: 'Pricing model type',
        },
        rate_usd: {
          type: 'number',
          minimum: 0,
          description: 'Rate in USD (hourly rate, per-task price, or fixed project price)',
        },
        notes: {
          type: 'string',
          description: 'Optional pricing notes or conditions',
        },
      },
    },
    availability: {
      type: 'string',
      enum: ['available', 'limited', 'unavailable'],
      description: 'Current availability status for new work',
    },
    description: {
      type: 'string',
      description: 'Short description of what this agent does',
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Discovery tags for registry search',
    },
  },
  additionalProperties: false,
} as const;

/** JSON Schema for agent registration response */
export const AGENT_REGISTRATION_OUTPUT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `${SCHEMA_BASE}/agent-registration-response.json`,
  title: 'CSA Agent Registration Response',
  type: 'object',
  required: ['message', 'entry', 'registry_endpoint', 'ledger_path'],
  properties: {
    message: { type: 'string' },
    entry: { type: 'object' },
    registry_endpoint: { type: 'string', format: 'uri' },
    ledger_path: { type: 'string' },
  },
} as const;

/** JSON Schema for GET /api/registry response */
export const AGENT_REGISTRY_QUERY_OUTPUT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `${SCHEMA_BASE}/agent-registry-query.json`,
  title: 'CSA Agent Registry Query Result',
  type: 'object',
  required: [
    'version',
    'last_updated',
    'query',
    'total_registered',
    'total_matching',
    'returned',
    'agents',
  ],
  properties: {
    version: { type: 'string' },
    last_updated: { type: 'string', format: 'date-time' },
    query: { type: 'object' },
    total_registered: { type: 'integer', minimum: 0 },
    total_matching: { type: 'integer', minimum: 0 },
    returned: { type: 'integer', minimum: 0 },
    agents: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'agent_id',
          'agent_name',
          'skills',
          'pricing',
          'availability',
          'registered_at',
        ],
        properties: {
          agent_id: { type: 'string' },
          agent_name: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          pricing: { type: 'object' },
          availability: { type: 'string', enum: ['available', 'limited', 'unavailable'] },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          registered_at: { type: 'string', format: 'date-time' },
          reputation: {
            type: 'object',
            properties: {
              ledger_task_count: { type: 'integer' },
              feedback_count: { type: 'integer' },
              average_satisfaction: { type: ['number', 'null'] },
            },
          },
        },
      },
    },
  },
} as const;

/** Query parameters schema for GET /api/registry (documented on agent card) */
export const AGENT_REGISTRY_QUERY_INPUT_SCHEMA = {
  type: 'object',
  description: 'Query parameters for GET /api/registry (append as URL query string)',
  properties: {
    skill: { type: 'string', description: 'Filter agents offering this skill (partial match)' },
    availability: {
      type: 'string',
      enum: ['available', 'limited', 'unavailable'],
      description: 'Filter by availability status',
    },
    max_price_usd: {
      type: 'number',
      minimum: 0,
      description: 'Maximum pricing rate_usd',
    },
    agent_id: { type: 'string', description: 'Filter by exact agent ID' },
    tag: { type: 'string', description: 'Filter by tag (partial match)' },
    limit: { type: 'integer', minimum: 1, maximum: 100, description: 'Max results (default 50)' },
  },
} as const;