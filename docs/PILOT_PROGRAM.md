# Sentinel Developer Pilot Program (Alpha)

## Objective
The goal of the Sentinel Pilot Program is to validate the product's core value hypothesis with 10-20 active developers: **Does Sentinel catch meaningful vulnerabilities that a raw LLM or static analyzer misses, and is the AI verification reliable enough to suppress false positives without frustrating the user?**

## Target Audience
- 10-20 full-stack developers actively pushing code to GitHub.
- Primary languages: JavaScript/TypeScript (Node.js/React).

## Core Metrics to Track
1. **False Positive Suppression Rate:** Percentage of static scanner findings that the `AIVerifier` successfully drops.
2. **Fix Acceptance Rate:** Percentage of AI-generated fixes that developers actually merge via the PR interface.
3. **API Cost Per Scan:** Tracking token usage and rate limit hits per repository size.
4. **Time to Resolution:** How fast a developer resolves a BLOCKing issue using Sentinel compared to their baseline.

## Feedback Mechanisms
- **In-App Telemetry:** Track button clicks on "Apply Fix", "Dismiss (False Positive)", and "Request Re-scan".
- **PR Webhook Tracking:** Monitor if the automated PR comment leads to a subsequent commit that resolves the issue.
- **Post-Scan Survey:** A lightweight 1-click rating (👍/👎) inside the Sentinel Dashboard next to each finding.

## Operational Prerequisites
- **API Quota:** MUST upgrade the Gemini API to a paid tier. The current free-tier limit of 20 requests/day will instantly block the pilot.
- **Concurrency Control:** Implement request batching in `AnalysisOrchestrator` to prevent HTTP 429 errors.
