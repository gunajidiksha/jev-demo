#!/usr/bin/env node
/**
 * CLI Interface - Command-line demo
 */

import { writeFileSync } from 'fs';
import { JevApplication } from './main.js';
import type { DecisionPlan } from './types.js';

export function displayDecisions(decisionPlan: DecisionPlan) {
  const app = new JevApplication();
  const { adSets } = app.getInputData();
  
  let actCount = 0;
  let reviewCount = 0;
  
  decisionPlan.decision_plan.ad_set_actions.forEach((decision, index) => {
    const adSet = adSets.find(a => a.ad_set_id === decision.ad_set_id)!;
    const badge = decision.act_or_review === 'act' ? '🟢 AUTO' : '🟡 REVIEW';
    const actionEmoji = decision.action === 'scale' ? '📈' : decision.action === 'pause' ? '⏸️ ' : '🤚';
    
    if (decision.act_or_review === 'act') actCount++;
    else reviewCount++;
    
    console.log(`${index + 1}. ${decision.ad_set_id} - ${adSet.name}`);
    console.log(`   Action: ${actionEmoji} ${decision.action.toUpperCase()}`);
    console.log(`   Confidence: ${(decision.probability * 100).toFixed(0)}%`);
    console.log(`   Status: ${badge}`);
    console.log(`   Reason: ${decision.reason}`);
    console.log('');
  });
  
  console.log(`✅ Auto-Applied: ${actCount}  |  🟡 Flagged for Review: ${reviewCount}`);
}

async function main() {
  console.log('\n🎯 Jev Ad Budget Decision Demo - CLI\n');
  console.log('═'.repeat(60));
  
  try {
    const app = new JevApplication();
    
    // Get input data
    const { adSets, events } = app.getInputData();
    
    console.log(`\n📊 INPUT DATA`);
    console.log(`   Ad Sets: ${adSets.length}`);
    console.log(`   Events: ${events.length}\n`);

    // Process decisions
    const decisionPlan = await app.process();
    
    // Display results
    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 DECISION SUMMARY\n');
    
    displayDecisions(decisionPlan);
    
    console.log('\n' + '═'.repeat(60));
    
    // Save output
    writeFileSync('./output.json', JSON.stringify(decisionPlan, null, 2));
    console.log('\n💾 Decision plan saved to output.json\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
