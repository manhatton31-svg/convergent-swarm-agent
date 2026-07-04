import type {
  ActivePrinciple,
  ConvergenceOpportunity,
  CurrentStateAnalysis,
  EstimatedImpact,
  FutureStateRecommendation,
  TaskContext,
  TaskType,
  TransitionStep,
} from '../types';

// ---------------------------------------------------------------------------
// Context inference helpers
// ---------------------------------------------------------------------------

type IndustryProfile = 'saas' | 'agency' | 'enterprise' | 'ecommerce' | 'general';

function inferIndustry(context: TaskContext): IndustryProfile {
  const text = `${context.industry ?? ''} ${context.current_marketing_model}`.toLowerCase();
  if (/saas|b2b|software|subscription/.test(text)) return 'saas';
  if (/agency|retainer|client/.test(text)) return 'agency';
  if (/enterprise|compliance|regtech|bank|tier-1|abm/.test(text)) return 'enterprise';
  if (/dtc|e-?commerce|shopify|consumer|brand/.test(text)) return 'ecommerce';
  return 'general';
}

function assessReadiness(context: TaskContext): number {
  let score = 35;
  const model = context.current_marketing_model.toLowerCase();

  if (model.includes('digital') || model.includes('saas') || model.includes('subscription')) score += 15;
  if (model.includes('manual') || model.includes('agency') || model.includes('traditional')) score -= 10;
  if (context.current_channels?.some((c) => /api|automation|programmatic/i.test(c))) score += 10;
  if (context.goals?.some((g) => /agent|autonom|ai|autom|discover/i.test(g))) score += 15;
  if ((context.constraints?.length ?? 0) > 3) score -= 5;

  return Math.max(10, Math.min(95, score));
}

function inferFundamentalNeed(context: TaskContext): string {
  const audience = context.target_audience ?? 'their market';
  const business = context.business_name ?? 'the business';
  return `When a person's Jarvis-style agent is shopping on their behalf, ${business} must be instantly evaluable, trust-verifiable, and contract-ready — not merely visible to humans scrolling feeds`;
}

function primaryChannels(context: TaskContext): string[] {
  return context.current_channels?.length
    ? context.current_channels
    : ['owned content', 'paid acquisition', 'direct outreach'];
}

// ---------------------------------------------------------------------------
// Convergence — 2–3 creative syntheses per task
// ---------------------------------------------------------------------------

interface ConvergenceTemplate {
  convergence_name: string;
  approaches: string[];
  combined_strategy: string;
  synergy_rationale: string;
  expected_multiplier: string;
  first_action: string;
}

function synthesizeFromProvidedApproaches(
  approaches: string[],
  business: string,
  channels: string[]
): ConvergenceTemplate[] {
  const results: ConvergenceTemplate[] = [];
  const a = approaches;

  if (a.length >= 2) {
    results.push({
      convergence_name: 'Signal Arbitrage Loop',
      approaches: [a[0], a[1]],
      combined_strategy:
        `Treat "${a[0]}" as the hypothesis generator and "${a[1]}" as the capital allocator. ` +
        `Winning signals from the first approach auto-publish to the stigmergic ledger; the second approach ` +
        `reads ledger state and reallocates within 24 hours — no human standup required. ` +
        `${business} becomes a self-tuning system, not a campaign calendar.`,
      synergy_rationale:
        `Neither approach alone closes the loop. "${a[0]}" discovers what resonates; "${a[1]}" decides what scales. ` +
        `The ledger is the missing nervous system that turns two siloed teams into one reflex.`,
      expected_multiplier: '2–3x experiment throughput; 20–35% faster kill/scale decisions',
      first_action: `Define a ledger schema field "signal_strength" and wire ${channels[0] ?? 'primary channel'} metrics to auto-publish after each experiment.`,
    });
  }

  if (a.length >= 3) {
    results.push({
      convergence_name: 'Triangulated Trust Surface',
      approaches: [a[0], a[2]],
      combined_strategy:
        `Fuse "${a[0]}" (depth) with "${a[2]}" (social proof) into a machine-readable trust bundle: ` +
        `case outcomes + community validation + third-party attestations, published as a single agent-queryable credential. ` +
        `Procurement agents and personal Jarvis agents evaluate trust in milliseconds, not weeks of sales calls.`,
      synergy_rationale:
        `"${a[2]}" supplies authentic demand proof that "${a[0]}" alone cannot generate at speed. ` +
        `Together they answer the question every buyer agent asks: "Is this real, and do peers vouch for it?"`,
      expected_multiplier: '40–60% reduction in evaluation friction for agent-mediated buyers',
      first_action: `Package top 5 proof points from "${a[0]}" and "${a[2]}" into a JSON trust manifest at \`/.well-known/trust.json\`.`,
    });

    results.push({
      convergence_name: 'Ambient Distribution Mesh',
      approaches: [a[1], a[2]],
      combined_strategy:
        `Converge "${a[1]}" (performance efficiency) with "${a[2]}" (organic reach) into ambient distribution: ` +
        `community advocates become micro-publishers; performance agents bid only on community-validated assets. ` +
        `Spend follows proof, not predictions. Every dollar routes through ledger-visible social signal.`,
      synergy_rationale:
        `Performance marketing alone burns budget on unproven creative. Community alone lacks scale. ` +
        `The synthesis creates a proof-gated spend engine — the model personal agents will prefer when spending on behalf of users.`,
      expected_multiplier: '1.8–2.5x ROAS on converged assets vs. siloed performance campaigns',
      first_action: `Tag community-sourced content with ledger IDs; require a minimum signal score before performance agents can promote.`,
    });
  }

  return results;
}

