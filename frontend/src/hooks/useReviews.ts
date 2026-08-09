import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchReviews,
  fetchStats,
  fetchRepositories,
  fetchScanHistory,
  updateReviewStatus,
  connectRepository,
  disconnectRepository,
  scanRepository,
  submitFeedback,
  type ReviewRow,
} from "@/lib/api";
import type { Issue } from "@/data/mockData";

// ---------- helpers ----------

/** Map a Supabase row to the frontend Issue shape */
export function rowToIssue(r: ReviewRow): Issue {
  const severityMap: Record<string, Issue["severity"]> = {
    critical: "critical",
    high: "high",
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
    lineNumber: r.line_number,
    category: r.category,
    secureCode: r.secure_code,
    bestPractices: r.best_practices,
    aiModel: r.ai_model,
    confidenceScore: r.confidence_score,
    validationStatus: r.validation_status,
    engineVersion: r.engine_version,
  };
}

// ---------- hooks ----------

export function useReviews(repoFullName?: string) {
  return useQuery({
    queryKey: ["reviews", repoFullName || "all"],
    queryFn: () => fetchReviews(repoFullName),
    select: (rows) => rows.map(rowToIssue),
    refetchInterval: 15_000,
  });
}

export function useStats(repoFullName?: string) {
  return useQuery({
    queryKey: ["stats", repoFullName || "all"],
    queryFn: () => fetchStats(repoFullName),
    refetchInterval: 15_000,
  });
}

export function usePurgeReviews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repoFullName?: string) => purgeReviews(repoFullName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["scan-history"] });
    },
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

export function useScanHistory(repoFullName?: string) {
  return useQuery({
    queryKey: ["scan-history", repoFullName || "all"],
    queryFn: () => fetchScanHistory(repoFullName),
    refetchInterval: 30_000,
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

export function useScanRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repoFullName: string) => scanRepository(repoFullName),
    onSuccess: () => {
      // Invalidate after a short delay to allow scan to complete
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["repositories"] });
        qc.invalidateQueries({ queryKey: ["reviews"] });
        qc.invalidateQueries({ queryKey: ["stats"] });
      }, 5000);
    },
  });
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: "up" | "down" }) =>
      submitFeedback(id, rating),
  });
}
