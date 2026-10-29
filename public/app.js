/**
 * Frontend Application - Loads and displays decision data
 * Now connects to REAL API backend!
 */

const API_URL = '/api'; // Relative URL for Vercel deployment

// Global variable to store current decision plan
let currentDecisionPlan = null;

// Load data from API
async function loadData() {
    // Don't load demo data automatically - wait for user upload
    return null;
}

// Fallback: Load from static files (original method)
async function loadStaticData() {
    try {
        const response = await fetch('output.json');
        const decisionPlan = await response.json();
        
        const adSetsResponse = await fetch('data/adsets.json');
        const adSets = await adSetsResponse.json();
        
        const eventsResponse = await fetch('data/events.json');
        const events = await eventsResponse.json();
        
        console.log('✅ Data loaded from static files');
        return { decisionPlan, adSets, events };
    } catch (error) {
        console.error('❌ Failed to load static files:', error);
        return generateDemoData();
    }
}

// Generate demo data (last resort fallback)
function generateDemoData() {
    console.log('📝 Using hardcoded demo data');
    
    const adSets = [
        { ad_set_id: "AS-01", name: "Festive Hero", daily_budget_inr: 8000, roas_14d: 4.2, ctr_pct: 2.8, days_running: 21 },
        { ad_set_id: "AS-02", name: "Retargeting Core", daily_budget_inr: 5000, roas_14d: 3.1, ctr_pct: 2.1, days_running: 34 },
        { ad_set_id: "AS-03", name: "Broad Prospecting", daily_budget_inr: 6000, roas_14d: 0.6, ctr_pct: 0.5, days_running: 14 },
        { ad_set_id: "AS-04", name: "Lookalike Test", daily_budget_inr: 3000, roas_14d: 2.9, ctr_pct: 1.9, days_running: 2 },
        { ad_set_id: "AS-05", name: "Winback Lapsed", daily_budget_inr: 4000, roas_14d: 1.1, ctr_pct: 0.9, days_running: 12 },
        { ad_set_id: "AS-06", name: "Clearance Push", daily_budget_inr: 3500, roas_14d: 2.2, ctr_pct: 1.6, days_running: 8 }
    ];
    
    const events = [
        { event_id: "ev1", ad_set_id: "AS-03", type: "opt_out_spike", detail: "Opt-outs 3x baseline over the last 5 days." },
        { event_id: "ev2", ad_set_id: "AS-05", type: "bounce_rise", detail: "Bounce rate rose from 1.2% to 4.6% over the last week." },
        { event_id: "ev3", ad_set_id: "AS-01", type: "creative_fatigue_watch", detail: "Frequency approaching 4; monitor but no action required." }
    ];
    
    const decisionPlan = {
        decision_plan: {
            ad_set_actions: [
                { ad_set_id: "AS-01", action: "scale", probability: 0.88, act_or_review: "act", reason: "Excellent ROAS 4.2x, strong CTR 2.8%. Proven winner, scale budget to maximize returns. Monitor creative fatigue." },
                { ad_set_id: "AS-02", action: "hold", probability: 0.88, act_or_review: "act", reason: "Solid ROAS 3.1x, CTR 2.1%. Profitable and stable, maintain current budget." },
                { ad_set_id: "AS-03", action: "pause", probability: 0.95, act_or_review: "act", reason: "Critical: opt-out spike detected. Low ROAS 0.6x, CTR 0.5%. Pause to prevent brand damage." },
                { ad_set_id: "AS-04", action: "hold", probability: 0.78, act_or_review: "review", reason: "Only 2 days running. Insufficient data for confident decision. ROAS 2.9x looks promising but needs more time." },
                { ad_set_id: "AS-05", action: "hold", probability: 0.72, act_or_review: "review", reason: "Borderline ROAS 1.1x with bounce rate concerns. Hold and monitor before scaling." },
                { ad_set_id: "AS-06", action: "hold", probability: 0.88, act_or_review: "act", reason: "Solid ROAS 2.2x, CTR 1.6%. Profitable and stable, maintain current budget." }
            ],
            policy_note: "Act-vs-Review Policy: Decisions are auto-applied only when Jev's calibrated probability is ≥ 0.85 (85% confidence) AND the ad set has ≥ 5 days of running data."
        }
    };
    
    return { decisionPlan, adSets, events };
}

/**
 * Show empty state when no data uploaded yet
 */
