import path from 'path';

function resolvePublicUrl(): string {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? '3000'}`;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  host: process.env.HOST ?? '0.0.0.0',
  publicUrl: resolvePublicUrl(),
  agentName: process.env.AGENT_NAME ?? 'Convergent Swarm Agent',
  agentVersion: process.env.AGENT_VERSION ?? '1.0.0',
  ledgerPath: process.env.VERCEL
    ? path.join('/tmp', 'stigmergic-ledger.json')
    : path.resolve(process.cwd(), 'ledger', 'stigmergic-ledger.json'),
  systemPromptPath: path.resolve(process.cwd(), 'system-prompt.txt'),
};