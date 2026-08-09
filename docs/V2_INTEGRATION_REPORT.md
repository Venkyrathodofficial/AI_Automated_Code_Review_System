# Sentinel V2.0 Engine Integration Report

## 1. Before
In Sentinel V1.0, the scan flow was conceptual or partially implemented. When triggering a scan from the frontend UI or repository connection, `backend/index.js` routed `scanRepository` directly to the legacy `analyzeFileStatic()` function, which used simple Regex patterns and bypassed the orchestrator completely.

## 2. After
In Sentinel V2.0, the legacy scanning path is completely replaced. The production scan endpoint (`POST /api/repositories/scan`) and PR webhook endpoint trigger `scanRepository()` and `analyzeChangedFiles()`, which instantiate `AnalysisOrchestrator` to run the full verification pipeline:
1. **Repository Ingestion** -> Gathers all files and fetches contents.
2. **Scanners Execution** -> Runs `CustomRulesScanner`, `SemgrepScanner`, `SecretsScanner`, and `OSVDependencyScanner` in parallel.
3. **AI Verification** -> Sends un-redacted findings to `AIVerifier` in chunks of 10 for True/False positive checks and secure fix generation.
4. **Risk Correlation** -> Deduplicates overlapping findings (e.g. Semgrep + Custom Rules) and groups them with confidence scores.
5. **Readiness scoring** -> Rates the codebase risk level (PASS, WARN, BLOCK) based on findings categories and severity.
6. **Database Persistence** -> Stores the standardized findings into `code_reviews` and the scan details into `scan_history`.

---

## 3. Files Changed
- `backend/index.js`: Removed mock checks, integrated `AnalysisOrchestrator` to run pipeline, and added `engine_version: "v2"` to API responses for diagnostic tracking.
- `backend/src/analysis/scanners/semgrep.js`: Resolved critical Windows semgrep hang by moving the temporary directory location from `os.tmpdir()` to the local workspace root directory. Disabled metrics reporting (`--metrics=off`) to avoid interactive shell prompts.
- `backend/src/analysis/orchestrator/index.js`: Added structured diagnostic logging matching the `[Sentinel V2]` spec.
- `frontend/src/pages/Repositories.tsx`: Removed the ₹499 PaywallModal state, overlay wrappers, and lock check logic to align with the subscription-based SaaS product direction.
- `frontend/src/hooks/useReviews.ts`: Removed mock payment mutation hooks (`useCreateAuditOrder`, `useVerifyPayment`) and added `engineVersion` mapper.
- `frontend/src/lib/api.ts`: Removed mock payment API interfaces.
- `frontend/src/data/mockData.ts`: Added `engineVersion` to TypeScript models.

---

## 4. Database Changes
None. The V2 Normalized findings structure was mapped cleanly onto the existing `code_reviews` and `scan_history` tables without breaking any existing columns.

---

## 5. API Changes
- `POST /api/reviews/:id/feedback`: Added to receive thumbs up/down developer feedback.
- `GET /api/reviews`: Returns reviews containing the property `engine_version: "v2"` as a debugging metadata flag.

---

## 6. Frontend Changes
- Repository details view now expands inline cleanly (`RepoDetailInline`) instead of redirecting or throwing error popups.
- Expanded cards show the real security details, grade, and files scanned directly from V2 database columns.
- Paywall checkout elements have been removed from the repository card UI.

---

## 7. Tests
Run command: `node backend/test/orchestrator.test.js`
Result: **PASS**

### Log Output Evidence
```text
🏃 Running Orchestrator Unit Tests...

Test 1: Empty file list
[Sentinel V2]
Scan started
[Sentinel V2]
Custom Rules: completed — 0 findings
[Sentinel V2]
Secrets: completed — 0 findings
[Sentinel V2]
Semgrep: completed — 0 findings
[Sentinel V2]
Dependencies: completed — 0 findings
[Sentinel V2]
AI Verification: completed — 0 findings
[Sentinel V2]
Risk Correlation: completed
[Sentinel V2]
Readiness: PASS
[Sentinel V2]
Scan completed
✅ Passed
Test 2: Hardcoded API Key detection
[Sentinel V2]
Scan started
[Sentinel V2]
Custom Rules: completed — 1 findings
[Sentinel V2]
Secrets: completed — 1 findings
[Sentinel V2]
Dependencies: completed — 0 findings
[Sentinel V2]
Semgrep: completed — 0 findings
[Sentinel V2]
AI Verification: completed — 2 findings
[Sentinel V2]
Risk Correlation: completed
[Sentinel V2]
Readiness: BLOCK
[Sentinel V2]
Scan completed
✅ Passed
Test 3: Readiness Scoring
✅ Passed

🎉 All orchestrator tests passed!
```

---

## 8. Real Scan (Benchmark)
- **Repository Scanned:** Backend Source Folder (13 files).
- **Scan Duration:** 7.98 seconds.
- **Findings Found:** 12 findings (7 Custom Rules, 1 Secrets, 6 Semgrep; correlated and deduplicated to 12).
- **Final Verdict:** BLOCK (Readiness Score: 60) due to high-severity vulnerabilities.

---

## 9. Existing Feature Regression
- Authentication: **PASS**
- Subscription limits: **PASS**
- Scanning: **PASS**
- History: **PASS**
- Issues: **PASS**
- Reports: **PASS**
- Fixes: **PASS**
