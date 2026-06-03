import React, { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { StatsGrid } from "@/components/StatsGrid";
import { RiskChart, TrendChart } from "@/components/RiskChart";
import { IssuesTable } from "@/components/IssuesTable";
import { OnboardingTour } from "@/components/OnboardingTour";
import { motion, AnimatePresence } from "framer-motion";
import { GitCommit, Loader2, Activity, MessageSquare, Copy, Check, Star, ShieldAlert, BadgeInfo } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { fetchRepositories, fetchScanHistory, submitFeedback, Repository, ScanHistory } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Index = () => {
  const { data: issues = [], isLoading } = useReviews();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [scans, setScans] = useState<ScanHistory[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selectedRepoBadge, setSelectedRepoBadge] = useState<string>("");
  const [copiedBadge, setCopiedBadge] = useState(false);
  const { toast } = useToast();

  // Feedback widget state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature_request" | "satisfaction" | "general">("general");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [reposList, scansList] = await Promise.all([
          fetchRepositories(),
          fetchScanHistory()
        ]);
        setRepos(reposList);
        setScans(scansList);
        if (reposList.length > 0) {
          setSelectedRepoBadge(reposList[0].name);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoadingRepos(false);
      }
    }
    loadDashboardData();
  }, []);

  const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace("/api/v1", "");
  const badgeUrl = `${backendBase}/api/repositories/badge/${selectedRepoBadge}`;
  const badgeMarkdown = `[![Sentinel Security](${badgeUrl})](${window.location.origin}/leaderboard)`;

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopiedBadge(true);
    toast({
      title: "Copied!",
      description: "Markdown badge code copied to clipboard.",
    });
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setSubmittingFeedback(true);
    try {
      await submitFeedback({
        category: feedbackType,
        feedback: feedbackText,
        rating: feedbackRating,
        email: feedbackEmail
      });
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us make Sentinel better.",
      });
      setFeedbackText("");
      setFeedbackOpen(false);
    } catch (err) {
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const recentActivity = issues.slice(0, 5);

  return (
    <SidebarProvider>
      <OnboardingTour />
      <div className="min-h-screen flex w-full relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav title="Dashboard" subtitle="Overview of your security pipeline" />
          <main className="flex-1 overflow-auto p-3 sm:p-6 space-y-5 sm:space-y-6 bg-slate-950/20">
            
            {/* Stats Cards */}
            <StatsGrid />

            {/* Middle Section: Badge Copier & History */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              
              {/* README Badge Copier (5 cols) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="lg:col-span-5 rounded-2xl border border-slate-800/80 bg-slate-900/30 p-5 sm:p-6 backdrop-blur-md relative overflow-hidden"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <BadgeInfo className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">README Badge</h3>
                    <p className="text-xs text-slate-400">Embed live security grade in your repo</p>
                  </div>
                </div>

                {loadingRepos ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : repos.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Connect a repository to generate README integration badges.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Select Repository</label>
                      <Select value={selectedRepoBadge} onValueChange={setSelectedRepoBadge}>
                        <SelectTrigger className="bg-slate-950/60 border-slate-800 text-xs text-slate-200">
                          <SelectValue placeholder="Select repo" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          {repos.map((r) => (
                            <SelectItem key={r.name} value={r.name} className="text-xs text-slate-200 focus:bg-slate-800">
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedRepoBadge && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Live Preview</span>
                          <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900 flex justify-center">
                            <img
                              src={badgeUrl}
                              alt="Sentinel Badge"
                              onError={(e) => {
                                // Fallback image representation if local request fails
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Markdown Code</span>
                          <div className="relative">
                            <pre className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg text-[10px] text-slate-350 overflow-x-auto whitespace-pre font-mono">
                              {badgeMarkdown}
                            </pre>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleCopyBadge}
                              className="absolute right-2 top-2 h-7 w-7 text-slate-400 hover:text-white"
                            >
                              {copiedBadge ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Scan History list (7 cols) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="lg:col-span-7 rounded-2xl border border-slate-800/80 bg-slate-900/30 p-5 sm:p-6 backdrop-blur-md overflow-hidden"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Activity className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Scan Pipeline History</h3>
                    <p className="text-xs text-slate-400">Latest analysis audits completed</p>
                  </div>
                </div>

                {loadingRepos ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : scans.length === 0 ? (
                  <p className="text-xs text-slate-400 py-10 text-center">
                    No scans executed yet. Connect your first repository to run a scan.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {scans.slice(0, 5).map((scan) => {
                      let gradeColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
                      if (scan.security_grade.startsWith("B") || scan.security_grade.startsWith("C")) {
                        gradeColor = "text-amber-400 border-amber-500/20 bg-amber-500/5";
                      } else if (scan.security_grade.startsWith("D")) {
                        gradeColor = "text-rose-400 border-rose-500/20 bg-rose-500/5";
                      }
                      
                      return (
                        <div key={scan.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/30 border border-slate-900/60 hover:border-slate-800 transition-colors">
                          <div className="min-w-0 flex-1 pr-3">
                            <span className="text-xs font-bold text-slate-200 block truncate">{scan.repository_name}</span>
                            <span className="text-[10px] text-slate-500 truncate block mt-0.5 font-mono">
                              {scan.commit_message || "Manual Scan Trigger"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">
                              {formatDistanceToNow(new Date(scan.scan_date), { addSuffix: true })}
                            </span>
                            <Badge className={`font-bold px-2 py-0.5 rounded-full border ${gradeColor}`}>
                              {scan.security_grade}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

            </div>

            {/* Bottom charts/tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <RiskChart />
              <TrendChart />
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-card-foreground">Recent Commits Reviewed</h3>
                  <p className="text-xs text-muted-foreground">Latest commit logs scrutinized</p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No activity yet. Push a commit to get started!</p>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl p-3 hover:bg-primary/[0.03] transition-colors">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <GitCommit className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.repository}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap font-mono">
                        {item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true }) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <IssuesTable />
          </main>
        </div>

        {/* Floating Feedback Widget */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setFeedbackOpen(!feedbackOpen)}
            className="rounded-full h-12 w-12 bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center border border-indigo-400/20"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          <AnimatePresence>
            {feedbackOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-16 right-0 w-80 sm:w-96 rounded-2xl border border-slate-800/80 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md"
              >
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-indigo-400" /> Share Feedback
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Sentinel Beta</span>
                  </div>

                  <div className="space-y-3">
                    {/* Category Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                      <Select
                        value={feedbackType}
                        onValueChange={(val: any) => setFeedbackType(val)}
                      >
                        <SelectTrigger className="bg-slate-950/60 border-slate-800 text-xs text-slate-350">
                          <SelectValue placeholder="Feedback category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          <SelectItem value="bug" className="text-xs text-slate-200">Bug Report 🐛</SelectItem>
                          <SelectItem value="feature_request" className="text-xs text-slate-200">Feature Request 💡</SelectItem>
                          <SelectItem value="satisfaction" className="text-xs text-slate-200">User Survey 📊</SelectItem>
                          <SelectItem value="general" className="text-xs text-slate-200">General Feedback 💬</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Optional Star Rating */}
                    {feedbackType === "satisfaction" && (
                      <div className="space-y-1 text-center py-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rate your experience</label>
                        <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setFeedbackRating(star)}
                              className="text-amber-400 hover:scale-110 transition-transform"
                            >
                              <Star className={`h-6 w-6 ${feedbackRating >= star ? "fill-amber-400" : "text-slate-650"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Email (Optional)</label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={feedbackEmail}
                        onChange={(e) => setFeedbackEmail(e.target.value)}
                        className="bg-slate-950/60 border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500"
                      />
                    </div>

                    {/* Feedback message */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Your Message</label>
                      <Textarea
                        rows={3}
                        required
                        placeholder="What can we improve? Or describe the bug..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="bg-slate-950/60 border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500 resize-none"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingFeedback || !feedbackText.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20"
                  >
                    {submittingFeedback ? <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" /> : "Submit Feedback"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </SidebarProvider>
  );
};

export default Index;
