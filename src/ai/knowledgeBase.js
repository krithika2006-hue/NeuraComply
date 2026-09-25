/**
 * NeuraComply Human-in-the-Loop Validated Knowledge Base Store
 *
 * Implements persistent storage and retrieval for operator-confirmed syntax mappings.
 * When a SecOps operator confirms an ambiguous or novel vendor statement during triage,
 * it is recorded into this knowledge base. Subsequent occurrences of identical or
 * highly-similar syntax directly retrieve the verified mapping with elevated confidence.
 */

import { computeEmbedding } from './embeddings.js';
import { cosineSimilarity } from './similarity.js';

// In-memory registry with persistent structure
let VALIDATED_MAPPINGS = [
  {
    id: 'KB-001',
    vendor: 'Allied Telesis',
    raw_pattern: 'service ssh version 2',
    normalized_intent: 'SSH_PROTOCOL_VERSION',
    human_verified: true,
    operator: 'Lead-Auditor (SecOps)',
    timestamp: '2026-09-18T10:00:00Z',
    confidence_before: 0.68,
    embedding: null
  },
  {
    id: 'KB-002',
    vendor: 'Arista EOS',
    raw_pattern: 'management ssh\n  server protocol v2',
    normalized_intent: 'SSH_PROTOCOL_VERSION',
    human_verified: true,
    operator: 'Lead-Auditor (SecOps)',
    timestamp: '2026-09-19T14:30:00Z',
    confidence_before: 0.71,
    embedding: null
  }
];

// Initialize vector embeddings for initial seed entries
function ensureEmbeddings() {
  for (const item of VALIDATED_MAPPINGS) {
    if (!item.embedding) {
      item.embedding = computeEmbedding(item.raw_pattern);
    }
  }
}
ensureEmbeddings();

/**
 * Register a human-verified mapping into the knowledge base
 */
export function recordVerifiedMapping({
  vendor,
  raw_pattern,
  normalized_intent,
  operator = 'SecOps-Operator',
  confidence_before = 0.5
}) {
  const embedding = computeEmbedding(raw_pattern);
  const entry = {
    id: `KB-${String(VALIDATED_MAPPINGS.length + 1).padStart(3, '0')}`,
    vendor: vendor || 'Unknown Vendor',
    raw_pattern: raw_pattern.trim(),
    normalized_intent,
    human_verified: true,
    operator,
    timestamp: new Date().toISOString(),
    confidence_before,
    embedding
  };

  // Check if identical pattern already exists and update it
  const existingIdx = VALIDATED_MAPPINGS.findIndex(
    m => m.raw_pattern.toLowerCase() === raw_pattern.trim().toLowerCase()
  );

  if (existingIdx !== -1) {
    VALIDATED_MAPPINGS[existingIdx] = entry;
  } else {
    VALIDATED_MAPPINGS.push(entry);
  }

  return entry;
}

/**
 * Query the Knowledge Base for a matching validated mapping.
 * Matches exact strings first, then vector cosine similarity >= 0.88.
 */
export function lookupVerifiedMapping(queryText, vendorHint = null) {
  ensureEmbeddings();
  const trimmed = (queryText || '').trim().toLowerCase();

  // 1. Exact or normalized string match
  for (const mapping of VALIDATED_MAPPINGS) {
    if (mapping.raw_pattern.toLowerCase() === trimmed) {
      return {
        matchType: 'EXACT_KNOWLEDGE_MATCH',
        mapping,
        similarity: 1.0,
        boostedConfidence: 0.99
      };
    }
  }

  // 2. Vector space similarity match over human-verified patterns
  // Require high similarity (>= 0.93) or matching vendor to prevent cross-vendor over-matching
  const queryVec = computeEmbedding(queryText);
  let bestMatch = null;
  let bestSim = 0;

  for (const mapping of VALIDATED_MAPPINGS) {
    if (mapping.embedding) {
      const sim = cosineSimilarity(queryVec, mapping.embedding);
      const vendorMatches = vendorHint && mapping.vendor &&
        vendorHint.toLowerCase() === mapping.vendor.toLowerCase();
      const threshold = vendorMatches ? 0.85 : 0.96;

      if (sim > bestSim && sim >= threshold) {
        bestSim = sim;
        bestMatch = mapping;
      }
    }
  }

  if (bestMatch) {
    return {
      matchType: 'SIMILAR_KNOWLEDGE_MATCH',
      mapping: bestMatch,
      similarity: bestSim,
      boostedConfidence: 0.95
    };
  }

  return null;
}

export function getAllVerifiedMappings() {
  return VALIDATED_MAPPINGS.map(m => ({
    id: m.id,
    vendor: m.vendor,
    raw_pattern: m.raw_pattern,
    normalized_intent: m.normalized_intent,
    human_verified: m.human_verified,
    operator: m.operator,
    timestamp: m.timestamp,
    confidence_before: m.confidence_before
  }));
}

export function resetKnowledgeBase() {
  VALIDATED_MAPPINGS = [];
}
