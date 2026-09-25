import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSecurityIntent } from '../src/ai/semanticEngine.js';
import { recordVerifiedMapping, resetKnowledgeBase } from '../src/ai/knowledgeBase.js';
import { setConfidenceThresholds, getConfidenceThresholds, DECISION_STATUS } from '../src/ai/confidence.js';
import { evaluateRealConfig } from '../src/data/auditParser.js';

describe('Semantic Intent Normalization Engine (AI/USS)', () => {
  beforeEach(() => {
    // Reset thresholds to default before each test
    setConfidenceThresholds({ high: 0.80, review: 0.60 });
  });

  test('test_same_intent_across_vendors(): maps 4 divergent vendor syntaxes to canonical SSH_PROTOCOL_VERSION', () => {
    const cisco = normalizeSecurityIntent('ip ssh version 2', 'Cisco');
    const juniper = normalizeSecurityIntent('set system services ssh protocol-version v2', 'Juniper');
    const fortinet = normalizeSecurityIntent('set admin-ssh-v1 disable', 'Fortinet');
    const paloAlto = normalizeSecurityIntent('<ssh><version>2</version></ssh>', 'Palo Alto');

    assert.equal(cisco.security_intent, 'SSH_PROTOCOL_VERSION');
    assert.equal(juniper.security_intent, 'SSH_PROTOCOL_VERSION');
    assert.equal(fortinet.security_intent, 'SSH_PROTOCOL_VERSION');
    assert.equal(paloAlto.security_intent, 'SSH_PROTOCOL_VERSION');

    // All must conform to Unified Security Schema properties
    assert.equal(cisco.normalized_intent.protocol, 'SSH');
    assert.equal(cisco.normalized_intent.minimum_version, '2');
    assert.equal(cisco.normalized_intent.category, 'secure_management');
  });

  test('test_high_confidence_mapping(): verifies well-formed syntax achieves AUTO_ACCEPTED status', () => {
    const res = normalizeSecurityIntent('ip ssh version 2', 'Cisco');
    assert.ok(res.confidence >= 0.80, `Expected confidence >= 0.80, got ${res.confidence}`);
    assert.equal(res.status, DECISION_STATUS.AUTO_ACCEPTED);
    assert.ok(res.evidence.length >= 3, 'Evidence trail must contain at least 3 explanation items');
  });

  test('test_low_confidence_routes_to_hitl(): routes borderline/ambiguous syntax to HUMAN_REVIEW triage', () => {
    // A syntax statement with partial keyword overlap that is borderline
    const res = normalizeSecurityIntent('crypto session rate-limit management', 'Cisco');
    // Either routed to HUMAN_REVIEW or rejected, but not auto-accepted
    assert.notEqual(res.status, DECISION_STATUS.AUTO_ACCEPTED);
    if (res.status === DECISION_STATUS.HUMAN_REVIEW) {
      assert.ok(res.confidence >= 0.60 && res.confidence < 0.80);
    }
  });

  test('test_unknown_vendor_syntax(): handles completely non-security noise configurations', () => {
    const res = normalizeSecurityIntent('interface Loopback0 description MGMT-VIRTUAL-INTERFACE-ONLY', 'Unknown');
    // Non-security configuration should not be auto-accepted as a security control
    assert.notEqual(res.status, DECISION_STATUS.AUTO_ACCEPTED);
  });

  test('test_invalid_configuration(): safely rejects empty or null configurations', () => {
    const emptyRes = normalizeSecurityIntent('', 'Cisco');
    assert.equal(emptyRes.security_intent, 'INVALID_EMPTY_CONFIG');
    assert.equal(emptyRes.confidence, 0.0);
    assert.equal(emptyRes.status, DECISION_STATUS.REJECTED);

    const nullRes = normalizeSecurityIntent(null, 'Cisco');
    assert.equal(nullRes.security_intent, 'INVALID_EMPTY_CONFIG');
    assert.equal(nullRes.confidence, 0.0);
    assert.equal(nullRes.status, DECISION_STATUS.REJECTED);
  });

  test('test_cross_vendor_equivalence(): validates equivalence across multiple security domains', () => {
    // 1. Telnet Disabled
    const ciscoTelnet = normalizeSecurityIntent('no transport input telnet', 'Cisco');
    const fortiTelnet = normalizeSecurityIntent('set admin-telnet disable', 'Fortinet');
    const paloTelnet = normalizeSecurityIntent('<disable-telnet>yes</disable-telnet>', 'Palo Alto');

    assert.equal(ciscoTelnet.security_intent, 'TELNET_DISABLED');
    assert.equal(fortiTelnet.security_intent, 'TELNET_DISABLED');
    assert.equal(paloTelnet.security_intent, 'TELNET_DISABLED');

    // 2. HTTP Server Disabled (TLS Enforced)
    const ciscoHttp = normalizeSecurityIntent('no ip http server', 'Cisco');
    const fortiHttp = normalizeSecurityIntent('set admin-sport 443', 'Fortinet');
    const paloHttp = normalizeSecurityIntent('<disable-http>yes</disable-http>', 'Palo Alto');

    assert.equal(ciscoHttp.security_intent, 'HTTP_CLEARTEXT_DISABLED');
    assert.equal(fortiHttp.security_intent, 'HTTP_CLEARTEXT_DISABLED');
    assert.equal(paloHttp.security_intent, 'HTTP_CLEARTEXT_DISABLED');
  });

  test('test_human_verified_mapping_reuse(): records novel syntax and boosts confidence upon re-encounter', () => {
    const novelSyntax = 'extreme-switch enable ssh2-server';
    const vendor = 'Extreme Networks';

    // Before human verification: not auto-accepted or confidence is low
    const beforeRes = normalizeSecurityIntent(novelSyntax, vendor);
    assert.notEqual(beforeRes.confidence, 0.99);

    // Human operator verifies the novel mapping during triage
    recordVerifiedMapping({
      vendor,
      raw_pattern: novelSyntax,
      normalized_intent: 'SSH_PROTOCOL_VERSION',
      operator: 'SecOps-Auditor-Lead',
      confidence_before: beforeRes.confidence
    });

    // Re-encountering identical syntax in subsequent scan
    const afterRes = normalizeSecurityIntent(novelSyntax, vendor);
    assert.equal(afterRes.security_intent, 'SSH_PROTOCOL_VERSION');
    assert.ok(afterRes.confidence >= 0.95, `Expected boosted confidence >= 0.95, got ${afterRes.confidence}`);
    assert.equal(afterRes.status, DECISION_STATUS.AUTO_ACCEPTED);
    assert.ok(afterRes.evidence[0].includes('human-verified knowledge base entry'));
  });

  test('test_semantic_mismatch(): verifies opposing command polarities do not match same intent', () => {
    // Telnet Enabled (Risk) vs Telnet Disabled (Compliant)
    const telnetRisk = normalizeSecurityIntent('transport input telnet', 'Cisco');
    const telnetSafe = normalizeSecurityIntent('no transport input telnet', 'Cisco');

    assert.equal(telnetRisk.security_intent, 'TELNET_ENABLED');
    assert.equal(telnetSafe.security_intent, 'TELNET_DISABLED');
    assert.notEqual(telnetRisk.security_intent, telnetSafe.security_intent);

    // HTTP Enabled (Risk) vs HTTP Disabled (Compliant)
    const httpRisk = normalizeSecurityIntent('ip http server', 'Cisco');
    const httpSafe = normalizeSecurityIntent('no ip http server', 'Cisco');

    assert.equal(httpRisk.security_intent, 'HTTP_CLEARTEXT_ACTIVE');
    assert.equal(httpSafe.security_intent, 'HTTP_CLEARTEXT_DISABLED');
    assert.notEqual(httpRisk.security_intent, httpSafe.security_intent);
  });

  test('test_compliance_decision_after_normalization(): verifies deterministic compliance evaluator acts on normalized state', () => {
    // Audit a configuration that permits Telnet
    const nonCompliantConfig = 'line vty 0 4\n transport input telnet\n';
    const norm = normalizeSecurityIntent('transport input telnet', 'Cisco');
    assert.equal(norm.security_intent, 'TELNET_ENABLED');
    assert.equal(norm.normalized_intent.state, 'ACTIVE_RISK');

    // The deterministic compliance engine evaluates CIS-2.1.4 as violation
    const auditRes = evaluateRealConfig('test_telnet.cfg', nonCompliantConfig, 'sha256:test1');
    const sshCtrl = auditRes.controls.find(c => c.id === 'CIS-2.1.4');
    assert.equal(sshCtrl.status, 'violation');

    // Audit a compliant configuration enforcing SSHv2
    const compliantConfig = 'line vty 0 4\n transport input ssh\n exec-timeout 10 0\n';
    const normCompliant = normalizeSecurityIntent('transport input ssh', 'Cisco');
    assert.equal(normCompliant.security_intent, 'TELNET_DISABLED');

    const compliantAudit = evaluateRealConfig('test_ssh.cfg', compliantConfig, 'sha256:test2');
    const sshCtrlCompliant = compliantAudit.controls.find(c => c.id === 'CIS-2.1.4');
    assert.equal(sshCtrlCompliant.status, 'passed');
  });
});
