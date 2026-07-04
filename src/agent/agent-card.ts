import { config } from '../config';
import { CHANGELOG_RAW_URL, CHANGELOG_URL, VERSION } from '../version';
import { getReputationMetrics } from '../ledger/stigmergic-ledger';
import {
  FEEDBACK_INPUT_SCHEMA,
  TASK_REQUEST_INPUT_SCHEMA,
  TRANSITION_ARTIFACT_OUTPUT_SCHEMA,
} from '../schemas/task-schemas';
import type { AgentCard } from '../types';

const taskSchemas = {
  inputSchema: TASK_REQUEST_INPUT_SCHEMA as Record<string, unknown>,
  outputSchema: TRANSITION_ARTIFACT_OUTPUT_SCHEMA as Record<string, unknown>,
};

export async function buildAgentCard(): Promise<AgentCard> {
  const reputation = await getReputationMetrics();

  return {
    name: config.agentName,
    description:
      'Future-State Transition Architect for marketing. CSA helps other agents architect marketing ' +
      'and business models for where the agent economy is heading — not incremental tweaks on today\'s tactics. ' +
      'When procurement agents evaluate vendors, personal Jarvis agents shop on behalf of users, and ' +
      'category agents route demand, CSA designs the transition path: agent-legible positioning, trust ' +
      'credentials, converged strategies, and stigmergic coordination. Agents coordinate indirectly through ' +
      'a queryable shared ledger — read environmental signals by task type, roadmap principle, agent, or time ' +
      'without direct messaging. Built on three active principles (Stigmergy, First Principles, Convergence), ' +
      'guided by a five-principle long-term roadmap, and a mandatory post-task feedback loop.',
    url: `${config.publicUrl}/`,
    version: VERSION,
    protocolVersion: '0.2.5',
    defaultInputModes: ['text', 'application/json'],
    defaultOutputModes: ['application/json', 'text'],
    reputation,
    pricing: {
      model: 'free_during_beta',
      notes: 'Transaction fees may apply in future versions',
    },
    capabilities: {
      streaming: false,
      health: {
        endpoint: `${config.publicUrl}/health`,
        aliases: [`${config.publicUrl}/status`],
        description:
          'Machine-readable health and observability probe for orchestrators and calling agents — ' +
          'reports operational status, uptime, last activity, ledger state, and capability readiness',
        response_fields: {
          status: 'healthy | degraded | unhealthy — overall operational state',
          version: 'Current agent version string',
          uptime_seconds: 'Seconds since this server instance started',
          last_activity: 'ISO-8601 timestamp of most recent task or feedback (null if none)',
          capabilities_status:
            'ledger_mode (ephemeral|persistent), schemas_enabled, feedback_loop_enabled, stigmergic_ledger_queryable, system_prompt_available',
          ledger_status:
            'entry_count, task_entries, feedback_entries, last_write_time, readable',
          environment: 'production | development',
          timestamp: 'ISO-8601 time this health response was generated',
          agent: 'Agent display name',
        },
        status_codes: {
          '200': 'healthy or degraded — agent is reachable and mostly operational',
          '503': 'unhealthy — critical dependency failure (e.g. ledger unreadable)',
        },
        example: `${config.publicUrl}/health`,
      },
      feedback_loop: {
        enabled: true,
        required: true,
        endpoint: `${config.publicUrl}/api/feedback`,
        questions: 3,
        description:
          'Every task concludes with 3 mandatory feedback questions stored in the stigmergic ledger',
      },
      stigmergic_ledger: {
        enabled: true,
        queryable: true,
        endpoint: `${config.publicUrl}/api/ledger`,
        description:
          'Queryable shared JSON ledger for stigmergic coordination — agents read filtered environmental signals without direct messaging',
        query_parameters: {
          task_type: 'Filter task signals: future_state_transition | convergence_analysis | strategy_evolution',
          principle:
            'Filter feedback signals: auto_catalysis | decentralization | zero_marginal_cost | exponential_economics | adjacent_possible',
          requesting_agent: 'Filter by calling agent identifier',
          since: 'ISO-8601 timestamp — return entries on or after this time',
          limit: 'Max entries to return (default 50, max 100)',
        },
        examples: [
          `${config.publicUrl}/api/ledger?task_type=future_state_transition&limit=10`,
          `${config.publicUrl}/api/ledger?principle=adjacent_possible&since=2026-01-01T00:00:00Z`,
          `${config.publicUrl}/api/ledger?requesting_agent=growth-strategist-agent-v2`,
        ],
      },
      principles: {
        active: [
          {
            id: 'stigmergy',
            name: 'Stigmergy',
            description: 'Coordinate through a shared JSON ledger instead of constant direct messaging',
          },
          {
            id: 'first_principles',
            name: 'First Principles Thinking',
            description: 'Strip pre-agent assumptions; redesign for agent-discoverable capabilities',
          },
          {
            id: 'convergence',
            name: 'Convergence',
            description: 'Fuse 2+ marketing approaches into multiplied outcomes',
          },
        ],
        roadmap: [
          { id: 'auto_catalysis', name: 'Auto-Catalysis', status: 'planned' },
          { id: 'decentralization', name: 'Decentralization', status: 'planned' },
          { id: 'zero_marginal_cost', name: 'Zero Marginal Cost', status: 'planned' },
          { id: 'exponential_economics', name: 'Exponential Economics', status: 'planned' },
          { id: 'adjacent_possible', name: 'Adjacent Possible', status: 'planned' },
        ],
      },
      agent_economy_focus: true,
      structured_output: true,
      versioning: {
        current: VERSION,
        source: 'src/version.ts',
        changelog_endpoint: `${config.publicUrl}/changelog`,
        changelog_url: CHANGELOG_URL,
        changelog_raw_url: CHANGELOG_RAW_URL,
        description:
          'CSA tracks its own semantic version and maintains a public changelog for calling agents and orchestrators',
      },
      trust_signals: {
        source: 'stigmergic_ledger',
        description:
          'Reputation metrics derived from completed tasks and post-task feedback stored in the shared ledger',
        metrics: [
          'totalTasksCompleted',
          'averageSatisfactionScore',
          'lastActive',
          'feedbackCount',
        ],
        ledger_endpoint: `${config.publicUrl}/api/ledger`,
      },
    },
    skills: [
      {
        id: 'future_state_transition',
        name: 'Future State Transition',
        description:
          'Problem: Your client\'s marketing is built for human funnels and is invisible to procurement agents, ' +
          'Jarvis shoppers, and agent-to-agent discovery. Solution: CSA scores agent-economy readiness, identifies gaps, ' +
          'and returns a phased transition plan with trust credentials, capability shifts, and converged plays — so ' +
          'calling agents can reposition a business for where demand actually moves next.',
        tags: [
          'agent-economy',
          'future-state-transition',
          'stigmergic-coordination',
          'first-principles-marketing',
          'marketing-strategy',
          'agent-to-agent',
          'jarvis-agent-readiness',
          'convergence',
          'procurement-agents',
          'transition-architect',
          'business-model-shift',
        ],
        examples: [
          'Transition our B2B SaaS from human-led demand gen to agent-discoverable marketing with procurement-ready credentials',
          'Design a future state where personal Jarvis agents can evaluate, trial, and shortlist our product without SDR involvement',
          'Analyze agent-economy readiness for Acme Corp — industry fintech, model subscription SaaS, channels LinkedIn and SEO',
        ],
        inputSchema: {
          ...taskSchemas.inputSchema,
          description: 'Set task_type to "future_state_transition" for full transition planning',
        },
        outputSchema: taskSchemas.outputSchema,
      },
      {
        id: 'convergence_analysis',
        name: 'Convergence Analysis',
        description:
          'Problem: A business runs disconnected marketing plays (content, paid, community, brand) that compete ' +
          'for budget and never compound. Solution: CSA fuses 2+ specified approaches into 2–3 named convergences ' +
          'with synergy rationale, expected multipliers, and immediate first actions — lighter-weight than a full ' +
          'transition plan when the caller already knows which approaches to combine.',
        tags: [
          'convergence',
          'convergence-analysis',
          'marketing-strategy',
          'strategy-synthesis',
          'multi-channel',
          'agent-economy',
          'first-principles-marketing',
          'agent-coordination',
        ],
        examples: [
          'Converge content-led growth, performance marketing, and community programs into one agent-coordinated system',
          'Fuse brand storytelling with programmatic media buying via a proof-gated spend engine for DTC',
        ],
        inputSchema: {
          ...taskSchemas.inputSchema,
          description: 'Set task_type to "convergence_analysis" and include approaches_to_converge (2+ items)',
        },
        outputSchema: taskSchemas.outputSchema,
      },
      {
        id: 'stigmergic_ledger_query',
        name: 'Stigmergic Ledger Query',
        description:
          'Problem: Agents need swarm context without synchronous messaging — what transitions ran, what feedback ' +
          'trends emerged, which roadmap principles peers prioritize. Solution: Query CSA\'s shared JSON ledger via ' +
          'GET /api/ledger with filters for task type, roadmap principle, requesting agent, or time window. Read-only; ' +
          'no task execution or feedback required.',
        tags: [
          'stigmergic-coordination',
          'stigmergic-ledger-query',
          'agent-to-agent',
          'swarm-intelligence',
          'environmental-signals',
          'indirect-coordination',
          'ledger-query',
          'agent-economy',
        ],
        examples: [
          'GET /api/ledger?task_type=future_state_transition&limit=10 — recent transition signals',
          'GET /api/ledger?principle=adjacent_possible&since=2026-01-01T00:00:00Z — feedback favoring Adjacent Possible',
          'GET /api/ledger?requesting_agent=growth-strategist-agent-v2 — history for a specific collaborator',
        ],
        inputSchema: {
          type: 'object',
          description: 'Query parameters for GET /api/ledger (append as URL query string)',
          properties: {
            task_type: {
              type: 'string',
              enum: ['future_state_transition', 'convergence_analysis', 'strategy_evolution'],
              description: 'Filter task entries by type',
            },
            principle: {
              type: 'string',
              enum: [
                'auto_catalysis',
                'decentralization',
                'zero_marginal_cost',
                'exponential_economics',
                'adjacent_possible',
              ],
              description: 'Filter feedback entries by roadmap principle preference',
            },
            requesting_agent: {
              type: 'string',
              description: 'Filter entries by calling agent identifier',
            },
            since: {
              type: 'string',
              format: 'date-time',
              description: 'ISO-8601 timestamp — return entries on or after this time',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Max entries to return (default 50)',
            },
          },
        },
        outputSchema: {
          type: 'object',
          required: [
            'version',
            'last_updated',
            'query',
            'total_in_ledger',
            'total_matching',
            'returned',
            'entries',
            'aggregate_insights',
          ],
          properties: {
            version: { type: 'string' },
            last_updated: { type: 'string', format: 'date-time' },
            query: { type: 'object' },
            total_in_ledger: { type: 'integer' },
            total_matching: { type: 'integer' },
            returned: { type: 'integer' },
            entries: { type: 'array', items: { type: 'object' } },
            aggregate_insights: {
              type: 'object',
              properties: {
                total_tasks: { type: 'integer' },
                total_feedback: { type: 'integer' },
                average_satisfaction: { type: ['number', 'null'] },
                most_requested_roadmap_principle: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
      {
        id: 'strategy_evolution',
        name: 'Strategy Evolution',
        description:
          'Problem: An existing marketing strategy optimizes human attention funnels but lacks agent-legible ' +
          'architecture, verifiable outcomes, or procurement-ready trust signals. Solution: CSA applies first-principles ' +
          'thinking to evolve the strategy in place — repositioning capabilities, contracts, and discovery for agent-mediated buyers.',
        tags: [
          'strategy-evolution',
          'first-principles-marketing',
          'agent-legibility',
          'marketing-strategy',
          'agent-economy',
          'enterprise',
          'trust-credentials',
        ],
        examples: [
          'Evolve our agency retainer model toward outcome-based agent contracts verifiable by client procurement agents',
          'Reposition enterprise marketing from conference-dependent to always-on trust publishing for agent discovery',
        ],
        inputSchema: {
          ...taskSchemas.inputSchema,
          description: 'Set task_type to "strategy_evolution" for first-principles strategy refresh',
        },
        outputSchema: taskSchemas.outputSchema,
      },
      {
        id: 'feedback_and_evolution',
        name: 'Swarm Feedback Loop',
        description:
          'Problem: The swarm cannot evolve CSA\'s roadmap without structured signals from collaborators. Solution: ' +
          'After any task skill, submit 3 mandatory feedback responses (satisfaction, improvement, roadmap principle ' +
          'preference) via POST /api/feedback — stored in the stigmergic ledger to prioritize future capabilities.',
        tags: [
          'feedback',
          'stigmergic-coordination',
          'swarm-evolution',
          'roadmap',
          'agent-to-agent',
        ],
        examples: [
          'Submit feedback for task abc-123 with satisfaction score and roadmap principle preference',
        ],
        inputSchema: FEEDBACK_INPUT_SCHEMA as Record<string, unknown>,
        outputSchema: {
          type: 'object',
          required: ['message', 'entry', 'ledger_path'],
          properties: {
            message: { type: 'string' },
            entry: { type: 'object' },
            ledger_path: { type: 'string' },
          },
        },
      },
    ],
  };
}