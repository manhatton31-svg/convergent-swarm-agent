import { v4 as uuidv4 } from 'uuid';
import { ApiError, ErrorCode } from '../errors/api-error';
import { config } from '../config';
import { buildFeedbackRequest } from '../feedback/feedback';
import { appendLedgerEntry, readLedger } from '../ledger/stigmergic-ledger';
import { COORDINATED_WORKFLOW_INPUT_SCHEMA } from '../schemas/workflow-schemas';
import { validateAgainstSchema } from '../schemas/validate';
import type {
  ActivePrinciple,
  AgentAvailabilitySignal,
  CoordinatedWorkflowArtifact,
  CoordinatedWorkflowRequest,
  LedgerFeedbackEntry,
  LedgerTaskEntry,
  RecommendedTeamMember,
  TaskType,
  WorkflowSubtask,
} from '../types';

const COORDINATION_FEE_PERCENT = 7.5;

interface SubtaskTemplate {
  id: string;
  name: string;
  description: string;
  estimated_duration: string;
  required_capability: string;
  base_cost_usd: number;
  depends_on: string[];
}

interface AgentProfile {
  agent_id: string;
  display_name: string;
  capabilities: Set<string>;
  ledger_task_count: number;
  feedback_count: number;
  average_satisfaction: number | null;
  last_active: string;
  availability_signal: AgentAvailabilitySignal;
  match_score_base: number;
}

const SWARM_AGENT_POOL: Array<{
  agent_id: string;
  display_name: string;
  capabilities: string[];
}> = [
  {
    agent_id: 'growth-strategist-agent-v2',
    display_name: 'Growth Strategist Agent',
    capabilities: ['readiness', 'strategy', 'transition', 'analysis'],
  },
  {
    agent_id: 'creative-brief-agent',
    display_name: 'Creative Brief Agent',
    capabilities: ['convergence', 'creative', 'brand', 'synthesis'],
  },
  {
    agent_id: 'procurement-scout-agent',
    display_name: 'Procurement Scout Agent',
    capabilities: ['procurement', 'enterprise', 'trust', 'credentials'],
  },
  {
    agent_id: 'content-pipeline-agent',
    display_name: 'Content Pipeline Agent',
    capabilities: ['content', 'seo', 'legibility', 'publishing'],
  },
  {
    agent_id: 'performance-ops-agent',
    display_name: 'Performance Ops Agent',
    capabilities: ['performance', 'analytics', 'execution', 'optimization'],
  },
];

const TASK_TYPE_CAPABILITIES: Record<TaskType, string[]> = {
  future_state_transition: ['readiness', 'strategy', 'transition', 'analysis'],
  convergence_analysis: ['convergence', 'creative', 'synthesis', 'brand'],
  strategy_evolution: ['strategy', 'enterprise', 'trust', 'evolution'],
  coordinated_workflow: ['coordination', 'orchestration'],
};

