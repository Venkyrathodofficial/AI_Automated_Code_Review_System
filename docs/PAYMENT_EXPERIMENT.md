# Sentinel ₹499 Validation Experiment

## The Hypothesis
Developers will pay ₹499 for a one-time **Production Readiness Audit** of their codebase if they believe the AI verification provides higher signal-to-noise ratio than free static analyzers.

## Experiment Design
1. **The Hook:** Market Sentinel not as a subscription, but as a one-off "Code Audit & Certification" service.
2. **The Flow:**
   - User connects GitHub repo.
   - Sentinel ingests files and displays a blurred/locked dashboard showing "X Critical Issues Found".
   - User hits a paywall powered by Cashfree.
   - Upon payment of ₹499, the dashboard unlocks, providing the full AI-verified report, Readiness Score, and automated fix generation.

## Integration Status
- Cashfree integration is currently stubbed in the `.env` file (`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`).
- The frontend UI needs a paywall gateway component inserted before `Repositories.tsx` expands into `Issues.tsx`.

## Success Criteria
- **Conversion Rate:** Achieve a > 2% conversion rate from repo-connection to payment.
- **Customer Satisfaction:** Post-payment survey indicating whether the report was worth the price.
- **Cost Margin:** The AI token cost per scan must remain strictly under ₹50 to ensure a 90% gross margin on the ₹499 price point. Given current Gemini pricing, this is highly feasible *if* rate limits are resolved.
