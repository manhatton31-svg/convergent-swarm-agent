import { ApiError, ErrorCode } from '../errors/api-error';
import { readLedger, writeLedger } from '../ledger/stigmergic-ledger';
import { AGENT_REGISTRATION_INPUT_SCHEMA } from '../schemas/registry-schemas';
import { validateAgainstSchema } from '../schemas/validate';
import type {
  AgentAvailabilitySignal,
  AgentMatchingProfile,
  AgentPricingModel,
  AgentRegistrationRequest,
  LedgerAgentRegistrationEntry,
  LedgerEntry,
  LedgerFeedbackEntry,
  LedgerTaskEntry,
  RegisteredAgentView,
  RegistryAvailability,
  RegistryQueryParams,
  RegistryQueryResult,
  TaskType,
} from '../types';

const DEFAULT_REGISTRY_LIMIT = 50;
const MAX_REGISTRY_LIMIT = 100;

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

export function validateAgentRegistration(request: unknown): string[] {
  const schemaErrors = validateAgainstSchema(AGENT_REGISTRATION_INPUT_SCHEMA, request);
  if (schemaErrors.length > 0) {
    return schemaErrors.map((e) => `Schema: ${e}`);
  }
  return [];
}

export async function registerAgent(
  request: AgentRegistrationRequest
): Promise<LedgerAgentRegistrationEntry> {
  const ledger = await readLedger();
  const timestamp = new Date().toISOString();

  const entry: LedgerAgentRegistrationEntry = {
    type: 'agent_registration',
    agent_id: request.agent_id.trim(),
    agent_name: request.agent_name.trim(),
    requesting_agent: request.agent_id.trim(),
    timestamp,
    skills: request.skills.map((s) => s.trim()).filter(Boolean),
    pricing: request.pricing,
    availability: request.availability,
    description: request.description?.trim(),
    tags: request.tags?.map((t) => t.trim()).filter(Boolean) ?? [],
  };

  ledger.entries = ledger.entries.filter(
    (e) => !(e.type === 'agent_registration' && e.agent_id === entry.agent_id)
  );
  ledger.entries.push(entry);
  await writeLedger(ledger);

  return entry;
}

export function getLatestRegistrations(
  entries: LedgerEntry[]
): Map<string, LedgerAgentRegistrationEntry> {
  const map = new Map<string, LedgerAgentRegistrationEntry>();
  for (const entry of entries) {
    if (entry.type !== 'agent_registration') continue;
    const existing = map.get(entry.agent_id);
    if (!existing || new Date(entry.timestamp) > new Date(existing.timestamp)) {
      map.set(entry.agent_id, entry);
    }
  }
  return map;
}

function buildReputationMaps(entries: LedgerEntry[]): Map<
  string,
  { taskCount: number; feedbackCount: number; avgSatisfaction: number | null }
> {
  const map = new Map<
    string,
    { taskCount: number; feedbackCount: number; avgSatisfaction: number | null }
  >();

  for (const entry of entries) {
    if (entry.type === 'agent_registration') continue;

    const agentId = entry.requesting_agent;
    let rep = map.get(agentId);
    if (!rep) {
      rep = { taskCount: 0, feedbackCount: 0, avgSatisfaction: null };
      map.set(agentId, rep);
    }

    if (entry.type === 'task') {
      rep.taskCount += 1;
    } else if (entry.type === 'feedback') {
      const feedback = entry as LedgerFeedbackEntry;
      rep.feedbackCount += 1;
      if (rep.avgSatisfaction === null) {
        rep.avgSatisfaction = feedback.satisfaction_score;
      } else {
        const total =
          rep.avgSatisfaction * (rep.feedbackCount - 1) + feedback.satisfaction_score;
        rep.avgSatisfaction = Math.round((total / rep.feedbackCount) * 10) / 10;
      }
    }
  }

  return map;
}

