const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Gemini 2.5 Flash pricing estimate (tokens → USD)
// Input: ~$0.075 per 1M tokens / Output: ~$0.30 per 1M tokens
// We use a blended estimate of $0.15 / 1M tokens for simplicity
const COST_PER_1K_TOKENS_USD = 0.00015;

/**
 * Validates and explains potential vulnerabilities using Gemini 2.5 Flash.
 * Tracks usage in the system_budget and ai_usage_log tables.
 *
 * @param {string} fileName
 * @param {Array<object>} potentialIssues
 * @param {object} opts - { userId, scanId, repoName, supabase }
 * @returns {Promise<Array<object>>}
 */
async function validateAndExplainIssuesWithGemini(fileName, potentialIssues, opts = {}) {
  if (!GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY not set. Skipping Gemini validation.");
    return potentialIssues;
  }

  if (potentialIssues.length === 0) {
    return [];
  }

  // ── Budget check ──────────────────────────────────────────
  if (opts.supabase) {
    try {
      const budgetExceeded = await isBudgetExceeded(opts.supabase);
      if (budgetExceeded) {
        console.warn("⚠️ Monthly AI budget exceeded. Falling back to static scan results.");
        return potentialIssues; // Graceful fallback — don't charge the API
      }
    } catch (err) {
      console.warn("⚠️ Could not check budget:", err.message);
    }
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `You are a Senior Security Engineer. Analyze the following potential code vulnerabilities detected by our static scanner in the file "${fileName}".
For each candidate vulnerability, review the code snippet and context to determine if it is a TRUE POSITIVE or a FALSE POSITIVE.
If it is a true positive, generate a detailed security explanation, severity rating, and secure refactoring fix.
If it is a false positive (e.g. commented code, test variables, safe usage, or irrelevant match), do not include it in your output.

Vulnerability Candidates:
${JSON.stringify(potentialIssues, null, 2)}

You must respond ONLY with a JSON array of validated issues. Each validated issue must strictly follow this JSON schema:
[
  {
    "ruleId": "SEC001",
    "category": "api_key_exposure",
    "issue_title": "Detailed professional title describing the issue",
    "issue_description": "AI-generated detailed explanation of what was detected, why it is dangerous, and its real-world impact.",
    "severity": "Low" | "Medium" | "High" | "Critical",
    "risk_score": number,
    "line_number": number,
    "suggestion": "Detailed recommended fix step-by-step description.",
    "secure_code": "Complete refactored secure code block replacing the original snippet.",
    "best_practices": "Bullet points of best practices to avoid this issue.",
    "confidence_score": number, // A number between 0.0 and 1.0 indicating AI confidence in this finding
    "validation_status": "passed" | "needs_review" // "passed" if highly confident fix is secure, "needs_review" if complex/requires manual check
  }
]

If all candidates are false positives, respond with an empty JSON array: []`;

  try {
    console.log(`🤖 Sending ${potentialIssues.length} candidates in ${fileName} to Gemini 2.5 Flash...`);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Estimate token usage (rough heuristic: ~4 chars per token)
    const promptTokens = Math.ceil(prompt.length / 4);
    const responseTokens = Math.ceil(responseText.length / 4);
    const totalTokens = promptTokens + responseTokens;
    const estimatedCost = (totalTokens / 1000) * COST_PER_1K_TOKENS_USD;

    // Track usage asynchronously (don't block the scan)
    if (opts.supabase) {
      trackUsage(opts.supabase, {
        userId: opts.userId || null,
        scanId: opts.scanId || null,
        repoName: opts.repoName || null,
        tokens: totalTokens,
        costUsd: estimatedCost,
      }).catch(err => console.warn("⚠️ Usage tracking failed:", err.message));
    }

    const jsonMatch = responseText.match(/\[\s*[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("No JSON array found in Gemini response for", fileName);
      return [];
    }

    const validatedIssues = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(validatedIssues)) {
      console.warn("Gemini response is not an array for", fileName);
      return [];
    }

    console.log(`✅ Gemini validated ${validatedIssues.length}/${potentialIssues.length} issues in ${fileName} (~${totalTokens} tokens, ~$${estimatedCost.toFixed(6)})`);
    return validatedIssues.map(issue => ({
      ruleId: issue.ruleId || "GEN001",
      file_name: fileName,
      issue_title: issue.issue_title || "Potential Issue",
      issue_description: issue.issue_description || "Identified potential issue.",
      severity: issue.severity || "Low",
      suggestion: issue.suggestion || "",
      optimization_tip: issue.best_practices || "",
      risk_score: issue.risk_score || 1,
      line_number: issue.line_number || null,
      category: issue.category || "general_vulnerability",
      secure_code: issue.secure_code || "",
      best_practices: issue.best_practices || "",
      ai_model: "Gemini 2.5 Flash",
      confidence_score: issue.confidence_score !== undefined ? Number(issue.confidence_score) : 0.92,
      validation_status: issue.validation_status || "passed"
    }));
  } catch (err) {
    console.error(`Gemini validation error for ${fileName}:`, err.message);
    return potentialIssues; // Fallback to static results
  }
}

/**
 * Checks if the monthly AI budget has been exceeded.
 * Returns true if scans should be blocked.
 */
async function isBudgetExceeded(supabase) {
  const monthlyBudget = parseFloat(process.env.MONTHLY_AI_BUDGET_USD || "50");
  if (monthlyBudget <= 0) return false; // 0 means disabled

  const { data, error } = await supabase
    .from("system_budget")
    .select("monthly_cost_usd, budget_exceeded, last_reset_date")
    .eq("id", "global")
    .single();

  if (error || !data) return false;

  // Reset daily/monthly counters if it's a new day/month
  const today = new Date().toISOString().split("T")[0];
  if (data.last_reset_date !== today) {
    const newMonth = today.substring(0, 7) !== data.last_reset_date?.substring(0, 7);
    await supabase
      .from("system_budget")
      .update({
        daily_cost_usd: 0,
        monthly_cost_usd: newMonth ? 0 : data.monthly_cost_usd,
        budget_exceeded: newMonth ? false : data.budget_exceeded,
        last_reset_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "global");
    return false;
  }

  return data.budget_exceeded === true || data.monthly_cost_usd >= monthlyBudget;
}

/**
 * Records AI usage in the database and updates system budget.
 */
async function trackUsage(supabase, { userId, scanId, repoName, tokens, costUsd }) {
  const dailyBudget = parseFloat(process.env.DAILY_AI_BUDGET_USD || "5");
  const monthlyBudget = parseFloat(process.env.MONTHLY_AI_BUDGET_USD || "50");

  try {
    const { data: exceeded, error } = await supabase.rpc("log_ai_cost", {
      user_id_param: userId,
      scan_id_param: String(scanId || ""),
      repo_name_param: String(repoName || ""),
      tokens_param: tokens,
      cost_usd_param: costUsd,
      monthly_cap_param: monthlyBudget,
      daily_cap_param: dailyBudget,
    });

    if (error) {
      console.warn("⚠️ log_ai_cost RPC error:", error.message);
    } else if (exceeded) {
      console.warn("🚨 AI BUDGET ALERT: Gemini usage has exceeded the budget!");
    }
  } catch (err) {
    console.warn("⚠️ trackUsage error calling RPC:", err.message);
  }
}

/**
 * Legacy scan method (for backwards compatibility)
 */
async function scanCodeWithGemini(fileName, codeContent, opts = {}) {
  const { analyzeFileStatic } = require("./helpers");
  const potentialIssues = analyzeFileStatic(fileName, codeContent);
  return validateAndExplainIssuesWithGemini(fileName, potentialIssues, opts);
}

module.exports = {
  validateAndExplainIssuesWithGemini,
  scanCodeWithGemini,
  isBudgetExceeded,
  trackUsage,
};