function showEmptyState() {
    // Update policy note
    document.getElementById('policy-note').textContent = 'Upload your ad sets JSON file to get started';
    
    // Set stats to 0
    document.getElementById('total-ads').textContent = '0';
    document.getElementById('auto-applied').textContent = '0';
    document.getElementById('review-needed').textContent = '0';
    document.getElementById('avg-confidence').textContent = '0%';
    
    // Show empty message in decisions
    const container = document.getElementById('decisions-container');
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">📤</div>
            <h2 style="color: rgba(255,255,255,0.9); margin-bottom: 12px; font-size: 1.8rem;">No Data Uploaded Yet</h2>
            <p style="color: rgba(255,255,255,0.6); font-size: 1.1rem;">Upload your ad sets JSON file above to see Jev AI decisions</p>
        </div>
    `;
    
    // Show empty events
    const eventsContainer = document.getElementById('events-container');
    eventsContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No events to display</p>';
}

// Render dashboard
function renderDashboard(data) {
    // If no data, show empty state
    if (!data) {
        showEmptyState();
        hideDownloadButton();
        return;
    }
    
    const { decisionPlan, adSets, events } = data;
    const actions = decisionPlan.decision_plan.ad_set_actions;
    
    // Store decision plan for download
    currentDecisionPlan = decisionPlan;
    showDownloadButton();
    
    // Update policy note
    document.getElementById('policy-note').textContent = decisionPlan.decision_plan.policy_note || 'Loading...';
    
    // Calculate stats
    const actCount = actions.filter(a => a.act_or_review === 'act').length;
    const reviewCount = actions.filter(a => a.act_or_review === 'review').length;
    const avgConfidence = (actions.reduce((sum, a) => sum + a.probability, 0) / actions.length * 100).toFixed(0);
    
    document.getElementById('total-ads').textContent = actions.length;
    document.getElementById('auto-applied').textContent = actCount;
    document.getElementById('review-needed').textContent = reviewCount;
    document.getElementById('avg-confidence').textContent = avgConfidence + '%';
    
    // Render decision cards
    const container = document.getElementById('decisions-container');
    container.innerHTML = '';
    
    actions.forEach(decision => {
        const adSet = adSets.find(a => a.ad_set_id === decision.ad_set_id);
        if (!adSet) return;
        
        const card = document.createElement('div');
        card.className = 'decision-card';
        
        const actionEmoji = decision.action === 'scale' ? '📈' : decision.action === 'pause' ? '⏸️' : '🤚';
        const confidencePercent = (decision.probability * 100).toFixed(0);
        
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="ad-id">${decision.ad_set_id}</div>
                    <div class="ad-name">${adSet.name}</div>
                </div>
                <span class="final-badge badge-${decision.act_or_review}">
                    ${decision.act_or_review === 'act' ? '🟢 AUTO' : '🟡 REVIEW'}
                </span>
            </div>
            
            <div class="metrics-grid">
                <div class="metric">
                    <div class="metric-value">₹${adSet.daily_budget_inr.toLocaleString()}</div>
                    <div class="metric-label">Daily Budget</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${adSet.roas_14d}x</div>
                    <div class="metric-label">ROAS (14d)</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${adSet.ctr_pct}%</div>
                    <div class="metric-label">CTR</div>
                </div>
            </div>
            
            <div class="ai-decision">
                <h4>
                    🤖 Jev AI Decision
                    <span class="action-badge action-${decision.action}">
                        ${actionEmoji} ${decision.action.toUpperCase()}
                    </span>
                </h4>
                
                <div class="confidence-bar">
                    <div class="confidence-label">
                        <span>Confidence</span>
                        <span><strong>${confidencePercent}%</strong></span>
                    </div>
                    <div class="confidence-progress">
                        <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="reason">
                <strong>💡 Reasoning:</strong> ${decision.reason}
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Render events
    const eventsContainer = document.getElementById('events-container');
    eventsContainer.innerHTML = '';
    
    if (events.length === 0) {
        eventsContainer.innerHTML = '<p style="color: white;">No active events</p>';
    } else {
        events.forEach(event => {
            const adSet = adSets.find(a => a.ad_set_id === event.ad_set_id);
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <div class="event-type">⚠️ ${event.type.replace(/_/g, ' ')}</div>
                <div><strong>${adSet ? adSet.name : event.ad_set_id}</strong> - ${event.detail}</div>
            `;
            eventsContainer.appendChild(eventCard);
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    const data = await loadData();
    renderDashboard(data);
    
    // Setup upload functionality
    setupUpload();
    
    // Setup download functionality
    setupDownload();
});

/**
 * Setup file upload functionality
 */
function setupUpload() {
    const analyzeBtn = document.getElementById('analyze-btn');
    const adsetsInput = document.getElementById('adsets-file');
    const eventsInput = document.getElementById('events-file');
    const statusDiv = document.getElementById('upload-status');
    
    analyzeBtn.addEventListener('click', async () => {
        const adsetsFile = adsetsInput.files[0];
        
        if (!adsetsFile) {
            showStatus('error', '❌ Please select an Ad Sets JSON file');
            return;
        }
        
        try {
            showStatus('loading', '⏳ Analyzing your data...');
            analyzeBtn.disabled = true;
            
            // Read ad sets file
            const adsetsData = await readJSONFile(adsetsFile);
            
            // Read events file (optional)
            let eventsData = [];
            const eventsFile = eventsInput.files[0];
            if (eventsFile) {
                eventsData = await readJSONFile(eventsFile);
            }
            
            // Send to API for analysis
            const response = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adSets: adsetsData,
                    events: eventsData
                })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Update dashboard with new results
            renderDashboard({
                decisionPlan: result.decisionPlan,
                adSets: adsetsData,
                events: eventsData
            });
            
            showStatus('success', `✅ Analysis complete! Processed ${adsetsData.length} ad sets. Results saved to output.json`);
            
            // Clear file inputs
            adsetsInput.value = '';
            eventsInput.value = '';
            
        } catch (error) {
            console.error('Upload error:', error);
            showStatus('error', `❌ Error: ${error.message}`);
        } finally {
            analyzeBtn.disabled = false;
        }
    });
}

/**
 * Read and parse JSON file
 */
function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Show upload status message
 */
function showStatus(type, message) {
    const statusDiv = document.getElementById('upload-status');
    statusDiv.className = `upload-status ${type}`;
    statusDiv.textContent = message;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.className = 'upload-status';
            statusDiv.textContent = '';
        }, 5000);
    }
}

/**
 * Setup download functionality
 */
function setupDownload() {
    const downloadBtn = document.getElementById('download-btn');
    
    downloadBtn.addEventListener('click', () => {
        if (!currentDecisionPlan) {
            alert('No decision plan available to download');
            return;
        }
        
        // Create blob from decision plan
        const jsonString = JSON.stringify(currentDecisionPlan, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'output.json';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📥 Downloaded output.json');
    });
}

/**
 * Show download button
 */
function showDownloadButton() {
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.style.display = 'inline-block';
}

/**
 * Hide download button
 */
function hideDownloadButton() {
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.style.display = 'none';
}
