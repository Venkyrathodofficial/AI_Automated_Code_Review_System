/**
 * Sentinel Centralized Module Manifest
 * Single source of truth for platform modules, routes, RBAC requirements, and capabilities.
 */

const MODULE_GROUPS = {
  CORE: "Core Platform",
  ENGINES: "Security Engines",
  WORKFLOWS: "Developer Workflows",
  GOVERNANCE: "Governance & Insights",
  ADMIN: "Operations & Admin"
};

const MODULE_MANIFEST = [
  // ── Core Developer Experience ──
  {
    id: "dashboard",
    displayName: "Dashboard",
    route: "/dashboard",
    group: MODULE_GROUPS.CORE,
    icon: "LayoutDashboard",
    requiredRole: "customer_member",
    capabilityStatus: "GA",
    backendService: "core",
    description: "Security posture overview and quick actions"
  },
  {
    id: "repositories",
    displayName: "Repositories",
    route: "/repositories",
    group: MODULE_GROUPS.CORE,
    icon: "FolderGit2",
    requiredRole: "customer_member",
    capabilityStatus: "GA",
    backendService: "github-sync",
    description: "Connected Git repositories and automated review settings"
  },
  {
    id: "issues",
    displayName: "Issues & Findings",
    route: "/issues",
    group: MODULE_GROUPS.CORE,
    icon: "AlertTriangle",
    requiredRole: "customer_member",
    capabilityStatus: "GA",
    backendService: "findings-service",
    description: "Triage and remediation tracking for detected vulnerabilities"
  },

  // ── Security Engines ──
  {
    id: "code-security",
    displayName: "Code Security (SAST)",
    route: "/code-security",
    group: MODULE_GROUPS.ENGINES,
    icon: "ShieldAlert",
    requiredRole: "customer_member",
    capabilityStatus: "GA",
    backendService: "sentinel-code-custom",
    description: "Static code analysis for OWASP Top 10, SSRF, and injection flaws"
  },
  {
    id: "supply-chain",
    displayName: "Supply Chain (SCA)",
    route: "/supply-chain",
    group: MODULE_GROUPS.ENGINES,
    icon: "Layers",
    requiredRole: "customer_member",
    capabilityStatus: "GA",
    backendService: "sentinel-dependency-osv",
    description: "Open-source dependency vulnerability and lockfile graph analysis"
  },
  {
    id: "secrets-security",
    displayName: "Secrets Security",
    route: "/secrets-security",
    group: MODULE_GROUPS.ENGINES,
    icon: "KeyRound",
    requiredRole: "customer_member",
    capabilityStatus: "GA",
    backendService: "sentinel-secrets",
    description: "Detection and masking of API keys, fintech gateways, and cloud secrets"
  },
  {
    id: "container-security",
    displayName: "Container Security",
    route: "/container-security",
    group: MODULE_GROUPS.ENGINES,
    icon: "Boxes",
    requiredRole: "customer_member",
    capabilityStatus: "BETA",
    backendService: "container-analysis",
    description: "Dockerfile misconfiguration and container image vulnerability audits"
  },
  {
    id: "cloud-security",
    displayName: "Cloud Security (IaC)",
    route: "/cloud-security",
    group: MODULE_GROUPS.ENGINES,
    icon: "CloudShield",
    requiredRole: "customer_member",
    capabilityStatus: "BETA",
    backendService: "iac-scanner",
    description: "Terraform, Kubernetes, and CloudFormation posture evaluation"
  },
  {
    id: "api-security",
    displayName: "API Security",
    route: "/api-security",
    group: MODULE_GROUPS.ENGINES,
    icon: "Webhook",
    requiredRole: "customer_member",
    capabilityStatus: "BETA",
    backendService: "api-auditor",
    description: "OpenAPI schema checks and OWASP API Security Top 10 detection"
  },

  // ── Developer Workflows ──
  {
    id: "ai-security",
    displayName: "AI Security & Guardrails",
    route: "/workflows/ai-security",
    group: MODULE_GROUPS.WORKFLOWS,
    icon: "Bot",
    requiredRole: "customer_member",
    capabilityStatus: "GA",
    backendService: "ai-verifier",
    description: "LLM guardrails, prompt injection detection, and AI review verification"
  },
  {
    id: "workflows",
    displayName: "CI/CD & Workflows",
    route: "/workflows",
    group: MODULE_GROUPS.WORKFLOWS,
    icon: "Workflow",
    requiredRole: "customer_member",
    capabilityStatus: "GA",
    backendService: "webhook-service",
    description: "GitHub Actions integrations and pull request gating policies"
  },
  {
    id: "policies",
    displayName: "Security Policies",
    route: "/policies",
    group: MODULE_GROUPS.WORKFLOWS,
    icon: "ShieldCheck",
    requiredRole: "customer_org_admin",
    capabilityStatus: "GA",
    backendService: "policy-engine",
    description: "Guardrails, severity thresholds, and branch merge blocking rules"
  },

  // ── Governance & Customer Incidents ──
  {
    id: "reports",
    displayName: "Compliance & Reports",
    route: "/reports",
    group: MODULE_GROUPS.GOVERNANCE,
    icon: "FileText",
    requiredRole: "customer_member",
    capabilityStatus: "GA",
    backendService: "reporting-service",
    description: "Exportable executive summaries, audit reports, and shareable links"
  },
  {
    id: "incidents-customer",
    displayName: "Support & Incidents",
    route: "/incidents",
    group: MODULE_GROUPS.GOVERNANCE,
    icon: "LifeBuoy",
    requiredRole: "customer_member",
    capabilityStatus: "GA",
    backendService: "incident-service",
    description: "Report technical issues, track tickets, and follow up with support"
  },
  {
    id: "organization",
    displayName: "Organization & Team",
    route: "/organization",
    group: MODULE_GROUPS.GOVERNANCE,
    icon: "Building2",
    requiredRole: "customer_org_admin",
    capabilityStatus: "GA",
    backendService: "org-service",
    description: "Manage team memberships, workspace access, and billing"
  },
  {
    id: "integrations",
    displayName: "Integrations & Webhooks",
    route: "/integrations",
    group: MODULE_GROUPS.GOVERNANCE,
    icon: "Network",
    requiredRole: "customer_org_admin",
    capabilityStatus: "GA",
    backendService: "integrations-service",
    description: "Connect Slack, Jira, webhooks, and developer tooling"
  },

  // ── Operations & Admin Console (Staff Only) ──
  {
    id: "admin-operations",
    displayName: "Operations Overview",
    route: "/admin/operations",
    group: MODULE_GROUPS.ADMIN,
    icon: "Activity",
    requiredRole: "support_agent",
    capabilityStatus: "GA",
    backendService: "admin-metrics",
    description: "Platform health, queue latencies, engine status, and incident volume"
  },
  {
    id: "admin-pipeline",
    displayName: "Pipeline & Execution Monitor",
    route: "/admin/pipeline",
    group: MODULE_GROUPS.ADMIN,
    icon: "GitBranch",
    requiredRole: "operations_engineer",
    capabilityStatus: "GA",
    backendService: "execution-monitor",
    description: "Real-time execution traces, stage telemetry, failure correlation, and retries"
  },
  {
    id: "admin-incidents",
    displayName: "Staff Incident Workspace",
    route: "/admin/incidents",
    group: MODULE_GROUPS.ADMIN,
    icon: "Inbox",
    requiredRole: "support_agent",
    capabilityStatus: "GA",
    backendService: "admin-incidents",
    description: "Support ticket queue, SLA countdowns, confidential notes, and resolution"
  },
  {
    id: "admin-organizations",
    displayName: "Customer & Org Directory",
    route: "/admin/organizations",
    group: MODULE_GROUPS.ADMIN,
    icon: "Users2",
    requiredRole: "platform_admin",
    capabilityStatus: "GA",
    backendService: "admin-orgs",
    description: "Staff view of tenant accounts, projects, subscription status, and usage"
  },
  {
    id: "admin-diagnostics",
    displayName: "Logs & Diagnostics",
    route: "/admin/diagnostics",
    group: MODULE_GROUPS.ADMIN,
    icon: "Terminal",
    requiredRole: "operations_engineer",
    capabilityStatus: "GA",
    backendService: "diagnostics-service",
    description: "Sanitized error traces, correlation ID lookups, and redaction verification"
  },
  {
    id: "admin-alerts",
    displayName: "Alerts & Notifications",
    route: "/admin/alerts",
    group: MODULE_GROUPS.ADMIN,
    icon: "BellRing",
    requiredRole: "platform_admin",
    backendService: "alert-service",
    capabilityStatus: "GA",
    description: "Automated event triggers, deduplication rules, and notification routing"
  },
  {
    id: "admin-audit",
    displayName: "Audit Trail",
    route: "/admin/audit-trail",
    group: MODULE_GROUPS.ADMIN,
    icon: "ShieldAlert",
    requiredRole: "platform_admin",
    capabilityStatus: "GA",
    backendService: "audit-service",
    description: "Immutable ledger of administrative actions, status transitions, and config updates"
  },
  {
    id: "admin-settings",
    displayName: "Admin Settings & RBAC",
    route: "/admin/settings",
    group: MODULE_GROUPS.ADMIN,
    icon: "Sliders",
    requiredRole: "platform_owner",
    capabilityStatus: "GA",
    backendService: "admin-settings",
    description: "Platform-wide policies, maintenance mode, and staff access controls"
  }
];

module.exports = {
  MODULE_GROUPS,
  MODULE_MANIFEST
};
