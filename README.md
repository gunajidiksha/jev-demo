# Jev Ad Budget Decision Demo

**Production-ready AI decision system for ad budget optimization**

Built for Niti assignment - demonstrates Jev (TypeSafe AI) productionized for ad budget allocation with act-vs-review policy.

---

## 🚀 Quick Start

```bash
npm install
npm test
npm run server
```

**What happens:**
1. Shows CLI output with all 6 demo decisions in terminal
2. Auto-opens dashboard in browser at http://localhost:3000
3. **Dashboard starts EMPTY** - waiting for you to upload data!
4. Upload your JSON files to see instant AI-powered decisions

**To stop:** Press `Ctrl+C`

---

## 📤 Upload Custom Data

**The dashboard is interactive and starts empty!** Upload your data to see results:

1. Open http://localhost:3000 in your browser
2. Click "Choose File" under "Ad Sets JSON"
3. Select your custom `adsets.json` file  
4. (Optional) Upload an `events.json` file
5. Click "🚀 Analyze"
6. **See instant AI-powered decisions with confidence scores!**

**Example ad set format:**
```json
[
  {
    "ad_set_id": "AS-01",
    "name": "My Campaign",
    "daily_budget_inr": 5000,
    "roas_14d": 3.5,
    "ctr_pct": 2.1,
    "days_running": 15
  }
]
```

This proves the system works with **any valid data**, not just the demo examples!

**Try it now:**
- Use the included `test-upload.json` file to test the upload feature
- Or create your own JSON with your ad campaign data

---

## 📂 Project Structure

```
jev-demo/
├── src/
│   ├── types.ts           # TypeScript type definitions
│   ├── jev-service.ts     # Mock Jev AI service
│   ├── policy-engine.ts   # Act-vs-review policy layer
│   ├── validator.ts       # Schema validation
│   ├── main.ts            # Main application
│   ├── cli.ts             # CLI interface
│   └── server.ts          # API server
├── public/
│   ├── index.html         # Dashboard UI
│   ├── styles.css         # Styling
│   └── app.js             # Frontend JavaScript
├── data/
│   ├── adsets.json        # 6 ad campaigns (input)
│   ├── events.json        # Warning signals
│   └── schema.json        # Output schema
├── tests/
│   └── policy.test.ts     # Policy tests
├── output.json            # Generated decisions
└── package.json
```

---

## 📊 How It Works

### 1. Input Data (6 Ad Sets)
- **AS-01 Festive Hero**: ROAS 4.2x, CTR 2.8% → **Scale**
- **AS-02 Retargeting Core**: ROAS 3.1x → **Hold**
- **AS-03 Broad Prospecting**: ROAS 0.6x + opt-out spike → **Pause**
- **AS-04 Lookalike Test**: Only 2 days data → **Hold (Review)**
- **AS-05 Winback Lapsed**: Borderline + bounce issues → **Hold (Review)**
- **AS-06 Clearance Push**: ROAS 2.2x → **Hold**

### 2. Jev AI Analysis
Mock Jev service analyzes each ad set based on:
- ROAS (Return on Ad Spend)
- CTR (Click-Through Rate)
- Days running (data maturity)
- Events (warning signals)

Returns typed decisions with calibrated probabilities.

### 3. Act-vs-Review Policy
**Auto-apply (ACT)** when:
- ✅ Probability ≥ 0.85 (85% confidence)
- ✅ Days running ≥ 5 (sufficient data)

**Flag for review (REVIEW)** when:
- ⚠️ Probability < 0.85 (low confidence)
- ⚠️ Days < 5 (insufficient data)

**Result:** 4 auto-applied, 2 flagged for review

### 4. Output
- Terminal: All decisions with emoji, confidence, reasoning
- Dashboard: Beautiful UI with metrics, confidence bars, status badges
- API: JSON responses at http://localhost:3000/api/decisions

---

## 🧪 Run Tests

```bash
npm test
```

Tests verify:
- Policy thresholds work correctly
- Low confidence cases flagged for review
- Insufficient data cases flagged for review
- All decision scenarios handled

---

## 🌐 API Endpoints

**API Server:** http://localhost:3000

- `GET /api/decisions` - Get all decisions with act/review status
- `GET /api/input` - Get input ad sets and events
- `POST /api/analyze` - **Analyze custom uploaded data** (NEW!)

### Upload Custom Data via API

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "adSets": [...],
    "events": [...]
  }'
```

---

## 📝 Assignment Requirements

✅ **Requirement 1:** 6 synthetic ad sets with all metrics  
✅ **Requirement 2:** Typed decision schema (pause/scale/hold + probability + reason)  
✅ **Requirement 3:** Act-vs-review policy (85% confidence + 5 days threshold)  
✅ **Requirement 4:** Working demo (CLI + web dashboard)  
✅ **Bonus:** Production-ready API server integration

---

## 🎯 Key Features

- **Type Safety:** Full TypeScript implementation
- **Schema Validation:** Ajv validates output against schema.json
- **Testing:** Automated tests for policy logic
- **Production Design:** Real API server with CORS, error handling
- **Beautiful UI:** Modern dashboard with glassmorphism effects
- **Auto-Open:** Dashboard opens automatically when server starts
- **Dual Output:** CLI terminal + web dashboard
- **📤 Live Upload:** Upload custom JSON files and see instant results!

---

## 📦 Commands Reference

```bash
npm install      # Install dependencies
npm run build    # Build TypeScript
npm run server   # Start API + show CLI + open dashboard
npm run cli      # CLI only (no server)
npm test         # Run tests
```

---

## ✅ Submission Checklist

- ✅ 6 ad sets with synthetic data
- ✅ Typed schema with action/probability/reason
- ✅ Mock Jev service (real API not accessible)
- ✅ Act-vs-review policy implemented
- ✅ Working CLI + web dashboard
- ✅ Tests pass
- ✅ output.json generated

---

## 👤 Author

**Diksha**  
Built for Niti assignment.

---

## 📄 Notes

- Mock Jev implementation follows documented interface (real API unavailable)
- All data is synthetic for demo purposes
- Production design shows architecture understanding
- Policy thresholds are configurable in `PolicyEngine`
