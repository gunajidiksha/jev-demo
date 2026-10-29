/**
 * Policy Engine Tests
 */

import { describe, it, expect } from 'vitest';
import { PolicyEngine } from '../src/policy-engine.js';
import { JevDecision, AdSet } from '../src/types.js';

describe('PolicyEngine', () => {
  const policyEngine = new PolicyEngine();
  
  const mockAdSets: AdSet[] = [
    {
      ad_set_id: 'AS-01',
      name: 'High Confidence Campaign',
      daily_budget_inr: 8000,
      spend_inr_14d: 100000,
      revenue_inr_14d: 400000,
      roas_14d: 4.0,
      ctr_pct: 2.5,
      days_running: 21
    },
    {
      ad_set_id: 'AS-04',
      name: 'Insufficient Data Campaign',
      daily_budget_inr: 3000,
      spend_inr_14d: 5000,
      revenue_inr_14d: 15000,
      roas_14d: 3.0,
      ctr_pct: 2.0,
      days_running: 2 // Less than minimum
    },
    {
      ad_set_id: 'AS-05',
      name: 'Low Confidence Campaign',
      daily_budget_inr: 4000,
      spend_inr_14d: 50000,
      revenue_inr_14d: 55000,
      roas_14d: 1.1,
      ctr_pct: 0.9,
      days_running: 12
    }
  ];

  describe('High confidence + sufficient data', () => {
    it('should auto-apply when probability >= 0.85 and days >= 5', () => {
      const jevDecisions: JevDecision[] = [{
        ad_set_id: 'AS-01',
        action: 'scale',
        probability: 0.92,
        reason: 'High ROAS'
      }];

      const results = policyEngine.evaluate(jevDecisions, [mockAdSets[0]]);
      
      expect(results[0].act_or_review).toBe('act');
      expect(results[0].probability).toBe(0.92);
    });
  });

  describe('Insufficient data', () => {
    it('should flag for review when days < 5', () => {
      const jevDecisions: JevDecision[] = [{
        ad_set_id: 'AS-04',
        action: 'hold',
        probability: 0.90, // High probability but insufficient data
        reason: 'Looks good but needs more data'
      }];

      const results = policyEngine.evaluate(jevDecisions, [mockAdSets[1]]);
      
      expect(results[0].act_or_review).toBe('review');
      expect(results[0].ad_set_id).toBe('AS-04');
    });
  });

  describe('Low confidence', () => {
    it('should flag for review when probability < 0.85', () => {
      const jevDecisions: JevDecision[] = [{
        ad_set_id: 'AS-05',
        action: 'hold',
        probability: 0.72, // Low confidence
        reason: 'Borderline performance'
      }];

      const results = policyEngine.evaluate(jevDecisions, [mockAdSets[2]]);
      
      expect(results[0].act_or_review).toBe('review');
      expect(results[0].probability).toBe(0.72);
    });
  });

  describe('Policy configuration', () => {
    it('should return correct configuration', () => {
      const config = policyEngine.getConfig();
      
      expect(config.min_probability).toBe(0.85);
      expect(config.min_days_running).toBe(5);
    });

    it('should provide policy note', () => {
      const note = policyEngine.getPolicyNote();
      
      expect(note).toContain('0.85');
      expect(note).toContain('5 days');
      expect(note).toContain('Act-vs-Review');
    });
  });

  describe('Multiple decisions', () => {
    it('should correctly evaluate mixed scenarios', () => {
      const jevDecisions: JevDecision[] = [
        { ad_set_id: 'AS-01', action: 'scale', probability: 0.92, reason: 'High ROAS' },
        { ad_set_id: 'AS-04', action: 'hold', probability: 0.90, reason: 'Good but early' },
        { ad_set_id: 'AS-05', action: 'hold', probability: 0.72, reason: 'Borderline' }
      ];

      const results = policyEngine.evaluate(jevDecisions, mockAdSets);
      
      // AS-01: High confidence + sufficient data = act
      expect(results[0].act_or_review).toBe('act');
      
      // AS-04: High confidence but insufficient data = review
      expect(results[1].act_or_review).toBe('review');
      
      // AS-05: Low confidence = review
      expect(results[2].act_or_review).toBe('review');
    });
  });
});