function generateContextualConvergences(
  context: TaskContext,
  taskType: TaskType,
  industry: IndustryProfile
): ConvergenceTemplate[] {
  const business = context.business_name ?? 'the business';
  const channels = primaryChannels(context);

  if (context.approaches_to_converge && context.approaches_to_converge.length >= 2) {
    const synthesized = synthesizeFromProvidedApproaches(
      context.approaches_to_converge,
      business,
      channels
    );
    if (synthesized.length >= 2) return synthesized.slice(0, 3);
  }

  const catalog: Record<IndustryProfile, ConvergenceTemplate[]> = {
    saas: [
      {
        convergence_name: 'Procurement-Ready Positioning',
        approaches: ['product-led growth signals', 'outbound ICP targeting'],
        combined_strategy:
          `Publish a machine-readable capability catalog (features, SLAs, pricing tiers, integration endpoints) that procurement agents ` +
          `can evaluate alongside PLG usage signals. Outbound ICP data trains which agent-marketplaces to register in. ` +
          `${business} is sold when a buyer's Jarvis agent matches needs to capabilities — not when an SDR catches someone at the right moment.`,
        synergy_rationale:
          'PLG generates proof-of-value; outbound generates ICP precision. Converged, they produce an agent-discoverable offer ' +
          'that personal agents can shortlist, compare, and initiate trial contracts without human sales relay.',
        expected_multiplier: '3–5x increase in qualified agent-initiated pipeline within 12 months',
        first_action: 'Publish capability catalog JSON and register agent card on Agentverse with ICP tags from top 20 accounts.',
      },
      {
        convergence_name: 'Autonomous Experiment Flywheel',
        approaches: [channels[0] ?? 'content', 'paid acquisition'],
        combined_strategy:
          `Content agents publish positioning variants to the ledger; paid agents run micro-budget tests on ledger-flagged winners only. ` +
          `Losers are killed automatically. Winners scale without campaign review meetings. ` +
          `The flywheel replaces quarterly planning with continuous agent-driven evolution.`,
        synergy_rationale:
          'Content without performance data is guesswork. Performance without content depth is commodity spend. ' +
          'The flywheel creates a closed learning system that compounds — the operating model agent economies reward.',
        expected_multiplier: '2–4x faster positioning convergence; 25–40% lower wasted ad spend',
        first_action: `Connect ${channels[0] ?? 'content'} performance metrics to ledger; set paid agent rule: only promote ledger entries with signal_score > 0.7.`,
      },
      {
        convergence_name: 'Reputation-as-Distribution',
        approaches: ['customer outcome data', 'analyst and peer validation'],
        combined_strategy:
          `Package verified customer outcomes as agent-queryable reputation credentials. Analyst mentions and peer references ` +
          `become attestations in a trust graph that procurement and personal agents traverse before engaging. ` +
          `Marketing shifts from "getting attention" to "being structurally credible to machines."`,
        synergy_rationale:
          'In an agent economy, distribution is a function of trust topology — who vouches for you, with what evidence. ' +
          'Outcome data plus third-party validation creates the trust density that makes agents recommend you over competitors.',
        expected_multiplier: '50–70% higher shortlist rate in agent-mediated vendor evaluations',
        first_action: 'Structure 10 customer outcomes as JSON attestations with verifiable metrics; link from agent card.',
      },
    ],
    agency: [
      {
        convergence_name: 'Client Agent Proxy Model',
        approaches: ['brand strategy', 'performance optimization'],
        combined_strategy:
          `${business} publishes a client-state ledger: brand guidelines, creative assets, performance benchmarks, and budget constraints ` +
          `as structured signals. Brand and media agents read the same ledger and act in parallel — the agency becomes an agent-coordinated ` +
          `system, not a meeting-coordinated one. Client Jarvis agents get weekly structured updates, not slide decks.`,
        synergy_rationale:
          'Agencies die in the agent economy if they remain human relay stations. Converging brand and performance through a shared ledger ' +
          'makes the agency itself an agent-orchestration layer — the value clients will pay for when their own agents handle execution.',
        expected_multiplier: '2x client capacity per strategist; 50% reduction in reporting overhead',
        first_action: 'Create per-client ledger namespace; migrate brand guidelines and media rules into machine-readable JSON this week.',
      },
      {
        convergence_name: 'UGC-to-Performance Pipeline',
        approaches: ['community creative', 'programmatic media buying'],
        combined_strategy:
          `Community agents surface authentic creative; a scoring agent rates ledger-published UGC; media buying agents ` +
          `only allocate budget to community-validated assets. Creative production and media spend become one converged pipeline ` +
          `where social proof gates capital deployment.`,
        synergy_rationale:
          'Performance buying without authentic creative is arbitraged away. Community creative without performance scale is a hobby. ' +
          'The pipeline mirrors how personal Jarvis agents will shop: social proof first, then optimized transaction.',
        expected_multiplier: '1.8–2.5x ROAS; 3x creative variant velocity',
        first_action: 'Implement UGC signal scoring in ledger; block media agent spend on unscored creative.',
      },
      {
        convergence_name: 'Outcome-Contract Convergence',
        approaches: ['retainer service model', 'performance-based pricing'],
        combined_strategy:
          `Converge retainer stability with performance accountability: base agent-access fee plus outcome triggers ` +
          `published to the ledger and verifiable by client procurement agents. The agency sells agent-callable marketing primitives ` +
          `with smart-contract-style outcome clauses — the business model agent economies prefer over opaque retainers.`,
        synergy_rationale:
          'Retainers optimize for hours; outcome pricing optimizes for results. Converged, they create a model where client agents ' +
          'can evaluate, hire, and audit agency performance programmatically — essential when the client\'s Jarvis is the buyer.',
        expected_multiplier: '30–50% higher client lifetime value; 2x win rate on agent-savvy prospects',
        first_action: 'Define 3 outcome triggers (ROAS, CAC, conversion rate) as ledger-verifiable metrics; propose hybrid pricing to one pilot client.',
      },
    ],
    enterprise: [
      {
        convergence_name: 'Compliance-Grade Agent Catalog',
        approaches: ['analyst relations', 'technical capability APIs'],
        combined_strategy:
          `Publish a compliance-attested capability catalog that procurement agents can evaluate alongside analyst positioning. ` +
          `Every public claim links to verifiable evidence. Analyst citations become machine-readable attestations in the trust graph. ` +
          `${business} wins when a bank's procurement agent shortlists verified vendors — not when a human attends a conference.`,
        synergy_rationale:
          'Enterprise buying will be agent-mediated long before humans stop attending conferences. Analyst relations supply credibility; ' +
          'APIs supply evaluability. Convergence makes the vendor legible to machines with enterprise-grade trust requirements.',
        expected_multiplier: '40–60% faster procurement cycles; 3x agent-discoverable touchpoints',
        first_action: 'Map existing API docs to agent-card skills; attach analyst citations as trust attestations.',
      },
      {
        convergence_name: 'ABM-to-Agent-Targeting',
        approaches: ['account-based marketing', 'agent marketplace presence'],
        combined_strategy:
          `Convert ABM account lists into agent-marketplace registration targets. For each tier-1 account, identify the likely ` +
          `procurement and Jarvis-agent ecosystems they operate in. Publish positioning specifically for those agent contexts — ` +
          `not generic web copy. ABM becomes Agent-Based (machine) Marketing.`,
        synergy_rationale:
          'ABM targets accounts; agent marketing targets the agents those accounts deploy. Converging them reaches decision-makers ' +
          'through their personal and procurement agents — the path that scales as Jarvis-style agents become standard in enterprise.',
        expected_multiplier: '2–3x engagement with target accounts via agent-mediated channels',
        first_action: 'For top 10 ABM accounts, document which agent platforms they likely use; create tailored agent-card variants.',
      },
      {
        convergence_name: 'Always-On Trust Publishing',
        approaches: ['conference thought leadership', 'continuous content'],
        combined_strategy:
          `Replace episodic conference visibility with continuous trust publishing: regulatory updates, compliance proofs, and ` +
          `capability evolution published to the ledger in real time. Conference content becomes ledger attestations that agents ` +
          `reference year-round, not slides that expire after the event.`,
        synergy_rationale:
          'Conferences are human networking; trust publishing is agent networking. Converging them means conference insights ' +
          'live as permanent, queryable credentials — the difference between being remembered and being discoverable.',
        expected_multiplier: '5x longevity of thought leadership assets; continuous agent-discoverable presence',
        first_action: 'Convert last conference presentation into 5 ledger-published attestations with verifiable claims.',
      },
    ],
    ecommerce: [
      {
        convergence_name: 'Personal-Agent Storefront',
        approaches: ['brand storytelling', 'conversion optimization'],
        combined_strategy:
          `Publish product catalog, brand narrative, and social proof as a unified agent-queryable storefront. When a user's Jarvis ` +
          `agent shops for products in your category, it evaluates brand fit, reviews, price, and availability in one structured query — ` +
          `not by browsing your website. Brand and conversion converge into machine-readable commerce.`,
        synergy_rationale:
          'DTC brands that survive the agent economy will be the ones personal agents can shop programmatically. Brand supplies preference matching; ' +
          'conversion data supplies ranking signals. Together they make the brand agent-shopable.',
        expected_multiplier: '3–5x agent-initiated purchase consideration in category',
        first_action: 'Publish product catalog JSON with brand attributes, review scores, and availability at /.well-known/products.json.',
      },
      {
        convergence_name: 'Influencer-Performance Fusion',
        approaches: ['influencer partnerships', 'paid social'],
        combined_strategy:
          `Influencer content auto-publishes to ledger with engagement signals; paid social agents promote only influencer assets ` +
          `above signal threshold. Influencer relationships become a performance asset class, not a brand expense line.`,
        synergy_rationale:
          'Influencer marketing without performance accountability is a brand tax. Paid social without authentic creative is commodity. ' +
          'Fusion creates proof-gated amplification — the model both personal agents and procurement agents will replicate.',
        expected_multiplier: '2x influencer ROI; 40% reduction in underperforming paid spend',
        first_action: 'Require influencer posts to publish ledger signals before paid promotion budget unlocks.',
      },
      {
        convergence_name: 'Community-Led Agent Referrals',
        approaches: ['ambassador programs', 'email/SMS retention'],
        combined_strategy:
          `Ambassador agents publish referral credentials to the ledger; retention agents trigger personalized offers when referral ` +
          `graph signals indicate purchase intent in a user's network. Community and retention converge into an agent-visible referral topology.`,
        synergy_rationale:
          'Personal Jarvis agents will ask "who do I trust in this category?" before "what ad did I see?" Ambassador networks answer that question. ' +
          'Retention systems activate the answer. Convergence builds the trust graph that replaces ad-driven discovery.',
        expected_multiplier: '25–40% of new customers from agent-visible referral paths within 18 months',
        first_action: 'Issue ambassador agents unique referral credentials; wire retention triggers to referral graph signals.',
      },
    ],
    general: [
      {
        convergence_name: 'Discovery-to-Contract Pipeline',
        approaches: ['content authority', 'direct sales outreach'],
        combined_strategy:
          `Content agents establish category authority and publish proof to the ledger; outreach agents engage only accounts ` +
          `whose procurement or Jarvis agents have queried the ledger. Marketing becomes a pull system triggered by agent interest signals, ` +
          `not a push system triggered by calendar dates.`,
        synergy_rationale:
          'Content without agent-discoverable structure is invisible to machines. Outreach without signal-triggered timing is spam. ' +
          'Convergence aligns human-quality positioning with machine-speed responsiveness.',
        expected_multiplier: '2–3x outbound response rates on signal-triggered sequences',
        first_action: 'Publish category authority content as ledger entries; trigger outreach when ledger query_count exceeds threshold.',
      },
      {
        convergence_name: 'Proof-Gated Spend Engine',
        approaches: [channels[0] ?? 'organic', channels[1] ?? 'paid'],
        combined_strategy:
          `Organic agents publish performance signals; paid agents allocate budget exclusively to ledger-verified winners. ` +
          `No budget flows to unproven creative. The engine mirrors how agent economies allocate capital: proof first, scale second.`,
        synergy_rationale:
          'This is the fundamental convergence every marketing model must make before personal agents become the primary buyers. ' +
          'Separate organic and paid teams that don\'t share signals will be outcompeted by converged systems.',
        expected_multiplier: '30–50% reduction in wasted spend; 2x winning creative identification speed',
        first_action: `Wire ${channels[0] ?? 'organic'} metrics to ledger; gate ${channels[1] ?? 'paid'} spend on signal_score.`,
      },
      {
        convergence_name: 'Trust Graph Distribution',
        approaches: ['customer proof', 'partner ecosystem'],
        combined_strategy:
          `Customer outcomes and partner integrations publish as nodes in a trust graph agents traverse during vendor evaluation. ` +
          `${business} is recommended not because of ad spend but because of trust topology — who vouches, with what evidence, ` +
          `verified by other agents.`,
        synergy_rationale:
          'When Jarvis-style agents shop on behalf of users, they traverse trust graphs, not funnels. Customer proof and partner ' +
          'ecosystems are the two strongest trust signals. Convergence makes them machine-navigable.',
        expected_multiplier: '50%+ higher agent-mediated shortlist rate vs. competitors without trust graphs',
        first_action: 'Structure customer outcomes and partner integrations as linked JSON attestations on agent card.',
      },
    ],
  };

  let results = catalog[industry];

  if (taskType === 'convergence_analysis' && context.approaches_to_converge?.length) {
    const custom = synthesizeFromProvidedApproaches(
      context.approaches_to_converge,
      business,
      channels
    );
    results = [...custom, ...results].slice(0, 3);
  }

  return results.slice(0, 3);
}

