/**
 * Main Application Logic - Orchestrates the entire decision flow
 */

import { readFileSync } from 'fs';
import { JevService } from './jev-service.js';
import { PolicyEngine } from './policy-engine.js';
import { Validator } from './validator.js';
import { AdSet, Event, DecisionPlan } from './types.js';

export class JevApplication {
  private jevService: JevService;
  private policyEngine: PolicyEngine;
  private validator: Validator;
  private customAdSets?: AdSet[];
  private customEvents?: Event[];

  constructor() {
    this.jevService = new JevService();
    this.policyEngine = new PolicyEngine();
    
    // Load schema for validation
    const schema = JSON.parse(readFileSync('./data/schema.json', 'utf-8'));
    this.validator = new Validator(schema);
  }

  /**
   * Load custom data from uploaded files
   */
  loadCustomData(adSets: AdSet[], events: Event[]): void {
    this.customAdSets = adSets;
    this.customEvents = events;
  }

  /**
   * Main processing pipeline
   */
  async process(): Promise<DecisionPlan> {
    // 1. Load input data (use custom data if provided)
    const adSets = this.customAdSets || this.loadAdSets();
    const events = this.customEvents || this.loadEvents();

    // 2. Get Jev AI decisions
    console.log('📊 Analyzing ad sets with Jev AI...');
    const jevDecisions = await this.jevService.analyze(adSets, events);

    // 3. Apply policy engine
    console.log('🛡️  Applying act-vs-review policy...');
    const policyDecisions = this.policyEngine.evaluate(jevDecisions, adSets);

    // 4. Build decision plan
    const decisionPlan: DecisionPlan = {
      decision_plan: {
        ad_set_actions: policyDecisions,
        policy_note: this.policyEngine.getPolicyNote()
      }
    };

    // 5. Validate against schema
    const validation = this.validator.validate(decisionPlan);
    if (!validation.valid) {
      throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
    }

    console.log('✅ Decision plan generated and validated');
    return decisionPlan;
  }

  /**
   * Load ad sets from JSON
   */
  private loadAdSets(): AdSet[] {
    const data = readFileSync('./data/adsets.json', 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Load events from JSON
   */
  private loadEvents(): Event[] {
    const data = readFileSync('./data/events.json', 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Get input data for display
   */
  getInputData(): { adSets: AdSet[]; events: Event[] } {
    return {
      adSets: this.loadAdSets(),
      events: this.loadEvents()
    };
  }
}
