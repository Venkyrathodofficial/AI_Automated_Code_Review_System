const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Validates and explains potential vulnerabilities using Gemini 2.5 Flash.
 * @param {string} fileName - Name of the file being scanned
 * @param {Array<object>} potentialIssues - Array of potential issues found by regex
 * @returns {Promise<Array<object>>} - Array of validated and enriched issues
 */
async function validateAndExplainIssuesWithGemini(fileName, potentialIssues) {
  if (!GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY not set in environment. Skipping Gemini validation.");
    return potentialIssues; // Fallback to raw regex matches if no API key
  }

  if (potentialIssues.length === 0) {
    return [];
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
    "ruleId": "SEC001", // Match the original ruleId
    "category": "api_key_exposure", // Match the original category or refine it
    "issue_title": "Detailed professional title describing the issue",
    "issue_description": "AI-generated detailed explanation of what was detected, why it is dangerous, and its real-world impact.",
    "severity": "Low" | "Medium" | "High" | "Critical",
    "risk_score": number, // 1-10
    "line_number": number, // The original line number
    "suggestion": "Detailed recommended fix step-by-step description.",
    "secure_code": "Complete refactored secure code block replacing the original snippet.",
    "best_practices": "Bullet points of best practices to avoid this issue."
  }
]

If all candidates are false positives, respond with an empty JSON array: []`;

  try {
    console.log(`🤖 Sending ${potentialIssues.length} candidate vulnerabilities in ${fileName} to Gemini 2.5 Flash...`);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse response
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

    console.log(`✅ Gemini validated ${validatedIssues.length}/${potentialIssues.length} issues in ${fileName}`);
    return validatedIssues.map(issue => ({
      ruleId: issue.ruleId || "GEN001",
      file_name: fileName,
      issue_title: issue.issue_title || "Potential Issue",
      issue_description: issue.issue_description || "Identified potential issue.",
      severity: issue.severity || "Low",
      suggestion: issue.suggestion || "",
      optimization_tip: issue.best_practices || "", // Backwards compatibility for UI
      risk_score: issue.risk_score || 1,
      line_number: issue.line_number || null,
      category: issue.category || "general_vulnerability",
      secure_code: issue.secure_code || "",
      best_practices: issue.best_practices || ""
    }));
  } catch (err) {
    console.error(`Gemini validation error for ${fileName}:`, err.message);
    // If Gemini fails, fallback to the potential issues to ensure the scan still runs
    return potentialIssues;
  }
}

/**
 * Legacy scan method (for backwards compatibility)
 */
async function scanCodeWithGemini(fileName, codeContent) {
  // We now route through pre-filtered analysis to save cost
  const { analyzeFileStatic } = require("./helpers"); // Avoid circular dependency if index.js imports this
  const potentialIssues = analyzeFileStatic(fileName, codeContent);
  return validateAndExplainIssuesWithGemini(fileName, potentialIssues);
}

module.exports = {
  validateAndExplainIssuesWithGemini,
  scanCodeWithGemini
};
