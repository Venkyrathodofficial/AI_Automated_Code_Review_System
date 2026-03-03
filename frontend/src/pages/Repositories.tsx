import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitFork,
  AlertTriangle,
  Clock,
  ExternalLink,
  Loader2,
  FileCode2,
  Plus,
  X,
  Copy,
  Check,
  Trash2,
  Webhook,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useRepositories, useConnectRepo, useDisconnectRepo, useScanRepo } from "@/hooks/useReviews";
import { formatDistanceToNow } from "date-fns";
import type { ConnectRepoResult } from "@/lib/api";

const getHealthColor = (score: number) => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const getHealthBg = (score: number) => {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-critical";
};

const Repositories = () => {
  const { data: repositories = [], isLoading } = useRepositories();
  const connectMutation = useConnectRepo();
  const disconnectMutation = useDisconnectRepo();
  const scanMutation = useScanRepo();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [webhookResult, setWebhookResult] = useState<ConnectRepoResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [scanning, setScanning] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;
    const parsed = repoInput.trim()
      .replace(/^https?:\/\/(www\.)?github\.com\//, "")
      .replace(/\.git$/, "")
      .replace(/\/$/, "");
    try {
      const result = await connectMutation.mutateAsync(parsed);
      setWebhookResult(result);
    } catch {
      // error is in connectMutation.error
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDisconnect = async (repoName: string) => {
    setDisconnecting(repoName);
    try {
      await disconnectMutation.mutateAsync(repoName);
    } finally {
      setDisconnecting(null);
    }
  };

  const handleScan = async (repoName: string) => {
    setScanning(repoName);
    try {
      await scanMutation.mutateAsync(repoName);
    } finally {
      setTimeout(() => setScanning(null), 3000);
    }
  };

  const closeModal = () => {
    setShowConnectModal(false);
    setRepoInput("");
    setWebhookResult(null);
    connectMutation.reset();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav title="Repositories" subtitle="Manage your connected repositories" />
          <main className="flex-1 overflow-auto p-3 sm:p-6 bg-background">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Loading..." : `${repositories.length} repositor${repositories.length === 1 ? "y" : "ies"} connected`}
                </p>
              </div>
              <Button size="sm" className="h-9 text-xs w-full sm:w-auto rounded-xl gap-1.5" onClick={() => setShowConnectModal(true)}>
                <Plus className="h-3.5 w-3.5" />
                Connect Repository
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
              </div>
            ) : repositories.length === 0 ? (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                  <GitFork className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">No repositories connected</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Connect a GitHub repository to start receiving automated code reviews on every push.
                </p>
                <Button onClick={() => setShowConnectModal(true)} className="rounded-xl h-10">
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Your First Repository
                </Button>
              </motion.div>
            ) : (
              /* Repository Cards */
              <div className="grid grid-cols-1 gap-4">
                {repositories.map((repo, i) => {
                  const totalIssues = repo.critical + repo.medium + repo.low;
                  const statusLabel = repo.open > 0 ? "active" : "clean";
                  const repoShort = repo.name.includes("/") ? repo.name.split("/").pop()! : repo.name;
                  const lastReview = repo.lastReviewDate
                    ? formatDistanceToNow(new Date(repo.lastReviewDate), { addSuffix: true })
                    : "never";

                  return (
                    <motion.div
                      key={repo.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                      className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                              <GitFork className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-card-foreground">{repoShort}</h3>
                                <Badge variant="outline" className={`text-[10px] h-5 capitalize rounded-lg ${statusLabel === "clean" ? "border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20" : "border-primary/30 text-primary bg-primary/5"}`}>
                                  {statusLabel}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{repo.name}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <FileCode2 className="h-3.5 w-3.5" />
                              {repo.filesReviewed} file{repo.filesReviewed !== 1 ? "s" : ""} reviewed
                            </span>
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {totalIssues} issue{totalIssues !== 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              Last reviewed {lastReview}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-start gap-4 sm:gap-6 sm:ml-6">
                          {/* Health Score */}
                          <div className="text-center min-w-[80px]">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Health</p>
                            <p className={`text-xl font-extrabold ${getHealthColor(repo.healthScore)}`}>{repo.healthScore}%</p>
                            <Progress value={repo.healthScore} className={`h-1.5 mt-1.5 rounded-full [&>div]:${getHealthBg(repo.healthScore)}`} />
                          </div>

                          {/* Issues breakdown */}
                          <div className="flex items-center gap-2">
                            <div className="text-center px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/10">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Crit</p>
                              <p className="text-sm font-bold text-red-600 dark:text-red-400">{repo.critical}</p>
                            </div>
                            <div className="text-center px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Med</p>
                              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{repo.medium}</p>
                            </div>
                            <div className="text-center px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Low</p>
                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{repo.low}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-primary hover:text-primary hover:bg-primary/10 rounded-xl"
                              onClick={() => handleScan(repo.name)}
                              disabled={scanning === repo.name}
                              title="Re-scan repository"
                            >
                              {scanning === repo.name ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-secondary rounded-xl"
                              onClick={() => window.open(`https://github.com/${repo.name}`, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                              onClick={() => handleDisconnect(repo.name)}
                              disabled={disconnecting === repo.name}
                            >
                              {disconnecting === repo.name ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Connect Repository Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <GitFork className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      {webhookResult ? "Webhook Setup" : "Connect Repository"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {webhookResult
                        ? "Configure the webhook in your GitHub repo"
                        : "Enter your GitHub repository name"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-5">
                {!webhookResult ? (
                  /* Step 1: Enter repo name */
                  <form onSubmit={handleConnect} className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Repository (owner/repo)</Label>
                      <Input
                        placeholder="e.g. octocat/hello-world"
                        className="mt-1.5 h-10 text-sm font-mono rounded-xl"
                        value={repoInput}
                        onChange={(e) => setRepoInput(e.target.value)}
                        required
                      />
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        Enter the full repository name as it appears on GitHub.
                      </p>
                    </div>

                    {connectMutation.isError && (
                      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-3 flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        {(connectMutation.error as Error)?.message || "Failed to connect"}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-10 text-sm rounded-xl"
                      disabled={connectMutation.isPending || !repoInput.includes("/")}
                    >
                      {connectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      Connect & Get Webhook URL
                    </Button>
                  </form>
                ) : (
                  /* Step 2: Webhook instructions */
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-3">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <p className="text-xs font-medium">
                        Repository connected! Now set up the webhook in GitHub.
                      </p>
                    </div>

                    {/* Webhook URL */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Webhook URL</Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Input
                          readOnly
                          value={webhookResult.webhook.url}
                          className="h-9 text-xs font-mono flex-1 rounded-xl"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 rounded-xl"
                          onClick={() => handleCopy(webhookResult.webhook.url, "url")}
                        >
                          {copiedField === "url" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Webhook Secret */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Webhook Secret</Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Input
                          readOnly
                          value={webhookResult.webhook.secret}
                          className="h-9 text-xs font-mono flex-1 rounded-xl"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 rounded-xl"
                          onClick={() => handleCopy(webhookResult.webhook.secret, "secret")}
                        >
                          {copiedField === "secret" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Step-by-step instructions */}
                    <div className="rounded-xl border border-border bg-secondary/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Webhook className="h-4 w-4 text-primary" />
                        <p className="text-xs font-bold text-foreground">Setup Instructions</p>
                      </div>
                      <ol className="space-y-2.5">
                        {webhookResult.webhook.instructions.map((step, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{step.replace(/^\d+\.\s*/, "")}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <Button className="w-full h-10 text-sm rounded-xl" onClick={closeModal}>
                      <Check className="h-4 w-4 mr-2" />
                      Done
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SidebarProvider>
  );
};

export default Repositories;
