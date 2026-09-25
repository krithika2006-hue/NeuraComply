/**
 * NeuraComply Semantic Intent Normalization Pipeline
 *
 * Implements the cross-vendor translation layer:
 * Vendor Configuration -> Semantic Representation -> Security Intent -> Unified Security Schema (USS)
 */

import { CANONICAL_INTENTS } from './intentSchema.js';
import { findSimilarIntents } from './similarity.js';
import { evaluateConfidence, DECISION_STATUS } from './confidence.js';
import { lookupVerifiedMapping } from './knowledgeBase.js';
import { tokenizeConfig } from './embeddings.js';

/**
 * Normalizes an arbitrary vendor configuration line or block into a canonical Security Intent
 * conformant to the Unified Security Schema (USS).
 *
 * @param {string} configLine - Raw configuration line or XML/CLI snippet
 * @param {string} [vendorHint] - Optional vendor identity ('Cisco', 'Juniper', 'Fortinet', 'Palo Alto')
 * @param {Object} [context] - Optional enclosing context (parent block, line number, interface)
 * @returns {Object} Canonical Intent Envelope
 */
export function normalizeSecurityIntent(configLine, vendorHint = 'Unknown', context = {}) {
  if (!configLine || typeof configLine !== 'string' || configLine.trim().length === 0) {
    return {
      vendor: vendorHint,
      raw_config: configLine || '',
      security_intent: 'INVALID_EMPTY_CONFIG',
      normalized_intent: null,
      confidence: 0.0,
      status: DECISION_STATUS.REJECTED,
      evidence: ['Input configuration statement is empty or null.']
    };
  }

  const rawConfig = configLine.trim();

  // 1. Check Knowledge Base for prior Operator-Verified Mappings (HITL Feedback Loop)
  const kbHit = lookupVerifiedMapping(rawConfig, vendorHint);
  if (kbHit) {
    const verifiedIntent = CANONICAL_INTENTS[kbHit.mapping.normalized_intent];
    if (verifiedIntent) {
      return {
        vendor: vendorHint !== 'Unknown' ? vendorHint : kbHit.mapping.vendor,
        raw_config: rawConfig,
        security_intent: verifiedIntent.id,
        normalized_intent: {
          category: verifiedIntent.category,
          ...verifiedIntent.schema
        },
        confidence: kbHit.boostedConfidence,
        status: DECISION_STATUS.AUTO_ACCEPTED,
        cisControlMapping: verifiedIntent.cisControlMapping,
        evidence: [
          `Matched human-verified knowledge base entry ${kbHit.mapping.id} (${kbHit.matchType}).`,
          `Verified by ${kbHit.mapping.operator} on ${kbHit.mapping.timestamp}.`,
          `Initial confidence before verification: ${(kbHit.mapping.confidence_before * 100).toFixed(1)}%.`
        ]
      };
    }
  }

  // 2. Vector Space Similarity Matching against Canonical Prototypes
  const matches = findSimilarIntents(rawConfig, 3);
  if (!matches || matches.length === 0) {
    return {
      vendor: vendorHint,
      raw_config: rawConfig,
      security_intent: 'UNMAPPED_CONFIGURATION',
      normalized_intent: null,
      confidence: 0.0,
      status: DECISION_STATUS.REJECTED,
      evidence: ['No semantic prototypes matched the input.']
    };
  }

  const topMatch = matches[0];
  const runnerUp = matches.length > 1 ? matches[1] : null;

  // 3. Calibrated Confidence & Decision Routing
  const confResult = evaluateConfidence(topMatch, runnerUp);
  const canonicalDef = CANONICAL_INTENTS[topMatch.intentId];

  // 4. Synthesize Evidence Array
  const tokens = tokenizeConfig(rawConfig);
  const evidence = [
    `Top prototype matched: "${topMatch.prototype}" (raw cosine similarity: ${(topMatch.similarity * 100).toFixed(1)}%)`,
    `Extracted semantic tokens: [${tokens.join(', ')}]`,
    `Calibrated confidence score: ${(confResult.confidence * 100).toFixed(1)}%`,
    confResult.explanation
  ];

  if (runnerUp) {
    evidence.push(
      `Margin separation over runner-up intent "${runnerUp.intentId}" (${(runnerUp.similarity * 100).toFixed(1)}%): +${(confResult.margin * 100).toFixed(1)}%`
    );
  }

  return {
    vendor: vendorHint,
    raw_config: rawConfig,
    security_intent: canonicalDef.id,
    normalized_intent: {
      category: canonicalDef.category,
      ...canonicalDef.schema
    },
    confidence: confResult.confidence,
    status: confResult.status,
    cisControlMapping: canonicalDef.cisControlMapping,
    evidence
  };
}
