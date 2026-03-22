const fetch = require("node-fetch");

const CLAUDE_API_URL = process.env.CLAUDE_API_URL;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

/**
 * Calls Claude API to fix code and return improved code and explanation.
 * @param {string} code - The code to fix
 * @param {string} issueDescription - The issue description
 * @returns {Promise<{improved_code: string, explanation: string}|null>}
 */
async function fixCodeWithAI(code, issueDescription) {
  if (!CLAUDE_API_URL || !CLAUDE_API_KEY) {
    throw new Error("Claude API URL or key not set in environment");
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
