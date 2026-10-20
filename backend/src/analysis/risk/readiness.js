class ProductionReadinessModel {
  constructor() {}

  /**
   * Calculates the overall production readiness score and PASS/WARN/BLOCK verdict.
   * @param {Array} correlatedFindings - Findings after correlation
   * @param {Object} repoStats - General stats (file count, etc.)
   */
  evaluate(correlatedFindings, repoStats = {}) {
    const scores = {
      Security: 100,
      Dependencies: 100,
      CodeQuality: 100,
      Reliability: 100,
      Configuration: 100
    };
    
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;

    correlatedFindings.forEach(f => {
      const isDep = f.category === 'insecure_dependency';
      const isSec = !isDep && f.category !== 'environment_misconfiguration';
      const isConf = f.category === 'environment_misconfiguration';
      
      const sevLower = f.severity.toLowerCase();
      
      if (sevLower === 'critical') criticalCount++;
      if (sevLower === 'high') highCount++;
      if (sevLower === 'medium') mediumCount++;

      // Deduct points based on category
      let deduction = 0;
      if (sevLower === 'critical') deduction = 15;
      else if (sevLower === 'high') deduction = 10;
      else if (sevLower === 'medium') deduction = 5;
      else if (sevLower === 'low') deduction = 2;

      if (isSec) scores.Security = Math.max(0, scores.Security - deduction);
      if (isDep) scores.Dependencies = Math.max(0, scores.Dependencies - deduction);
      if (isConf) scores.Configuration = Math.max(0, scores.Configuration - deduction);
      // CodeQuality and Reliability could be affected by other specific scanner rules
    });

    // Weighted Overall Score
    const overallScore = Math.round(
      (scores.Security * 0.40) +
      (scores.Dependencies * 0.20) +
      (scores.CodeQuality * 0.15) +
      (scores.Reliability * 0.15) +
      (scores.Configuration * 0.10)
    );

    let verdict = "PASS";
    if (criticalCount > 0 || highCount > 0) {
      verdict = "BLOCK";
    } else if (mediumCount > 0 || overallScore < 80) {
      verdict = "WARN";
    }

    return {
      overallScore,
      categoryScores: scores,
      verdict,
      criticalCount,
      highCount,
      mediumCount
    };
  }
}

module.exports = ProductionReadinessModel;
