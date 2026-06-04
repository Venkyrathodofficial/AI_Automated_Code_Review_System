import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { StatsGrid } from "@/components/StatsGrid";
import { RiskChart, TrendChart } from "@/components/RiskChart";
import { OnboardingTour } from "@/components/OnboardingTour";
import { motion } from "framer-motion";
import { GitCommit, Loader2, Activity, Sparkles, ArrowUpRight, ChevronRight, Shield, ShieldCheck } from "lucide-react";
import { useReviews, useScanHistory } from "@/hooks/useReviews";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { Issue } from "@/data/mockData";
import { buildRecommendedSecurityActions, calculatePotentialSecurityGain } from "@/lib/security";

const Index = () => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const { data: issues = [], isLoading } = useReviews();
  const { data: scanHistory = [] } = useScanHistory();
  const recentActivity = issues.slice(0, 5);
  const previousScan = scanHistory[1];

  // Action Center Calculations
  const openIssues = issues.filter(i => i.status === "open");
  const openCritical = openIssues.filter((i) => i.severity === "critical").length;
  const openHigh = openIssues.filter((i) => i.severity === "high").length;
  const openMed = openIssues.filter((i) => i.severity === "medium").length;
  const openLow = openIssues.filter((i) => i.severity === "low").length;

  // Calculate current score based on open issues (same logic as backend)
  const penalty = openCritical * 15 + openHigh * 8 + openMed * 4 + openLow * 1;
  const currentScore = Math.max(0, 100 - penalty);
  const potentialSecurityGain = calculatePotentialSecurityGain({ critical: openCritical, high: openHigh, medium: openMed, low: openLow });
  const openFixCount = openIssues.filter((issue) => issue.suggestedFix && issue.suggestedFix.trim().length > 0).length;

  // Take top priority risks for Action Center recommended fixes
  const topFixes = buildRecommendedSecurityActions(issues, 3);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav title="Dashboard" subtitle="Overview of your code review pipeline" />
          <main className="flex-1 overflow-auto p-3 sm:p-6 bg-background space-y-5 sm:space-y-6">
            <OnboardingTour />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-card-foreground">Security Intelligence Overview</h3>
                  <p className="text-xs text-muted-foreground mt-1">A single view for score, risk, recommended fixes, and improvement potential.</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-primary/10 bg-primary/5 px-3 py-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Zero Human Code Access</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-secondary/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What you get</p>
                  <p className="mt-1 text-sm font-medium text-card-foreground">One score, one grade, one risk level.</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Focus first</p>
                  <p className="mt-1 text-sm font-medium text-card-foreground">Fix the highest-risk findings first.</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI support</p>
                  <p className="mt-1 text-sm font-medium text-card-foreground">Gemini shows impact and remediation steps.</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Improvement potential</p>
                  <p className="mt-1 text-sm font-medium text-emerald-600">Up to +{potentialSecurityGain} score gain</p>
                </div>
              </div>
            </motion.div>
            
            <StatsGrid />

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
                    <h3 className="text-sm font-bold text-card-foreground">Recommended Security Actions</h3>
                    <p className="text-xs text-muted-foreground">Automated prioritization and fixes for the highest-impact risks</p>
                  </div>
                </div>

                {potentialSecurityGain > 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold animate-pulse">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>POTENTIAL SECURITY GAIN</span>
                    <span className="font-bold">+{potentialSecurityGain}</span>
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
                      key={fix.sourceIssue.id}
                      className="group flex flex-col justify-between p-4 rounded-xl border border-border/85 bg-secondary/15 hover:bg-secondary/35 dark:hover:bg-muted/30 hover:border-primary/20 transition-all duration-200"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">PRIORITY {fix.rank}</span>
                          <span className={`text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5 ${
                            fix.priority === "Critical" ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400" :
                            fix.priority === "High" ? "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400" :
                            "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                          }`}>
                            {fix.priority}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">{fix.title}</h4>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{fix.fileName}</p>
                        <p className="text-[10px] text-muted-foreground">Impact: {fix.estimatedImpact}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Expected Gain: {fix.expectedScoreGain}</span>
                        <button 
                          onClick={() => setSelectedIssue(fix.sourceIssue)}
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
                <RiskChart />
              </div>
              <div className="lg:col-span-2">
                <TrendChart />
              </div>
            </motion.div>

            {/* Recent Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2.5 mb-5 sm:mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-card-foreground">Recent Activity</h3>
                  <p className="text-xs text-muted-foreground">Latest events across your security reviews pipeline</p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No scan activity found yet.</p>
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
