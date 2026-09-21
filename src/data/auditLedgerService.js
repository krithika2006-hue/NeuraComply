/**
 * NeuraComply Immutable Audit Trail Service
 * Simulated Tamper-Evident Hash Chain Engine
 *
 * NOTE: Mocked entirely in frontend state for SIH prototype demonstration.
 * In a production deployment, this would anchor to a permissioned distributed
 * ledger (e.g., Hyperledger Fabric / Ethereum Enterprise) for multi-stakeholder audit trust.
 */

// Simple deterministic hash generator producing realistic 64-char SHA-256 hex strings
export function generatePseudoSha256(seed) {
  let h1 = 0xdeadbeef ^ seed.length;
  let h2 = 0x41c64e6d ^ seed.length;
  let h3 = 0x5a827999 ^ seed.length;
  let h4 = 0x6ed9eba1 ^ seed.length;

  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3812041921);
    h4 = Math.imul(h4 ^ ch, 2246822507);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const hex4 = (h4 >>> 0).toString(16).padStart(8, '0');
  
  // Stretch to 64 hex characters like true SHA-256
  const rev1 = hex1.split('').reverse().join('');
  const rev2 = hex2.split('').reverse().join('');
  const rev3 = hex3.split('').reverse().join('');
  const rev4 = hex4.split('').reverse().join('');

  return `0x${hex1}${hex2}${hex3}${hex4}${rev1}${rev2}${rev3}${rev4}`;
}

export function truncateHash(hash, startLen = 6, endLen = 4) {
  if (!hash) return '';
  if (hash.length <= startLen + endLen + 2) return hash;
  return `${hash.slice(0, startLen + 2)}...${hash.slice(-endLen)}`;
}

export const INITIAL_LEDGER_BLOCKS = [
  {
    index: 4,
    timestamp: '2026-09-11 11:24:02 UTC',
    eventType: 'VIOLATION_FLAGGED',
    eventTitle: 'Deterministic AST Policy Violations Flagged',
    eventDescription: 'Evaluated 42 CIS / CERT-In controls against AST. Flagged 3 high-severity rule violations (SSH-v1 fallback, Telnet plaintext active, VTY ACL missing).',
    targetSystem: 'Cisco Catalyst 9300 (IOS-XE 17.9)',
    operator: 'NeuraComply Engine (Automated)',
    payloadHash: generatePseudoSha256('VIOLATION_FLAGGED_42_CONTROLS_CIS_CAT9300'),
    previousHash: '0x8f3c1b9942a1705e3db1c527e0294da9c31405b6329ef31a78c1b4802e8412af',
    currentHash: '0x5e2b810f912c474d284a1b89ef03a452cb1094038a8e19c3b77209ff8203c942',
    metadata: {
      framework: 'CIS Benchmark v1.4 / CERT-In CI-2024',
      rulesEvaluated: 42,
      violationsCount: 3,
      confidenceAvg: '97.4%'
    }
  },
  {
    index: 3,
    timestamp: '2026-09-11 11:23:48 UTC',
    eventType: 'SCAN_COMPLETED',
    eventTitle: 'Full Canonical AST Scan Executed',
    eventDescription: 'Grammar parsed to Vendor-Agnostic Canonical AST; validated 3,420 nodes across interfaces, AAA, crypto, and telemetry hierarchy.',
    targetSystem: 'Cisco Catalyst 9300 (IOS-XE 17.9)',
    operator: 'SecOps-Auditor (Admin)',
    payloadHash: generatePseudoSha256('SCAN_COMPLETED_CANONICAL_AST_NODE_INGEST_3420'),
    previousHash: '0xb231fa8820c746e01a88b2094c8e71549420b83e4088001e792c3983f4b82931',
    currentHash: '0x8f3c1b9942a1705e3db1c527e0294da9c31405b6329ef31a78c1b4802e8412af',
    metadata: {
      astNodesCount: 3420,
      grammarRevision: 'ANTLR4-Cisco-IOSXE-v2.1',
      parseTimeMs: 312
    }
  },
  {
    index: 2,
    timestamp: '2026-09-11 11:23:15 UTC',
    eventType: 'CONFIG_INGESTED',
    eventTitle: 'Device Configuration Checksum Ingested',
    eventDescription: 'Running configuration raw bytes ingested and normalized. Baseline checksum securely fingerprinted and anchored.',
    targetSystem: 'Cisco Catalyst 9300 (IOS-XE 17.9)',
    operator: 'SecOps-Auditor (Admin)',
    payloadHash: generatePseudoSha256('CONFIG_INGESTED_CISCO_CAT9300_BASE_CONFIG_SHA'),
    previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    currentHash: '0xb231fa8820c746e01a88b2094c8e71549420b83e4088001e792c3983f4b82931',
    metadata: {
      configSizeKb: '14.8 KB',
      interfaceCount: 48,
      vlanCount: 8
    }
  },
  {
    index: 1,
    timestamp: '2026-09-11 11:20:00 UTC',
    eventType: 'GENESIS_ANCHOR',
    eventTitle: 'Genesis Block & Audit Policy Anchor',
    eventDescription: 'Root trust anchored for NeuraComply Compliance Auditor. Policy rule definitions verified against CIS Network Benchmark & NIST SP 800-53 r5.',
    targetSystem: 'NeuraComply Core Trust Authority',
    operator: 'System Bootstrap (Authority)',
    payloadHash: generatePseudoSha256('GENESIS_ROOT_TRUST_NEURACOMPLY_POLICY_V1.4'),
    previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    currentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    metadata: {
      consensus: 'Proof of Authority (Simulated)',
      complianceStandard: 'ISO 27001 / SOC2 Type II / SIH 2026'
    }
  }
];

export function createAuditBlock({
  previousBlock,
  eventType,
  eventTitle,
  eventDescription,
  targetSystem = 'Cisco Catalyst 9300 (IOS-XE 17.9)',
  operator = 'SecOps Operator',
  metadata = {}
}) {
  const newIndex = (previousBlock?.index || 0) + 1;
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  
  const payloadString = `${eventType}_${eventTitle}_${JSON.stringify(metadata)}_${timestamp}`;
  const payloadHash = generatePseudoSha256(payloadString);
  const previousHash = previousBlock?.currentHash || '0x0000000000000000000000000000000000000000000000000000000000000000';
  const currentHash = generatePseudoSha256(`${newIndex}_${previousHash}_${payloadHash}`);

  return {
    index: newIndex,
    timestamp,
    eventType,
    eventTitle,
    eventDescription,
    targetSystem,
    operator,
    payloadHash,
    previousHash,
    currentHash,
    metadata
  };
}
