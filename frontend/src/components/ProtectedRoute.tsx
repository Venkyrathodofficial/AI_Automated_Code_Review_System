import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SentinelLockLoader } from "@/components/SentinelLockLoader";
import { MaintenanceOverlay } from "@/components/MaintenanceOverlay";
import { NoticeBanner } from "@/components/NoticeBanner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SentinelLockLoader
        message="Loading protected workspace..."
        subMessage="Validating active cryptographic session & tenant policies"
      />
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <MaintenanceOverlay />
      <NoticeBanner />
      {children}
    </>
  );
}
