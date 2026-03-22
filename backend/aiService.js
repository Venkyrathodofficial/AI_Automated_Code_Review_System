const fetch = require("node-fetch");

const CLAUDE_API_URL = process.env.CLAUDE_API_URL;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

/**
 * Calls Claude API to analyze code and returns structured JSON.
 * @param {string} code - The code to analyze
 * @returns {Promise<object|null>} - AI analysis result or null on error
 */
async function analyzeCode(code) {
  if (!CLAUDE_API_URL || !CLAUDE_API_KEY) {
    throw new Error("Claude API URL or key not set in environment");
  }
  const prompt = `Analyze the following code and return a JSON object with the following fields:\n\n{
  issue_title: string,
  issue_description: string,
  severity: "Low" | "Medium" | "High" | "Critical",
  suggestion: string,
  optimization_tip: string,
  risk_score: number, // 1-10
  code_health_score: number // 0-100
}\n\nCode:\n\n"""
${code}
"""\n\nRespond ONLY with a valid JSON object.`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229", // or your Claude model
        max_tokens: 512,
        temperature: 0.2,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });
    if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
    const data = await response.json();
    let aiText = data?.content || data?.choices?.[0]?.message?.content || "";
    // Extract JSON from response (in case Claude adds text)
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
    console.error("Claude analyzeCode error:", err.message);
    return null;
  }
}

module.exports = { analyzeCode };
