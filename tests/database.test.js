import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool, initDatabase } from '../server/db.js';

describe('PostgreSQL Database & Backend Integration', () => {
  before(async () => {
    await initDatabase();
  });

  after(async () => {
    await pool.end();
  });

  test('successfully connects to PostgreSQL 15 on port 5432 (neuracomply)', async () => {
    const res = await pool.query('SELECT current_database() as db, version() as ver');
    assert.equal(res.rows[0].db, 'neuracomply');
    assert.match(res.rows[0].ver, /PostgreSQL 15/);
  });

  test('verifies all 5 core enterprise relational tables exist in PostgreSQL', async () => {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = res.rows.map(r => r.table_name);
    assert.ok(tables.includes('devices'), 'devices table must exist');
    assert.ok(tables.includes('audit_scans'), 'audit_scans table must exist');
    assert.ok(tables.includes('audit_controls'), 'audit_controls table must exist');
    assert.ok(tables.includes('triage_items'), 'triage_items table must exist');
    assert.ok(tables.includes('ledger_blocks'), 'ledger_blocks table must exist');
  });

  test('verifies seeded baseline vendor devices exist in PostgreSQL', async () => {
    const res = await pool.query('SELECT id, name, vendor, initial_score FROM devices');
    assert.ok(res.rows.length >= 4, 'Should contain at least 4 seeded vendor devices');
    const cisco = res.rows.find(d => d.vendor === 'Cisco Systems');
    assert.ok(cisco);
    assert.ok(cisco.initial_score > 0);
  });

  test('verifies seeded confidence triage items and routes in PostgreSQL', async () => {
    const res = await pool.query('SELECT id, type, confidence, can_confirm, confirmed FROM triage_items');
    assert.ok(res.rows.length >= 5, 'Should contain at least 5 triage items');

    const autoResolved = res.rows.filter(i => i.type === 'auto-resolved');
    assert.ok(autoResolved.length >= 3);
    for (const item of autoResolved) {
      assert.ok(parseFloat(item.confidence) >= 80.0);
    }

    const humanReview = res.rows.filter(i => i.type === 'human-review');
    assert.ok(humanReview.length >= 2);
    for (const item of humanReview) {
      assert.ok(parseFloat(item.confidence) < 80.0);
      assert.equal(item.can_confirm, true);
    }
  });

  test('verifies ledger blocks are cryptographically chained in PostgreSQL', async () => {
    const res = await pool.query('SELECT block_number, previous_block_hash, current_block_hash FROM ledger_blocks ORDER BY block_number ASC');
    const blocks = res.rows;
    assert.ok(blocks.length >= 4, 'Should contain at least 4 ledger blocks');

    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1];
      const current = blocks[i];
      assert.equal(
        current.previous_block_hash,
        prev.current_block_hash,
        `Block #${current.block_number} previous_block_hash must match block #${prev.block_number} current_block_hash`
      );
    }
  });

  test('inserts and retrieves an audit scan with Merkle state root in PostgreSQL', async () => {
    const testDeviceId = 'cisco-cat9300';
    const testScanId = `SCAN-TEST-${Date.now()}`;
    const testMerkleRoot = '0x3b89e7f891a0c44192bcaef89104d5e718293abcf78192039485710293847561';

    await pool.query(`
      INSERT INTO audit_scans (
        id, device_id, timestamp_iso, compliance_score, remediated_score,
        merkle_state_root, tx_id, violations_count, warnings_count, passed_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      testScanId,
      testDeviceId,
      new Date().toISOString(),
      87.5,
      98.0,
      testMerkleRoot,
      'tx-test-998',
      3,
      4,
      35
    ]);

    const queryRes = await pool.query('SELECT * FROM audit_scans WHERE id = $1', [testScanId]);
    assert.equal(queryRes.rows.length, 1);
    assert.equal(queryRes.rows[0].merkle_state_root, testMerkleRoot);

    // Clean up test scan
    await pool.query('DELETE FROM audit_scans WHERE id = $1', [testScanId]);
  });
});
