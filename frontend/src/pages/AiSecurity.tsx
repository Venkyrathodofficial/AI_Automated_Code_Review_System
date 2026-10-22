import React, { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { useReviews, useRepositories } from "@/hooks/useReviews";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { Issue } from "@/data/mockData";
import {
  Sparkles,
  CheckCircle2,
  Shield,
  Lock,
  Cpu,
  Brain,
  ChevronRight,
  Filter,
  FileCode,
  Wand2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AiSecurity() {
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const { data: repositories = [] } = useRepositories();
  const { data: allIssues = [], isLoading } = useReviews(selectedRepo);

  // Issues that have AI verification or AI fix suggestions
  const aiEnrichedIssues = allIssues.filter(
    (i) => i.aiModel || (i.suggestedFix && i.suggestedFix.trim() !== "")
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            title="Sentinel AI"
            subtitle="Intelligent false-positive suppression, context reasoning & automated remediation"
          />

          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-6">
            {/* Header Status & Engine Identity */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-base font-bold text-foreground">Sentinel AI</h1>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] font-semibold">
                        Available • Hardened Pipeline
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Powered by Google Gemini 2.5 Flash with XML boundary isolation, deterministic secret guardrails, and secure fix validation.
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

              {/* AI Architecture Guardrails Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-500" />
                      Prompt Injection Defenses
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Enforced</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Code snippets are strictly framed within passive XML tags (<code className="text-[10px]">&lt;untrusted_code&gt;</code>) to prevent system prompt overrides.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-emerald-500" />
                      Deterministic Guardrails
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    High-confidence secret leaks and known CVEs can never be suppressed by AI false-negative hallucinations.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Wand2 className="h-3.5 w-3.5 text-primary" />
                      Context-Aware Remediation
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Generates exact parameterized query and escaping code replacements validated through pre-commit checks.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Enriched Findings List */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  AI-Verified Findings & Automated Fixes ({aiEnrichedIssues.length})
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Model: Gemini 2.5 Flash
                </span>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">Loading AI-verified findings...</div>
              ) : aiEnrichedIssues.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">No Issues Requiring AI Remediation</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    All scanned repositories are either clean or pending initial verification scans.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {aiEnrichedIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                              issue.severity === "critical"
                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                : issue.severity === "high"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span className="text-xs font-bold text-foreground truncate">{issue.title}</span>
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/20 flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            {issue.aiModel || "Gemini 2.5 Flash"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {issue.suggestedFix || issue.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                          <span className="font-mono text-[10px] text-foreground/80 flex items-center gap-1">
                            <FileCode className="h-3 w-3" />
                            {issue.fileName}:{issue.lineNumber || 1}
                          </span>
                          <span>•</span>
                          <span>Repo: {issue.repository}</span>
                          {issue.confidenceScore && (
                            <>
                              <span>•</span>
                              <span>Confidence: {Math.round(issue.confidenceScore * 100)}%</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          View AI Fix
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
