import { X, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useAdminSettings } from "@/hooks/useAdmin";

/**
 * A dismissible banner shown at the top inside the user dashboard area
 * when an admin has published a notice.
 */
export function NoticeBanner() {
  const { data: settings } = useAdminSettings();
  const [dismissed, setDismissed] = useState(false);

  if (!settings?.notice_enabled || !settings.notice_message || dismissed) return null;

  const type = settings.notice_type || "info";

  const styles: Record<string, { bg: string; icon: React.ElementType; iconColor: string }> = {
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
      icon: Info,
      iconColor: "text-blue-500",
    },
    warning: {
      bg: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
    },
    critical: {
      bg: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
      icon: AlertCircle,
      iconColor: "text-red-500",
    },
  };

  const s = styles[type] || styles.info;
  const Icon = s.icon;

  return (
    <div className={`flex items-center gap-3 border-b px-4 sm:px-6 py-2.5 text-xs font-medium ${s.bg}`}>
      <Icon className={`h-4 w-4 flex-shrink-0 ${s.iconColor}`} />
      <span className="flex-1">{settings.notice_message}</span>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss notice"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
