import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Issue } from "@/data/mockData";
import { GitCommit, Lightbulb, Wrench, ShieldAlert, Clock3 } from "lucide-react";
import { FixCodeButton } from "./FixCodeButton";
import { OriginalCodeFetcher } from "./OriginalCodeFetcher";
import { useState } from "react";
import { deriveVulnerabilityIntel } from "@/lib/vulnerability";

interface Props {
  issue: Issue | null;
  onClose: () => void;
}

const severityColor: Record<string, string> = {
  critical: "bg-red-100 text-red-750 border-0 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-755 border-0 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-emerald-100 text-emerald-750 border-0 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function IssueDetailModal({ issue, onClose }: Props) {
  const [originalCode, setOriginalCode] = useState("");
  const [showFixModal, setShowFixModal] = useState(false);
  if (!issue) return null;
  const intel = deriveVulnerabilityIntel(issue);

  return (
    <Dialog open={!!issue} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] font-semibold uppercase rounded-lg px-2 py-0.5 ${severityColor[issue.severity]}`}> 
              {issue.severity}
            </Badge>
            <Badge className={`text-[10px] font-semibold capitalize rounded-lg px-2 py-0.5 ${issue.status === "open" ? "bg-red-50 text-red-600 border-0 dark:bg-red-900/20 dark:text-red-400" : "bg-emerald-50 text-emerald-600 border-0 dark:bg-emerald-900/20 dark:text-emerald-400"}`}>
              {issue.status}
            </Badge>
          </div>
          <DialogTitle className="text-base font-bold text-card-foreground mt-2">
            {issue.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Vulnerability details, suggested secure code fix, and remediation instructions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2 max-h-[80vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vulnerability Name</p>
              <p className="mt-1 text-sm font-bold text-card-foreground">{intel.name}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</p>
              <p className="mt-1 text-sm font-bold text-card-foreground">{intel.category}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Security Score Impact</p>
              <p className="mt-1 text-sm font-bold text-rose-600">-{intel.securityScoreImpact}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Remediation Difficulty</p>
              <p className="mt-1 text-sm font-bold text-card-foreground">{intel.remediationDifficulty}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Description</p>
            <p className="text-sm text-card-foreground leading-relaxed">{issue.description}</p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-card-foreground">Potential Impact If Exploited</p>
            </div>
            <ul className="space-y-1.5">
              {intel.attackImpact.map((impact) => (
                <li key={impact} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{impact}</span>
                </li>
              ))}
            </ul>
          </div>

          {intel.secretTypes.length > 0 && (
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-xs font-bold text-card-foreground mb-2">Potential Secret Types Found</p>
              <div className="flex flex-wrap gap-2">
                {intel.secretTypes.map((secretType) => (
                  <Badge key={secretType} variant="outline" className="text-[10px] font-mono">
                    {secretType}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/10 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-card-foreground mb-1">Suggested Fix</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{issue.suggestedFix}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock3 className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-card-foreground">Step-by-Step Remediation</p>
            </div>
            <ol className="space-y-2">
              {intel.remediationSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary flex-shrink-0">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* AI Verification Details */}
          <div className="bg-emerald-950/5 dark:bg-emerald-950/10 border border-emerald-900/10 dark:border-emerald-800/25 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">AI Verification Status</span>
              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {issue.validationStatus === "passed" ? "Verified" : (issue.validationStatus || "Passed")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1.5 border-t border-emerald-900/10 dark:border-emerald-800/20">
              <div>
                <p className="text-[9px] text-muted-foreground font-semibold uppercase">Engine Model</p>
                <p className="font-semibold text-card-foreground mt-0.5">{issue.aiModel || "Gemini 2.5 Flash"}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground font-semibold uppercase">Confidence Score</p>
                <p className="font-semibold text-card-foreground mt-0.5">
                  {issue.confidenceScore ? `${(Number(issue.confidenceScore) * 100).toFixed(0)}%` : "92%"}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground font-semibold uppercase">Expected Risk Reduction</p>
                <p className="font-semibold text-card-foreground mt-0.5">-{intel.potentialSecurityGain}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground font-semibold uppercase">Estimated Fix Time</p>
                <p className="font-semibold text-card-foreground mt-0.5">{intel.estimatedFixTime}</p>
              </div>
            </div>
          </div>

          {/* Code comparison block */}
          {issue.secureCode && (
            <div className="space-y-3.5 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Code Remediation</p>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wide">Vulnerable Code</span>
                  <pre className="p-3 bg-red-950/10 border border-red-900/20 rounded-lg font-mono text-xs text-red-200 overflow-x-auto whitespace-pre">
                    {/* If there's no original code fetched, we show the offending line from scan if available */}
                    {originalCode || `// Line ${issue.lineNumber || "unknown"}\n${issue.suggestedFix ? "Vulnerability detected." : ""}`}
                  </pre>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">Secure Code</span>
                  <pre className="p-3 bg-emerald-950/10 border border-emerald-900/20 rounded-lg font-mono text-xs text-emerald-350 overflow-x-auto whitespace-pre">
                    {issue.secureCode}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {issue.bestPractices && (
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/20 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/20 flex-shrink-0">
                <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-card-foreground mb-1">Best Practices</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{issue.bestPractices}</p>
              </div>
            </div>
          )}

          {issue.optimizationTip && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20 flex-shrink-0">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-card-foreground mb-1">Optimization Tip</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{issue.optimizationTip}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl bg-secondary/50 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted flex-shrink-0">
              <GitCommit className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-bold text-card-foreground mb-1">Commit Info</p>
              <p className="text-sm text-muted-foreground">{issue.commitMessage}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">ID: {issue.commitId}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
            <span><span className="font-bold text-card-foreground">Repo:</span> {issue.repository}</span>
            <span>
              <span className="font-bold text-card-foreground">File:</span> {issue.fileName}
              {issue.lineNumber && <span className="text-indigo-400 font-mono ml-1.5">Line {issue.lineNumber}</span>}
            </span>
          </div>

          {/* Fix Code with AI button and modal, only if open */}
          {issue.status === "open" && (
            <div className="pt-4 border-t border-border">
              {originalCode ? (
                <FixCodeButton
                  fileName={issue.fileName}
                  originalCode={originalCode}
                  issueDescription={issue.description}
                />
              ) : (
                <OriginalCodeFetcher fileName={issue.fileName} repository={issue.repository} commitId={issue.commitId} onCodeFetched={setOriginalCode} />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
