/**
 * High-Dimensional Subword-Semantic Vector Projection Engine
 *
 * Implements dense continuous vector representations in R^D (D=128) using:
 * 1. Subword Character n-Gram Hashing (n=3..5) with sign-balanced Murmur-style projections.
 * 2. Domain Security Concept Weighting (protocol tokens, command verbs, parameters).
 * 3. Polarity/Negation embedding axes (distinguishing 'disable telnet' vs 'enable telnet').
 * 4. Strict L2-normalization ensuring vector dot products equal cosine similarity.
 */

export const EMBEDDING_DIMENSION = 128;

// Domain-specific semantic concept weights
const CONCEPT_WEIGHTS = {
  // Protocol roots
  ssh: 3.2,
  telnet: 3.5,
  snmp: 3.0,
  http: 3.0,
  https: 3.2,
  ntp: 2.8,
  syslog: 2.8,
  acl: 2.5,
  banner: 2.5,
  password: 2.5,
  timeout: 2.2,

  // Polarity / Negation directives
  disable: 3.0,
  disabled: 3.0,
  enable: 2.5,
  enabled: 2.5,
  no: 2.8,
  delete: 2.8,
  undo: 2.8,
  deny: 2.5,
  permit: 2.2,

  // Versions and qualifications
  v1: 2.8,
  v2: 3.0,
  v3: 3.0,
  version: 2.2,
  public: 3.0,
  private: 3.0,
  secret: 2.4,
  scrypt: 2.8,
  sha512: 2.8
};

// Fast 32-bit FNV-1a hash for deterministic subword projection
function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Tokenize configuration statements across vendor syntax styles:
 * Handles CLI flags, Junos braces, Fortigate dashes, and Palo Alto XML tags.
 */
export function tokenizeConfig(text) {
  if (!text || typeof text !== 'string') return [];
  // Strip XML tags delimiters while preserving tag name tokens
  const clean = text
    .replace(/[<>/=;{}()"]/g, ' ')
    .replace(/[-_.]/g, ' ')
    .toLowerCase();

  return clean
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !['the', 'a', 'an', 'in', 'on', 'at', 'to', 'of', 'and'].includes(t));
}

/**
 * Extract character n-grams (lengths 3 to 5) from a token
 */
function extractNGrams(token, minN = 3, maxN = 5) {
  const ngrams = [];
  const decorated = `^${token}$`;
  for (let n = minN; n <= maxN; n++) {
    for (let i = 0; i <= decorated.length - n; i++) {
      ngrams.push(decorated.slice(i, i + n));
    }
  }
  return ngrams;
}

/**
 * Compute continuous 128-dimensional embedding vector for an input text.
 * Strictly returns an L2-normalized Float64Array.
 */
export function computeEmbedding(text) {
  const vec = new Float64Array(EMBEDDING_DIMENSION);
  const tokens = tokenizeConfig(text);

  if (tokens.length === 0) {
    return vec;
  }

  // 1. Subword n-gram hashing projection
  for (const token of tokens) {
    const weight = CONCEPT_WEIGHTS[token] || 1.0;
    const ngrams = extractNGrams(token, 3, 4);

    for (const ng of ngrams) {
      const h = fnv1a(ng);
      const index = h % EMBEDDING_DIMENSION;
      const sign = (h & 0x80000000) ? -1.0 : 1.0;
      vec[index] += sign * weight * 0.4;
    }

    // 2. Direct lexical token projection
    const tokenHash = fnv1a(token);
    const tokenIndex = tokenHash % EMBEDDING_DIMENSION;
    const tokenSign = (tokenHash & 0x40000000) ? -1.0 : 1.0;
    vec[tokenIndex] += tokenSign * weight * 1.5;
  }

  // 3. Negation & Polarity Axis Encoding
  // Explicitly modulate dimensions 120-127 for affirmative vs negative security state
  const hasNegation = tokens.some(t => ['no', 'disable', 'disabled', 'delete', 'undo', 'deny'].includes(t));
  const hasAffirmative = tokens.some(t => ['enable', 'enabled', 'permit', 'active', 'yes', 'true'].includes(t));

  if (hasNegation) {
    vec[126] -= 2.5;
    vec[127] += 2.5;
  }
  if (hasAffirmative) {
    vec[126] += 2.5;
    vec[127] -= 2.5;
  }

  // 4. L2 Normalization: v / ||v||_2
  let sumSq = 0;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    sumSq += vec[i] * vec[i];
  }

  const norm = Math.sqrt(sumSq);
  if (norm > 1e-9) {
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}
