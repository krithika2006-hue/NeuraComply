/**
 * Cosine Similarity & Vector Space Prototype Matching Engine
 */

import { computeEmbedding, EMBEDDING_DIMENSION } from './embeddings.js';
import { CANONICAL_INTENTS } from './intentSchema.js';

/**
 * Compute cosine similarity between two vectors:
 * cos(u, v) = (u . v) / (||u|| * ||v||)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator < 1e-9) return 0;

  const sim = dotProduct / denominator;
  // Clamp between -1.0 and 1.0 to eliminate float precision anomalies
  return Math.max(-1.0, Math.min(1.0, sim));
}

// Precomputed prototypes cache: { intentId: [{ prototype, embedding }, ...] }
let CACHED_PROTOTYPES = null;

export function getCachedPrototypes() {
  if (CACHED_PROTOTYPES) return CACHED_PROTOTYPES;

  CACHED_PROTOTYPES = [];
  for (const [intentId, intentDef] of Object.entries(CANONICAL_INTENTS)) {
    for (const proto of intentDef.canonicalPrototypes) {
      CACHED_PROTOTYPES.push({
        intentId,
        category: intentDef.category,
        prototypeText: proto,
        embedding: computeEmbedding(proto),
        schema: intentDef.schema,
        cisControlMapping: intentDef.cisControlMapping
      });
    }
  }

  return CACHED_PROTOTYPES;
}

/**
 * Find highest similarity matches for a configuration statement
 * against all canonical intent prototype representations.
 */
export function findSimilarIntents(queryText, topK = 3) {
  const queryVec = computeEmbedding(queryText);
  const prototypes = getCachedPrototypes();

  const matchesByIntent = new Map();

  for (const proto of prototypes) {
    const sim = cosineSimilarity(queryVec, proto.embedding);

    const existing = matchesByIntent.get(proto.intentId);
    if (!existing || sim > existing.similarity) {
      matchesByIntent.set(proto.intentId, {
        intentId: proto.intentId,
        category: proto.category,
        prototype: proto.prototypeText,
        similarity: sim,
        schema: proto.schema,
        cisControlMapping: proto.cisControlMapping
      });
    }
  }

  const sorted = Array.from(matchesByIntent.values())
    .sort((a, b) => b.similarity - a.similarity);

  return sorted.slice(0, topK);
}
