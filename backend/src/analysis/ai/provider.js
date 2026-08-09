const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIProvider {
  constructor(apiKey, modelName = "gemini-2.5-flash") {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.modelName = modelName;
    
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: { responseMimeType: "application/json" }
      });
    }
  }

  isConfigured() {
    return !!this.apiKey && !!this.model;
  }

  /**
   * Run a prompt expecting a JSON response
   * @param {string} prompt 
   * @returns {Object|null}
   */
  async generateJSON(prompt) {
    if (!this.isConfigured()) {
      console.warn("AI Provider not configured. Missing API key.");
      return null;
    }

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error(`AI generation failed: ${err.message}`);
      return null;
    }
  }
}

module.exports = AIProvider;
