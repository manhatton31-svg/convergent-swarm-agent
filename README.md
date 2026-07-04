# Convergent Swarm Agent (CSA)

A **Future-State Transition Architect** for marketing — built for where the **agent economy** is heading, not where we are today.

CSA helps other agents evolve marketing strategies and business models toward a future where procurement agents evaluate vendors, personal Jarvis-style agents shop on behalf of users, and discovery happens agent-to-agent. It returns structured JSON artifacts, coordinates through a shared stigmergic ledger, always requests feedback after every task, and exposes basic **reputation metrics** on its agent card so other agents can assess trust before collaborating.

---

## How to Deploy & Register on Agentverse

This is the fastest path from zero to a live agent on [Agentverse](https://agentverse.ai).

### Step 1 — Test locally (2 minutes)

```bash
npm install
npm run simulate        # offline test — no server needed
npm run dev             # start server at http://localhost:3000
```

Verify the agent card loads:

```bash
curl http://localhost:3000/.well-known/agent.json
curl http://localhost:3000/health
```

### Step 2 — Deploy to Vercel (easiest option)

1. **Push this project to GitHub** (create a repo and push the code).

2. **Create a Vercel project**:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click **Add New → Project** and import your GitHub repo
   - Vercel auto-detects the Node.js project — no extra config needed
   - Click **Deploy**

3. **Set one environment variable** in Vercel (Project → Settings → Environment Variables):

   | Variable | Value | Example |
   |----------|-------|---------|
   | `PUBLIC_URL` | Your Vercel deployment URL | `https://csa-agent.vercel.app` |

   > Vercel also sets `VERCEL_URL` automatically. `PUBLIC_URL` ensures your agent card and feedback endpoints show the correct public URL.

4. **Redeploy** after adding the environment variable (Deployments → ⋯ → Redeploy).

5. **Confirm it works** — open these URLs in your browser:

   ```
   https://YOUR-APP.vercel.app/health
   https://YOUR-APP.vercel.app/.well-known/agent.json
   ```

### Step 3 — Get your public URL

After deployment, your public URL is:

```
https://YOUR-APP.vercel.app
```

Your agent card URL (needed for Agentverse registration):

```
https://YOUR-APP.vercel.app/.well-known/agent.json
```

### Step 4 — Register on Agentverse

1. Go to [agentverse.ai](https://agentverse.ai) and sign in.
2. Click **Launch Agent** (or **Add Agent**).
3. Choose **External / A2A Agent**.
4. Enter your agent card URL:
   ```
   https://YOUR-APP.vercel.app/.well-known/agent.json
   ```
5. Agentverse reads your agent card automatically — name, skills, description, and capabilities.
6. Use the **Inspector** to test chat. Send a message like:
   ```
   Transition our B2B SaaS from human-led demand gen to agent-discoverable marketing
   ```
7. Submit feedback when prompted via `POST /api/feedback` (see examples below).

**Registration reference:** See `agentverse/manifest.json` for the full endpoint map, principles, and feedback loop documentation to copy into your Agentverse profile if needed.

### Alternative deployments

Vercel works great for v1. For persistent ledger storage across restarts, consider Render or Railway (always-on Node.js process). See the Dockerfile for container deployment.

---

## What This Agent Does

| Capability | Description |
|------------|-------------|
| **Analyze** | Assess current marketing models — honest readiness scoring for agent-economy legibility |
| **Architect** | Design bold transition paths toward agent-discoverable, Jarvis-ready operations |
| **Converge** | Synthesize 2–3 creative convergences with named playbooks and first actions |
| **Coordinate** | Publish environmental signals to a shared JSON ledger (stigmergy) |
| **Evolve** | Collect mandatory structured feedback to prioritize the long-term roadmap |
| **Trust** | Publish reputation signals on the agent card from ledger activity |

### Reputation & Trust Signals

CSA tracks basic reputation metrics from the stigmergic ledger and exposes them on `GET /.well-known/agent.json` under the top-level `reputation` object:

| Field | Source | Description |
|-------|--------|-------------|
| `totalTasksCompleted` | Ledger task entries | Number of tasks completed and recorded |
| `averageSatisfactionScore` | Feedback entries | Mean satisfaction score (1–10); `null` if no feedback yet |
| `feedbackCount` | Feedback entries | Number of post-task feedback submissions received |
| `lastActive` | Latest ledger entry | ISO-8601 timestamp of most recent task or feedback |

Metrics update dynamically when tasks and feedback are stored. Calling agents can use these signals alongside ledger queries (`GET /api/ledger`) to decide whether to delegate work.

Example agent card excerpt:

```json
{
  "reputation": {
    "totalTasksCompleted": 12,
    "averageSatisfactionScore": 8.4,
    "feedbackCount": 9,
    "lastActive": "2026-07-04T14:22:00.000Z"
  }
}
```

### Active Principles (v1)

1. **Stigmergy** — Coordinate via shared JSON ledger, not constant direct messaging
2. **First Principles Thinking** — Strip pre-agent assumptions; redesign for agent discovery
3. **Convergence** — Fuse 2+ approaches for multiplied outcomes

### Roadmap (documented, evolving via feedback)

4. Auto-Catalysis · 5. Decentralization · 6. Zero Marginal Cost · 7. Exponential Economics · 8. Adjacent Possible

---

## Project Structure

```
csa-agent/
├── vercel-entry.ts          # Vercel serverless entry point
├── src/
│   ├── agent/               # Task handler + transition architect logic
│   ├── feedback/            # Mandatory feedback collection
│   ├── ledger/              # Stigmergic ledger read/write
│   ├── types/               # TypeScript interfaces
│   ├── server.ts            # HTTP API (Express)
│   └── index.ts             # Local server entry point
├── ledger/
│   └── stigmergic-ledger.json
├── examples/                # Sample agent-to-agent interactions
├── scripts/
│   ├── simulate-agent.ts    # Test as another agent
│   └── submit-feedback.ts   # Submit feedback manually
├── agentverse/
│   └── manifest.json        # Agentverse registration reference
├── system-prompt.txt        # Full agent instructions
└── vercel.json              # Vercel deployment config
```

---

## How Other Agents Use CSA

### 1. Send a task

```bash
POST /api/task
Content-Type: application/json
```

```json
{
  "requesting_agent": "your-agent-id",
  "task_type": "future_state_transition",
  "context": {
    "business_name": "Acme Corp",
    "industry": "B2B SaaS",
    "current_marketing_model": "Human-led demand gen with agency support",
    "current_channels": ["LinkedIn", "SEO", "webinars"],
    "target_audience": "VP Engineering at mid-market companies",
    "goals": ["Reduce CAC", "Become agent-discoverable"],
    "constraints": ["$30k/month budget cap"]
  }
}
```

### 2. Receive a structured artifact

The response includes:

- `current_state_analysis` — readiness score, strengths, gaps, first-principles breakdown
- `future_state_recommendations` — Jarvis-ready vision, capabilities, business model shifts
- `convergence_opportunities` — 2–3 named syntheses with `first_action` steps
- `transition_steps` — phased plan toward agent-mediated revenue
- `estimated_impact` — revenue, efficiency, risk, confidence
- `feedback_request` — **mandatory** 3-question feedback form

### 3. Submit feedback

```bash
POST /api/feedback
```

```json
{
  "task_id": "<from response>",
  "requesting_agent": "your-agent-id",
  "responses": {
    "satisfaction_score": 8,
    "improvement_suggestion": "Include competitor benchmarks",
    "roadmap_principle": "adjacent_possible",
    "roadmap_principle_rationale": "Exploring adjacent spaces would improve convergence"
  }
}
```

### 4. Read swarm signals (optional)

```bash
GET /api/ledger
```

---

## Run Locally

### Prerequisites

- Node.js 18+
- npm

### Install & start

```bash
npm install
npm run dev             # development with auto-reload
npm run build && npm start   # production
```

### Health & observability

Orchestrators and calling agents can probe operational status at:

```
GET /health
GET /status   # alias
```

Returns structured JSON with `status` (`healthy` | `degraded` | `unhealthy`), `version`, `uptime_seconds`, `last_activity`, `capabilities_status`, `ledger_status`, `environment`, and `timestamp`.

| Status | Meaning |
|--------|---------|
| `healthy` | All dependencies readable; persistent ledger (local/Railway/Render) |
| `degraded` | Operational but ledger is **ephemeral** (Vercel `/tmp` — data resets on cold starts) |
| `unhealthy` | Critical failure (ledger or system prompt unreadable) — HTTP 503 |

Example:

```bash
curl https://csa-agent-amber.vercel.app/health
```

```json
{
  "status": "degraded",
  "version": "1.0.0",
  "uptime_seconds": 42,
  "last_activity": "2026-07-04T16:19:11.600Z",
  "capabilities_status": {
    "ledger_mode": "ephemeral",
    "schemas_enabled": true,
    "feedback_loop_enabled": true,
    "stigmergic_ledger_queryable": true,
    "system_prompt_available": true
  },
  "ledger_status": {
    "entry_count": 3,
    "task_entries": 2,
    "feedback_entries": 1,
    "last_write_time": "2026-07-04T16:19:11.601Z",
    "readable": true
  },
  "environment": "production",
  "timestamp": "2026-07-04T17:00:00.000Z",
  "agent": "Convergent Swarm Agent"
}
```

Documented on the agent card under `capabilities.health`.

### API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health & observability probe |
| `GET` | `/status` | Alias for `/health` |
| `GET` | `/.well-known/agent.json` | A2A agent card (Agentverse discovery) |
| `POST` | `/api/task` | Submit structured task (primary) |
| `POST` | `/api/coordinated-workflow` | Multi-agent workflow plan with cost estimates |
| `POST` | `/api/register-agent` | Register agent skills, pricing, and availability |
| `GET` | `/api/registry` | Query the agent registry |
| `POST` | `/api/chat` | Agentverse-friendly chat (text or JSON) |
| `POST` | `/api/feedback` | Submit post-task feedback |
| `GET` | `/api/ledger` | Read stigmergic ledger |
| `GET` | `/api/system-prompt` | Download system prompt |
| `GET` | `/changelog` | Public changelog (Markdown) |

---

## Test Locally (Simulate Another Agent)

```bash
npm run simulate                              # offline — first example
npm run simulate -- --example 02-agency-convergence
npm run simulate:all                          # all 3 examples
npm run simulate -- --http --with-feedback    # against running server
```

---

## Examples

| Example | Scenario |
|---------|----------|
| `01-saas-to-agent-economy` | B2B SaaS transitioning from human-led demand gen |
| `02-agency-convergence` | Agency converging brand + performance + community |
| `03-b2b-marketing-transition` | RegTech evolving to agent-discoverable procurement |

Each folder has `request.json` (input) and `response.json` (representative output). See `examples/README.md`.

---

## Configuration

Copy `.env.example` to `.env`:

```bash
PORT=3000
PUBLIC_URL=http://localhost:3000
AGENT_NAME=Convergent Swarm Agent
AGENT_VERSION=1.0.0   # optional override; canonical version is in src/version.ts
```

On Vercel, set `PUBLIC_URL` to your deployment URL. The ledger uses `/tmp` on Vercel (ephemeral); use Render/Railway for persistent ledger storage.

---

## Task Types

| Type | Use when |
|------|----------|
| `future_state_transition` | Full transition plan to agent-economy target state |
| `convergence_analysis` | Combine 2+ approaches (set `approaches_to_converge`) |
| `strategy_evolution` | Evolve existing strategy with first-principles refresh |

---

## License

MIT