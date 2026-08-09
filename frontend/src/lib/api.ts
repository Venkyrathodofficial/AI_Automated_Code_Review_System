// ============================================
// API Service — talks to Express backend
// ============================================

import { supabase } from "@/lib/supabase";

export interface ReviewRow {
  id: string;
  repository_name: string;
  file_name: string;
  issue_title: string;
  issue_description: string;
  severity: string;
  suggestion: string;
  optimization_tip: string;
  risk_score: number;
  commit_id: string;
  commit_message: string;
  status: string;
  created_at: string | null;
  ai_model?: string;
  confidence_score?: number;
  validation_status?: string;
  line_number?: number | null;
  category?: string;
  secure_code?: string;
  best_practices?: string;
  offending_line?: string;
}

export interface Stats {
  totalReviews: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  open: number;
  resolved: number;
  securityScore?: number;
  securityGrade?: string;
  riskLevel?: string;
  fixesAvailable?: number;
  potentialSecurityGain?: number;
}

export interface Repository {
  name: string;
  totalReviews: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  open: number;
  resolved: number;
  healthScore: number;
  security_score?: number;
  security_grade?: string;
  risk_level?: string;
  criticalIssues?: number;
  highIssues?: number;
  mediumIssues?: number;
  lowIssues?: number;
  lastReviewDate: string | null;
  filesReviewed: number;
  connectedAt?: string;
  previousSecurityScore?: number | null;
  scoreImprovement?: number;
  potentialSecurityGain?: number;
}

export interface ConnectRepoResult {
  success: boolean;
  repository: { id: string; repo_full_name: string; webhook_secret: string };
  webhook: {
    url: string;
    secret: string;
    instructions: string[];
  };
}

export interface ReportEmailResult {
  success: boolean;
  message: string;
  summary: {
    total: number;
    critical: number;
    medium: number;
    low: number;
  };
}

const BASE = import.meta.env.VITE_API_URL || "/api/v1";

/** Get current user's access token */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchReviews(repoFullName?: string): Promise<ReviewRow[]> {
  const headers = await getAuthHeaders();
  const url = repoFullName ? `${BASE}/reviews?repo=${encodeURIComponent(repoFullName)}` : `${BASE}/reviews`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export async function fetchStats(repoFullName?: string): Promise<Stats> {
  const headers = await getAuthHeaders();
  const url = repoFullName ? `${BASE}/stats?repo=${encodeURIComponent(repoFullName)}` : `${BASE}/stats`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchRepositories(): Promise<Repository[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/repositories`, { headers });
  if (!res.ok) throw new Error("Failed to fetch repositories");
  return res.json();
}

export async function updateReviewStatus(
  id: string,
  status: string
): Promise<ReviewRow[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/reviews/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update review");
  return res.json();
}

export async function purgeReviews(repoFullName?: string): Promise<{ success: boolean; count: number }> {
  const headers = await getAuthHeaders();
  const url = repoFullName 
    ? `${BASE}/reviews/purge?repo=${encodeURIComponent(repoFullName)}`
    : `${BASE}/reviews/purge`;
  const res = await fetch(url, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to purge reviews");
  return res.json();
}

export async function connectRepository(
  repoFullName: string
): Promise<ConnectRepoResult> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/repositories/connect`, {
    method: "POST",
    headers,
    body: JSON.stringify({ repoFullName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to connect" }));
    throw new Error(err.error || "Failed to connect repository");
  }
  return res.json();
}

export async function disconnectRepository(
  repoFullName: string
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${BASE}/repositories/${encodeURIComponent(repoFullName)}`,
    { method: "DELETE", headers }
  );
  if (!res.ok) throw new Error("Failed to disconnect repository");
}

export async function scanRepository(
  repoFullName: string
): Promise<{ success: boolean; message: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/repositories/scan`, {
    method: "POST",
    headers,
    body: JSON.stringify({ repoFullName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to scan" }));
    throw new Error(err.error || "Failed to start scan");
  }
  return res.json();
}

export async function sendDetailedReportEmail(payload?: {
  repoFullName?: string | null;
  includeResolved?: boolean;
}): Promise<ReportEmailResult> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/notifications/report/email`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to send report" }));
    throw new Error(err.error || "Failed to send report");
  }
  return res.json();
}

export interface ScanHistory {
  id: string;
  repository_name: string;
  scan_date: string;
  security_score: number;
  security_grade: string;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  files_scanned: number;
  commit_id: string;
  commit_message: string;
}

export interface LeaderboardEntry {
  rank: number;
  repository_name: string;
  owner: string;
  security_score: number;
  security_grade: string;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  last_scan_date: string;
  score_improvement: number;
  most_improved: boolean;
}

export interface PublicReportResult {
  scan: ScanHistory;
  reviews: ReviewRow[];
}

export async function fetchScanHistory(repoFullName?: string): Promise<ScanHistory[]> {
  const headers = await getAuthHeaders();
  const url = repoFullName 
    ? `${BASE}/scan-history?repo=${encodeURIComponent(repoFullName)}`
    : `${BASE}/scan-history`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Failed to fetch scan history");
  return res.json();
}

export async function submitReviewFeedback(id: string, rating: "up" | "down"): Promise<{ success: boolean; message: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/reviews/${id}/feedback`, {
    method: "POST",
    headers,
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) throw new Error("Failed to submit feedback");
  return res.json();
}

export async function submitFeedback(payload: {
  category: string;
  feedback: string;
  rating?: number;
  email?: string;
}): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/feedback`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to submit feedback");
  return res.json();
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${BASE}/leaderboard`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

export async function fetchPublicReport(scanId: string): Promise<PublicReportResult> {
  const res = await fetch(`${BASE}/public/reports/${scanId}`);
  if (!res.ok) throw new Error("Failed to fetch public report");
  return res.json();
}
