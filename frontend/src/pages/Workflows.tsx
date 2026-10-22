import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { useRepositories } from "@/hooks/useReviews";
import {
  GitPullRequest,
  CheckCircle2,
  GitCommit,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Radio,
  FileCheck2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Workflows() {
  const { data: repositories = [], isLoading } = useRepositories();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            title="Sentinel Workflows"
            subtitle="Developer git integrations, pull request verification gates & CI/CD commit checks"
          />

          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-6">
            {/* Header Status & Engine Identity */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <GitPullRequest className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-foreground">Pull Requests & CI/CD</h1>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] font-semibold">
                      Available • Automated PR Check-Runs
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Inspects code deltas on pull request creation, comments on security findings, and posts commit status checks.
                  </p>
                </div>
              </div>

              {/* Workflow Pipeline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-emerald-500" />
                      Webhook Event Listener
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Accepts GitHub <code className="text-[10px]">pull_request</code> and <code className="text-[10px]">push</code> events with HMAC SHA-256 signature enforcement.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5 text-emerald-500" />
                      PR Delta Scanning
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Only analyzes files changed in the PR delta, ensuring sub-10 second check turnaround times.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Commit Check-Run Gate
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Sets <code className="text-[10px]">sentinel/verification</code> commit checks to PASS, WARN, or BLOCK on GitHub.
                  </p>
                </div>
              </div>
            </div>

            {/* Connected Repositories for Workflows */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Connected Repositories ({repositories.length})
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  CI/CD Automation Active
                </span>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">Loading repositories...</div>
              ) : repositories.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <GitBranch className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs font-semibold text-foreground">No Repositories Connected</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Connect a repository from the Projects tab to enable automated PR checks and push scans.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {repositories.map((repo) => (
                    <div key={repo.name} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{repo.name}</span>
                          <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                            PR Checks Active
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>Security Score: {repo.healthScore ?? 100}%</span>
                          <span>•</span>
                          <span>Grade: {repo.security_grade || "A"}</span>
                          <span>•</span>
                          <span>Files: {repo.filesReviewed}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://github.com/${repo.name}/pulls`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors"
                        >
                          <span>View PRs on GitHub</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
