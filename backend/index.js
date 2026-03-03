require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ============================
// Supabase Setup
// ============================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

// Admin client — used for auth verification and non-user-scoped ops
const supabase = createClient(supabaseUrl, supabaseKey);

// Create a Supabase client scoped to a specific user's JWT
// This makes auth.uid() in RLS policies match the user
function supabaseForUser(token) {
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// ============================
// Auth Middleware — extracts user from Bearer token
// ============================
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }
  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.user = user;
  req.token = token;
  // Attach a user-scoped Supabase client so RLS auth.uid() works
  req.supabase = supabaseForUser(token);
  next();
}

// ============================
// Root Route (Health Check)
// ============================
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ============================
// API: Get user's connected repositories
// ============================
app.get("/api/repositories", authMiddleware, async (req, res) => {
  try {
    const { data: userRepos, error: repoErr } = await req.supabase
      .from("user_repositories")
      .select("*")
      .eq("user_id", req.user.id)
      .order("connected_at", { ascending: false });

    if (repoErr) {
      return res.status(500).json({ error: repoErr.message });
    }

    if (!userRepos || userRepos.length === 0) {
      return res.json([]);
    }

    const repoNames = userRepos.map((r) => r.repo_full_name);

    const { data: reviews, error: revErr } = await req.supabase
      .from("code_reviews")
      .select("*")
      .eq("user_id", req.user.id)
      .in("repository_name", repoNames);

    if (revErr) {
      return res.status(500).json({ error: revErr.message });
    }

    const repoMap = {};
    userRepos.forEach((ur) => {
      repoMap[ur.repo_full_name] = {
        name: ur.repo_full_name,
        totalReviews: 0,
        critical: 0,
        medium: 0,
        low: 0,
        open: 0,
        resolved: 0,
        lastReviewDate: null,
        files: new Set(),
        connectedAt: ur.connected_at,
        webhookSecret: ur.webhook_secret,
      };
    });

    (reviews || []).forEach((r) => {
      const name = r.repository_name;
      if (!repoMap[name]) return;
      const repo = repoMap[name];
      repo.totalReviews++;
      const sev = (r.severity || "").toLowerCase();
      if (sev === "critical") repo.critical++;
      else if (sev === "medium") repo.medium++;
      else repo.low++;
      const st = (r.status || "").toLowerCase();
      if (st === "resolved") repo.resolved++;
      else repo.open++;
      if (r.file_name) repo.files.add(r.file_name);
      if (r.created_at && (!repo.lastReviewDate || r.created_at > repo.lastReviewDate)) {
        repo.lastReviewDate = r.created_at;
      }
    });

    const repos = Object.values(repoMap).map((r) => {
      const total = r.critical + r.medium + r.low;
      const healthScore = total === 0 ? 100 : Math.max(0, Math.round(100 - (r.critical * 15 + r.medium * 5 + r.low * 1)));
      return {
        name: r.name,
        totalReviews: r.totalReviews,
        critical: r.critical,
        medium: r.medium,
        low: r.low,
        open: r.open,
        resolved: r.resolved,
        healthScore,
        lastReviewDate: r.lastReviewDate,
        filesReviewed: r.files.size,
        connectedAt: r.connectedAt,
      };
    });

    return res.json(repos);
  } catch (err) {
    console.error("❌ Repos Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Connect a repository
// ============================
app.post("/api/repositories/connect", authMiddleware, async (req, res) => {
  try {
    let { repoFullName } = req.body;
    // Auto-parse GitHub URLs: https://github.com/owner/repo → owner/repo
    if (repoFullName) {
      repoFullName = repoFullName.trim()
        .replace(/^https?:\/\/(www\.)?github\.com\//, "")
        .replace(/\.git$/, "")
        .replace(/\/$/, "");
    }
    if (!repoFullName || !repoFullName.includes("/")) {
      return res.status(400).json({ error: "Provide repo as owner/repo" });
    }

    const webhookSecret = crypto.randomBytes(20).toString("hex");

    const { data, error } = await req.supabase
      .from("user_repositories")
      .upsert(
        {
          user_id: req.user.id,
          repo_full_name: repoFullName.trim(),
          webhook_secret: webhookSecret,
        },
        { onConflict: "user_id,repo_full_name" }
      )
      .select();

    if (error) {
      console.error("❌ Connect Repo Error:", error);
      return res.status(500).json({ error: error.message });
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    const webhookUrl = `${backendUrl}/webhook/github/${req.user.id}`;

    return res.json({
      success: true,
      repository: data?.[0],
      webhook: {
        url: webhookUrl,
        secret: webhookSecret,
        instructions: [
          `1. Go to https://github.com/${repoFullName.trim()}/settings/hooks`,
          `2. Click "Add webhook"`,
          `3. Set Payload URL to: ${webhookUrl}`,
          `4. Set Content type to: application/json`,
          `5. Set Secret to: ${webhookSecret}`,
          `6. Select "Just the push event"`,
          `7. Click "Add webhook"`,
        ],
      },
    });
  } catch (err) {
    console.error("❌ Connect Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Disconnect a repository
// ============================
app.delete("/api/repositories/:repoName", authMiddleware, async (req, res) => {
  try {
    const repoFullName = decodeURIComponent(req.params.repoName);
    const { error } = await req.supabase
      .from("user_repositories")
      .delete()
      .eq("user_id", req.user.id)
      .eq("repo_full_name", repoFullName);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Get user's code reviews
// ============================
app.get("/api/reviews", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("code_reviews")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Get user's aggregate stats
// ============================
app.get("/api/stats", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("code_reviews")
      .select("*")
      .eq("user_id", req.user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const reviews = data || [];
    return res.json({
      totalReviews: reviews.length,
      critical: reviews.filter((r) => r.severity?.toLowerCase() === "critical").length,
      medium: reviews.filter((r) => r.severity?.toLowerCase() === "medium").length,
      low: reviews.filter((r) => r.severity?.toLowerCase() === "low").length,
      open: reviews.filter((r) => r.status?.toLowerCase() === "open").length,
      resolved: reviews.filter((r) => r.status?.toLowerCase() === "resolved").length,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Update review status
// ============================
app.patch("/api/reviews/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await req.supabase
      .from("code_reviews")
      .update({ status })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// GitHub Webhook Route (per-user)
// ============================
app.post("/webhook/github/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`✅ Webhook received for user ${userId}`);

    const repository = req.body.repository?.full_name || "Unknown Repo";
    const head = req.body.head_commit || {};

    // Verify this repo is connected to this user
    const { data: userRepo } = await supabase
      .from("user_repositories")
      .select("*")
      .eq("user_id", userId)
      .eq("repo_full_name", repository)
      .single();

    if (!userRepo) {
      console.log(`⚠️ Repo ${repository} not connected for user ${userId}`);
      return res.status(404).send("Repository not connected for this user");
    }

    // Verify webhook signature if present
    const sig = req.headers["x-hub-signature-256"];
    if (sig && userRepo.webhook_secret) {
      const hmac = crypto
        .createHmac("sha256", userRepo.webhook_secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
      if (sig !== `sha256=${hmac}`) {
        return res.status(401).send("Invalid signature");
      }
    }

    const modifiedFiles = head.modified || [];
    const addedFiles = head.added || [];
    const allFiles = [...modifiedFiles, ...addedFiles];
    const fileName = allFiles.length > 0 ? allFiles[0] : "Unknown File";

    const { error } = await supabase.from("code_reviews").insert([
      {
        user_id: userId,
        repository_name: repository,
        file_name: fileName,
        issue_title: "Commit Detected",
        issue_description: `Commit message: ${head.message || "No message"}`,
        severity: "Low",
        suggestion: "AI suggestion will be generated.",
        optimization_tip: "Optimization will be added later.",
        risk_score: 1,
        commit_id: head.id || "No ID",
        commit_message: head.message || "No message",
        status: "Open",
      },
    ]);

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      return res.status(500).send("Insert error");
    }

    console.log("✅ Review created for", repository);
    return res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Legacy webhook (backwards compat)
app.post("/webhook/github", async (req, res) => {
  try {
    const repository = req.body.repository?.full_name || "Unknown Repo";
    const head = req.body.head_commit || {};

    const { data: userRepo } = await supabase
      .from("user_repositories")
      .select("user_id")
      .eq("repo_full_name", repository)
      .limit(1)
      .single();

    const userId = userRepo?.user_id || null;

    const { error } = await supabase.from("code_reviews").insert([
      {
        user_id: userId,
        repository_name: repository,
        file_name: (head.modified || head.added || ["Unknown File"])[0] || "Unknown File",
        issue_title: "Commit Detected",
        issue_description: `Commit message: ${head.message || "No message"}`,
        severity: "Low",
        suggestion: "AI suggestion will be generated.",
        optimization_tip: "Optimization will be added later.",
        risk_score: 1,
        commit_id: head.id || "No ID",
        commit_message: head.message || "No message",
        status: "Open",
      },
    ]);

    if (error) {
      return res.status(500).send("Insert error");
    }
    return res.status(200).send("OK");
  } catch (err) {
    return res.status(500).send("Internal Server Error");
  }
});

// ============================
// Start Server
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});