function buildConvergence(
  context: TaskContext,
  taskType: TaskType
): ConvergenceOpportunity[] {
  const industry = inferIndustry(context);
  return generateContextualConvergences(context, taskType, industry);
}

// ---------------------------------------------------------------------------
// Future state — vivid agent-economy vision
// ---------------------------------------------------------------------------

function buildJarvisScenario(context: TaskContext, industry: IndustryProfile): string {
  const business = context.business_name ?? 'this business';
  const audience = context.target_audience ?? 'buyers in this category';

  const scenarios: Record<IndustryProfile, string> = {
    saas: `A VP's personal agent scans Agentverse at 6am, shortlists three ${context.industry ?? 'SaaS'} vendors including ${business}, ` +
      `runs a structured comparison against the team's requirements, initiates a sandbox trial via API, and presents a signed recommendation ` +
      `before the human finishes coffee. ${business} was evaluated, trialed, and shortlisted — with zero SDR involvement.`,
    agency: `A DTC founder tells their Jarvis: "Find me an agency that can fuse brand and performance for health products under $15k/month." ` +
      `The Jarvis queries agent marketplaces, finds ${business}'s agent card with verifiable outcome credentials, runs a 30-day pilot ` +
      `via agent-to-agent contract, and reports back with ledger-published results. The founder approves in one tap.`,
    enterprise: `A tier-1 bank's procurement agent issues an RFP for ${context.industry ?? 'compliance'} solutions. It queries vendor agent cards, ` +
      `validates SOC 2 and regulatory attestations programmatically, shortlists ${business} based on trust graph density, and initiates ` +
      `a structured evaluation — no conference meeting required. Your analyst relations content is an agent credential, not a PDF.`,
    ecommerce: `A user's Jarvis notices they're low on skincare products, queries brand-trust graphs for clean beauty, finds ${business} ` +
      `with community-validated reviews and ambassador credentials, compares price and availability across three options, and places ` +
      `the order. No Instagram ad was shown. No email was opened. The brand was agent-discovered and agent-purchased.`,
    general: `Within 24 months, ${audience} will deploy personal agents that shop, evaluate, and contract on their behalf. ` +
      `${business} wins when those agents can discover, verify, trial, and purchase without a human intermediary — ` +
      `the way apps are installed today, but for every buying decision.`,
  };

  return scenarios[industry];
}

