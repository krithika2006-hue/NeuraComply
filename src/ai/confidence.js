/**
 * Configurable Confidence Engine & Human-in-the-Loop (HITL) Routing
 *
 * Implements calibrated decision boundaries between autonomous acceptance,
 * triage queue dispatch, and rejection.
 */

export const DECISION_STATUS = {
  AUTO_ACCEPTED: 'AUTO_ACCEPTED',
  HUMAN_REVIEW: 'HUMAN_REVIEW',
  REJECTED: 'REJECTED'
};

// Production confidence threshold policy:
// - AUTO_ACCEPTED: similarity >= 80% (0.80) AND margin >= 10% (0.10)
// - HUMAN_REVIEW: similarity 60%-79% (0.60-0.79) OR margin < 10% (0.10)
// - REJECTED: similarity < 60% (0.60)
let HIGH_THRESHOLD = 0.80;
let REVIEW_THRESHOLD = 0.60;

/**
 * Update active confidence thresholds at runtime
 */
export function setConfidenceThresholds({ high, review }) {
  if (typeof high === 'number') HIGH_THRESHOLD = high;
  if (typeof review === 'number') REVIEW_THRESHOLD = review;
}

export function getConfidenceThresholds() {
  return { high: HIGH_THRESHOLD, review: REVIEW_THRESHOLD };
}

/**
 * Calculate calibrated confidence score and routing decision:
 * @param {Object} topMatch - Primary candidate intent match
 * @param {Object} runnerUp - Secondary candidate intent match (for margin separation)
 * @returns {Object} { confidence: number, status: string, explanation: string }
 */
export function evaluateConfidence(topMatch, runnerUp = null) {
  if (!topMatch || topMatch.similarity <= 0) {
    return {
      confidence: 0.0,
      status: DECISION_STATUS.REJECTED,
      explanation: 'No meaningful semantic intent alignment detected.'
    };
  }

  const s1 = topMatch.similarity;
  const s2 = runnerUp ? runnerUp.similarity : 0;
  const margin = Math.max(0, s1 - s2);

  // Calibrate confidence: 75% raw similarity + 25% margin separation
  let calibratedConfidence = (s1 * 0.75) + (margin * 0.25);
  calibratedConfidence = Math.max(0.0, Math.min(0.99, Math.round(calibratedConfidence * 100) / 100));

  let status = DECISION_STATUS.REJECTED;
  let explanation = '';

  if (s1 >= HIGH_THRESHOLD && margin >= 0.10) {
    status = DECISION_STATUS.AUTO_ACCEPTED;
    explanation = `High semantic similarity (${(s1 * 100).toFixed(1)}%) with clear margin separation over alternative intents. Automatically accepted.`;
  } else if (s1 >= REVIEW_THRESHOLD) {
    status = DECISION_STATUS.HUMAN_REVIEW;
    explanation = `Medium semantic similarity (${(s1 * 100).toFixed(1)}%) or tight separation from runner-up (${runnerUp?.intentId || 'None'}). Routed to HITL triage queue.`;
  } else {
    status = DECISION_STATUS.REJECTED;
    explanation = `Similarity (${(s1 * 100).toFixed(1)}%) below minimum review threshold (${(REVIEW_THRESHOLD * 100).toFixed(1)}%). Intent classification rejected.`;
  }

  return {
    confidence: calibratedConfidence,
    rawSimilarity: s1,
    margin,
    status,
    explanation
  };
}
