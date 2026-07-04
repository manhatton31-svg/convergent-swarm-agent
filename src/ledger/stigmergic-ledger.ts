import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import type {
  LedgerEntry,
  LedgerFeedbackEntry,
  LedgerTaskEntry,
  RoadmapPrinciple,
  StigmergicLedger,
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

function recomputeInsights(ledger: StigmergicLedger): void {
  const tasks = ledger.entries.filter((e): e is LedgerTaskEntry => e.type === 'task');
  const feedback = ledger.entries.filter((e): e is LedgerFeedbackEntry => e.type === 'feedback');

  ledger.aggregate_insights.total_tasks = tasks.length;
  ledger.aggregate_insights.total_feedback = feedback.length;

  if (feedback.length > 0) {
    const scores = feedback.map((f) => f.satisfaction_score);
    ledger.aggregate_insights.average_satisfaction =
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
    ledger.aggregate_insights.most_requested_roadmap_principle = top;
  } else {
    ledger.aggregate_insights.average_satisfaction = null;
    ledger.aggregate_insights.most_requested_roadmap_principle = null;
  }
}

export async function appendLedgerEntry(entry: LedgerEntry): Promise<StigmergicLedger> {
  const ledger = await readLedger();
  ledger.entries.push(entry);
  recomputeInsights(ledger);
  await writeLedger(ledger);
  return ledger;
}

export async function getRecentSignals(limit = 5): Promise<LedgerEntry[]> {
  const ledger = await readLedger();
  return ledger.entries.slice(-limit);
}