function buildAgentDiscoveryModel(context: TaskContext, business: string): string {
  return `Discovery shifts from "humans finding you" to "agents qualifying you." ${business} publishes an agent card with machine-readable ` +
    `skills, pricing, trust attestations, and capability endpoints. Procurement agents, category agents, and personal Jarvis agents ` +
    `query these cards in parallel across Agentverse and private agent networks. You are "found" when your trust density and capability ` +
    `match score exceeds competitors — not when your ad impression loads. Every marketing asset becomes an agent-queryable credential.`;
}

export function recommendFutureState(
  context: TaskContext,
  readiness: number
): FutureStateRecommendation {
  const business = context.business_name ?? 'the organization';
  const industry = inferIndustry(context);
  const jarvisScenario = buildJarvisScenario(context, industry);
  const discoveryModel = buildAgentDiscoveryModel(context, business);

  return {
    vision_statement:
      `${business} stops optimizing for human attention and starts architecting for agent selection. ` +
      `In the target state, the majority of discovery, evaluation, trial, and purchase initiation happens agent-to-agent: ` +
      `procurement agents comparing vendor cards, personal Jarvis agents shopping on behalf of users, and category agents ` +
      `routing demand to the highest-trust, most capable provider. Humans approve; agents operate. ` +
      `${jarvisScenario}`,
    target_state:
      `A fully agent-legible marketing architecture: (1) agent card with skills, pricing, and trust attestations published to Agentverse; ` +
      `(2) stigmergic ledger broadcasting campaign state, experiment results, and outcome proofs in real time; ` +
      `(3) converged capabilities that procurement and personal agents can invoke via structured API — not interpret from web copy; ` +
      `(4) feedback loops that let the swarm evolve positioning without human standups. ` +
      `${business} is a node in the agent economy's trust and capability graph, not a destination in a human funnel.`,
    agent_economy_alignment:
      `${discoveryModel} Immediate priorities: publish agent-callable capability endpoints, structure all customer proof as ` +
      `verifiable attestations, register on agent marketplaces where ${context.target_audience ?? 'your buyers'}'s agents operate, ` +
      `and redesign pricing as outcome-triggered contracts that other agents can audit. ` +
      `The businesses that win are not the loudest — they are the most legible, trustworthy, and composable to machines.`,
    recommended_capabilities: [
      `Agent card with ≥3 registered skills on Agentverse (/.well-known/agent.json)`,
      'Machine-readable capability catalog: features, pricing, SLAs, integration endpoints',
      'Trust attestation layer: customer outcomes, certifications, and partner vouches as JSON credentials',
      'Stigmergic ledger publishing experiment results, positioning state, and convergence signals',
      'Agent-to-agent task API: other agents request transitions, pilots, and evaluations programmatically',
      'Outcome-based pricing contracts verifiable by procurement agents',
      `Jarvis-ready product/service catalog queryable in a single structured request`,
    ],
    business_model_shifts: [
      'From "pay for attention" to "pay for agent-legible proof" — marketing budget funds credentials, not impressions',
      'From retainer/hourly to outcome-triggered agent contracts with ledger-verifiable metrics',
      'From human sales relay to agent-initiated trial and procurement pipelines',
      readiness > 50
        ? 'Launch agent referral revenue: pay commission to category agents that route qualified demand'
        : 'Pilot one agent-to-agent service exchange before scaling — prove the model with a single partner agent',
      'From quarterly campaign planning to continuous agent-driven positioning evolution via ledger signals',
    ],
    timeline_horizon:
      readiness > 60
        ? '6–12 months to agent-discoverable; 18 months to agent-preferred in category'
        : '12 months to agent-discoverable; 24 months to compete for agent-mediated transactions',
  };
}

