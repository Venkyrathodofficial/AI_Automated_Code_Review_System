import type { Issue } from "@/data/mockData";

export type SecurityGrade = "A+" | "A" | "B" | "C" | "D" | "F";
export type SecurityRiskLevel = "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk";
export type IssueCategory = "Security" | "Code Quality";

export interface SecurityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface SecurityProfile extends SecurityCounts {
  score: number;
  grade: SecurityGrade;
  riskLevel: SecurityRiskLevel;
  deductions: number;
}

export interface SecuritySummary {
  currentScore: number;
  grade: SecurityGrade;
  riskLevel: SecurityRiskLevel;
  criticalRisks: number;
  aiFixesAvailable: number;
  potentialSecurityGain: number;
  previousScore?: number;
  improvement?: number;
}

export interface SecurityAction {
  rank: number;
  title: string;
  severity: Issue["severity"];
  priority: "Critical" | "High" | "Medium" | "Low";
  expectedScoreGain: number;
  estimatedImpact: string;
  fileName: string;
  sourceIssue: Issue;
}

const SCORE_WEIGHTS: Record<keyof SecurityCounts, number> = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 1,
};

const ACTION_WEIGHTS: Record<keyof SecurityCounts, number> = {
  critical: 20,
  high: 15,
  medium: 10,
  low: 5,
};

const SECURITY_CATEGORY_MATCHERS = [
  /api key|secret|credential|token|oauth|auth|authentication|authorization/i,
  /sql injection|xss|cross site scripting|command injection|path traversal|unsafe upload/i,
  /sensitive data|exposure|vulnerable dependency|dependency vulnerability|environment configuration/i,
  /general_vulnerability|injection|ssrf|csrf|cve|hardcoded secret/i,
];