function formatDisplayName(agentId: string): string {
  return agentId
    .replace(/-agent(-v\d+)?$/i, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .concat(' Agent');
}

function inferPoolCapabilities(agentId: string): string[] {
  const poolMatch = SWARM_AGENT_POOL.find((a) => a.agent_id === agentId);
  if (poolMatch) return poolMatch.capabilities;
  if (agentId.includes('growth') || agentId.includes('strateg')) {
    return ['strategy', 'transition', 'analysis'];
  }
  if (agentId.includes('creative') || agentId.includes('brief')) {
    return ['convergence', 'creative', 'brand'];
  }
  if (agentId.includes('procurement') || agentId.includes('scout')) {
    return ['procurement', 'enterprise', 'trust'];
  }
  if (agentId.includes('content')) return ['content', 'seo', 'legibility'];
  if (agentId.includes('performance')) return ['performance', 'analytics', 'execution'];
  return ['general', 'marketing'];
}

export function validateCoordinatedWorkflowRequest(request: unknown): string[] {
  const schemaErrors = validateAgainstSchema(COORDINATED_WORKFLOW_INPUT_SCHEMA, request);
  if (schemaErrors.length > 0) {
    return schemaErrors.map((e) => `Schema: ${e}`);
  }

  const req = request as CoordinatedWorkflowRequest;
  if (!req.context?.objective?.trim()) {
    return ['context.objective must be a non-empty string'];
  }
  if (req.task_type !== 'coordinated_workflow') {
    return ['task_type must be "coordinated_workflow"'];
  }
  return [];
}

async function buildAgentProfiles(): Promise<{
  profiles: AgentProfile[];
  signalsUsed: number;
}> {
  const ledger = await readLedger();
  const profileMap = new Map<string, AgentProfile>();

  for (const entry of ledger.entries) {
    const agentId = entry.requesting_agent;
    let profile = profileMap.get(agentId);

    if (!profile) {
      const poolMatch = SWARM_AGENT_POOL.find((a) => a.agent_id === agentId);
      profile = {
        agent_id: agentId,
        display_name: poolMatch?.display_name ?? formatDisplayName(agentId),
        capabilities: new Set(poolMatch?.capabilities ?? inferPoolCapabilities(agentId)),
        ledger_task_count: 0,
        feedback_count: 0,
        average_satisfaction: null,
        last_active: entry.timestamp,
        availability_signal: 'active_in_ledger',
        match_score_base: 0,
      };
      profileMap.set(agentId, profile);
    }

    if (new Date(entry.timestamp) > new Date(profile.last_active)) {
      profile.last_active = entry.timestamp;
    }

    if (entry.type === 'task') {
      const task = entry as LedgerTaskEntry;
      profile.ledger_task_count += 1;
      profile.availability_signal = 'active_in_ledger';
      for (const cap of TASK_TYPE_CAPABILITIES[task.task_type] ?? []) {
        profile.capabilities.add(cap);
      }
    } else {
      const feedback = entry as LedgerFeedbackEntry;
      profile.feedback_count += 1;
      if (profile.ledger_task_count === 0) {
        profile.availability_signal = 'feedback_only';
      }
      if (profile.average_satisfaction === null) {
        profile.average_satisfaction = feedback.satisfaction_score;
      } else {
        const total =
          profile.average_satisfaction * (profile.feedback_count - 1) +
          feedback.satisfaction_score;
        profile.average_satisfaction =
          Math.round((total / profile.feedback_count) * 10) / 10;
      }
    }

    profile.match_score_base =
      profile.ledger_task_count * 2 +
      profile.feedback_count +
      (profile.average_satisfaction ?? 5) * 0.5;
  }

  for (const poolAgent of SWARM_AGENT_POOL) {
    if (!profileMap.has(poolAgent.agent_id)) {
      profileMap.set(poolAgent.agent_id, {
        agent_id: poolAgent.agent_id,
        display_name: poolAgent.display_name,
        capabilities: new Set(poolAgent.capabilities),
        ledger_task_count: 0,
        feedback_count: 0,
        average_satisfaction: null,
        last_active: new Date(0).toISOString(),
        availability_signal: 'inferred_capability',
        match_score_base: 1,
      });
    }
  }

  const profiles = [...profileMap.values()].sort(
    (a, b) => b.match_score_base - a.match_score_base
  );

  return { profiles, signalsUsed: ledger.entries.length };
}

function buildSubtaskTemplates(
  objective: string,
  industry?: string
): SubtaskTemplate[] {
  const industryNote = industry ? ` for ${industry}` : '';
  const isConvergence =
    /converge|combine|fuse|synthesis/i.test(objective) ||
    /convergence/i.test(objective);
  const isEnterprise = /enterprise|procurement|b2b|regtech/i.test(objective);

  const templates: SubtaskTemplate[] = [
    {
      id: 'readiness-audit',
      name: 'Agent-Economy Readiness Audit',
      description:
        `Assess current-state marketing legibility${industryNote} — score agent-discoverability, ` +
        'identify structural gaps, and produce a readiness baseline for the coordinated workflow.',
      estimated_duration: '2-3 days',
      required_capability: 'readiness',
      base_cost_usd: 85,
      depends_on: [],
    },
    {
      id: 'strategy-design',
      name: isConvergence ? 'Convergence Strategy Design' : 'Future-State Strategy Design',
      description: isConvergence
        ? `Design 2-3 converged marketing plays that compound toward: ${objective.slice(0, 120)}`
        : `Architect the transition strategy and phased roadmap toward: ${objective.slice(0, 120)}`,
      estimated_duration: '3-5 days',
      required_capability: isConvergence ? 'convergence' : 'strategy',
      base_cost_usd: 120,
      depends_on: ['readiness-audit'],
    },
    {
      id: 'trust-legibility',
      name: 'Trust Credentials & Agent Legibility',
      description:
        'Build procurement-ready trust signals, machine-readable capability descriptors, ' +
        'and agent-discoverable positioning artifacts.',
      estimated_duration: '2-4 days',
      required_capability: isEnterprise ? 'trust' : 'legibility',
      base_cost_usd: 95,
      depends_on: ['strategy-design'],
    },
    {
      id: 'execution-kickoff',
      name: 'Coordinated Execution Kickoff',
      description:
        'Launch first actions across the team — wire subtask outputs into a unified execution ' +
        'sequence with ledger-published milestones for stigmergic follow-through.',
      estimated_duration: '1-2 days',
      required_capability: 'execution',
      base_cost_usd: 75,
      depends_on: ['trust-legibility'],
    },
  ];

  return templates.slice(0, isConvergence ? 4 : 3);
}

function scoreAgentForCapability(profile: AgentProfile, capability: string): number {
  let score = profile.match_score_base;
  if (profile.capabilities.has(capability)) score += 10;
  for (const cap of profile.capabilities) {
    if (cap.includes(capability) || capability.includes(cap)) score += 3;
  }
  if (profile.availability_signal === 'active_in_ledger') score += 5;
  if (profile.availability_signal === 'feedback_only') score += 2;
  return score;
}

function estimateSubtaskCost(baseCost: number, satisfaction: number | null): number {
  if (satisfaction === null) return baseCost;
  const qualityMultiplier = 1 + (10 - satisfaction) * 0.02;
  return Math.round(baseCost * qualityMultiplier);
}

function selectAgentForSubtask(
  profiles: AgentProfile[],
  capability: string,
  usedAgents: Map<string, number>,
  maxPerAgent: number
): AgentProfile {
  const ranked = [...profiles].sort((a, b) => {
    const scoreA = scoreAgentForCapability(a, capability) - (usedAgents.get(a.agent_id) ?? 0) * 3;
    const scoreB = scoreAgentForCapability(b, capability) - (usedAgents.get(b.agent_id) ?? 0) * 3;
    return scoreB - scoreA;
  });

  for (const profile of ranked) {
    if ((usedAgents.get(profile.agent_id) ?? 0) < maxPerAgent) {
      return profile;
    }
  }

  return ranked[0];
}

function buildWorkflowSummary(
  objective: string,
  team: RecommendedTeamMember[],
  subtaskCount: number
): string {
  const teamNames = team.map((m) => m.display_name).join(', ');
  return (
    `CSA decomposed "${objective.slice(0, 80)}${objective.length > 80 ? '…' : ''}" into ` +
    `${subtaskCount} coordinated subtasks. Recommended team of ${team.length} agents from stigmergic ` +
    `ledger signals: ${teamNames}. Each subtask is matched by capability fit, ledger activity, and ` +
    `feedback satisfaction. CSA charges a ${COORDINATION_FEE_PERCENT}% coordination fee for orchestration.`
  );
}

export async function handleCoordinatedWorkflow(
  request: unknown
): Promise<CoordinatedWorkflowArtifact> {
  const errors = validateCoordinatedWorkflowRequest(request);
  if (errors.length > 0) {
    throw new CoordinatedWorkflowValidationError(errors);
  }

  const req = request as CoordinatedWorkflowRequest;
  const taskId = req.task_id ?? uuidv4();
  const generatedAt = new Date().toISOString();
  const objective = req.context.objective.trim();

  const { profiles, signalsUsed } = await buildAgentProfiles();
  const templates = buildSubtaskTemplates(objective, req.context.industry);
  const usedAgents = new Map<string, number>();
  const subtasks: WorkflowSubtask[] = [];

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const agent = selectAgentForSubtask(profiles, template.required_capability, usedAgents, 2);
    usedAgents.set(agent.agent_id, (usedAgents.get(agent.agent_id) ?? 0) + 1);

    const cost = estimateSubtaskCost(template.base_cost_usd, agent.average_satisfaction);

    subtasks.push({
      subtask_id: template.id,
      sequence: i + 1,
      name: template.name,
      description: template.description,
      estimated_duration: template.estimated_duration,
      recommended_agent_id: agent.agent_id,
      recommended_agent_name: agent.display_name,
      estimated_cost_usd: cost,
      match_rationale:
        `Matched via stigmergic ledger — ${agent.availability_signal.replace(/_/g, ' ')}, ` +
        `${agent.ledger_task_count} prior task(s), ` +
        `${agent.average_satisfaction !== null ? `avg satisfaction ${agent.average_satisfaction}/10` : 'no feedback yet'}, ` +
        `capabilities: ${[...agent.capabilities].slice(0, 4).join(', ')}.`,
      depends_on: template.depends_on,
    });
  }

  const teamAgentIds = [...new Set(subtasks.map((s) => s.recommended_agent_id))].slice(0, 4);
  const recommended_team: RecommendedTeamMember[] = teamAgentIds.map((agentId) => {
    const profile = profiles.find((p) => p.agent_id === agentId)!;
    const assigned = subtasks
      .filter((s) => s.recommended_agent_id === agentId)
      .map((s) => s.subtask_id);
    const totalCost = subtasks
      .filter((s) => s.recommended_agent_id === agentId)
      .reduce((sum, s) => sum + s.estimated_cost_usd, 0);

    return {
      agent_id: agentId,
      display_name: profile.display_name,
      capabilities: [...profile.capabilities],
      ledger_task_count: profile.ledger_task_count,
      average_satisfaction: profile.average_satisfaction,
      availability_signal: profile.availability_signal,
      estimated_total_cost_usd: totalCost,
      subtasks_assigned: assigned,
    };
  });

  while (recommended_team.length < 2 && profiles.length > recommended_team.length) {
    const next = profiles.find((p) => !recommended_team.some((t) => t.agent_id === p.agent_id));
    if (!next) break;
    recommended_team.push({
      agent_id: next.agent_id,
      display_name: next.display_name,
      capabilities: [...next.capabilities],
      ledger_task_count: next.ledger_task_count,
      average_satisfaction: next.average_satisfaction,
      availability_signal: next.availability_signal,
      estimated_total_cost_usd: 0,
      subtasks_assigned: [],
    });
  }

  const subtasks_total_usd = subtasks.reduce((sum, s) => sum + s.estimated_cost_usd, 0);
  const coordination_fee_usd =
    Math.round(subtasks_total_usd * (COORDINATION_FEE_PERCENT / 100) * 100) / 100;

  let total_estimated_usd = subtasks_total_usd + coordination_fee_usd;
  if (req.context.budget_usd && total_estimated_usd > req.context.budget_usd) {
    const scale = req.context.budget_usd / total_estimated_usd;
    for (const subtask of subtasks) {
      subtask.estimated_cost_usd = Math.round(subtask.estimated_cost_usd * scale);
    }
    for (const member of recommended_team) {
      member.estimated_total_cost_usd = subtasks
        .filter((s) => s.recommended_agent_id === member.agent_id)
        .reduce((sum, s) => sum + s.estimated_cost_usd, 0);
    }
    const scaledSubtotal = subtasks.reduce((sum, s) => sum + s.estimated_cost_usd, 0);
    total_estimated_usd =
      scaledSubtotal +
      Math.round(scaledSubtotal * (COORDINATION_FEE_PERCENT / 100) * 100) / 100;
  }

  const principles_applied: ActivePrinciple[] = ['stigmergy', 'first_principles', 'convergence'];

  const artifact: CoordinatedWorkflowArtifact = {
    task_id: taskId,
    generated_at: generatedAt,
    requesting_agent: req.requesting_agent,
    agent_name: config.agentName,
    agent_version: config.agentVersion,
    skill: 'coordinated_workflow',
    principles_applied,
    main_objective: objective,
    workflow_summary: buildWorkflowSummary(objective, recommended_team, subtasks.length),
    subtasks,
    recommended_team,
    cost_breakdown: {
      subtasks_total_usd: subtasks.reduce((sum, s) => sum + s.estimated_cost_usd, 0),
      coordination_fee_usd:
        Math.round(
          subtasks.reduce((sum, s) => sum + s.estimated_cost_usd, 0) *
            (COORDINATION_FEE_PERCENT / 100) *
            100
        ) / 100,
      coordination_fee_percent: COORDINATION_FEE_PERCENT,
      total_estimated_usd,
      currency: 'USD',
    },
    ledger_signals_used: signalsUsed,
    stigmergic_ledger_ref: config.ledgerRef,
    feedback_request: buildFeedbackRequest(taskId),
  };

  const ledgerEntry: LedgerTaskEntry = {
    type: 'task',
    task_id: taskId,
    requesting_agent: req.requesting_agent,
    timestamp: generatedAt,
    task_type: 'coordinated_workflow',
    business_name: req.context.business_name,
    summary:
      `Coordinated workflow for "${objective.slice(0, 100)}${objective.length > 100 ? '…' : ''}" — ` +
      `${subtasks.length} subtasks, team of ${recommended_team.length}, ` +
      `est. $${artifact.cost_breakdown.total_estimated_usd} USD.`,
    readiness_score: 0,
  };

  await appendLedgerEntry(ledgerEntry);

  return artifact;
}

export class CoordinatedWorkflowValidationError extends ApiError {
  constructor(public readonly errors: string[]) {
    super(
      ErrorCode.VALIDATION_FAILED,
      'Coordinated workflow request validation failed',
      400,
      errors
    );
    this.name = 'CoordinatedWorkflowValidationError';
  }
}