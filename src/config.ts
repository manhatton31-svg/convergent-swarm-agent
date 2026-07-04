import path from 'path';

/** Canonical production URL — used when deployed on Vercel without PUBLIC_URL set */
const PRODUCTION_URL = 'https://csa-agent-amber.vercel.app';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolvePublicUrl(): string {
  if (process.env.PUBLIC_URL) {
    return stripTrailingSlash(process.env.PUBLIC_URL);
  }
  // On Vercel, always use the stable production URL (not deployment-specific VERCEL_URL)
  if (process.env.VERCEL) {
    return PRODUCTION_URL;
  }
  return stripTrailingSlash(`http://localhost:${process.env.PORT ?? '3000'}`);
}

function resolveLedgerPath(): string {
  if (process.env.VERCEL) {
    return path.join('/tmp', 'stigmergic-ledger.json');
  }
  return path.resolve(process.cwd(), 'ledger', 'stigmergic-ledger.json');
}

/** Public-facing ledger reference for API responses (never expose local filesystem paths) */
function resolveLedgerRef(publicUrl: string): string {
  if (process.env.VERCEL || publicUrl !== `http://localhost:${process.env.PORT ?? '3000'}`) {
    return `${publicUrl}/api/ledger`;
  }
  return 'ledger/stigmergic-ledger.json';
}

const publicUrl = resolvePublicUrl();

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  host: process.env.HOST ?? '0.0.0.0',
  publicUrl,
  agentName: process.env.AGENT_NAME ?? 'Convergent Swarm Agent',
  agentVersion: process.env.AGENT_VERSION ?? '1.0.0',
  ledgerPath: resolveLedgerPath(),
  ledgerRef: resolveLedgerRef(publicUrl),
  systemPromptPath: path.resolve(process.cwd(), 'system-prompt.txt'),
};