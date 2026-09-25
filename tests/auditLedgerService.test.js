import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePseudoSha256,
  truncateHash,
  INITIAL_LEDGER_BLOCKS,
  createAuditBlock
} from '../src/data/auditLedgerService.js';

describe('Audit Ledger & Hash Chaining Engine', () => {
  describe('Cryptographic Hashing & Formatting', () => {
    test('produces deterministic 64-character hex strings with 0x prefix', () => {
      const hash1 = generatePseudoSha256('TEST_PAYLOAD_STRING_ABC');
      const hash2 = generatePseudoSha256('TEST_PAYLOAD_STRING_ABC');
      const hashDiff = generatePseudoSha256('TEST_PAYLOAD_STRING_XYZ');

      assert.equal(hash1, hash2, 'Identical inputs must produce identical hashes');
      assert.notEqual(hash1, hashDiff, 'Different inputs must produce distinct hashes');
      assert.match(hash1, /^0x[0-9a-fA-F]{64}$/, 'Hash must be 0x followed by 64 hex characters');
    });

    test('truncates 64-char hashes for UI display with ellipsis', () => {
      const fullHash = '0x8f3c1b9942a1705e3db1c527e0294da9c31405b6329ef31a78c1b4802e8412af';
      const truncated = truncateHash(fullHash, 6, 4);
      assert.equal(truncated, '0x8f3c1b...12af');
      assert.ok(truncated.length < fullHash.length);
    });

    test('handles empty or short hashes gracefully', () => {
      assert.equal(truncateHash(''), '');
      assert.equal(truncateHash('0x1234'), '0x1234');
    });
  });

  describe('Genesis Block & Cryptographic Hash Chain Integrity', () => {
    test('validates Genesis Block integrity', () => {
      const genesis = INITIAL_LEDGER_BLOCKS.find(b => b.index === 1);
      assert.ok(genesis, 'Genesis block must exist at index 1');
      assert.equal(genesis.eventType, 'GENESIS_ANCHOR');
      assert.match(genesis.previousHash, /^0x0+$/);
    });

    test('verifies consecutive block hash linking throughout initial chain', () => {
      // Sort ascending by index
      const sorted = [...INITIAL_LEDGER_BLOCKS].sort((a, b) => a.index - b.index);

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const current = sorted[i];

        assert.equal(
          current.previousHash,
          prev.currentHash,
          `Block #${current.index} previousHash must equal Block #${prev.index} currentHash`
        );
      }
    });

    test('creates new audit blocks dynamically with valid cryptographic linkage', () => {
      const latestBlock = INITIAL_LEDGER_BLOCKS[0]; // highest index in default list
      const newBlock = createAuditBlock({
        previousBlock: latestBlock,
        eventType: 'REMEDIATION_CONFIRMED',
        eventTitle: 'SSHv2 Policy Applied',
        eventDescription: 'Applied transport input ssh to Cisco Catalyst 9300',
        targetSystem: 'Cisco Catalyst 9300 (IOS-XE 17.6)',
        operator: 'Krithika S. (SecOps Admin)',
        metadata: { ruleId: 'CIS-2.1.4', status: 'remediated' }
      });

      assert.equal(newBlock.index, latestBlock.index + 1);
      assert.equal(newBlock.previousHash, latestBlock.currentHash);
      assert.match(newBlock.currentHash, /^0x[0-9a-fA-F]{64}$/);
      assert.match(newBlock.timestamp, /UTC$/);
      assert.equal(newBlock.eventType, 'REMEDIATION_CONFIRMED');
    });
  });

  describe('Tamper-Evidence & Anti-Tamper Detection', () => {
    function verifyChainIntegrity(blocks) {
      const sorted = [...blocks].sort((a, b) => a.index - b.index);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const current = sorted[i];
        if (current.previousHash !== prev.currentHash) {
          return { valid: false, brokenAtIndex: current.index, reason: 'Parent hash mismatch' };
        }
      }
      return { valid: true };
    }

    test('detects an intact ledger chain as valid', () => {
      const result = verifyChainIntegrity(INITIAL_LEDGER_BLOCKS);
      assert.equal(result.valid, true);
    });

    test('mathematically flags tampering if an attacker modifies historical block data', () => {
      // Clone blocks
      const tamperedBlocks = JSON.parse(JSON.stringify(INITIAL_LEDGER_BLOCKS));
      const targetBlock = tamperedBlocks.find(b => b.index === 2);

      // Malicious insider alters historical event description and fake hash
      targetBlock.eventDescription = 'Tampered: Changed audit findings to suppress security violation';
      targetBlock.currentHash = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

      const result = verifyChainIntegrity(tamperedBlocks);
      assert.equal(result.valid, false, 'Tampered ledger must be flagged as invalid');
      assert.equal(result.brokenAtIndex, 3, 'Integrity verification must fail at block 3 due to mismatched previousHash');
    });
  });
});
