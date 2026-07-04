import fs from 'fs/promises';
import { config } from '../config';
import { readLedger } from '../ledger/stigmergic-ledger';
import type {
  HealthCapabilitiesStatus,
  HealthLedgerStatus,
  HealthResponse,
  HealthStatus,
  LedgerFeedbackEntry,
  LedgerTaskEntry,
} from '../types';

const processStartedAt = Date.now();

export interface HealthResult {
  body: HealthResponse;
  httpStatus: number;
}

async function checkSystemPromptAvailable(): Promise<boolean> {
  try {
    await fs.access(config.systemPromptPath);
    return true;
  } catch {
    return false;
  }
}

async function probeLedger(): Promise<{
  ledgerStatus: HealthLedgerStatus;
  lastActivity: string | null;
}> {
  try {
    const ledger = await readLedger();
    const taskEntries = ledger.entries.filter((e): e is LedgerTaskEntry => e.type === 'task');
    const feedbackEntries = ledger.entries.filter(
      (e): e is LedgerFeedbackEntry => e.type === 'feedback'
    );

    let lastActivity: string | null = null;
    if (ledger.entries.length > 0) {
      const latest = ledger.entries.reduce((a, b) =>
        new Date(a.timestamp).getTime() >= new Date(b.timestamp).getTime() ? a : b
      );
      lastActivity = latest.timestamp;
    }

    return {
      ledgerStatus: {
        entry_count: ledger.entries.length,
        task_entries: taskEntries.length,
        feedback_entries: feedbackEntries.length,
        last_write_time: ledger.last_updated ?? null,
        readable: true,
      },
      lastActivity,
    };
  } catch {
    return {
      ledgerStatus: {
        entry_count: 0,
        task_entries: 0,
        feedback_entries: 0,
        last_write_time: null,
        readable: false,
      },
      lastActivity: null,
    };
  }
}

function resolveStatus(
  ledgerReadable: boolean,
  systemPromptAvailable: boolean,
  ledgerMode: HealthCapabilitiesStatus['ledger_mode']
): HealthStatus {
  if (!ledgerReadable || !systemPromptAvailable) {
    return 'unhealthy';
  }
  if (ledgerMode === 'ephemeral') {
    return 'degraded';
  }
  return 'healthy';
}

export async function getHealthStatus(): Promise<HealthResult> {
  const [systemPromptAvailable, ledgerProbe] = await Promise.all([
    checkSystemPromptAvailable(),
    probeLedger(),
  ]);

  const capabilities_status: HealthCapabilitiesStatus = {
    ledger_mode: config.ledgerMode,
    schemas_enabled: true,
    feedback_loop_enabled: true,
    stigmergic_ledger_queryable: ledgerProbe.ledgerStatus.readable,
    system_prompt_available: systemPromptAvailable,
  };

  const status = resolveStatus(
    ledgerProbe.ledgerStatus.readable,
    systemPromptAvailable,
    config.ledgerMode
  );

  const body: HealthResponse = {
    status,
    version: config.agentVersion,
    uptime_seconds: Math.floor((Date.now() - processStartedAt) / 1000),
    last_activity: ledgerProbe.lastActivity,
    capabilities_status,
    ledger_status: ledgerProbe.ledgerStatus,
    environment: config.environment,
    timestamp: new Date().toISOString(),
    agent: config.agentName,
  };

  const httpStatus = status === 'unhealthy' ? 503 : 200;

  return { body, httpStatus };
}