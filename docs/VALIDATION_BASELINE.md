# Sentinel V2.0 Validation Baseline

**Date:** August 9, 2026
**Objective:** Document the pre-validation state of CodeAurora Sentinel, establishing the baseline capabilities, components, and known limitations before the benchmarking phase begins.

## 1. Current Architecture

Sentinel V2.0 operates as a full-stack code verification platform consisting of a React frontend and an Express/Node.js backend, backed by Supabase.

### Core Analysis Engine
The heart of the verification system is the `AnalysisOrchestrator` (`backend/src/analysis/orchestrator/index.js`). It manages the pipeline:
1. **Ingestion**: Constructs `RepositoryContext` from a list of files.
2. **Scanning**: Executes an array of deterministic static scanners in parallel.
3. **Verification**: Passes normalized findings to the `AIVerifier` to filter false positives and determine true severity using an LLM (Gemini).
4. **Correlation**: Passes verified findings to the `RiskCorrelationEngine` to deduplicate and merge related issues.
5. **Scoring**: Computes a final repository `ProductionReadinessModel` (PASS, WARN, BLOCK).

### Workflows
- **On-Demand Scanning**: Triggered via API `/api/scan`. Analyzes the entire provided repository context.
- **Automated Fix Generation**: Driven by `/api/commit-fix`, uses an LLM to generate secure code, followed by `FixValidator` to ensure the fix resolves the original finding before attempting a commit.
- **GitHub PR Verification**: Webhook handler (`backend/index.js` -> `PRVerifier`) listens for `pull_request` events, executes a delta scan, and posts an automated review comment to GitHub.

## 2. Current Scanners Status

The system currently relies on the following scanner modules:
1. **CustomRulesScanner**: Uses regex patterns to detect:
   - API Key Exposures
   - SQL Injection (via string concatenation)
   - XSS (innerHTML, document.write)
   - Insecure Dependencies (wildcard versions)
   - Authentication Weaknesses (weak hashes like MD5, hardcoded passwords)
   - Configuration Flaws (e.g., debug mode enabled)
2. **SecretsScanner**: Specialized module for finding secrets.
3. **DependencyScanner**: Module for parsing package files.
4. **SemgrepScanner**: Intended for running Semgrep rules (current execution reliability to be validated).

## 3. Current AI Verification Status

The `AIVerifier` uses a 4-stage reasoning prompt sent to the configured AI Provider (Gemini 2.5 Flash / Pro):
- **Stage 1 (Verification):** True positive vs False positive evaluation.
- **Stage 2 (Context Reasoning):** Evaluates how the code interacts with the repo based on `RepositoryContext`.
- **Stage 3 (Impact & Severity):** Calculates final severity.
- **Stage 4 (Remediation):** Generates a secure code replacement snippet.

**Known Limitations:**
- Reliance on LLM stability; "hallucinations" or overly aggressive false-positive flagging by the AI have not been formally quantified.
- Extremely large files may truncate the context window, reducing AI verification accuracy.

## 4. Current Test Coverage

**Status:** Minimal / Untested.
The system is functionally assembled and operational in MVP form, but lacks a formal, comprehensive automated test suite (unit tests, integration tests) measuring accuracy (Precision/Recall) across the scanner array and the AI Verifier. The Validation Phase will introduce the `evaluation/` framework to solve this.

## 5. Current Known Failures & Limitations
- **Regex Fragility**: The `CustomRulesScanner` is heavily regex-based. It is highly susceptible to false positives (e.g., test files, comments) and false negatives (e.g., string interpolation spread across multiple lines).
- **Delta Scan Coverage**: The `PRVerifier` currently scans only the files included in the PR delta. If a vulnerability is introduced because a core configuration changed, but the vulnerable sink is in an unmodified file, the delta scan might miss it.
- **Fix Validation**: The `FixValidator` verifies that the updated code parses and no longer triggers the *specific* scanner rule. It does not run a full dynamic test suite (as it lacks a runtime environment for the target repo), meaning it cannot guarantee that the fix hasn't broken business logic.
- **Confidence Scoring**: Currently, confidence scores are largely emitted by the LLM itself ("How confident are you?"). The statistical reliability of these numbers is unknown.

---
**Next Step:** Build the Evaluation Framework and Benchmark Suite to quantify these baseline assumptions.

## 6. Milestone 1 & 2 Validation Findings

### AI Verification & Rate Limiting
- The AIVerifier successfully identifies and drops false positives from the regex scanner (e.g., parameterized SQL queries).
- **CRITICAL ISSUE:** The Orchestrator fires verification requests concurrently. Against Gemini's Free Tier (15 requests/minute), scanning a repository with > 10 findings will instantly trigger a 429 Too Many Requests error, causing the AI engine to fail open and return the findings unverified.

### Correlation Engine
- The Risk Correlation Engine accurately deduplicates overlapping findings from multiple scanners based on line proximity and correctly cascades the AI confidence scores (dropping false positives with < 0.2 confidence).

### Automated Fix Validation
- **CRITICAL ISSUE:** The FixValidator uses only static scanners (for speed) to verify that an AI-generated fix resolved the issue. However, because the static regex is prone to false positives, it will often reject perfectly valid AI fixes (e.g., rejecting a parameterized query fix because it contains a ? that triggers the regex). This prevents secure fixes from being committed automatically.


## 7. Milestone 3 Validation Findings

### GitHub PR Verification
- The \PRVerifier\ successfully integrates the Orchestrator pipeline output into a formatted GitHub markdown comment. It correctly tabulates category scores, sets emojis based on the \ProductionReadinessModel\ verdict (e.g., ?? BLOCK), and truncates findings to avoid oversized PR comments.

### Security (Prompt Injection) & Performance Constraints
- **API Quota Exhaustion (FATAL SCALABILITY FLAW):** During the prompt injection and expanded benchmark tests, the Gemini Free Tier enforced a hard daily limit of 20 requests per project. Because the \AnalysisOrchestrator\ fires a dedicated LLM prompt for *every single static finding*, a repository with just 20 findings will exhaust the daily quota in a single scan. When the quota is exhausted, the AI Verification engine fails open (returning \iVerified: false\ instead of throwing a fatal error), which causes the system to revert to the noisy, false-positive-heavy static scanner baseline.
- **Prompt Injection:** Due to the API exhaustion, the adversarial prompt injection test could not be completed by the LLM. However, the system's fail-open design means an attacker cannot guarantee suppression of a vulnerability merely by injecting a prompt if the API is degraded.

