# Jev Ad Budget Decision Demo

Mock Jev (TypeSafe AI) productionization for ad budget allocation with act-vs-review policy.

## Quick Start

```bash
npm install
npm test
npm run server
```

Opens CLI + web dashboard at http://localhost:3000. Dashboard allows uploading custom JSON for instant analysis.

## How It Works

**Input:** 6 synthetic ad sets (data/adsets.json) + warning events (data/events.json)

**Mock Jev AI** analyzes each ad set based on ROAS, CTR, days running, and events. Returns typed decisions with calibrated probabilities.

**Act-vs-Review Policy:**
- **AUTO-APPLY (act):** probability ≥ 0.85 AND days ≥ 5
- **FLAG FOR REVIEW (review):** probability < 0.85 OR days < 5

**Results:**
- AS-01: scale/act (88%, 21 days, excellent ROAS 4.2x)
- AS-02: hold/act (88%, 34 days, solid ROAS 3.1x)
- AS-03: pause/act (95%, 14 days, critical opt-out spike + poor ROAS 0.6x)
- AS-04: hold/review (78%, 2 days, insufficient data)
- AS-05: hold/review (72%, 12 days, borderline ROAS 1.1x + bounce concerns)
- AS-06: hold/act (88%, 8 days, solid ROAS 2.2x)

**Output:** output.json matches schema.json (validated with Ajv)

## Project Structure

```
src/           # TypeScript: types, jev-service, policy-engine, validator, main, cli, server
public/        # Dashboard: HTML/CSS/JS
data/          # Input: adsets.json, events.json, schema.json
tests/         # Policy tests (vitest)
api/           # Vercel serverless function
```

## Run Demo

```bash
npm run cli     # CLI only
npm run server  # CLI + API + dashboard
npm test        # Run policy tests
```

## AI Tools Used

GitHub Copilot for code completion, Claude for architecture decisions. All outputs manually reviewed and tested against requirements.

## Rerun Instructions

1. `npm install` - Install dependencies
2. `npm test` - Verify policy logic
3. `npm run server` - Start server + see CLI output
4. Open http://localhost:3000 - View dashboard
5. Upload test-upload.json - Test custom data

Decision plan saved to output.json after each run.
