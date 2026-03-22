/**
 * Calculates code health score from risk score.
 * @param {number} risk_score - Risk score (1-10)
 * @returns {number} - Code health score (0-100)
 */
function calculateHealthScore(risk_score) {
  return 100 - (risk_score * 5);
}

module.exports = { calculateHealthScore };
