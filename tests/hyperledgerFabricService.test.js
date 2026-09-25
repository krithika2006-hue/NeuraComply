import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  FABRIC_NETWORK_CONFIG,
  generateFabricTxId,
  truncateFabricHash,
  INITIAL_FABRIC_BLOCKS
} from '../src/data/hyperledgerFabricService.js';

describe('Hyperledger Fabric v2.5 LTS Enterprise Ledger Service', () => {
  describe('Fabric Network Topology & Channel Configuration', () => {
    test('enforces dual-organization MSP configuration (SecOps + Auditor)', () => {
      assert.equal(FABRIC_NETWORK_CONFIG.channel, 'neura-compliance-channel');
      assert.match(FABRIC_NETWORK_CONFIG.chaincode, /neura-audit-cc/);
      assert.match(FABRIC_NETWORK_CONFIG.consensus, /Raft/);
      assert.equal(FABRIC_NETWORK_CONFIG.endorsementPolicy, "AND('Org1MSP.peer', 'AuditorMSP.peer')");

      const msps = FABRIC_NETWORK_CONFIG.organizations.map(o => o.mspId);
      assert.ok(msps.includes('Org1MSP'), 'Org1MSP must be configured');
      assert.ok(msps.includes('AuditorMSP'), 'AuditorMSP must be configured');
      assert.equal(FABRIC_NETWORK_CONFIG.organizations.length, 2);
    });

    test('validates 3-node Raft crash-fault tolerant orderer cluster', () => {
      assert.equal(FABRIC_NETWORK_CONFIG.orderers.length, 3);
      for (const orderer of FABRIC_NETWORK_CONFIG.orderers) {
        assert.match(orderer, /:7050$/, 'Orderers should listen on standard Fabric port 7050');
      }
    });
  });

  describe('Fabric Transaction ID & Cryptographic Hashes', () => {
    test('generates valid 64-character hex Fabric transaction ID', () => {
      const txId1 = generateFabricTxId('AUDIT_SCAN_CISCO_CAT9300');
      const txId2 = generateFabricTxId('AUDIT_SCAN_JUNIPER_SRX');

      assert.equal(txId1.length, 64);
      assert.equal(txId2.length, 64);
      assert.match(txId1, /^[0-9a-fA-F]{64}$/);
      assert.match(txId2, /^[0-9a-fA-F]{64}$/);
      assert.notEqual(txId1, txId2);
    });

    test('truncates Fabric hashes cleanly for ledger explorer UI', () => {
      const hash = 'e78d91b4a2c0918274615243dfb9081234567890abcdef1234567890abcdef12';
      const truncated = truncateFabricHash(hash, 8, 6);
      assert.equal(truncated, 'e78d91b4...cdef12');
    });
  });

  describe('Fabric Block Validation & Dual-Peer Endorsement', () => {
    test('verifies all committed audit blocks contain dual-peer endorsements', () => {
      const auditBlocks = INITIAL_FABRIC_BLOCKS.filter(b => b.blockNumber >= 2);
      assert.ok(auditBlocks.length >= 3);

      for (const block of auditBlocks) {
        assert.equal(block.channelId, 'neura-compliance-channel');
        assert.equal(block.validationCode, 'VALID (TxValidationCode 0)');

        // Validate endorsing peers satisfy AND('Org1MSP.peer', 'AuditorMSP.peer')
        const msps = block.endorsingPeers.map(p => p.msp);
        assert.ok(msps.includes('Org1MSP'), `Block #${block.blockNumber} must have Org1MSP endorsement`);
        assert.ok(msps.includes('AuditorMSP'), `Block #${block.blockNumber} must have AuditorMSP endorsement`);

        for (const peer of block.endorsingPeers) {
          assert.equal(peer.status, 'ENDORSED_200');
        }
      }

      // Check genesis block has orderer consensus commitment
      const genesis = INITIAL_FABRIC_BLOCKS.find(b => b.blockNumber === 1);
      assert.ok(genesis);
      assert.equal(genesis.mspId, 'OrdererOrg');
      assert.equal(genesis.endorsingPeers[0].status, 'GENESIS_COMMITTED');
    });

    test('verifies read-write set isolation on ledger state mutations', () => {
      for (const block of INITIAL_FABRIC_BLOCKS) {
        assert.ok(block.readWriteSet, `Block #${block.blockNumber} must define readWriteSet`);
        assert.ok(Array.isArray(block.readWriteSet.readKeys), 'readKeys must be an array');
        assert.ok(Array.isArray(block.readWriteSet.writtenKeys), 'writtenKeys must be an array');
      }
    });

    test('validates block hash linkage on neura-compliance-channel', () => {
      const sorted = [...INITIAL_FABRIC_BLOCKS].sort((a, b) => a.blockNumber - b.blockNumber);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const current = sorted[i];
        assert.equal(
          current.previousBlockHash,
          prev.currentBlockHash,
          `Fabric block #${current.blockNumber} previousBlockHash must match block #${prev.blockNumber} currentBlockHash`
        );
      }
    });
  });
});
