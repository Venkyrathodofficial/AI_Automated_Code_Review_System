import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ArrowUpRight, 
  LucideIcon, 
  Loader2, 
  Shield, 
  AlertOctagon, 
  Sparkles 
} from "lucide-react";
import { useStats } from "@/hooks/useReviews";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant: "primary" | "critical" | "high" | "warning" | "success" | "violet";
  subtitle: string;
  delay?: number;
}

function StatCard({ title, value, icon: Icon, variant, subtitle, delay = 0 }: StatCardProps) {
  const variantStyles = {
    primary: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg shadow-primary/20",
    critical: "bg-card border-border hover:border-red-500/30 dark:hover:border-red-500/20",
    high: "bg-card border-border hover:border-orange-500/30 dark:hover:border-orange-500/20",
    warning: "bg-card border-border hover:border-amber-500/30 dark:hover:border-amber-500/20",
    success: "bg-card border-border hover:border-emerald-500/30 dark:hover:border-emerald-500/20",
    violet: "bg-card border-border hover:border-violet-500/30 dark:hover:border-violet-500/20",
  };

  const iconStyles = {
    primary: "bg-primary-foreground/15 text-primary-foreground",
    critical: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
    high: "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400",
    warning: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
    success: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400",
  };

  const isPrimary = variant === "primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`rounded-2xl p-5 border transition-all duration-300 backdrop-blur-sm relative overflow-hidden group ${variantStyles[variant]}`}
    >
      {!isPrimary && (
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3 flex-1">
          <p className={`text-[10px] font-bold tracking-wider uppercase ${isPrimary ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{title}</p>
          <p className={`text-2xl font-extrabold tracking-tight ${isPrimary ? "text-primary-foreground" : "text-card-foreground"}`}>
            {value}
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <div className={`flex h-4.5 w-4.5 items-center justify-center rounded-full ${
              isPrimary ? "bg-primary-foreground/20" : "bg-primary/5"
            }`}>
              <ArrowUpRight className={`h-3 w-3 ${isPrimary ? "text-primary-foreground" : "text-primary"}`} />
            </div>
            <span className={`text-[10px] font-medium ${isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              {subtitle}
            </span>
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 duration-300 ${iconStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

export function StatsGrid() {
  const { data, isLoading } = useStats();

  const score = data?.securityScore ?? 100;
  const scoreVariant = score >= 90 ? "success" : score >= 70 ? "warning" : "critical";

  const stats: StatCardProps[] = [
    { title: "Security Score", value: `${score}%`, icon: Shield, variant: scoreVariant, subtitle: "Overall repository health" },
    { title: "Critical Issues", value: data?.critical ?? 0, icon: AlertOctagon, variant: "critical", subtitle: "Requires immediate fix" },
    { title: "High Issues", value: data?.high ?? 0, icon: AlertTriangle, variant: "high", subtitle: "High risk vulnerabilities" },
    { title: "Medium Issues", value: data?.medium ?? 0, icon: AlertCircle, variant: "warning", subtitle: "Quality & best practices" },
    { title: "Low Issues", value: data?.low ?? 0, icon: Info, variant: "success", subtitle: "Minor code optimizations" },
    { title: "AI Fixes Available", value: data?.fixesAvailable ?? 0, icon: Sparkles, variant: "violet", subtitle: "One-click commits ready" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, i) => (
        <StatCard key={stat.title} {...stat} delay={i * 0.05} />
      ))}
    </div>
  );
}

export { StatCard };
