import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Props {
  fileName: string;
  repository: string;
  commitId?: string;
  onCodeFetched: (code: string) => void;
}

export function OriginalCodeFetcher({ fileName, repository, commitId, onCodeFetched }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCode = async () => {
    if (!repository || repository === "undefined" || repository === "Private Repository") {
      setError("Cannot fetch code for this repository (private or invalid configuration)");
      return;
    }
    if (!fileName) {
      setError("File name is missing");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const url = `/api/file-content?file=${encodeURIComponent(fileName)}&repo=${encodeURIComponent(repository)}&ref=${encodeURIComponent(commitId || "")}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch code");
      onCodeFetched(data.code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={fetchCode} disabled={loading}>
        {loading ? "Loading..." : "Get Original Code"}
      </Button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
