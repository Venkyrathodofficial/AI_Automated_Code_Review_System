import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchReviews,
  fetchStats,
  fetchRepositories,
  updateReviewStatus,
  connectRepository,
  disconnectRepository,
  type ReviewRow,
} from "@/lib/api";
import type { Issue } from "@/data/mockData";

// ---------- helpers ----------

/** Map a Supabase row to the frontend Issue shape */
export function rowToIssue(r: ReviewRow): Issue {
  const severityMap: Record<string, Issue["severity"]> = {
    critical: "critical",
    medium: "medium",
    low: "low",
  };
  const statusMap: Record<string, Issue["status"]> = {
    open: "open",
    resolved: "resolved",
  };

  return {
    id: String(r.id),
    repository: r.repository_name,
    fileName: r.file_name,
    title: r.issue_title,
    severity: severityMap[r.severity?.toLowerCase()] ?? "low",
    status: statusMap[r.status?.toLowerCase()] ?? "open",
    date: r.created_at ? r.created_at.slice(0, 10) : "",
    description: r.issue_description,
    suggestedFix: r.suggestion,
    optimizationTip: r.optimization_tip,
    commitMessage: r.commit_message,
    commitId: r.commit_id,
  };
}

// ---------- hooks ----------

export function useReviews() {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: fetchReviews,
    select: (rows) => rows.map(rowToIssue),
    refetchInterval: 15_000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 15_000,
  });
}

export function useToggleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateReviewStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useRepositories() {
  return useQuery({
    queryKey: ["repositories"],
    queryFn: fetchRepositories,
    refetchInterval: 15_000,
  });
}

export function useConnectRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repoFullName: string) => connectRepository(repoFullName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repositories"] });
    },
  });
}

export function useDisconnectRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repoFullName: string) => disconnectRepository(repoFullName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repositories"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
