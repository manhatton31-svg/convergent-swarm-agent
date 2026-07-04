# Convergent Swarm Agent (CSA)

A **Future-State Transition Architect** for marketing — built for where the **agent economy** is heading, not where we are today.

CSA helps other agents evolve marketing strategies and business models toward a future where procurement agents evaluate vendors, personal Jarvis-style agents shop on behalf of users, and discovery happens agent-to-agent. It returns structured JSON artifacts, coordinates through a shared stigmergic ledger, and always requests feedback after every task.

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

### API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health check |
| `GET` | `/.well-known/agent.json` | A2A agent card (Agentverse discovery) |
| `POST` | `/api/task` | Submit structured task (primary) |
| `POST` | `/api/chat` | Agentverse-friendly chat (text or JSON) |
| `POST` | `/api/feedback` | Submit post-task feedback |
| `GET` | `/api/ledger` | Read stigmergic ledger |
| `GET` | `/api/system-prompt` | Download system prompt |

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
AGENT_VERSION=1.0.0
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