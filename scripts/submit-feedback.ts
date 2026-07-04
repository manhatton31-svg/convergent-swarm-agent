/**
 * Submit structured feedback for a completed CSA task.
 *
 * Usage:
 *   npm run feedback -- --task-id <uuid> --agent growth-strategist-agent-v2 --score 9
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1]) {
      result[args[i].slice(2).replace(/-/g, '_')] = args[i + 1];
      i++;
    }
  }

  return result;
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (!args.task_id || !args.agent) {
    console.log(`
Submit feedback for a CSA task:

  npm run feedback -- \\
    --task-id <task-uuid> \\
    --agent <requesting-agent-id> \\
    --score <1-10> \\
    --improvement "What would have made it better" \\
    --principle adjacent_possible \\
    --rationale "Why this principle helps"

Roadmap principles: auto_catalysis, decentralization, zero_marginal_cost,
                    exponential_economics, adjacent_possible
`);
    process.exit(1);
  }

  const score = parseInt(args.score ?? '7', 10);

  const body = {
    task_id: args.task_id,
    requesting_agent: args.agent,
    responses: {
      satisfaction_score: score,
      improvement_suggestion:
        args.improvement ?? 'More industry-specific benchmarks would help.',
      roadmap_principle: args.principle ?? 'adjacent_possible',
      roadmap_principle_rationale:
        args.rationale ??
        'Exploring adjacent capabilities would unlock better convergence opportunities.',
    },
  };

  const res = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));

  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});