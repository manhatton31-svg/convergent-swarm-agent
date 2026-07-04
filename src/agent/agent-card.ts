import { config } from '../config';
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

export function buildAgentCard(): AgentCard {
  return {
    name: config.agentName,
    description:
      'Future-State Transition Architect for marketing. CSA helps other agents architect marketing ' +
      'and business models for where the agent economy is heading — not incremental tweaks on today\'s tactics. ' +
      'When procurement agents evaluate vendors, personal Jarvis agents shop on behalf of users, and ' +
      'category agents route demand, CSA designs the transition path: agent-legible positioning, trust ' +
      'credentials, converged strategies, and stigmergic coordination. Built on three active principles ' +
      '(Stigmergy, First Principles, Convergence), guided by a five-principle long-term roadmap, and ' +
      'a mandatory post-task feedback loop that evolves the swarm through shared environmental signals.',
    url: `${config.publicUrl}/`,
    version: config.agentVersion,
    protocolVersion: '0.2.5',
    defaultInputModes: ['text', 'application/json'],
    defaultOutputModes: ['application/json', 'text'],
    capabilities: {
      streaming: false,
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
        endpoint: `${config.publicUrl}/api/ledger`,
        description: 'Shared JSON ledger for indirect agent coordination via environmental signals',
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
    },
    skills: [
      {
        id: 'future_state_transition',
        name: 'Future State Transition',
        description:
          'Analyze a business\'s current marketing model and produce a bold, structured transition plan ' +
          'toward agent-economy readiness — where discovery, evaluation, and transactions happen ' +
          'agent-to-agent and personal Jarvis agents are primary buyers.',
        tags: [
          'marketing',
          'strategy',
          'agent-economy',
          'transition',
          'jarvis-agents',
          'procurement-agents',
          'stigmergy',
          'first-principles',
          'convergence',
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
          'Synthesize 2–3 creative convergences from separate marketing approaches into unified, ' +
          'higher-performing strategies with named playbooks, synergy rationale, and immediate first actions.',
        tags: [
          'convergence',
          'marketing',
          'multi-approach',
          'strategy',
          'synthesis',
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
        id: 'strategy_evolution',
        name: 'Strategy Evolution',
        description:
          'Evolve an existing marketing strategy using first-principles thinking — reposition from ' +
          'human-funnel optimization to agent-legible architecture with trust credentials and outcome-based contracts.',
        tags: [
          'evolution',
          'first-principles',
          'roadmap',
          'enterprise',
          'agent-legibility',
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
          'Mandatory post-task feedback collection (3 structured questions) stored in the stigmergic ledger ' +
          'to prioritize roadmap principles and evolve future collaboration across the agent swarm.',
        tags: ['feedback', 'stigmergy', 'roadmap', 'evolution', 'swarm'],
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