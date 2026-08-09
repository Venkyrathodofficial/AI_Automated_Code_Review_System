const fetch = require("node-fetch");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const CLAUDE_API_URL = process.env.CLAUDE_API_URL;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Calls Gemini or Claude API to fix code and return improved code and explanation.
 * @param {string} code - The code to fix
 * @param {string} issueDescription - The issue description
 * @returns {Promise<{improved_code: string, explanation: string}|null>}
 */
async function fixCodeWithAI(code, issueDescription) {
  // Try Gemini first if the API key is configured
  if (GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `You are a Senior Security Engineer. Analyze the following code containing a security vulnerability or bug and produce a clean, secure, refactored version.
Ensure that the original logic and functional behavior remain exactly the same, but the vulnerability is corrected.

Issue Description:
${issueDescription}

Original Code:
${code}

Respond ONLY with a JSON object following this format:
{
  "improved_code": "The complete secure code snippet/file contents replacing the original code.",
  "explanation": "A short, professional description of the fixes applied and why they remediate the security risk."
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found in Gemini response");
      
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        improved_code: parsed.improved_code || "",
        explanation: parsed.explanation || "Fixed vulnerability using Gemini AI."
      };
    } catch (err) {
      console.error("Gemini fixCodeWithAI error:", err.message);
      // Fallback to Claude below if configured, otherwise throw
      if (!CLAUDE_API_URL || !CLAUDE_API_KEY) {
        return null;
      }
    }
  }

  // Legacy Claude API Call
  if (!CLAUDE_API_URL || !CLAUDE_API_KEY) {
    throw new Error("No API key configured for code fixes (Gemini or Claude)");
  }

  const prompt = `Fix this code, remove issues, and optimize performance.\n\nIssue: ${issueDescription}\n\nCode:\n"""\n${code}\n"""\n\nRespond ONLY with a JSON object like:\n{\n  improved_code: string,\n  explanation: string\n}`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        temperature: 0.2,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });
    if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
    const data = await response.json();
    let aiText = data?.content || data?.choices?.[0]?.message?.content || "";
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Claude response");
    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (err) {
      throw new Error("Invalid JSON from Claude");
    }
    return result;
  } catch (err) {
    console.error("Claude fixCodeWithAI error:", err.message);
    return null;
  }
}

module.exports = { fixCodeWithAI };
