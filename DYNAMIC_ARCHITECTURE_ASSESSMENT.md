# CodeAurora Sentinel AI — Dynamic Architecture Assessment & Operations Plan

**Product:** CodeAurora Sentinel AI ("Secure Every Commit")  
**Date:** October 2026  
**Auditor / Architect:** Senior SaaS Architect, AppSec & Operations Lead  
**Scope:** Strict Dynamic Architecture Mandate + Admin Operations, Pipeline Observability & Incident Management System

---

## 1. Executive Summary & Audit Findings

An exhaustive audit of the existing CodeAurora Sentinel AI repository was conducted to assess hardcoded logic, embedded constants, rigid scanner definitions, duplicated navigation models, and the current operational support infrastructure.

### 1.1 Current Architecture vs. Dynamic Mandate

| Area | Current State | Risk / Limitation | Target Dynamic Architecture |
| :--- | :--- | :--- | :--- |
| **SAST Rules (`customRules.js`)** | Hardcoded array in constructor with regex literals, fixed `confidence: 0.6`, no validation, no schema. | Cannot add/disable rules without source code changes and service redeployment. | Declarative, versioned Rule Registry with schema validation, category/CWE/OWASP taxonomy, and runtime enable/disable flags. |
| **Scanner Registry (`orchestrator/index.js`)** | Hardcoded array of scanner instances in constructor (`[CustomRulesScanner, SecretsScanner, SemgrepScanner, DependencyScanner]`). | Rigid execution loop, name-matching heuristics for logs, no unified capability discovery. | Unified Scanner Registry exposing metadata, required dependencies, runtime availability check, and execution hooks. |
| **Product Navigation & Modules** | Duplicated lists in `AppSidebar.tsx`, `App.tsx`, and backend route guards. | Inconsistencies between UI navigation and backend engine capability; risk of advertising unavailable features. | Centralized Module Manifest (`shared/moduleManifest.ts` / backend manifest) driving routes, sidebar navigation, capability status, and RBAC requirements. |
| **Execution Observability** | Execution pipeline logged to `console.log`; reviews stored in `code_reviews` and `scan_history` without stage-level metrics. | No stage latency, trace correlation IDs, error categorization, or partial failure recovery tracking. | Structured `executions` and `execution_stages` models with correlation IDs, stage status, duration, and error codes. |
| **Incident Management** | No incident tracking model; feedback dumped into `beta_feedback`. | Users cannot report issues; operations team has no queue, SLA tracking, or internal notes separation. | Dual-tier Incident System: Customer Incident Portal (`INC-YYYY-XXXXXX`) + Staff Operations Queue with private notes, SLA countdowns, and deduplication. |
| **Audit Trail & RBAC** | Basic `admin_users` table with binary `admin` flag; no tamper-evident audit trail for administrative actions. | Lack of compliance readiness, no granular roles (`platform_owner`, `platform_admin`, `support_agent`, `operations_engineer`). | Granular RBAC middleware + Append-only `audit_events` ledger recording actor, action, target, before/after diffs. |

---

## 2. Dynamic Boundary Classification

To avoid moving constants into a database indiscriminately, values are classified into four distinct architectural tiers:

### Tier 1: Foundational Invariants (Code-Level, Deterministic)
*These must remain deterministic, cryptographically verified, and non-overridable by tenants:*
- Encryption algorithms and key lengths (`AES-256-GCM`, 96-bit IV, 128-bit auth tag).
- Cryptographic hash algorithms for HMAC signatures (`SHA-256`).
- Deterministic secret scanning boundary limits and memory masking.
- Database foreign key constraints and schema uniqueness invariants.
- Strict authorization barriers (e.g., customers can never read internal support notes).

### Tier 2: Version-Controlled Declarative Registry (File/Config-Driven)
*These are versioned, schema-validated, and can be updated without core engine rewrites:*
- Security rules definitions (patterns, CWEs, OWASP mappings, severities, remediation suggestions, test fixtures).
- Scanner engine manifests (name, version, supported ecosystems, binary dependencies, health checks).
- Application module manifests (module ID, navigation group, routes, minimum permissions, icon tokens).
- Default incident categories, priority matrices, and default SLA windows.

### Tier 3: Database-Backed Configurable Policies & Settings (Tenant/Admin Configurable)
*These support dynamic adjustments with validation, safe defaults, and audit logging:*
- Scanner execution policies (timeouts, maximum file size limits, exclusions).
- Organization notification rules and webhook destinations.
- Incident SLA thresholds and escalation assignments.
- Platform maintenance flags, banners, and operational notice configurations.

### Tier 4: Runtime Dynamic State & Telemetry (Database Queries & Streams)
*These represent live operational reality, never hardcoded counters:*
- Execution stage progress, latency, and status (`QUEUED`, `RUNNING`, `COMPLETED`, `PARTIAL`, `FAILED`).
- Engine health and runtime availability checks.
- Live incident queue status, SLA countdowns, and correlation links.

---

## 3. Incremental Implementation Plan

We execute this mandate in 5 verified phases:

1. **Phase A: Dynamic Rule & Scanner Registry Refactoring**
2. **Phase B: Database Schema Migrations & RBAC Foundation**
3. **Phase C: Dual-Tier Customer & Staff Incident Management**
4. **Phase D: Execution Pipeline Observability & Diagnostics**
5. **Phase E: Admin Operations Console UI & Notification Alerts**
