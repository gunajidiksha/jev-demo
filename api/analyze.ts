
/**
 * Vercel Serverless Function — /api/analyze
 * Runs the Jev decision engine + policy layer server-side
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Types ────────────────────────────────────────────────────────────────────

interface AdSet {
  ad_set_id: string;
  name: string;
  daily_budget_inr: number;
  spend_inr_14d?: number;
  revenue_inr_14d?: number;
  roas_14d: number;
  ctr_pct: number;
  days_running: number;
}

interface Event {
  event_id: string;
  ad_set_id: string;
  type: string;
  detail: string;
}

type Action = 'pause' | 'scale' | 'hold';
type ActOrReview = 'act' | 'review';

interface PolicyDecision {
  ad_set_id: string;
  action: Action;
  probability: number;
  act_or_review: ActOrReview;
  reason: string;
}

// ── Jev Decision Logic ───────────────────────────────────────────────────────

function makeDecision(adSet: AdSet, events: Event[]): PolicyDecision {
  const { ad_set_id, roas_14d, ctr_pct, days_running } = adSet;
  const adSetEvents = events.filter(e => e.ad_set_id === ad_set_id);

  const hasOptOutSpike     = adSetEvents.some(e => e.type === 'opt_out_spike');
  const hasBounceRise      = adSetEvents.some(e => e.type === 'bounce_rise');
  const hasCreativeFatigue = adSetEvents.some(e => e.type === 'creative_fatigue_watch');

  let action: Action;
  let probability: number;
  let reason: string;

  if (roas_14d < 1.0 || hasOptOutSpike) {
    action = 'pause';
    if (hasOptOutSpike) {
      probability = 0.95;
      reason = `Critical: opt-out spike detected. Low ROAS ${roas_14d.toFixed(1)}x, CTR ${ctr_pct}%. Pause to prevent brand damage.`;
    } else {
      probability = 0.90;
      reason = `Poor ROAS ${roas_14d.toFixed(1)}x (below 1.0x break-even). Losing money, recommend pause.`;
    }
  } else if (roas_14d >= 3.5 && ctr_pct >= 2.0 && days_running >= 7) {
    action = 'scale';
    probability = hasCreativeFatigue ? 0.88 : 0.93;
    reason = `Excellent ROAS ${roas_14d.toFixed(1)}x, strong CTR ${ctr_pct}%. Proven winner, scale budget to maximize returns.${hasCreativeFatigue ? ' Monitor creative fatigue.' : ''}`;
  } else {
    action = 'hold';
    if (days_running < 5) {
      probability = 0.78;
      reason = `Only ${days_running} days running. Insufficient data for confident decision. ROAS ${roas_14d.toFixed(1)}x looks promising but needs more time.`;
    } else if (hasBounceRise && roas_14d < 1.5) {
      probability = 0.72;
      reason = `Borderline ROAS ${roas_14d.toFixed(1)}x with bounce rate concerns. Hold and monitor before scaling.`;
    } else if (roas_14d >= 2.0 && roas_14d < 3.5) {
      probability = 0.88;
      reason = `Solid ROAS ${roas_14d.toFixed(1)}x, CTR ${ctr_pct}%. Profitable and stable, maintain current budget.`;
    } else {
      probability = 0.85;
      reason = `Moderate ROAS ${roas_14d.toFixed(1)}x, CTR ${ctr_pct}%. Holding steady, monitor for optimization opportunities.`;
    }
  }

  // Act-vs-review policy: need >= 85% confidence AND >= 5 days data
  const act_or_review: ActOrReview =
    probability >= 0.85 && days_running >= 5 ? 'act' : 'review';

  return { ad_set_id, action, probability, act_or_review, reason };
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adSets, events = [] } = req.body as { adSets: AdSet[]; events: Event[] };

    if (!adSets || !Array.isArray(adSets) || adSets.length === 0) {
      return res.status(400).json({ error: 'adSets array is required' });
    }

    const ad_set_actions = adSets.map(adSet => makeDecision(adSet, events));

    const policy_note =
      'Act-vs-Review Policy: Decisions are auto-applied only when confidence is ≥ 85% AND the ad set has ≥ 5 days of running data.';

    return res.status(200).json({
      decisionPlan: {
        decision_plan: {
          ad_set_actions,
          policy_note,
        },
      },
    });
  } catch (err) {
    console.error('analyze error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