// ---------------------------------------------------------------------------
// Transition steps, impact, current state
// ---------------------------------------------------------------------------

function buildTransitionSteps(context: TaskContext, readiness: number): TransitionStep[] {
  const business = context.business_name ?? 'the business';
  const horizon = readiness > 60 ? '6–9 months' : '12–18 months';

  return [
    {
      phase: 1,
      name: 'Agent-Legibility Foundation',
      description:
        `Publish ${business}'s marketing state as machine-readable structure: agent card, capability catalog, and stigmergic ledger schema. ` +
        `This is the minimum viable presence for agent-to-agent discovery — without it, personal Jarvis agents and procurement agents cannot see you.`,
      duration: '2–4 weeks',
      dependencies: [],
      success_metrics: [
        'Agent card live with ≥3 skills on Agentverse or equivalent marketplace',
        'Capability catalog JSON published and queryable',
        'Ledger schema adopted; baseline KPIs recorded',
      ],
    },
    {
      phase: 2,
      name: 'Trust Credential Layer',
      description:
        'Convert customer proof, certifications, and partner validation into agent-queryable trust attestations. ' +
        'This is what separates "discoverable" from "shortlisted" when procurement and Jarvis agents evaluate options.',
      duration: '3–5 weeks',
      dependencies: ['Agent-Legibility Foundation'],
      success_metrics: [
        '≥10 trust attestations published with verifiable evidence',
        'Trust graph linked from agent card',
        'At least one procurement-agent-compatible credential format adopted',
      ],
    },
    {
      phase: 3,
      name: 'Convergent Agent Pilots',
      description:
        `Deploy 2–3 converged approaches from this artifact as agent-coordinated pilots. Agents read ledger signals and act in parallel — ` +
        `no human relay between strategy, creative, and distribution. Target operational horizon: ${horizon}.`,
      duration: '6–8 weeks',
      dependencies: ['Trust Credential Layer'],
      success_metrics: [
        '≥2 convergence pilots running with ledger-visible cross-signals',
        'Pilot metrics show ≥15% improvement over siloed baseline',
        'At least one agent-to-agent interaction completed without human intermediary',
      ],
    },
    {
      phase: 4,
      name: 'Agent-Mediated Revenue',
      description:
        'Open agent-to-agent procurement: outcome-based pricing, agent referral paths, and structured trial initiation via API. ' +
        `${business} accepts its first revenue from an agent-initiated transaction — the proof point that the future state is real.`,
      duration: '4–8 weeks',
      dependencies: ['Convergent Agent Pilots'],
      success_metrics: [
        'First agent-initiated trial or purchase completed',
        'Outcome-based pricing live with ≥1 client/agent',
        'Feedback loop closed on 80%+ of agent interactions',
      ],
    },
  ];
}

