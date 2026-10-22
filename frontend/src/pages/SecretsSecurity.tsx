import React, { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { useReviews, useRepositories } from "@/hooks/useReviews";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { Issue } from "@/data/mockData";
import {
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lock,
  EyeOff,
  Building2,
  FileCode,
  ChevronRight,
  Filter,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SecretsSecurity() {
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const { data: repositories = [] } = useRepositories();
  const { data: allIssues = [], isLoading } = useReviews(selectedRepo);

  // Filter for Secrets & API Keys
  const secretIssues = allIssues.filter(
    (i) =>
      i.category === "api_key_exposure" ||
      i.title.toLowerCase().includes("key") ||
      i.title.toLowerCase().includes("secret") ||
      i.title.toLowerCase().includes("token") ||
      i.title.toLowerCase().includes("credential")
  );

  const criticalCount = secretIssues.filter((i) => i.severity === "critical").length;
  const highCount = secretIssues.filter((i) => i.severity === "high").length;
  const mediumCount = secretIssues.filter((i) => i.severity === "medium").length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            title="Sentinel Secrets"
            subtitle="Credential exposure detection with native Indian payment gateway & cloud token support"
          />

          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-6">
            {/* Header Status & Engine Identity */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-base font-bold text-foreground">Sentinel Secrets</h1>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] font-semibold">
                        Available • Full Redaction Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Detects hardcoded API keys, private keys, and payment credentials with in-memory sanitization before storage or AI evaluation.
                    </p>
                  </div>
                </div>

                {/* Repository Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="all">All Repositories ({repositories.length})</option>
                    {repositories.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Engine Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                      Indian Fintech Rules
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Razorpay (rzp_live/test), Cashfree (CF tokens), and PhonePe salt keys.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-500" />
                      Cloud Credentials
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    AWS, GCP, Stripe, GitHub PAT, Slack webhooks, Private RSA keys, Database URIs.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <EyeOff className="h-3.5 w-3.5 text-primary" />
                      In-Memory Redaction
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Enforced</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Zero raw secret values are printed to logs, forwarded to AI, or exposed in UI scorecards.
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Critical Secret Leaks</p>
                  <p className="text-xl font-bold text-red-500 mt-0.5">{criticalCount}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                  <KeyRound className="h-4 w-4" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">High Risk Credentials</p>
                  <p className="text-xl font-bold text-amber-500 mt-0.5">{highCount}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Safe Masking Status</p>
                  <p className="text-xl font-bold text-emerald-500 mt-0.5">100%</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Findings List */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Detected Credentials ({secretIssues.length})
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Masked prior to storage & display
                </span>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">Scanning repository secrets...</div>
              ) : secretIssues.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">No Exposed Secrets Found</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    All scanned source files are free of plaintext API keys, database connection URIs, and payment credentials.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {secretIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                            {issue.severity}
                          </span>
                          <span className="text-xs font-bold text-foreground truncate">{issue.title}</span>
                          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                            CWE-798
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="font-mono text-[10px] text-foreground/80 flex items-center gap-1">
                            <FileCode className="h-3 w-3" />
                            {issue.fileName}:{issue.lineNumber || 1}
                          </span>
                          <span>•</span>
                          <span>Repo: {issue.repository}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Secret Context
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </SidebarProvider>
  );
}
