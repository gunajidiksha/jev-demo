/**
 * Core TypeScript types for Jev Ad Budget Decision System
 */

// Input data types
export interface AdSet {
  ad_set_id: string;
  name: string;
  daily_budget_inr: number;
  spend_inr_14d: number;
  revenue_inr_14d: number;
  roas_14d: number;
  ctr_pct: number;
  days_running: number;
}

export interface Event {
  event_id: string;
  ad_set_id: string;
  type: 'opt_out_spike' | 'bounce_rise' | 'creative_fatigue_watch' | string;
  detail: string;
}

// Jev AI output types
export type Action = 'pause' | 'scale' | 'hold';
export type ActOrReview = 'act' | 'review';

export interface JevDecision {
  ad_set_id: string;
  action: Action;
  probability: number;
  confidence?: number;
  reason: string;
}

// Policy decision types
export interface PolicyDecision extends JevDecision {
  act_or_review: ActOrReview;
}

// Final output schema (matches schema.json)
export interface DecisionPlan {
  decision_plan: {
    ad_set_actions: PolicyDecision[];
    policy_note?: string;
  };
}

// Policy configuration
export interface PolicyConfig {
  min_probability: number;
  min_days_running: number;
  critical_event_types: string[];
}

// Enriched ad set with events
export interface EnrichedAdSet extends AdSet {
  events: Event[];
}
