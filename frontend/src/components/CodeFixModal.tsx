import { useState } from "react";
import { useGithubAuth } from "@/hooks/useGithubAuth";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onClose: () => void;
  fileName: string;
  originalCode: string;
  issueDescription: string;
}

export function CodeFixModal({ open, onClose, fileName, originalCode, issueDescription }: Props) {
  const [improvedCode, setImprovedCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState("");
  const { token, setToken, repo, setRepo, branch, setBranch, connectGithub } = useGithubAuth();
  
  const handleCommit = async () => {
    setCommitLoading(true);
    setCommitSuccess("");
    setError("");
    try {
      if (!repo) {
        setError("Please enter your GitHub repo.");
        setCommitLoading(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      const sbToken = session?.access_token;
      
      const res = await fetch("/api/v1/commit-fix", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(sbToken ? { Authorization: `Bearer ${sbToken}` } : {}),
        },
        body: JSON.stringify({ fileName, improvedCode, repo, branch, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to commit code");
      setCommitSuccess("Code committed to GitHub successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCommitLoading(false);
    }
  };

  const handleFix = async () => {
    setLoading(true);
    setError("");
    setImprovedCode("");
    setExplanation("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sbToken = session?.access_token;
      
      const res = await fetch("/api/v1/fix-code", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(sbToken ? { Authorization: `Bearer ${sbToken}` } : {}),
        },
        body: JSON.stringify({ code: originalCode, issueDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fix code");
      setImprovedCode(data.improved_code);
      setExplanation(data.explanation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleCopy = () => {
    navigator.clipboard.writeText(improvedCode);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Code Fix for {fileName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="font-semibold mb-1">Original Code</p>
            <Textarea value={originalCode} readOnly rows={6} className="font-mono text-xs" />
          </div>
          <Button onClick={handleFix} disabled={loading} className="w-full">
            {loading ? "Fixing..." : "Fix Code with AI"}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {improvedCode && (
            <>
              <div>
                <p className="font-semibold mb-1">Improved Code</p>
                <Textarea value={improvedCode} readOnly rows={6} className="font-mono text-xs" />
                <Button onClick={handleCopy} className="mt-2">Copy Code</Button>
              </div>
              <div>
                <p className="font-semibold mb-1">AI Explanation</p>
                <Textarea value={explanation} readOnly rows={3} className="font-mono text-xs" />
              </div>
              <div className="pt-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="GitHub repo (user/repo)"
                    value={repo}
                    onChange={e => setRepo(e.target.value)}
                    className="border rounded px-2 py-1 text-xs flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Branch"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    className="border rounded px-2 py-1 text-xs w-24"
                  />
                </div>
                <input
                  type="password"
                  placeholder="GitHub token"
                  value={token || ""}
                  onChange={e => setToken(e.target.value)}
                  className="border rounded px-2 py-1 text-xs w-full"
                />
                <Button onClick={handleCommit} disabled={commitLoading} className="w-full" variant="default">
                  {commitLoading ? "Committing..." : "Commit Fix to GitHub"}
                </Button>
                {commitSuccess && <p className="text-green-600 text-sm mt-2">{commitSuccess}</p>}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
