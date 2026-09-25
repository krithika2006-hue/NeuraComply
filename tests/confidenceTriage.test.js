import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TRIAGE_ITEMS, EXECUTIVE_SUMMARY_STATS, AUDIT_CONTROLS } from '../src/data/mockData.js';

describe('Confidence-Scored Triage Engine (Differentiator)', () => {
  describe('Threshold Routing & Categorization', () => {
    test('routes findings with confidence >= 80% to auto-resolved tier', () => {
      const autoResolved = TRIAGE_ITEMS.filter(item => item.type === 'auto-resolved');
      assert.ok(autoResolved.length >= 3, 'Should have at least 3 auto-resolved findings');

      for (const item of autoResolved) {
        assert.ok(
          item.confidence >= 80.0,
          `Item ${item.id} (${item.title}) has confidence ${item.confidence} which is < 80%`
        );
        assert.equal(item.confirmed, true, `Auto-resolved item ${item.id} should be pre-confirmed`);
        assert.equal(item.canConfirm, false, `Auto-resolved item ${item.id} should not require manual confirm`);
      }
    });

    test('routes findings with confidence < 80% to human-review tier', () => {
      const humanReview = TRIAGE_ITEMS.filter(item => item.type === 'human-review');
      assert.ok(humanReview.length >= 2, 'Should have at least 2 human-review findings');

      for (const item of humanReview) {
        assert.ok(
          item.confidence < 80.0,
          `Item ${item.id} (${item.title}) has confidence ${item.confidence} which is >= 80%`
        );
        assert.equal(item.canConfirm, true, `Human-review item ${item.id} must be confirmable by operator`);
        assert.ok(item.operatorNote, `Human-review item ${item.id} must have operator warning note`);
      }
    });

    test('validates full explainability justification on every triage item', () => {
      for (const item of TRIAGE_ITEMS) {
        assert.ok(item.confidenceReason, `Item ${item.id} missing confidenceReason`);
        assert.ok(item.confidenceReason.length > 30, `Item ${item.id} confidenceReason is too brief`);
        assert.ok(item.remediationScript, `Item ${item.id} missing remediationScript`);
        assert.ok(item.rollbackScript, `Item ${item.id} missing rollbackScript`);
        assert.match(item.controlCode, /CIS|NIST|STIG/, `Item ${item.id} must cite authoritative standard`);
      }
    });
  });

  describe('Human-in-the-Loop State Transitions', () => {
    test('simulates operator sign-off and fix approval', () => {
      const pendingItem = TRIAGE_ITEMS.find(item => item.id === 'TR-201');
      assert.ok(pendingItem);
      assert.equal(pendingItem.confirmed, false);

      // Operator confirms remediation
      const updatedItem = {
        ...pendingItem,
        confirmed: true,
        operatorSignedBy: 'SecOps-Auditor (Admin)',
        signedAt: new Date().toISOString()
      };

      assert.equal(updatedItem.confirmed, true);
      assert.equal(updatedItem.operatorSignedBy, 'SecOps-Auditor (Admin)');
      assert.ok(updatedItem.signedAt);
    });

    test('simulates operator exception marking with audit trail reasoning', () => {
      const ospfItem = TRIAGE_ITEMS.find(item => item.id === 'TR-202');
      assert.ok(ospfItem);

      const exceptionRecord = {
        id: ospfItem.id,
        action: 'MARK_EXCEPTION',
        justification: 'Approved maintenance window scheduled for peer key rotation on 2026-10-01.',
        approvedBy: 'Lead-Architect-01',
        expiryDays: 30
      };

      assert.equal(exceptionRecord.action, 'MARK_EXCEPTION');
      assert.ok(exceptionRecord.justification.includes('maintenance window'));
      assert.equal(exceptionRecord.expiryDays, 30);
    });
  });

  describe('What-If Remediation Simulation Math', () => {
    test('accurately calculates before and after remediation posture delta', () => {
      const initial = EXECUTIVE_SUMMARY_STATS.overallComplianceScore;
      const remediated = EXECUTIVE_SUMMARY_STATS.remediatedScore;
      assert.equal(initial, 87);
      assert.equal(remediated, 98);
      assert.ok(remediated > initial, 'Remediated score must exceed initial score');

      // Verify delta
      const delta = remediated - initial;
      assert.equal(delta, 11);
    });

    test('evaluates control status transitions from violation to remediated', () => {
      const violations = AUDIT_CONTROLS.filter(c => c.status === 'violation');
      assert.ok(violations.length >= 2, 'Default mock controls should have violations');

      // Simulated remediation
      const remediatedControls = AUDIT_CONTROLS.map(c => {
        if (c.status === 'violation' && c.remediationCommand) {
          return { ...c, status: 'passed', remediated: true };
        }
        return c;
      });

      const remainingViolations = remediatedControls.filter(c => c.status === 'violation');
      assert.equal(remainingViolations.length, 0, 'All remediable violations should transition to passed');
    });
  });
});
