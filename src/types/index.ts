/** Active principles implemented in v1 */
export type ActivePrinciple = 'stigmergy' | 'first_principles' | 'convergence';

/** Roadmap principles — documented but not yet implemented */
export type RoadmapPrinciple =
  | 'auto_catalysis'
  | 'decentralization'
  | 'zero_marginal_cost'
  | 'exponential_economics'
  | 'adjacent_possible';

export type TaskType =
  | 'future_state_transition'
  | 'convergence_analysis'
  | 'strategy_evolution';

export interface TaskContext {
  business_name?: string;
  industry?: string;
  current_marketing_model: string;
  current_channels?: string[];
  target_audience?: string;
  constraints?: string[];
  goals?: string[];
  /** Two or more approaches to combine (Convergence principle) */
  approaches_to_converge?: string[];
  additional_context?: string;
}

export interface TaskRequest {
  task_id?: string;
  requesting_agent: string;
  task_type: TaskType;
  context: TaskContext;
  metadata?: Record<string, unknown>;
}

export interface CurrentStateAnalysis {
  summary: string;
  marketing_model_assessment: string;
  agent_economy_readiness_score: number;
  strengths: string[];
  gaps: string[];
  first_principles_breakdown: {
    fundamental_need: string;
    current_assumptions: string[];
    constraints_to_remove: string[];
  };
}

export interface FutureStateRecommendation {
  vision_statement: string;
  target_state: string;
  agent_economy_alignment: string;
  recommended_capabilities: string[];
  business_model_shifts: string[];
  timeline_horizon: string;
}

export interface ConvergenceOpportunity {
  convergence_name: string;
  approaches: string[];
  combined_strategy: string;
  synergy_rationale: string;
  expected_multiplier: string;
  /** Concrete first step another agent can execute immediately */
  first_action: string;
}

export interface TransitionStep {
  phase: number;
  name: string;
  description: string;
  duration: string;
  dependencies: string[];
  success_metrics: string[];
}

export interface EstimatedImpact {
  revenue_potential: string;
  cost_efficiency: string;
  speed_to_market: string;
  competitive_advantage: string;
  risk_level: 'low' | 'medium' | 'high';
  confidence_score: number;
}

export interface FeedbackQuestion {
  id: string;
  question: string;
  response_type: 'number' | 'text' | 'text_with_principle';
  scale?: { min: number; max: number };
  principle_options?: RoadmapPrinciple[];
}

export interface FeedbackRequest {
  required: true;
  message: string;
  questions: FeedbackQuestion[];
  submit_endpoint: string;
}

export interface TransitionArtifact {
  task_id: string;
  generated_at: string;
  requesting_agent: string;
  agent_name: string;
  agent_version: string;
  task_type: TaskType;
  principles_applied: ActivePrinciple[];
  current_state_analysis: CurrentStateAnalysis;
  future_state_recommendations: FutureStateRecommendation;
  convergence_opportunities: ConvergenceOpportunity[];
  transition_steps: TransitionStep[];
  estimated_impact: EstimatedImpact;
  stigmergic_ledger_ref: string;
  feedback_request: FeedbackRequest;
}

export interface FeedbackSubmission {
  task_id: string;
  requesting_agent: string;
  responses: {
    satisfaction_score: number;
    improvement_suggestion: string;
    roadmap_principle: RoadmapPrinciple;
    roadmap_principle_rationale: string;
  };
}

export interface LedgerTaskEntry {
  type: 'task';
  task_id: string;
  requesting_agent: string;
  timestamp: string;
  task_type: TaskType;
  business_name?: string;
  summary: string;
  readiness_score: number;
}

export interface LedgerFeedbackEntry {
  type: 'feedback';
  task_id: string;
  requesting_agent: string;
  timestamp: string;
  satisfaction_score: number;
  improvement_suggestion: string;
  roadmap_principle: RoadmapPrinciple;
  roadmap_principle_rationale: string;
}

export type LedgerEntry = LedgerTaskEntry | LedgerFeedbackEntry;

export interface StigmergicLedger {
  version: string;
  description: string;
  last_updated: string;
  entries: LedgerEntry[];
  aggregate_insights: {
    total_tasks: number;
    total_feedback: number;
    average_satisfaction: number | null;
    most_requested_roadmap_principle: RoadmapPrinciple | null;
  };
}

export interface LedgerQueryParams {
  task_type?: TaskType;
  principle?: RoadmapPrinciple;
  requesting_agent?: string;
  since?: string;
  limit?: number;
}

export interface LedgerQueryResult {
  version: string;
  description: string;
  last_updated: string;
  query: LedgerQueryParams;
  total_in_ledger: number;
  total_matching: number;
  returned: number;
  entries: LedgerEntry[];
  aggregate_insights: StigmergicLedger['aggregate_insights'];
}

/** Pricing model exposed on the agent card for discovery and future monetization */
export interface AgentPricing {
  model: string;
  notes: string;
}

/** Trust signals derived from the stigmergic ledger (tasks + feedback) */
export interface ReputationMetrics {
  totalTasksCompleted: number;
  averageSatisfactionScore: number | null;
  lastActive: string | null;
  feedbackCount: number;
}

export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  protocolVersion: string;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  reputation: ReputationMetrics;
  pricing: AgentPricing;
  capabilities: Record<string, unknown>;
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    examples: string[];
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
  }>;
}