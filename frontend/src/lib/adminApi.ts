// ============================================
// Admin API Service
// ============================================

import { supabase } from "@/lib/supabase";

const BASE = import.meta.env.VITE_API_URL || "/api/v1";

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

// ---- Public (no auth) ----

export interface AdminSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
  notice_enabled: boolean;
  notice_message: string;
  notice_type: "info" | "warning" | "critical";
  updated_at: string;
}

export async function fetchAdminSettings(): Promise<AdminSettings> {
  const res = await fetch(`${BASE}/admin/settings`);
  if (!res.ok) throw new Error("Failed to fetch admin settings");
  return res.json();
}

// ---- Auth required ----

export async function checkIsAdmin(): Promise<{ isAdmin: boolean; role: string | null }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/admin/check`, { headers });
  if (!res.ok) return { isAdmin: false, role: null };
  return res.json();
}

// ---- Admin only ----

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmed: boolean;
  provider: string;
  planTier?: string;
  billingStatus?: string;
  scansUsed?: number;
  scansLimit?: number;
  paymentProvider?: string | null;
  periodEnd?: string | null;
}

export interface ActivityEntry {
  id: string;
  user_id: string | null;
  email: string | null;
  event_type: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface AdminRepository {
  id: string;
  user_id: string;
  repo_name: string;
  github_owner: string;
  is_connected: boolean;
  last_scan_at: string | null;
  created_at: string;
  security_score: number | null;
  security_grade: string | null;
  risk_level: string | null;
  critical_issues: number;
  medium_issues: number;
  low_issues: number;
}

export interface AdminCategoryBreakdown {
  category: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  open: number;
  resolved: number;
}

export interface AdminIssue {
  id: string;
  user_id: string;
  repo_name: string;
  file_path: string;
  issue_type: string;
  severity: string;
  status: string;
  message: string;
  line_number: number | null;
  suggestion: string | null;
  created_at: string;
}

export interface AdminDashboardData {
  totalUsers: number;
  totalReviews: number;
  totalRepos: number;
  signupsToday: number;
  signups7d: number;
  signups30d: number;
  loginsToday: number;
  logins7d: number;
  logins30d: number;
  criticalIssues: number;
  mediumIssues: number;
  lowIssues: number;
  openIssues: number;
  resolvedIssues: number;
  reviewsByDay: { date: string; count: number }[];
  users: AdminUser[];
  repositories: AdminRepository[];
  categoryBreakdown: AdminCategoryBreakdown[];
  recentActivity: ActivityEntry[];
  settings: AdminSettings;
  billingSummary?: {
    mrrEstimate: number;
    activePaidSubscribers: number;
    freeSubscribers: number;
    basicSubscribers: number;
    startupSubscribers: number;
    enterpriseSubscribers: number;
  };
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/admin/dashboard`, { headers });
  if (!res.ok) throw new Error("Failed to fetch admin dashboard");
  return res.json();
}

export async function updateAdminSettings(
  settings: Partial<AdminSettings>
): Promise<AdminSettings> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/admin/settings`, {
    method: "PUT",
    headers,
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

// ---- Activity tracking (public, fire-and-forget) ----

export function logActivity(
  event_type: string,
  user_id?: string,
  email?: string
): void {
  fetch(`${BASE}/activity/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, email, event_type }),
  }).catch(() => {
    // silently fail — activity logging is non-critical
  });
}

// ---- Promo Code Management (admin only) ----

export interface PromoCode {
  id: string;
  code: string;
  plan: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_by: string;
  notes: string | null;
  created_at: string;
}

export interface PromoRedemption {
  id: string;
  user_id: string;
  code: string;
  plan_granted: string;
  redeemed_at: string;
  expires_at: string | null;
}

export async function fetchPromoCodes(): Promise<PromoCode[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/admin/promo-codes`, { headers });
  if (!res.ok) throw new Error("Failed to fetch promo codes");
  return res.json();
}

export async function createPromoCode(data: {
  code: string;
  plan: string;
  maxUses: number;
  expiresAt: string;
  notes: string;
}): Promise<PromoCode> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/admin/promo-codes`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create promo code");
  }
  return res.json();
}

export async function deletePromoCode(code: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/admin/promo-codes/${encodeURIComponent(code)}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to delete promo code");
}

export async function togglePromoCode(code: string, isActive: boolean): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/admin/promo-codes/${encodeURIComponent(code)}/toggle`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw new Error("Failed to toggle promo code");
}

export async function fetchPromoRedemptions(): Promise<PromoRedemption[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/admin/promo-redemptions`, { headers });
  if (!res.ok) throw new Error("Failed to fetch redemptions");
  return res.json();
}

// ---- AI Usage Monitoring ----

export interface AiUsageSummary {
  monthlyCostUsd: number;
  dailyCostUsd: number;
  totalRequests: number;
  totalTokens: number;
  budgetExceeded: boolean;
  monthlyBudgetUsd: number;
  dailyBudgetUsd: number;
  topUsers: { user_id: string; email?: string; total_cost: number; total_requests: number }[];
}

export async function fetchAiUsage(): Promise<AiUsageSummary> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/admin/ai-usage`, { headers });
  if (!res.ok) throw new Error("Failed to fetch AI usage");
  return res.json();
}
