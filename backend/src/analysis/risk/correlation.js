class RiskCorrelationEngine {
  constructor() {}

  /**
   * Correlates overlapping findings across scanners, eliminates duplicates, and assigns confidence bands.
   * @param {Array} findings - Array of NormalizedFinding objects
   * @returns {Array} - Deduplicated and correlated NormalizedFinding objects
   */
  correlate(findings) {
    const correlated = [];
    const groupedByFile = {};

    // Group by file
    findings.forEach(f => {
      // Drop false positives verified by AI (confidence < 0.2)
      if (f.confidence < 0.2) return;

      if (!groupedByFile[f.file]) groupedByFile[f.file] = [];
      groupedByFile[f.file].push(f);
    });

    for (const [file, fileFindings] of Object.entries(groupedByFile)) {
      const mergedFindings = [];

      for (const finding of fileFindings) {
        // Simple distance-based deduplication (if same file, line is within 3 lines, and category matches)
        let merged = false;
        for (const existing of mergedFindings) {
          if (
            existing.category === finding.category &&
            Math.abs(existing.line - finding.line) <= 3
          ) {
            // Merge finding into existing
            existing.confidence = Math.min(1.0, existing.confidence + 0.15); // Confidence boost for multiple scanners agreeing
            if (!existing.scanner.includes(finding.scanner)) {
              existing.scanner = `${existing.scanner}, ${finding.scanner}`;
            }
            if (!existing.cwe && finding.cwe) existing.cwe = finding.cwe;
            merged = true;
            break;
          }
        }
        
        if (!merged) {
          mergedFindings.push(finding);
        }
      }

      correlated.push(...mergedFindings);
    }

    // Apply confidence bands
    correlated.forEach(f => {
      f.confidence_band = this._getConfidenceBand(f.confidence);
    });

    return correlated;
  }

  _getConfidenceBand(score) {
    if (score >= 0.9) return "Very High";
    if (score >= 0.7) return "High";
    if (score >= 0.4) return "Medium";
    return "Low";
  }
}

module.exports = RiskCorrelationEngine;
