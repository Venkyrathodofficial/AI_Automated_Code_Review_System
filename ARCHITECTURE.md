# CodeAurora Sentinel 2.0 — Architecture Document

## Overview
CodeAurora Sentinel 2.0 transforms a monolithic regex analyzer into a highly extensible, multi-stage static and dynamic analysis orchestration engine. The system is designed to independently verify AI-generated and human-written code before it enters a production environment.

## 1. Directory Structure

The core engine is located entirely within `backend/src/analysis`. 

```text
src/analysis/
├── orchestrator/
│   └── index.js             # The main AnalysisOrchestrator pipeline controller
├── scanners/
│   ├── customRules.js       # Fast regex-based rule definitions (CWE/OWASP mapped)
│   ├── secrets.js           # Secret detection with automatic memory redaction
│   ├── dependency.js        # Parses package manifests to query OSV.dev APIs
│   └── semgrep.js           # Structural AST analysis (SAST)
├── context/
│   └── repositoryContext.js # Lightweight AST parser for relationship mapping
├── ai/
│   ├── provider.js          # Wrapper for GoogleGenerativeAI (Gemini)
│   └── verifier.js          # Multi-stage Senior Security Engineer AI prompt flow
├── risk/
│   ├── correlation.js       # Deduplication and confidence banding
│   └── readiness.js         # Evaluates final PASS/WARN/BLOCK verdict
├── remediation/
│   └── fixValidator.js      # Runs scanners against AI fixes before GitHub commits
├── github/
│   └── prVerifier.js        # Handles PR delta scanning and Markdown formatting
└── models/
    └── normalizedFinding.js # Uniform JSON schema for all scanner outputs
```

## 2. Core Flows

### A. Standard Repository Scan (`/api/repositories/scan`)
1. **Fetch**: Code files are fetched from the remote GitHub branch.
2. **Orchestrator**: Files are passed to `AnalysisOrchestrator.runPipeline()`.
3. **Execution Pipeline**:
   - `INGESTING`: Repository code graph is built.
   - `SCANNING`: Static modules (Custom Rules, Secrets, Dependencies) execute in parallel.
   - `VERIFYING`: Findings are passed to the `AIVerifier` to filter out false positives and enrich remediation details.
   - `CORRELATING`: Overlapping findings are merged; confidence scores are aggregated.
   - `SCORING`: The `ProductionReadinessModel` assigns a final score (0-100) and Verdict.
4. **Database Mapping**: Findings are mapped to the Supabase `code_reviews` table backward-compatible format.

### B. Commit Fix Flow (`/api/commit-fix`)
Before an AI-generated secure code snippet is pushed directly to a user's GitHub repository, Sentinel enforces a safety check:
1. `FixValidator` takes the `originalCode` and the `improvedCode`.
2. It runs local, deterministic static scanners (Custom Rules, Secrets) in-memory on both variations.
3. If the vulnerability still exists in the `improvedCode`, or if new vulnerabilities are introduced, the commit is **BLOCKED**.

### C. GitHub Pull Request Hook (v2)
When a GitHub PR is opened or synchronized (`pull_request` webhook event or manual `/api/v2/pr/verify` trigger):
1. `PRVerifier` isolates only the changed files in the delta.
2. The Orchestrator runs a high-speed verification pipeline on the delta.
3. Sentinel posts an automated Markdown comment directly into the PR discussion.
4. Sentinel uses the GitHub Status API to set a commit check status (`success` for PASS/WARN, `failure` for BLOCK).

## 3. Principles & Limits

- **Never Execute Untrusted Code**: The engine does not execute, evaluate (`eval()`), or run child processes against raw user repository code. All AST mapping and regex parsing is strictly isolated.
- **Fail Gracefully**: If a specific scanner (e.g., OSV API network failure) crashes, the orchestrator catches the error, marks the scan as `PARTIAL`, and proceeds with the remaining findings.
- **Data Privacy**: High-entropy strings detected as secrets are masked (`AKIA************`) prior to being handed to the AI engine, ensuring raw secrets do not enter LLM training streams or log aggregators.
