import { useState } from "react";

export function useGithubAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [repo, setRepo] = useState<string>("");
  const [branch, setBranch] = useState<string>("main");

  // Placeholder: In production, use OAuth and store token securely
  const connectGithub = async () => {
    // TODO: Implement GitHub OAuth flow
    alert("GitHub OAuth not implemented. Please enter your token manually.");
  };

  return {
    token,
    setToken,
    repo,
    setRepo,
    branch,
    setBranch,
    connectGithub,
  };
}
