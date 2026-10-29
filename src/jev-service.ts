/**
 * Jev Mock Service - Simulates TypeSafe AI's Jev decision model
 * 
 * In production, this would call the real Jev API at typesafe.ai
 * For this demo, we implement intelligent decision logic based on:
 * - ROAS (Return on Ad Spend)
 * - CTR (Click-Through Rate)
 * - Days running (data maturity)
 * - Events (warning signals)
 */

import { AdSet, Event, JevDecision, EnrichedAdSet, Action } from './types.js';

export class JevService {
  /**
   * Main decision method - analyzes ad sets and returns typed decisions
   */
  async analyze(adSets: AdSet[], events: Event[]): Promise<JevDecision[]> {
    const enrichedAdSets = this.enrichAdSetsWithEvents(adSets, events);
    
    return enrichedAdSets.map(adSet => this.makeDecision(adSet));
  }

  /**
   * Enrich ad sets with their associated events
   */
  private enrichAdSetsWithEvents(adSets: AdSet[], events: Event[]): EnrichedAdSet[] {
    return adSets.map(adSet => ({
      ...adSet,
      events: events.filter(e => e.ad_set_id === adSet.ad_set_id)
    }));
  }

  /**
   * Core decision logic for a single ad set
   */
  private makeDecision(adSet: EnrichedAdSet): JevDecision {
    const { ad_set_id, roas_14d, ctr_pct, days_running, events } = adSet;

    // Check for critical events
    const hasOptOutSpike = events.some(e => e.type === 'opt_out_spike');
    const hasBounceRise = events.some(e => e.type === 'bounce_rise');
    const hasCreativeFatigue = events.some(e => e.type === 'creative_fatigue_watch');

    // Decision logic
    let action: Action;
    let probability: number;
    let reason: string;

    // PAUSE logic - poor performance or critical issues
    if (roas_14d < 1.0 || hasOptOutSpike) {
      action = 'pause';
      
      if (hasOptOutSpike) {
        probability = 0.95;
        reason = `Critical: opt-out spike detected. Low ROAS ${roas_14d.toFixed(1)}x, CTR ${ctr_pct}%. Pause to prevent brand damage.`;
      } else {
        probability = 0.90;
        reason = `Poor ROAS ${roas_14d.toFixed(1)}x (below 1.0x break-even). Losing money, recommend pause.`;
      }
    }
    // SCALE logic - excellent performance
    else if (roas_14d >= 3.5 && ctr_pct >= 2.0 && days_running >= 7) {
      action = 'scale';
      probability = 0.93;
      reason = `Excellent ROAS ${roas_14d.toFixed(1)}x, strong CTR ${ctr_pct}%. Proven winner, scale budget to maximize returns.`;
      
      if (hasCreativeFatigue) {
        probability = 0.88; // Slightly lower confidence
        reason += ' Monitor creative fatigue.';
      }
    }
    // HOLD logic - stable, early stage, or borderline
    else {
      action = 'hold';
      
      // Insufficient data
      if (days_running < 5) {
        probability = 0.78;
        reason = `Only ${days_running} days running. Insufficient data for confident decision. ROAS ${roas_14d.toFixed(1)}x looks promising but needs more time.`;
      }
      // Borderline with negative signals
      else if (hasBounceRise && roas_14d < 1.5) {
        probability = 0.72;
        reason = `Borderline ROAS ${roas_14d.toFixed(1)}x with bounce rate concerns. Hold and monitor before scaling.`;
      }
      // Decent but not exceptional
      else if (roas_14d >= 2.0 && roas_14d < 3.5) {
        probability = 0.88;
        reason = `Solid ROAS ${roas_14d.toFixed(1)}x, CTR ${ctr_pct}%. Profitable and stable, maintain current budget.`;
      }
      // Moderate performance
      else {
        probability = 0.85;
        reason = `Moderate ROAS ${roas_14d.toFixed(1)}x, CTR ${ctr_pct}%. Holding steady, monitor for optimization opportunities.`;
      }
    }

    return {
      ad_set_id,
      action,
      probability,
      confidence: probability, // Jev uses calibrated probabilities as confidence
      reason
    };
  }
}