function matchesRegistryQuery(
  agent: LedgerAgentRegistrationEntry,
  query: RegistryQueryParams
): boolean {
  if (query.agent_id && agent.agent_id !== query.agent_id) return false;

  if (query.availability && agent.availability !== query.availability) return false;

  if (query.max_price_usd !== undefined && agent.pricing.rate_usd > query.max_price_usd) {
    return false;
  }

  if (query.skill) {
    const skillLower = query.skill.toLowerCase();
    const hasSkill = agent.skills.some(
      (s) =>
        s.toLowerCase().includes(skillLower) || skillLower.includes(s.toLowerCase())
    );
    if (!hasSkill) return false;
  }

  if (query.tag) {
    const tagLower = query.tag.toLowerCase();
    const hasTag = (agent.tags ?? []).some(
      (t) => t.toLowerCase().includes(tagLower) || tagLower.includes(t.toLowerCase())
    );
    if (!hasTag) return false;
  }

  return true;
}

export function parseRegistryQuery(raw: Record<string, unknown>): {
  query: RegistryQueryParams;
  errors: string[];
} {
  const errors: string[] = [];
  const query: RegistryQueryParams = {};

  if (raw.skill !== undefined) {
    const skill = String(raw.skill).trim();
    if (!skill) errors.push('skill must be a non-empty string');
    else query.skill = skill;
  }

  if (raw.availability !== undefined) {
    const avail = String(raw.availability);
    if (!['available', 'limited', 'unavailable'].includes(avail)) {
      errors.push('availability must be available, limited, or unavailable');
    } else {
      query.availability = avail as RegistryAvailability;
    }
  }

  if (raw.max_price_usd !== undefined) {
    const price = parseFloat(String(raw.max_price_usd));
    if (Number.isNaN(price) || price < 0) {
      errors.push('max_price_usd must be a non-negative number');
    } else {
      query.max_price_usd = price;
    }
  }

  if (raw.agent_id !== undefined) {
    const agentId = String(raw.agent_id).trim();
    if (!agentId) errors.push('agent_id must be a non-empty string');
    else query.agent_id = agentId;
  }

  if (raw.tag !== undefined) {
    const tag = String(raw.tag).trim();
    if (!tag) errors.push('tag must be a non-empty string');
    else query.tag = tag;
  }

  if (raw.limit !== undefined) {
    const limit = parseInt(String(raw.limit), 10);
    if (Number.isNaN(limit) || limit < 1) {
      errors.push('limit must be a positive integer');
    } else {
      query.limit = Math.min(limit, MAX_REGISTRY_LIMIT);
    }
  }

  return { query, errors };
}

export async function queryRegistry(
  params: RegistryQueryParams = {}
): Promise<RegistryQueryResult> {
  const ledger = await readLedger();
  const limit = params.limit ?? DEFAULT_REGISTRY_LIMIT;
  const registrations = getLatestRegistrations(ledger.entries);
  const reputation = buildReputationMaps(ledger.entries);

  const allAgents = [...registrations.values()];
  const matching = allAgents.filter((a) => matchesRegistryQuery(a, params));
  const sorted = matching.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const slice = sorted.slice(0, limit);

  const agents: RegisteredAgentView[] = slice.map((reg) => {
    const rep = reputation.get(reg.agent_id) ?? {
      taskCount: 0,
      feedbackCount: 0,
      avgSatisfaction: null,
    };
    return {
      agent_id: reg.agent_id,
      agent_name: reg.agent_name,
      skills: reg.skills,
      pricing: reg.pricing,
      availability: reg.availability,
      description: reg.description,
      tags: reg.tags ?? [],
      registered_at: reg.timestamp,
      reputation: {
        ledger_task_count: rep.taskCount,
        feedback_count: rep.feedbackCount,
        average_satisfaction: rep.avgSatisfaction,
      },
    };
  });

  return {
    version: ledger.version,
    last_updated: ledger.last_updated,
    query: { ...params, limit },
    total_registered: allAgents.length,
    total_matching: matching.length,
    returned: agents.length,
    agents,
  };
}

