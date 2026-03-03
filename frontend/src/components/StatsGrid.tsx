import { motion } from "framer-motion";
import { FileSearch, AlertTriangle, AlertCircle, Info, TrendingDown, TrendingUp, LucideIcon, Loader2 } from "lucide-react";
import { useStats } from "@/hooks/useReviews";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: "default" | "critical" | "warning" | "success";
  change: string;
  trending: "up" | "down";
  delay?: number;
}

const iconStyles = {
  default: "bg-primary/10 text-primary",
  critical: "bg-critical/10 text-critical",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

export function StatCard({ title, value, icon: Icon, variant, change, trending, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-card-foreground">{value.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1">
            {trending === "down" ? (
              <TrendingDown className="h-3 w-3 text-success" />
            ) : (
              <TrendingUp className="h-3 w-3 text-critical" />
            )}
            <span className={`text-[11px] font-medium ${trending === "down" ? "text-success" : "text-critical"}`}>
              {change}
            </span>
            <span className="text-[11px] text-muted-foreground">vs last week</span>
          </div>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconStyles[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

export function StatsGrid() {
  const { data, isLoading } = useStats();

  const stats: StatCardProps[] = [
    { title: "Total Reviews", value: data?.totalReviews ?? 0, icon: FileSearch, variant: "default", change: "live", trending: "up" },
    { title: "Critical Issues", value: data?.critical ?? 0, icon: AlertTriangle, variant: "critical", change: "live", trending: "down" },
    { title: "Medium Issues", value: data?.medium ?? 0, icon: AlertCircle, variant: "warning", change: "live", trending: "up" },
    { title: "Low Issues", value: data?.low ?? 0, icon: Info, variant: "success", change: "live", trending: "down" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.title} {...stat} delay={i * 0.08} />
      ))}
    </div>
  );
}
