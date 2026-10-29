/**
 * Policy Engine - Act vs Review Decision Layer
 * 
 * This is the critical safety layer that determines whether to:
 * - AUTO-APPLY: Trust Jev's decision and apply automatically
 * - REVIEW: Flag for human review before taking action
 * 
 * Policy: Act automatically only when:
 * 1. Jev's probability >= 0.85 (high confidence)
 * 2. Ad set has >= 5 days of data (sufficient maturity)
 * 
 * Otherwise, flag for human review to prevent costly mistakes.
 */

import { AdSet, JevDecision, PolicyDecision, PolicyConfig, ActOrReview } from './types.js';

export class PolicyEngine {
  private config: PolicyConfig;

  constructor(config?: Partial<PolicyConfig>) {
    this.config = {
      min_probability: config?.min_probability ?? 0.85,
      min_days_running: config?.min_days_running ?? 5,
      critical_event_types: config?.critical_event_types ?? ['opt_out_spike', 'bounce_rise']
    };
  }

  /**
   * Evaluate Jev decisions and apply act-vs-review policy
   */
  evaluate(jevDecisions: JevDecision[], adSets: AdSet[]): PolicyDecision[] {
    const adSetMap = new Map(adSets.map(a => [a.ad_set_id, a]));

    return jevDecisions.map(decision => {
      const adSet = adSetMap.get(decision.ad_set_id);
      
      if (!adSet) {
        throw new Error(`Ad set ${decision.ad_set_id} not found`);
      }

      const actOrReview = this.determineActOrReview(decision, adSet);

      return {
        ...decision,
        act_or_review: actOrReview
      };
    });
  }

  /**
   * Core policy logic: should we act automatically or flag for review?
   */
  private determineActOrReview(decision: JevDecision, adSet: AdSet): ActOrReview {
    const { probability } = decision;
    const { days_running } = adSet;

    // Check probability threshold
    const hasHighConfidence = probability >= this.config.min_probability;
    
    // Check data maturity
    const hasSufficientData = days_running >= this.config.min_days_running;

    // Policy decision
    if (hasHighConfidence && hasSufficientData) {
      return 'act';
    } else {
      return 'review';
    }
  }

  /**
   * Get policy explanation for documentation
   */
  getPolicyNote(): string {
    return `Act-vs-Review Policy: Decisions are auto-applied only when Jev's calibrated probability is ≥ ${this.config.min_probability} (${this.config.min_probability * 100}% confidence) AND the ad set has ≥ ${this.config.min_days_running} days of running data. This threshold balances automation efficiency with risk mitigation. Lower confidence decisions or campaigns with insufficient data are flagged for human review to prevent costly mistakes on immature or uncertain campaigns. Calibrated probabilities from Jev reflect the model's uncertainty and are used as a trust signal for automation safety.`;
  }

  /**
   * Get configuration
   */
  getConfig(): PolicyConfig {
    return { ...this.config };
  }
}
