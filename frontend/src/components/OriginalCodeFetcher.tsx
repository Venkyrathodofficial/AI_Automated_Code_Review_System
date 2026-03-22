import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  fileName: string;
  onCodeFetched: (code: string) => void;
}

export function OriginalCodeFetcher({ fileName, onCodeFetched }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCode = async () => {
    setLoading(true);
    setError("");
    try {
      // Replace with your real API endpoint to fetch file content
      const res = await fetch(`/api/file-content?file=${encodeURIComponent(fileName)}`);
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
