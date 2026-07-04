import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import type {
  LedgerAgentRegistrationEntry,
  LedgerEntry,
  LedgerEntryType,
  LedgerFeedbackEntry,
  LedgerQueryParams,
  LedgerQueryResult,
  LedgerTaskEntry,
  RegistryAvailability,
  ReputationMetrics,
  RoadmapPrinciple,
  StigmergicLedger,
  TaskType,
} from '../types';

const EMPTY_LEDGER: StigmergicLedger = {
  version: '1.0',
  description:
    'Shared stigmergic ledger — environmental signals left by agents for indirect coordination',
  last_updated: new Date().toISOString(),
  entries: [],
  aggregate_insights: {
    total_tasks: 0,
    total_feedback: 0,
    average_satisfaction: null,
    most_requested_roadmap_principle: null,
  },
};

const VALID_TASK_TYPES: TaskType[] = [
  'future_state_transition',
  'convergence_analysis',
  'strategy_evolution',
  'coordinated_workflow',
];

const VALID_PRINCIPLES: RoadmapPrinciple[] = [
  'auto_catalysis',
  'decentralization',
  'zero_marginal_cost',
  'exponential_economics',
  'adjacent_possible',
];

const DEFAULT_QUERY_LIMIT = 50;
const MAX_QUERY_LIMIT = 100;

async function ensureLedgerDir(): Promise<void> {
  await fs.mkdir(path.dirname(config.ledgerPath), { recursive: true });
}

export async function readLedger(): Promise<StigmergicLedger> {
  try {
    const raw = await fs.readFile(config.ledgerPath, 'utf-8');
    return JSON.parse(raw) as StigmergicLedger;
  } catch {
    await ensureLedgerDir();
    await writeLedger(EMPTY_LEDGER);
    return { ...EMPTY_LEDGER };
  }
}

export async function writeLedger(ledger: StigmergicLedger): Promise<void> {
  await ensureLedgerDir();
  ledger.last_updated = new Date().toISOString();
  await fs.writeFile(config.ledgerPath, JSON.stringify(ledger, null, 2), 'utf-8');
}

function computeInsights(entries: LedgerEntry[]): StigmergicLedger['aggregate_insights'] {
  const tasks = entries.filter((e): e is LedgerTaskEntry => e.type === 'task');
  const feedback = entries.filter((e): e is LedgerFeedbackEntry => e.type === 'feedback');

  const insights: StigmergicLedger['aggregate_insights'] = {
    total_tasks: tasks.length,
    total_feedback: feedback.length,
    average_satisfaction: null,
    most_requested_roadmap_principle: null,
  };

  if (feedback.length > 0) {
    const scores = feedback.map((f) => f.satisfaction_score);
    insights.average_satisfaction =
      Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;

    const counts = new Map<RoadmapPrinciple, number>();
    for (const f of feedback) {
      counts.set(f.roadmap_principle, (counts.get(f.roadmap_principle) ?? 0) + 1);
    }
    let top: RoadmapPrinciple | null = null;
    let topCount = 0;
    for (const [principle, count] of counts) {
      if (count > topCount) {
        top = principle;
        topCount = count;
      }
    }
    insights.most_requested_roadmap_principle = top;
  }

  return insights;
}

function recomputeInsights(ledger: StigmergicLedger): void {
  ledger.aggregate_insights = computeInsights(ledger.entries);
}

function matchesQuery(entry: LedgerEntry, query: LedgerQueryParams, sinceMs?: number): boolean {
  if (query.entry_type && entry.type !== query.entry_type) {
    return false;
  }

  if (query.requesting_agent && entry.requesting_agent !== query.requesting_agent) {
    return false;
  }

  if (sinceMs !== undefined && new Date(entry.timestamp).getTime() < sinceMs) {
    return false;
  }

  if (query.task_type) {
    if (entry.type !== 'task' || entry.task_type !== query.task_type) {
      return false;
    }
  }

  if (query.principle) {
    if (entry.type !== 'feedback' || entry.roadmap_principle !== query.principle) {
      return false;
    }
  }

  if (entry.type === 'agent_registration') {
    const reg = entry as LedgerAgentRegistrationEntry;
    if (query.availability && reg.availability !== query.availability) return false;
    if (query.max_price_usd !== undefined && reg.pricing.rate_usd > query.max_price_usd) {
      return false;
    }
    if (query.skill) {
      const skillLower = query.skill.toLowerCase();
      const hasSkill = reg.skills.some(
        (s) =>
          s.toLowerCase().includes(skillLower) || skillLower.includes(s.toLowerCase())
      );
      if (!hasSkill) return false;
    }
    if (query.tag) {
      const tagLower = query.tag.toLowerCase();
      const hasTag = (reg.tags ?? []).some(
        (t) => t.toLowerCase().includes(tagLower) || tagLower.includes(t.toLowerCase())
      );
      if (!hasTag) return false;
    }
  }

  return true;
}

