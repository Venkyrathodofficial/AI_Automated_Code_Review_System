import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Issue } from "@/data/mockData";
import { GitCommit, Lightbulb, Wrench } from "lucide-react";

interface Props {
  issue: Issue | null;
  onClose: () => void;
}

const severityColor: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-0 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function IssueDetailModal({ issue, onClose }: Props) {
  if (!issue) return null;

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
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Description</p>
            <p className="text-sm text-card-foreground leading-relaxed">{issue.description}</p>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/10 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-card-foreground mb-1">Suggested Fix</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{issue.suggestedFix}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20 flex-shrink-0">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-card-foreground mb-1">Optimization Tip</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{issue.optimizationTip}</p>
            </div>
          </div>

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

          <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
            <span><span className="font-bold text-card-foreground">Repo:</span> {issue.repository}</span>
            <span><span className="font-bold text-card-foreground">File:</span> {issue.fileName}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
