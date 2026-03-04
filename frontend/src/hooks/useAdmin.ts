import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminDashboard,
  fetchAdminSettings,
  updateAdminSettings,
  checkIsAdmin,
  type AdminSettings,
} from "@/lib/adminApi";

export function useAdminCheck() {
  return useQuery({
    queryKey: ["admin-check"],
    queryFn: checkIsAdmin,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
    refetchInterval: 30_000, // auto-refresh every 30s
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchAdminSettings,
    staleTime: 10_000,
  });
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<AdminSettings>) =>
      updateAdminSettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
}
