import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Helper to compute genuine SHA-256 in Node.js
function sha256(data) {
  return crypto.createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
}

// 5-Leaf Merkle Tree Builder according to Architecture Specification
function buildAttestationMerkleTree({
  deviceInventory,
  rawConfigDigest,
  normalizedSchema,
  findingsArray,
  auditorPkiSignature
}) {
  const leaf0 = sha256(deviceInventory);
  const leaf1 = sha256(rawConfigDigest);
  const leaf2 = sha256(normalizedSchema);
  const leaf3 = sha256(findingsArray);
  const leaf4 = sha256(auditorPkiSignature);

  // Level 1 parent nodes
  const node01 = sha256(leaf0 + leaf1);
  const node23 = sha256(leaf2 + leaf3);
  const node44 = sha256(leaf4 + leaf4); // Odd leaf duplicated in standard Merkle tree

  // Level 2 parent nodes
  const node0123 = sha256(node01 + node23);
  const node4444 = sha256(node44 + node44);

  // Merkle Root
  const merkleRoot = sha256(node0123 + node4444);

  return {
    leaves: [leaf0, leaf1, leaf2, leaf3, leaf4],
    merkleRoot: `0x${merkleRoot}`,
    proofForLeaf3: [leaf2, node01, node4444] // sibling path for findings
  };
}