export function parseLedgerQuery(raw: Record<string, unknown>): {
  query: LedgerQueryParams;
  errors: string[];
} {
  const errors: string[] = [];
  const query: LedgerQueryParams = {};

  if (raw.entry_type !== undefined) {
    const entryType = String(raw.entry_type);
    if (!['task', 'feedback', 'agent_registration'].includes(entryType)) {
      errors.push('entry_type must be one of: task, feedback, agent_registration');
    } else {
      query.entry_type = entryType as LedgerEntryType;
    }
  }

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

  if (raw.tag !== undefined) {
    const tag = String(raw.tag).trim();
    if (!tag) errors.push('tag must be a non-empty string');
    else query.tag = tag;
  }

  if (raw.task_type !== undefined) {
    const taskType = String(raw.task_type);
    if (!VALID_TASK_TYPES.includes(taskType as TaskType)) {
      errors.push(`task_type must be one of: ${VALID_TASK_TYPES.join(', ')}`);
    } else {
      query.task_type = taskType as TaskType;
    }
  }

  if (raw.principle !== undefined) {
    const principle = String(raw.principle);
    if (!VALID_PRINCIPLES.includes(principle as RoadmapPrinciple)) {
      errors.push(`principle must be one of: ${VALID_PRINCIPLES.join(', ')}`);
    } else {
      query.principle = principle as RoadmapPrinciple;
    }
  }

  if (raw.requesting_agent !== undefined) {
    const agent = String(raw.requesting_agent).trim();
    if (!agent) {
      errors.push('requesting_agent must be a non-empty string');
    } else {
      query.requesting_agent = agent;
    }
  }

  if (raw.since !== undefined) {
    const since = String(raw.since);
    const parsed = Date.parse(since);
    if (Number.isNaN(parsed)) {
      errors.push('since must be a valid ISO-8601 timestamp');
    } else {
      query.since = new Date(parsed).toISOString();
    }
  }

  if (raw.limit !== undefined) {
    const limit = parseInt(String(raw.limit), 10);
    if (Number.isNaN(limit) || limit < 1) {
      errors.push('limit must be a positive integer');
    } else {
      query.limit = Math.min(limit, MAX_QUERY_LIMIT);
    }
  }

  return { query, errors };
}

export async function queryLedger(params: LedgerQueryParams = {}): Promise<LedgerQueryResult> {
  const ledger = await readLedger();
  const limit = params.limit ?? DEFAULT_QUERY_LIMIT;
  const sinceMs = params.since ? Date.parse(params.since) : undefined;

  const matching = ledger.entries.filter((entry) => matchesQuery(entry, params, sinceMs));
  const entries = matching.slice(-limit);

  return {
    version: ledger.version,
    description: ledger.description,
    last_updated: ledger.last_updated,
    query: { ...params, limit },
    total_in_ledger: ledger.entries.length,
    total_matching: matching.length,
    returned: entries.length,
    entries,
    aggregate_insights: computeInsights(entries),
  };
}

export async function appendLedgerEntry(entry: LedgerEntry): Promise<StigmergicLedger> {
  const ledger = await readLedger();
  ledger.entries.push(entry);
  recomputeInsights(ledger);
  await writeLedger(ledger);
  return ledger;
}

export async function getRecentSignals(limit = 5): Promise<LedgerEntry[]> {
  const result = await queryLedger({ limit });
  return result.entries;
}

/** Derive public trust signals from ledger task and feedback entries */
export async function getReputationMetrics(): Promise<ReputationMetrics> {
  const ledger = await readLedger();
  const { total_tasks, total_feedback, average_satisfaction } = ledger.aggregate_insights;

  let lastActive: string | null = null;
  if (ledger.entries.length > 0) {
    const latest = ledger.entries.reduce((a, b) =>
      new Date(a.timestamp).getTime() >= new Date(b.timestamp).getTime() ? a : b
    );
    lastActive = latest.timestamp;
  } else if (ledger.last_updated) {
    lastActive = ledger.last_updated;
  }

  return {
    totalTasksCompleted: total_tasks,
    averageSatisfactionScore: average_satisfaction,
    lastActive,
    feedbackCount: total_feedback,
  };
}