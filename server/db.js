import pg from 'pg';
import { VENDOR_PRESETS, AUDIT_CONTROLS, TRIAGE_ITEMS } from '../src/data/mockData.js';
import { INITIAL_FABRIC_BLOCKS } from '../src/data/hyperledgerFabricService.js';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'neuracomply',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Devices Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        vendor VARCHAR(128),
        os VARCHAR(128),
        checksum VARCHAR(128),
        line_count INTEGER,
        interfaces_detected INTEGER,
        protocol_footprint JSONB,
        initial_score INTEGER,
        what_if_score INTEGER,
        controls_passed INTEGER,
        controls_warning INTEGER,
        controls_violation INTEGER,
        file_name VARCHAR(255),
        raw_snippet TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Audit Scans Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_scans (
        id VARCHAR(64) PRIMARY KEY,
        device_id VARCHAR(64) REFERENCES devices(id) ON DELETE CASCADE,
        timestamp_iso VARCHAR(64),
        compliance_score NUMERIC(5,2),
        remediated_score NUMERIC(5,2),
        merkle_state_root VARCHAR(128),
        tx_id VARCHAR(128),
        violations_count INTEGER,
        warnings_count INTEGER,
        passed_count INTEGER,
        hitl_reviewed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Audit Controls Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_controls (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(64) REFERENCES devices(id) ON DELETE CASCADE,
        control_id VARCHAR(64),
        title VARCHAR(255),
        framework VARCHAR(128),
        category VARCHAR(128),
        severity VARCHAR(64),
        status VARCHAR(64),
        offending_snippet JSONB,
        remediation_command TEXT,
        ast_canonical_rule TEXT,
        audit_reason TEXT
      );
    `);

    // 4. Triage Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS triage_items (
        id VARCHAR(64) PRIMARY KEY,
        rule_id VARCHAR(64),
        title VARCHAR(255),
        vendor VARCHAR(128),
        control_code VARCHAR(128),
        category VARCHAR(128),
        type VARCHAR(64),
        confidence NUMERIC(5,2),
        confidence_reason TEXT,
        action_taken VARCHAR(255),
        risk_tier VARCHAR(64),
        remediation_script TEXT,
        rollback_script TEXT,
        can_confirm BOOLEAN DEFAULT TRUE,
        confirmed BOOLEAN DEFAULT FALSE,
        operator_note TEXT,
        operator_signed_by VARCHAR(255),
        signed_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // 5. Ledger Blocks Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ledger_blocks (
        block_number INTEGER PRIMARY KEY,
        tx_id VARCHAR(128) NOT NULL,
        timestamp VARCHAR(64) NOT NULL,
        channel_id VARCHAR(128) DEFAULT 'neura-compliance-channel',
        chaincode_id VARCHAR(128) DEFAULT 'neura-audit-cc:v1.4.0',
        validation_code VARCHAR(64) DEFAULT 'VALID (TxValidationCode 0)',
        event_type VARCHAR(64) NOT NULL,
        event_title VARCHAR(255) NOT NULL,
        event_description TEXT,
        target_system VARCHAR(255),
        operator VARCHAR(255),
        msp_id VARCHAR(64) DEFAULT 'Org1MSP',
        payload_hash VARCHAR(128) NOT NULL,
        previous_block_hash VARCHAR(128) NOT NULL,
        current_block_hash VARCHAR(128) NOT NULL,
        endorsing_peers JSONB,
        read_write_set JSONB,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('[PostgreSQL] Database tables initialized successfully.');

    // Seed Initial Data if empty
    await seedInitialData(client);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PostgreSQL] Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function seedInitialData(client) {
  // Check if devices table is empty
  const devCheck = await client.query('SELECT COUNT(*) FROM devices');
  if (parseInt(devCheck.rows[0].count, 10) === 0) {
    console.log('[PostgreSQL] Seeding baseline vendor preset devices...');
    for (const preset of VENDOR_PRESETS) {
      await client.query(`
        INSERT INTO devices (
          id, name, role, vendor, os, checksum, line_count, interfaces_detected,
          protocol_footprint, initial_score, what_if_score, controls_passed,
          controls_warning, controls_violation, file_name, raw_snippet
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING;
      `, [
        preset.id,
        preset.name,
        preset.role,
        preset.vendor,
        preset.os,
        preset.checksum,
        preset.lineCount,
        preset.interfacesDetected,
        JSON.stringify(preset.protocolFootprint),
        preset.initialScore,
        preset.whatIfScore,
        preset.controlsPassed,
        preset.controlsWarning,
        preset.controlsViolation,
        preset.fileName,
        preset.rawSnippet
      ]);

      // Seed audit controls for each preset
      for (const ctrl of AUDIT_CONTROLS) {
        await client.query(`
          INSERT INTO audit_controls (
            device_id, control_id, title, framework, category, severity,
            status, offending_snippet, remediation_command, ast_canonical_rule, audit_reason
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
        `, [
          preset.id,
          ctrl.id,
          ctrl.title,
          ctrl.framework,
          ctrl.category,
          ctrl.severity,
          ctrl.status,
          ctrl.offendingSnippet ? JSON.stringify(ctrl.offendingSnippet) : null,
          ctrl.remediationCommand,
          ctrl.astCanonicalRule,
          ctrl.auditReason
        ]);
      }
    }
  }

  // Seed / Sync triage items
  for (const item of TRIAGE_ITEMS) {
      await client.query(`
        INSERT INTO triage_items (
          id, rule_id, title, vendor, control_code, category, type,
          confidence, confidence_reason, action_taken, risk_tier,
          remediation_script, rollback_script, can_confirm, confirmed, operator_note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          confidence = EXCLUDED.confidence,
          type = EXCLUDED.type,
          can_confirm = EXCLUDED.can_confirm;
      `, [
        item.id,
        item.ruleId,
        item.title,
        item.vendor,
        item.controlCode,
        item.category,
        item.type,
        item.confidence,
        item.confidenceReason,
        item.actionTaken,
        item.riskTier,
        item.remediationScript,
        item.rollbackScript,
        item.canConfirm,
        item.confirmed,
        item.operatorNote || null
      ]);
    }

  // Check if ledger_blocks is empty
  const ledgerCheck = await client.query('SELECT COUNT(*) FROM ledger_blocks');
  if (parseInt(ledgerCheck.rows[0].count, 10) === 0) {
    console.log('[PostgreSQL] Seeding Hyperledger Fabric blocks...');
    for (const block of INITIAL_FABRIC_BLOCKS) {
      await client.query(`
        INSERT INTO ledger_blocks (
          block_number, tx_id, timestamp, channel_id, chaincode_id, validation_code,
          event_type, event_title, event_description, target_system, operator,
          msp_id, payload_hash, previous_block_hash, current_block_hash,
          endorsing_peers, read_write_set, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (block_number) DO NOTHING;
      `, [
        block.blockNumber,
        block.txId,
        block.timestamp,
        block.channelId,
        block.chaincodeId,
        block.validationCode,
        block.eventType,
        block.eventTitle,
        block.eventDescription,
        block.targetSystem,
        block.operator,
        block.mspId,
        block.payloadHash,
        block.previousBlockHash,
        block.currentBlockHash,
        JSON.stringify(block.endorsingPeers),
        JSON.stringify(block.readWriteSet),
        JSON.stringify(block.metadata)
      ]);
    }
  }
}
