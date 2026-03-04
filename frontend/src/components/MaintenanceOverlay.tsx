import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Construction, ShieldCheck, X } from "lucide-react";
import { useAdminSettings, useAdminCheck } from "@/hooks/useAdmin";

/**
 * Popup shown to non-admin users when maintenance mode is ON.
 * Admins never see this. Users can dismiss but features remain blocked.
 */
export function MaintenanceOverlay() {
  const { data: settings } = useAdminSettings();
  const { data: adminCheck } = useAdminCheck();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if maintenance is off, user is admin, or popup was dismissed
  if (!settings?.maintenance_mode || adminCheck?.isAdmin || dismissed) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[2px]" onClick={() => setDismissed(true)} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <Construction className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>

          <h2 className="text-lg font-extrabold text-foreground">Under Maintenance</h2>

          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {settings.maintenance_message ||
              "We are currently performing scheduled maintenance. Please check back shortly."}
          </p>

          <p className="mt-4 text-[11px] text-muted-foreground/70">
            Some features may be temporarily unavailable.
          </p>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold">CodeAurora Sentinel AI</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
