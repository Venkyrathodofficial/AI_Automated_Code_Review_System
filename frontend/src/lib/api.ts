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
}

export interface Stats {
  totalReviews: number;
  critical: number;
  medium: number;
  low: number;
  open: number;
  resolved: number;
}

export interface Repository {
  name: string;
  totalReviews: number;
  critical: number;
  medium: number;
  low: number;
  open: number;
  resolved: number;
  healthScore: number;
  lastReviewDate: string | null;
  filesReviewed: number;
  connectedAt?: string;
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

const BASE = import.meta.env.VITE_API_URL || "/api";

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

export async function fetchReviews(): Promise<ReviewRow[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/reviews`, { headers });
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/stats`, { headers });
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
