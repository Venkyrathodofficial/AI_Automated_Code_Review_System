import { motion } from "framer-motion";
import { Construction, ShieldCheck } from "lucide-react";
import { useAdminSettings } from "@/hooks/useAdmin";

/**
 * Full-screen overlay shown when maintenance mode is ON.
 * Renders on top of all user-facing pages (not admin panel).
 */
export function MaintenanceOverlay() {
  const { data: settings } = useAdminSettings();

  if (!settings?.maintenance_mode) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md"
    >
      <div className="text-center px-6 max-w-lg">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 dark:bg-amber-900/30"
        >
          <Construction className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </motion.div>

        <motion.h1
          className="text-2xl sm:text-3xl font-extrabold text-foreground"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Under Maintenance
        </motion.h1>

        <motion.p
          className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {settings.maintenance_message ||
            "We are currently performing scheduled maintenance. Please check back shortly."}
        </motion.p>

        <motion.div
          className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="font-semibold">CodeAurora Sentinel AI</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