/** Build unified agent profiles for coordinated_workflow matching */
export async function buildMatchingProfiles(): Promise<{
  profiles: AgentMatchingProfile[];
  signalsUsed: number;
  registryCount: number;
}> {
  const ledger = await readLedger();
  const registrations = getLatestRegistrations(ledger.entries);
  const profileMap = new Map<string, AgentMatchingProfile>();

  for (const reg of registrations.values()) {
    profileMap.set(reg.agent_id, {
      agent_id: reg.agent_id,
      display_name: reg.agent_name,
      capabilities: new Set(reg.skills.map((s) => s.toLowerCase())),
      skills: reg.skills,
      ledger_task_count: 0,
      feedback_count: 0,
      average_satisfaction: null,
      last_active: reg.timestamp,
      availability_signal: 'registered',
      registry_availability: reg.availability,
      pricing: reg.pricing,
      match_score_base: 10,
      registered: true,
      tags: reg.tags ?? [],
    });
    for (const skill of reg.skills) {
      profileMap.get(reg.agent_id)!.capabilities.add(skill.toLowerCase());
    }
  }

  for (const entry of ledger.entries) {
    if (entry.type === 'agent_registration') continue;

    const agentId = entry.requesting_agent;
    let profile = profileMap.get(agentId);

    if (!profile) {
      profile = {
        agent_id: agentId,
        display_name: formatDisplayName(agentId),
        capabilities: new Set(),
        skills: [],
        ledger_task_count: 0,
        feedback_count: 0,
        average_satisfaction: null,
        last_active: entry.timestamp,
        availability_signal: 'active_in_ledger',
        registry_availability: null,
        pricing: null,
        match_score_base: 0,
        registered: false,
        tags: [],
      };
      profileMap.set(agentId, profile);
    }

    if (new Date(entry.timestamp) > new Date(profile.last_active)) {
      profile.last_active = entry.timestamp;
    }

    if (entry.type === 'task') {
      const task = entry as LedgerTaskEntry;
      profile.ledger_task_count += 1;
      if (!profile.registered) profile.availability_signal = 'active_in_ledger';
      for (const cap of TASK_TYPE_CAPABILITIES[task.task_type] ?? []) {
        profile.capabilities.add(cap);
      }
    } else if (entry.type === 'feedback') {
      const feedback = entry as LedgerFeedbackEntry;
      profile.feedback_count += 1;
      if (!profile.registered && profile.ledger_task_count === 0) {
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
      (profile.registered ? 10 : 0) +
      profile.ledger_task_count * 2 +
      profile.feedback_count +
      (profile.average_satisfaction ?? 5) * 0.5;
  }

  const profiles = [...profileMap.values()]
    .filter((p) => p.registry_availability !== 'unavailable')
    .sort((a, b) => b.match_score_base - a.match_score_base);

  return {
    profiles,
    signalsUsed: ledger.entries.length,
    registryCount: registrations.size,
  };
}

export function estimateCostFromRegistryPricing(
  pricing: AgentPricingModel,
  baseCost: number,
  estimatedDuration: string
): number {
  switch (pricing.model) {
    case 'per_task':
      return Math.round(pricing.rate_usd);
    case 'fixed':
      return Math.round(pricing.rate_usd);
    case 'hourly': {
      const hours = parseDurationToHours(estimatedDuration);
      return Math.round(pricing.rate_usd * hours);
    }
    default:
      return baseCost;
  }
}

function parseDurationToHours(duration: string): number {
  const dayMatch = duration.match(/(\d+)\s*-\s*(\d+)\s*days?/i);
  if (dayMatch) {
    const avgDays = (parseInt(dayMatch[1], 10) + parseInt(dayMatch[2], 10)) / 2;
    return avgDays * 8;
  }
  const singleDay = duration.match(/(\d+)\s*days?/i);
  if (singleDay) return parseInt(singleDay[1], 10) * 8;
  return 8;
}

export class AgentRegistrationValidationError extends ApiError {
  constructor(public readonly errors: string[]) {
    super(ErrorCode.VALIDATION_FAILED, 'Agent registration validation failed', 400, errors);
    this.name = 'AgentRegistrationValidationError';
  }
}

export function assertValidRegistration(request: unknown): AgentRegistrationRequest {
  const errors = validateAgentRegistration(request);
  if (errors.length > 0) {
    throw new AgentRegistrationValidationError(errors);
  }
  return request as AgentRegistrationRequest;
}