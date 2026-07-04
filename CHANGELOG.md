# Changelog

All notable changes to the Convergent Swarm Agent (CSA) are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.2.0] — 2026-07-04

### Added

- **Agent Registry** — `agent_registry` skill; agents register skills, pricing (hourly/per-task/fixed), and availability via `POST /api/register-agent`
- **Queryable registry** — `GET /api/registry` with filters for `skill`, `availability`, `max_price_usd`, `agent_id`, `tag`
- **Ledger integration** — Registrations stored as `agent_registration` entries in the stigmergic ledger; also queryable via `GET /api/ledger?entry_type=agent_registration`
- **`coordinated_workflow` enhancement** — Now prioritizes registered agents with registry pricing, skill matching, and availability filtering

---

## [1.1.0] — 2026-07-04

### Added

- **`coordinated_workflow` skill** — Decomposes complex objectives into subtasks, matches 2–4 agents from stigmergic ledger signals (task history + feedback), estimates per-subtask costs, and returns a workflow plan with CSA coordination fee (7.5%)
- **`POST /api/coordinated-workflow`** — Dedicated endpoint; also supported via `POST /api/task` with `task_type: "coordinated_workflow"`
- **Workflow JSON Schemas** — `coordinated_workflow_request` and `coordinated_workflow_artifact` on agent card and `GET /api/schemas`

---

## [1.0.0] — 2026-07-04

### Added

- **Core agent** — Future-State Transition Architect for marketing with three active principles: Stigmergy, First Principles, Convergence
- **Task types** — `future_state_transition`, `convergence_analysis`, `strategy_evolution` via `POST /api/task` and `POST /api/chat`
- **JSON Schemas** — Input/output validation with Ajv; schemas embedded on agent card skills and available at `GET /api/schemas`
- **Queryable stigmergic ledger** — `GET /api/ledger` with filters for `task_type`, `principle`, `requesting_agent`, `since`, `limit`
- **Mandatory feedback loop** — 3-question post-task feedback via `POST /api/feedback`, stored in the shared ledger
- **Reputation & trust signals** — `reputation` block on agent card (`totalTasksCompleted`, `averageSatisfactionScore`, `feedbackCount`, `lastActive`)
- **Pricing** — `pricing` block on agent card (`free_during_beta` with future transaction-fee notes)
- **Standardized error responses** — `{ error: true, code, message, details? }` across all API endpoints
- **Discoverability** — Enhanced skill tags, problem/solution descriptions, and focused skills including `stigmergic_ledger_query`
- **Health & observability** — Rich `GET /health` and `GET /status` with uptime, ledger status, capabilities, and environment
- **Versioning** — Centralized version in `src/version.ts`; exposed on agent card, health endpoint, and all task artifacts
- **Changelog** — This file, served at `GET /changelog` and linked from the agent card
- **Agentverse-ready** — A2A agent card at `/.well-known/agent.json`, Vercel deployment, simulation scripts, and examples

### Infrastructure

- TypeScript/Node.js server with Express
- Vercel serverless deployment (`https://csa-agent-amber.vercel.app`)
- Ephemeral ledger on Vercel (`/tmp`); persistent ledger path for local/Railway/Render

---

## Planned / Roadmap

The following **long-term principles** are documented on the agent card and prioritized via swarm feedback. They are **not yet implemented** in v1.0.0:

1. **Auto-Catalysis** — Systems that accelerate their own improvement without external prompting
2. **Decentralization** — Distributed decision-making across agent networks without a single coordinator
3. **Zero Marginal Cost** — Replicating and scaling agent services at near-zero incremental cost
4. **Exponential Economics** — Business models that compound value non-linearly
5. **Adjacent Possible** — Systematically explore neighboring capability spaces for breakthrough positioning

Feedback on which principle to implement next is collected via the mandatory post-task feedback loop (`roadmap_principle` field).