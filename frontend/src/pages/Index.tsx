import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { StatsGrid } from "@/components/StatsGrid";
import { RiskChart, TrendChart } from "@/components/RiskChart";
import { OnboardingTour } from "@/components/OnboardingTour";
import { motion } from "framer-motion";
import { GitCommit, Loader2, Activity, Sparkles, ArrowUpRight, ChevronRight, Shield, RefreshCw, Trash2, Filter } from "lucide-react";
import { useReviews, useRepositories, usePurgeReviews } from "@/hooks/useReviews";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { Issue } from "@/data/mockData";
import { toast } from "sonner";

const Index = () => {
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  const { data: repositories = [] } = useRepositories();
  const { data: issues = [], isLoading, refetch, isRefetching } = useReviews(selectedRepo);
  const purgeMutation = usePurgeReviews();

  const recentActivity = issues.slice(0, 5);

  // Action Center Calculations
  const openIssues = issues.filter(i => i.status === "open");

  // Sort open issues by severity priority: critical, high, medium, low
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedRisks = [...openIssues].sort((a, b) => {
    const aOrder = severityOrder[a.severity] || 0;
    const bOrder = severityOrder[b.severity] || 0;
    return bOrder - aOrder;
  });

  // Calculate current score based on open issues (same logic as backend)
  const openCrit = openIssues.filter((i) => i.severity === "critical").length;
  const openHigh = openIssues.filter((i) => i.severity === "high").length;
  const openMed = openIssues.filter((i) => i.severity === "medium").length;
  const openLow = openIssues.filter((i) => i.severity === "low").length;
  const penalty = openCrit * 25 + openHigh * 15 + openMed * 8 + openLow * 2;
  const currentScore = Math.max(0, 100 - penalty);

  const expectedImprovement = 100 - currentScore;

  // Take top 3 priority risks for Action Center recommended fixes
  const topFixes = sortedRisks.slice(0, 3).map((issue, idx) => {
    let boost = 2;
    if (issue.severity === "critical") boost = 25;
    else if (issue.severity === "high") boost = 15;
    else if (issue.severity === "medium") boost = 8;
    return {
      id: issue.id,
      priority: idx + 1,
      title: issue.title,
      fileName: issue.fileName,
      severity: issue.severity,
      boost: `+${boost}% Score Boost`,
      originalIssue: issue,
    };
  });

  const handlePurge = async () => {
    const repoLabel = selectedRepo === "all" ? "ALL repositories" : selectedRepo;
    if (!window.confirm(`Are you sure you want to clear scan issues for ${repoLabel}? This will remove old accumulated test data.`)) {
      return;
    }

    try {
      setIsPurging(true);
      await purgeMutation.mutateAsync(selectedRepo);
      toast.success(`Successfully cleared scan issues for ${repoLabel}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to purge scan data");
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav title="Dashboard" subtitle="Overview of your code review pipeline" />
          <main className="flex-1 overflow-auto p-3 sm:p-6 bg-background space-y-5 sm:space-y-6">
            <OnboardingTour />
            
            {/* Dashboard Header Bar — Repository Filter & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Filter className="h-4 w-4" />
                </div>
                <div>
                  <label htmlFor="repo-select" className="text-xs font-bold text-card-foreground block">
                    Filter Dashboard by Repository
                  </label>
                  <p className="text-[11px] text-muted-foreground">Select a repository to scope security score and issues</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  id="repo-select"
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="h-9 px-3 text-xs font-semibold rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">🌐 All Repositories ({repositories.length})</option>
                  {repositories.map((repo) => (
                    <option key={repo.name} value={repo.name}>
                      📦 {repo.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  className="flex items-center gap-1.5 px-3 h-9 text-xs font-semibold rounded-xl border border-border bg-background hover:bg-accent text-foreground transition-colors disabled:opacity-50"
                  title="Refresh Live Data"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin text-primary" : ""}`} />
                  <span>{isRefetching ? "Refreshing..." : "Refresh"}</span>
                </button>

                <button
                  onClick={handlePurge}
                  disabled={isPurging}
                  className="flex items-center gap-1.5 px-3 h-9 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100/60 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  title="Clear accumulated test scan data"
                >
                  {isPurging ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>Clear Test Data</span>
                </button>
              </div>
            </div>

            <StatsGrid selectedRepo={selectedRepo} />

            {/* Action Center Section */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-card-foreground">Action Center</h3>
                    <p className="text-xs text-muted-foreground">Automated prioritization and fixes for top security risks</p>
                  </div>
                </div>

                {expectedImprovement > 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold animate-pulse">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>EXPECTED SCORE IMPROVEMENT</span>
                    <span className="font-bold">+{expectedImprovement}% Boost</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    <Shield className="h-3.5 w-3.5" />
                    <span>SECURE AND PROTECTED</span>
                  </div>
                )}
              </div>

              {topFixes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topFixes.map((fix) => (
                    <div 
                      key={fix.id}
                      className="group flex flex-col justify-between p-4 rounded-xl border border-border/85 bg-secondary/15 hover:bg-secondary/35 dark:hover:bg-muted/30 hover:border-primary/20 transition-all duration-200"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">PRIORITY {fix.priority}</span>
                          <span className={`text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5 ${
                            fix.severity === "critical" ? "bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400" :
                            fix.severity === "high" ? "bg-orange-50 text-orange-655 dark:bg-orange-950/20 dark:text-orange-400" :
                            "bg-amber-50 text-amber-655 dark:bg-amber-950/20 dark:text-amber-400"
                          }`}>
                            {fix.severity}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">{fix.title}</h4>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{fix.fileName}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{fix.boost}</span>
                        <button 
                          onClick={() => setSelectedIssue(fix.originalIssue)}
                          className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors"
                        >
                          <span>Review Fix</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/10 rounded-2xl border border-dashed border-border">
                  <Shield className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-card-foreground">No critical risks detected</p>
                  <p className="text-xs text-muted-foreground max-w-sm mt-0.5">Your connected repositories are secure. Keep up the good work!</p>
                </div>
              )}
            </motion.div>

            {/* Risk and Trend Charts */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6"
            >
              <div className="lg:col-span-1">
                <RiskChart selectedRepo={selectedRepo} />
              </div>
              <div className="lg:col-span-2">
                <TrendChart selectedRepo={selectedRepo} />
              </div>
            </motion.div>

            {/* Recent Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-card-foreground">Recent Activity</h3>
                    <p className="text-xs text-muted-foreground">Latest events across your security reviews pipeline</p>
                  </div>
                </div>
                {selectedRepo !== "all" && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground font-mono">
                    {selectedRepo}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No scan activity found yet for this selection.</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/20 transition-colors border border-transparent hover:border-border/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary flex-shrink-0">
                          <GitCommit className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-card-foreground truncate">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{item.repository} • {item.fileName}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true }) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Zero Human Code Access platform disclaimer */}
            <footer className="text-center pt-8 pb-4 text-[10px] sm:text-xs text-muted-foreground border-t border-border/60">
              🛡️ CodeAurora Sentinel follows a Zero Human Code Access architecture. Repository analysis is automated and administrators cannot view source code, secrets, or business logic.
            </footer>
          </main>
        </div>
      </div>

      <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </SidebarProvider>
  );
};

export default Index;