const QUALITY_CATEGORY_MATCHERS = [
  /todo|console|loose equality|naming|unused variable|duplicate|formatting|large function/i,
  /maintainability|style|lint|refactor|code smell|readability/i,
];

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getSecurityGrade(score: number): SecurityGrade {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function getSecurityRiskLevel(score: number): SecurityRiskLevel {
  if (score >= 90) return "Low Risk";
  if (score >= 70) return "Medium Risk";
  if (score >= 50) return "High Risk";
  return "Critical Risk";
}

export function calculateSecurityScore(counts: SecurityCounts): SecurityProfile {
  const deductions =
    counts.critical * SCORE_WEIGHTS.critical +
    counts.high * SCORE_WEIGHTS.high +
    counts.medium * SCORE_WEIGHTS.medium +
    counts.low * SCORE_WEIGHTS.low;

  const score = clampScore(100 - deductions);

  return {
    ...counts,
    score,
    grade: getSecurityGrade(score),
    riskLevel: getSecurityRiskLevel(score),
    deductions,
  };
}

export function calculatePotentialSecurityGain(counts: SecurityCounts): number {
  return clampScore(
    counts.critical * SCORE_WEIGHTS.critical +
      counts.high * SCORE_WEIGHTS.high +
      counts.medium * SCORE_WEIGHTS.medium +
      counts.low * SCORE_WEIGHTS.low
  );
}

export function classifyIssueCategory(issue: Issue): IssueCategory {
  const searchableText = [issue.title, issue.description, issue.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (SECURITY_CATEGORY_MATCHERS.some((matcher) => matcher.test(searchableText))) {
    return "Security";
  }

  if (QUALITY_CATEGORY_MATCHERS.some((matcher) => matcher.test(searchableText))) {
    return "Code Quality";
  }

  return issue.severity === "critical" || issue.severity === "high" ? "Security" : "Code Quality";
}

export function splitIssuesByCategory(issues: Issue[]): {
  security: Issue[];
  codeQuality: Issue[];
} {
  return issues.reduce(
    (acc, issue) => {
      if (classifyIssueCategory(issue) === "Security") {
        acc.security.push(issue);
      } else {
        acc.codeQuality.push(issue);
      }
      return acc;
    },
    { security: [] as Issue[], codeQuality: [] as Issue[] }
  );
}

export function summarizeSecurityState(params: {
  currentScore: number;
  previousScore?: number;
  criticalRisks: number;
  aiFixesAvailable: number;
  potentialSecurityGain: number;
}): SecuritySummary {
  const improvement =
    typeof params.previousScore === "number"
      ? params.currentScore - params.previousScore
      : undefined;

  return {
    currentScore: clampScore(params.currentScore),
    grade: getSecurityGrade(params.currentScore),
    riskLevel: getSecurityRiskLevel(params.currentScore),
    criticalRisks: params.criticalRisks,
    aiFixesAvailable: params.aiFixesAvailable,
    potentialSecurityGain: params.potentialSecurityGain,
    previousScore: params.previousScore,
    improvement,
  };
}

function getActionTitle(issue: Issue): string {
  const text = [issue.title, issue.description, issue.suggestedFix, issue.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/api key|secret|credential|token/.test(text)) return "Remove Exposed API Keys";
  if (/sql injection|parameterized query|query/.test(text)) return "Parameterize Database Queries";
  if (/innerhtml|xss|cross site scripting|sanitize/.test(text)) return "Fix XSS Rendering Paths";
  if (/password|hardcoded credential|authentication/.test(text)) return "Fix Authentication Weaknesses";
  if (/dependency|package|vulnerable/.test(text)) return "Upgrade Vulnerable Dependencies";
  if (/authorization|access control|role/.test(text)) return "Tighten Authorization Checks";
  if (/upload|file upload|path traversal/.test(text)) return "Harden File Handling";
  return issue.title;
}

export function buildRecommendedSecurityActions(issues: Issue[], limit = 3): SecurityAction[] {
  const openIssues = issues.filter((issue) => issue.status === "open");

  const severityOrder: Record<Issue["severity"], number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...openIssues]
    .sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])
    .slice(0, limit)
    .map((issue, index) => {
      const severityKey = issue.severity as keyof typeof ACTION_WEIGHTS;
      const expectedScoreGain = ACTION_WEIGHTS[severityKey] || 5;

      return {
        rank: index + 1,
        title: getActionTitle(issue),
        severity: issue.severity,
        priority:
          issue.severity === "critical"
            ? "Critical"
            : issue.severity === "high"
              ? "High"
              : issue.severity === "medium"
                ? "Medium"
                : "Low",
        expectedScoreGain,
        estimatedImpact: `+${expectedScoreGain} Security Score`,
        fileName: issue.fileName,
        sourceIssue: issue,
      };
    });
}

export interface GeminiFixValidationResult {
  detection: string;
  expectedFix: string;
}

export function validateGeminiSecurityFix(code: string): GeminiFixValidationResult | null {
  const normalized = code.trim();

  if (/\b(apiKey|api_key|secret|token|credential)\s*=\s*["'][^"']+["']/.test(normalized) || /const\s+apiKey\s*=\s*["']secret["']/.test(normalized)) {
    return {
      detection: "API Key Exposure",
      expectedFix: "Move secret into environment variables.",
    };
  }

  if (/SELECT\s+\*\s+FROM\s+.+\+\s*id/i.test(normalized) || /query\s*=\s*["'][^"']*SELECT[^"']*["']\s*\+\s*id/i.test(normalized)) {
    return {
      detection: "SQL Injection Risk",
      expectedFix: "Parameterized query.",
    };
  }

  if (/\.innerHTML\s*=\s*[^;]+/i.test(normalized)) {
    return {
      detection: "Cross Site Scripting (XSS)",
      expectedFix: "Input sanitization or safe rendering.",
    };
  }

  if (/password\s*===\s*["'][^"']+["']/.test(normalized)) {
    return {
      detection: "Hardcoded Credential",
      expectedFix: "Use secure authentication flow.",
    };
  }

  if (/vulnerable dependency|known vulnerable dependency|outdated dependency/i.test(normalized)) {
    return {
      detection: "Insecure Dependency",
      expectedFix: "Recommended secure dependency upgrade.",
    };
  }

  return null;
}