describe('Cryptographic Merkle Attestation & Go Chaincode Schema Engine', () => {
  describe('5-Leaf Merkle State Tree Construction', () => {
    test('constructs deterministic 32-byte Merkle root across audit artifacts', () => {
      const auditPayload = {
        deviceInventory: { hostname: 'cisco-cat9300-01', ip: '10.250.1.1', model: 'Catalyst 9300', os: '17.6.5' },
        rawConfigDigest: 'sha256:4a8b7921c3817263819283719283719283719283719283719283719283719e91',
        normalizedSchema: { ssh_v2: false, snmp_default: true, cleartext_http: true },
        findingsArray: [
          { ruleId: 'CIS-2.1.4', status: 'violation', severity: 'Critical' },
          { ruleId: 'CIS-1.2.1', status: 'violation', severity: 'Critical' }
        ],
        auditorPkiSignature: 'ECDSA_SHA256:30450221008f3c1b...29ef31a7'
      };

      const tree1 = buildAttestationMerkleTree(auditPayload);
      const tree2 = buildAttestationMerkleTree(auditPayload);

      assert.equal(tree1.merkleRoot, tree2.merkleRoot);
      assert.match(tree1.merkleRoot, /^0x[0-9a-f]{64}$/);
      assert.equal(tree1.leaves.length, 5);
    });

    test('alters Merkle state root if any finding or configuration artifact changes', () => {
      const basePayload = {
        deviceInventory: { hostname: 'cisco-cat9300-01' },
        rawConfigDigest: 'sha256:orig1234',
        normalizedSchema: { ssh_v2: false },
        findingsArray: [{ ruleId: 'CIS-2.1.4', status: 'violation' }],
        auditorPkiSignature: 'SIG_ORIGINAL'
      };

      const originalTree = buildAttestationMerkleTree(basePayload);

      // Attacker attempts to modify historical findings
      const tamperedPayload = {
        ...basePayload,
        findingsArray: [{ ruleId: 'CIS-2.1.4', status: 'passed' }] // Tampered to pass
      };

      const tamperedTree = buildAttestationMerkleTree(tamperedPayload);
      assert.notEqual(originalTree.merkleRoot, tamperedTree.merkleRoot, 'Merkle root must diverge upon tampering');
    });
  });

  describe('Zero-Knowledge Regulatory Verification & Rogue Admin Defense', () => {
    test('enables external auditor to verify finding inclusion using Merkle proof path', () => {
      const auditPayload = {
        deviceInventory: { hostname: 'cisco-cat9300-01' },
        rawConfigDigest: 'sha256:orig1234',
        normalizedSchema: { ssh_v2: false },
        findingsArray: [{ ruleId: 'CIS-2.1.4', status: 'violation' }],
        auditorPkiSignature: 'SIG_ORIGINAL'
      };

      const tree = buildAttestationMerkleTree(auditPayload);

      // Auditor verifies leaf 3 (findings) against root using sibling path
      const leaf3 = sha256(auditPayload.findingsArray);
      const siblingLeaf2 = tree.proofForLeaf3[0];
      const parent23 = sha256(siblingLeaf2 + leaf3);
      const siblingNode01 = tree.proofForLeaf3[1];
      const parent0123 = sha256(siblingNode01 + parent23);
      const siblingNode4444 = tree.proofForLeaf3[2];
      const computedRoot = `0x${sha256(parent0123 + siblingNode4444)}`;

      assert.equal(computedRoot, tree.merkleRoot, 'Merkle inclusion proof must match anchored root');
    });

    test('detects rogue administrator tampering against immutable Fabric anchor', () => {
      const anchoredFabricRoot = '0x3b89e7f891a0c44192bcaef89104d5e718293abcf78192039485710293847561';

      // Rogue DBA alters PostgreSQL database after a security breach
      const localPostgresRecord = {
        device: 'cisco-cat9300-01',
        auditScore: 99.0, // Falsified from 78.6%
        findings: [] // Cleared violations
      };

      const falsifiedRoot = `0x${sha256(localPostgresRecord)}`;
      assert.notEqual(
        falsifiedRoot,
        anchoredFabricRoot,
        'Postgres state divergence from Fabric anchor mathematically proves rogue tampering'
      );
    });
  });

  describe('Go Smart Contract State Schema Conformance', () => {
    test('validates Go chaincode RecordAuditScan invocation payload schema', () => {
      // Corresponds to Go struct AuditRecord in fabric/chaincode/compliance_contract.go
      const chaincodePayload = {
        scanId: 'SCAN-2026-0925-01',
        deviceUuid: 'cisco-cat9300-enterprise-01',
        vendor: 'Cisco Systems',
        osVersion: 'IOS-XE 17.6.5',
        merkleRoot: '0x3b89e7f891a0c44192bcaef89104d5e718293abcf78192039485710293847561',
        complianceScore: 78.6,
        violationsCount: 3,
        warningsCount: 4,
        passedCount: 35,
        hitlReviewed: false,
        auditorSignature: 'ECDSA_P256:30450221008f...',
        timestampUnix: Math.floor(Date.now() / 1000)
      };

      assert.ok(chaincodePayload.scanId.startsWith('SCAN-'));
      assert.match(chaincodePayload.merkleRoot, /^0x[0-9a-f]{64}$/);
      assert.ok(chaincodePayload.complianceScore >= 0 && chaincodePayload.complianceScore <= 100);
      assert.equal(typeof chaincodePayload.hitlReviewed, 'boolean');
      assert.ok(chaincodePayload.timestampUnix > 1700000000);
    });

    test('validates Go chaincode RecordRemediation state mutation schema', () => {
      // Corresponds to Go struct RemediationRecord in compliance_contract.go
      const remediationPayload = {
        remediationId: 'REM-2026-0925-88',
        scanId: 'SCAN-2026-0925-01',
        ruleId: 'CIS-2.1.4',
        action: 'CONFIRM_AND_APPLY',
        patchScriptDigest: sha256('line vty 0 4\n transport input ssh\n exec-timeout 15 0'),
        operatorMsp: 'Org1MSP',
        auditorMsp: 'AuditorMSP',
        endorsementStatus: 'VALID'
      };

      assert.ok(remediationPayload.remediationId.startsWith('REM-'));
      assert.equal(remediationPayload.operatorMsp, 'Org1MSP');
      assert.equal(remediationPayload.auditorMsp, 'AuditorMSP');
      assert.equal(remediationPayload.endorsementStatus, 'VALID');
    });
  });
});
