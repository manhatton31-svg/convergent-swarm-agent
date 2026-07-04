import { v4 as uuidv4 } from 'uuid';
import { ApiError, ErrorCode } from '../errors/api-error';
import { config } from '../config';
import { buildFeedbackRequest } from '../feedback/feedback';
import { appendLedgerEntry } from '../ledger/stigmergic-ledger';
import {
  buildMatchingProfiles,
  estimateCostFromRegistryPricing,
} from '../registry/agent-registry';
import { COORDINATED_WORKFLOW_INPUT_SCHEMA } from '../schemas/workflow-schemas';
import { validateAgainstSchema } from '../schemas/validate';
import type {
  ActivePrinciple,
  AgentMatchingProfile,
  CoordinatedWorkflowArtifact,
  CoordinatedWorkflowRequest,
  LedgerTaskEntry,
  RecommendedTeamMember,
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

function scoreAgentForCapability(profile: AgentMatchingProfile, capability: string): number {
  let score = profile.match_score_base;
  const capLower = capability.toLowerCase();

  if (profile.capabilities.has(capability) || profile.capabilities.has(capLower)) score += 10;
  for (const cap of profile.capabilities) {
    if (cap.includes(capLower) || capLower.includes(cap)) score += 3;
  }
  for (const skill of profile.skills) {
    if (skill.toLowerCase().includes(capLower) || capLower.includes(skill.toLowerCase())) {
      score += 8;
    }
  }

  if (profile.registered) score += 12;
  if (profile.registry_availability === 'available') score += 8;
  if (profile.registry_availability === 'limited') score += 3;
  if (profile.availability_signal === 'active_in_ledger') score += 5;
  if (profile.availability_signal === 'feedback_only') score += 2;

  return score;
}

function estimateSubtaskCost(
  profile: AgentMatchingProfile,
  baseCost: number,
  estimatedDuration: string
): number {
  if (profile.pricing) {
    return estimateCostFromRegistryPricing(profile.pricing, baseCost, estimatedDuration);
  }
  if (profile.average_satisfaction === null) return baseCost;
  const qualityMultiplier = 1 + (10 - profile.average_satisfaction) * 0.02;
  return Math.round(baseCost * qualityMultiplier);
}

function selectAgentForSubtask(
  profiles: AgentMatchingProfile[],
  capability: string,
  usedAgents: Map<string, number>,
  maxPerAgent: number
): AgentMatchingProfile {
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

function buildMatchRationale(profile: AgentMatchingProfile): string {
  const parts: string[] = [];

  if (profile.registered) {
    parts.push(
      `registered agent (${profile.registry_availability ?? 'unknown'} availability)`
    );
    if (profile.pricing) {
      parts.push(`${profile.pricing.model} @ $${profile.pricing.rate_usd} USD`);
    }
  } else {
    parts.push(`matched via stigmergic ledger (${profile.availability_signal.replace(/_/g, ' ')})`);
  }

  parts.push(`${profile.ledger_task_count} prior task(s)`);
  if (profile.average_satisfaction !== null) {
    parts.push(`avg satisfaction ${profile.average_satisfaction}/10`);
  }
  const caps = [...profile.capabilities].slice(0, 4).join(', ');
  if (caps) parts.push(`capabilities: ${caps}`);

  return parts.join(', ') + '.';
}

function buildWorkflowSummary(
  objective: string,
  team: RecommendedTeamMember[],
  subtaskCount: number,
  registryCount: number
): string {
  const teamNames = team.map((m) => m.display_name).join(', ');
  const registryNote =
    registryCount > 0
      ? `${registryCount} registered agent(s) in the registry were consulted. `
      : 'No registry entries yet — matches derived from ledger history and swarm templates. ';
  return (
    `CSA decomposed "${objective.slice(0, 80)}${objective.length > 80 ? '…' : ''}" into ` +
    `${subtaskCount} coordinated subtasks. ${registryNote}Recommended team of ${team.length} agents: ` +
    `${teamNames}. Matched by skill fit, registry pricing, reputation, and availability. ` +
    `CSA charges a ${COORDINATION_FEE_PERCENT}% coordination fee.`
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

  const { profiles, signalsUsed, registryCount } = await buildMatchingProfiles();
  const templates = buildSubtaskTemplates(objective, req.context.industry);
  const usedAgents = new Map<string, number>();
  const subtasks: WorkflowSubtask[] = [];

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const agent = selectAgentForSubtask(profiles, template.required_capability, usedAgents, 2);
    usedAgents.set(agent.agent_id, (usedAgents.get(agent.agent_id) ?? 0) + 1);

    const cost = estimateSubtaskCost(agent, template.base_cost_usd, template.estimated_duration);

    subtasks.push({
      subtask_id: template.id,
      sequence: i + 1,
      name: template.name,
      description: template.description,
      estimated_duration: template.estimated_duration,
      recommended_agent_id: agent.agent_id,
      recommended_agent_name: agent.display_name,
      estimated_cost_usd: cost,
      match_rationale: buildMatchRationale(agent),
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
    workflow_summary: buildWorkflowSummary(
      objective,
      recommended_team,
      subtasks.length,
      registryCount
    ),
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