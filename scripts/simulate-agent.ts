/**
 * Simulates another agent sending a task to the Convergent Swarm Agent.
 *
 * Usage:
 *   npm run simulate                          # Run example 01 (offline, no server)
 *   npm run simulate -- --example 02-agency-convergence
 *   npm run simulate -- --all                 # Run all examples
 *   npm run simulate -- --http                # POST to running server at localhost:3000
 *   npm run simulate -- --http --with-feedback  # Also submit sample feedback
 */

import fs from 'fs/promises';
import path from 'path';

const EXAMPLES_DIR = path.resolve(__dirname, '..', 'examples');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

async function listExamples(): Promise<string[]> {
  const entries = await fs.readdir(EXAMPLES_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^\d{2}-/.test(e.name))
    .map((e) => e.name)
    .sort();
}

async function loadRequest(exampleName: string): Promise<unknown> {
  const filePath = path.join(EXAMPLES_DIR, exampleName, 'request.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function runOffline(exampleName: string): Promise<unknown> {
  const { handleTask } = await import('../src/agent/task-handler');
  const request = await loadRequest(exampleName);
  return handleTask(request as import('../src/types').TaskRequest);
}

async function runHttp(exampleName: string): Promise<unknown> {
  const request = await loadRequest(exampleName);
  const res = await fetch(`${BASE_URL}/api/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }

  return res.json();
}

async function submitSampleFeedback(artifact: {
  task_id: string;
  requesting_agent: string;
}): Promise<void> {
  const feedback = {
    task_id: artifact.task_id,
    requesting_agent: artifact.requesting_agent,
    responses: {
      satisfaction_score: 8,
      improvement_suggestion:
        'Include industry-specific agent marketplace references and competitor benchmarks.',
      roadmap_principle: 'adjacent_possible',
      roadmap_principle_rationale:
        'Exploring adjacent capability spaces would help us discover non-obvious convergence partners in the agent economy.',
    },
  };

  const res = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Feedback HTTP ${res.status}: ${err}`);
  }

  const result = await res.json();
  console.log('\n📋 Feedback stored:', JSON.stringify(result, null, 2));
}

async function runExample(
  exampleName: string,
  options: { http: boolean; withFeedback: boolean }
): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🤖 Simulating agent → CSA | Example: ${exampleName}`);
  console.log(`   Mode: ${options.http ? 'HTTP' : 'Offline (direct handler)'}`);
  console.log('='.repeat(60));

  const request = await loadRequest(exampleName);
  console.log('\n📤 REQUEST:');
  console.log(JSON.stringify(request, null, 2));

  const artifact = (await (options.http
    ? runHttp(exampleName)
    : runOffline(exampleName))) as Record<string, unknown>;

  console.log('\n📥 RESPONSE:');
  console.log(JSON.stringify(artifact, null, 2));

  console.log('\n✅ Key sections present:');
  for (const section of [
    'current_state_analysis',
    'future_state_recommendations',
    'convergence_opportunities',
    'transition_steps',
    'estimated_impact',
    'feedback_request',
  ]) {
    console.log(`   ${artifact[section] ? '✓' : '✗'} ${section}`);
  }

  if (options.withFeedback && options.http) {
    await submitSampleFeedback(artifact as { task_id: string; requesting_agent: string });
  } else if (options.withFeedback && !options.http) {
    console.log('\n💡 Use --http with a running server to test feedback submission.');
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const http = args.includes('--http');
  const withFeedback = args.includes('--with-feedback');
  const all = args.includes('--all');

  const exampleIdx = args.indexOf('--example');
  const exampleArg = exampleIdx >= 0 ? args[exampleIdx + 1] : undefined;

  const examples = await listExamples();

  if (examples.length === 0) {
    console.error('No examples found in examples/');
    process.exit(1);
  }

  const toRun = all
    ? examples
    : [exampleArg ?? examples[0]];

  for (const name of toRun) {
    if (!examples.includes(name)) {
      console.error(`Unknown example: ${name}`);
      console.error(`Available: ${examples.join(', ')}`);
      process.exit(1);
    }
    await runExample(name, { http, withFeedback });
  }

  console.log('\n🐝 Simulation complete.\n');
}

main().catch((err) => {
  console.error('Simulation failed:', err);
  process.exit(1);
});