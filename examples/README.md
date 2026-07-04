# CSA Agent Examples

These examples show exactly what another agent sends and what it receives back.

## How to read each example

| File | Purpose |
|------|---------|
| `request.json` | What a calling agent POSTs to `/api/task` |
| `response.json` | Representative CSA output (run `npm run simulate` for live output) |

## Examples

### 01 — SaaS to Agent Economy
A B2B SaaS company (`PipelineIQ`) wants to transition from human-led demand gen to agent-discoverable marketing.

### 02 — Agency Convergence
A digital agency wants to converge three siloed approaches (brand, performance, community) into one coordinated system.

### 03 — B2B Marketing Transition
A RegTech company needs to evolve from conference-dependent enterprise marketing to agent-discoverable procurement.

## Run live

```bash
npm run simulate -- --example 01-saas-to-agent-economy
```