// ============================================
// Admin API Service
// ============================================

import { supabase } from "@/lib/supabase";

const BASE = import.meta.env.VITE_API_URL || "/api";

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
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmed: boolean;
  provider: string;
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
  recentActivity: ActivityEntry[];
  settings: AdminSettings;
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