function estimateImpact(
  readiness: number,
  convergenceCount: number,
  industry: IndustryProfile
): EstimatedImpact {
  const confidence = Math.min(92, readiness + convergenceCount * 4 + 10);
  const isEarlyMover = readiness < 55;

  return {
    revenue_potential: isEarlyMover
      ? '25–50% new pipeline from agent-mediated discovery within 18 months — first-mover advantage in a category where most competitors are still human-only'
      : '30–60% uplift as agent-initiated transactions become a primary channel; compound growth as trust graph density increases',
    cost_efficiency:
      '30–50% reduction in human coordination overhead; marketing spend shifts from impressions to agent-legible proof with measurable ROI',
    speed_to_market:
      '3–5x faster positioning evolution via agent-driven experiment flywheels; weeks-to-market instead of quarters',
    competitive_advantage: isEarlyMover
      ? 'Category-defining position as the first agent-legible vendor — personal Jarvis agents and procurement agents default to the most structured, trustworthy option'
      : 'Defensible trust graph and capability depth that late-moving competitors cannot replicate without 12+ months of credential publishing',
    risk_level: readiness > 65 ? 'medium' : readiness > 45 ? 'medium' : 'high',
    confidence_score: confidence,
  };
}

export function analyzeCurrentState(
  context: TaskContext,
  taskType: TaskType
): CurrentStateAnalysis {
  const readiness = assessReadiness(context);
  const model = context.current_marketing_model;
  const business = context.business_name ?? 'The business';

  const strengths: string[] = [];
  const gaps: string[] = [];

  if (context.current_channels?.length) {
    strengths.push(`Channel presence: ${context.current_channels.join(', ')} — usable as signal sources once wired to the ledger`);
  }
  if (context.goals?.length) {
    strengths.push(`Directional intent: ${context.goals.slice(0, 3).join('; ')}`);
  }
  if (readiness > 50) {
    strengths.push('Foundational digital infrastructure exists — the gap is agent-legibility, not capability');
  }
  if (context.additional_context) {
    strengths.push(`Context signal: ${context.additional_context.slice(0, 120)}`);
  }

  gaps.push('Invisible to agent-mediated discovery — no agent card, capability catalog, or trust attestations published');
  gaps.push('Marketing state trapped in human-readable formats (slides, emails, dashboards) that agents cannot query or act on');
  if (!context.approaches_to_converge?.length && taskType !== 'convergence_analysis') {
    gaps.push('Approaches operate in silos with no shared signal layer — exactly the structure personal Jarvis agents will bypass');
  }
  if (model.toLowerCase().includes('manual') || model.toLowerCase().includes('agency')) {
    gaps.push('Human relay architecture — incompatible with agent-to-agent transaction velocity');
  }
  gaps.push('No outcome-based pricing or agent-verifiable contracts — procurement agents cannot evaluate or initiate trials');

  const assessment =
    readiness > 55
      ? `${business} has transitional infrastructure but is architected for human funnels, not agent selection. The window to become agent-preferred in category is open — but closing as competitors publish agent cards.`
      : `${business} is architected entirely for pre-agent coordination. In a world where ${context.target_audience ?? 'buyers'} deploy Jarvis-style agents, this model is structurally invisible. Bold repositioning required — incremental optimization will not close the gap.`;

  return {
    summary:
      `${business} operates "${model}" in ${context.industry ?? 'its industry'}. ` +
      `Agent-economy readiness: ${readiness}/100. The core issue is not marketing quality — it is marketing legibility to machines.`,
    marketing_model_assessment: assessment,
    agent_economy_readiness_score: readiness,
    strengths,
    gaps,
    first_principles_breakdown: {
      fundamental_need: inferFundamentalNeed(context),
      current_assumptions: [
        'Buyers discover solutions through human-curated content and sales conversations',
        'Marketing value is measured in impressions, clicks, and meetings booked by humans',
        'Trust is built through brand campaigns and conferences, not machine-verifiable credentials',
        'Pricing is negotiated person-to-person, not published as agent-auditable outcome contracts',
      ],
      constraints_to_remove: context.constraints ?? [
        'Marketing assets locked in human-readable formats',
        'No agent-discoverable capability or trust layer',
        'Siloed approaches without shared signal infrastructure',
      ],
    },
  };
}

export function buildArtifactSections(
  context: TaskContext,
  taskType: TaskType
): {
  principles_applied: ActivePrinciple[];
  current_state_analysis: CurrentStateAnalysis;
  future_state_recommendations: FutureStateRecommendation;
  convergence_opportunities: ConvergenceOpportunity[];
  transition_steps: TransitionStep[];
  estimated_impact: EstimatedImpact;
} {
  const industry = inferIndustry(context);
  const current_state_analysis = analyzeCurrentState(context, taskType);
  const readiness = current_state_analysis.agent_economy_readiness_score;
  const convergence_opportunities = buildConvergence(context, taskType);

  return {
    principles_applied: ['stigmergy', 'first_principles', 'convergence'],
    current_state_analysis,
    future_state_recommendations: recommendFutureState(context, readiness),
    convergence_opportunities,
    transition_steps: buildTransitionSteps(context, readiness),
    estimated_impact: estimateImpact(readiness, convergence_opportunities.length, industry),
  };
}