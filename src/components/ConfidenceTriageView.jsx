import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Check,
  FileCheck,
  Terminal,
  Info,
  Lock,
  Link2
} from 'lucide-react';
import { TRIAGE_ITEMS } from '../data/mockData';
import { truncateHash } from '../data/auditLedgerService';

export default function ConfidenceTriageView({
  showToast,
  onRecordAuditEvent,
  onNavigateToLedger,
  auditBlocks = []
}) {
  const [items, setItems] = useState(TRIAGE_ITEMS);
  const [activeTab, setActiveTab] = useState('all');

  const handleConfirmItem = (id) => {
    const foundItem = items.find(i => i.id === id);
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          type: 'auto-resolved',
          confidence: 99.1,
          actionTaken: 'Confirmed by Operator & Staged',
          confirmed: true,
          canConfirm: false
        };
      }
      return item;
    }));

    if (onRecordAuditEvent) {
      onRecordAuditEvent({
        eventType: 'REMEDIATION_CONFIRMED',
        eventTitle: `Operator Confirmed Fix: ${foundItem?.controlCode || id}`,
        eventDescription: `Automated remediation verified & confirmed for ${foundItem?.title || id}. Calibrated confidence elevated to 99.1%.`,
        operator: 'SecOps-Operator (Manual Verification)',
        metadata: {
          triageId: id,
          controlCode: foundItem?.controlCode,
          priorConfidence: `${foundItem?.confidence}%`,
          newConfidence: '99.1%'
        }
      });
    }

    showToast(`Remediation for ${id} verified & promoted to auto-resolved queue`);
  };

  const handleException = (id) => {
    const foundItem = items.find(i => i.id === id);
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          actionTaken: 'Approved Business Policy Exception (Chained to Audit Ledger)',
          confirmed: true,
          canConfirm: false
        };
      }
      return item;
    }));

    if (onRecordAuditEvent) {
      onRecordAuditEvent({
        eventType: 'POLICY_EXCEPTION',
        eventTitle: `Policy Exception Approved: ${foundItem?.controlCode || id}`,
        eventDescription: `Business architecture exception recorded for ${foundItem?.title || id}. Risk acceptance rationale cryptographically anchored.`,
        operator: 'Lead Security Auditor (Authorized)',
        metadata: {
          triageId: id,
          controlCode: foundItem?.controlCode,
          rationale: 'Isolated control-plane topology verified'
        }
      });
    }

    showToast(`Policy exception logged in immutable audit trail for ${id}`);
  };

  const autoResolvedItems = items.filter(i => i.type === 'auto-resolved');
  const humanReviewItems = items.filter(i => i.type === 'human-review');

  return (
    <div className="triage-container">
      {/* Core Innovation Explainer Banner */}
      <div className="triage-explainer">
        <div>
          <h3>
            <Sparkles size={18} color="var(--accent-primary)" />
            <span>Dual-Stage Confidence Triage Engine</span>
            <span className="badge badge-accent" style={{ fontSize: '10px' }}>Proprietary SIH Innovation</span>
          </h3>
          <p>
            Traditional regex scanners produce high false-positive rates because they cannot differentiate between a deterministic security omission and an intentional, topology-dependent architecture choice. NeuraComply assigns a calibrated confidence score to each AST rule evaluation.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          padding: '12px 18px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Auto-Resolved</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-compliant)' }}>
              {autoResolvedItems.length}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>&ge; 95% Confidence</div>
          </div>

          <div style={{ width: '1px', backgroundColor: 'var(--border-subtle)' }} />

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Needs Review</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-warning)' }}>
              {humanReviewItems.length}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>&lt; 90% Confidence</div>
          </div>
        </div>
      </div>

      {/* Immutable Audit Ledger Quick Banner */}
      <div className="card" style={{
        padding: '14px 18px',
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-icon" style={{ width: '28px', height: '28px' }}>
            <Lock size={14} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Decisions Cryptographically Chained</span>
              <span className="badge badge-accent" style={{ fontSize: '9px', padding: '1px 5px' }}>
                {auditBlocks.length} Blocks Anchored
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Operator remediation approvals and approved policy exceptions are automatically recorded to the tamper-evident hash ledger.
            </div>
          </div>
        </div>

        {onNavigateToLedger && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onNavigateToLedger}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Link2 size={13} />
            <span>Open Audit Ledger</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Two Column Split: Auto-Resolved vs Needs Human Review */}
      <div className="triage-columns">
        {/* Left Column: Auto-Resolved (High Confidence) */}
        <div className="triage-column">
          <div className="triage-col-header auto-resolved">
            <div className="triage-col-title">
              <CheckCircle2 size={16} color="var(--status-compliant)" />
              <span>Auto-Resolved via High Confidence (&ge; 95%)</span>
            </div>
            <span className="badge badge-compliant">{autoResolvedItems.length} Active</span>
          </div>

          {autoResolvedItems.map(item => (
            <div key={item.id} className="triage-card card-green">
              <div className="triage-card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span className="badge badge-compliant" style={{ fontSize: '10px' }}>{item.id}</span>
                    <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      {item.controlCode}
                    </span>
                  </div>
                  <h4 className="triage-card-title">{item.title}</h4>
                </div>

                <div className="confidence-meter" style={{ color: 'var(--status-compliant)' }}>
                  <span>{item.confidence}%</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>conf</span>
                </div>
              </div>

              {/* Reasoning */}
              <div className="triage-reasoning">
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '3px' }}>
                  AI DETERMINISTIC PROOF
                </div>
                {item.confidenceReason}
              </div>

              {/* Remediation Snippet */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '8px 12px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--status-compliant)',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ color: 'var(--text-tertiary)' }}># Auto-generated fix:</span><br />
                {item.remediationScript}
              </div>

              {/* Status Action */}
              <div className="triage-actions">
                <span style={{ fontSize: '12px', color: 'var(--status-compliant)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={13} />
                  <span>{item.actionTaken}</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  Rollback verified
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Needs Human Review (The Core Pitch Differentiator) */}
        <div className="triage-column">
          <div className="triage-col-header human-review">
            <div className="triage-col-title">
              <AlertCircle size={16} color="var(--status-warning)" />
              <span>Needs Your Review &bull; Ambiguous Intent (&lt; 90%)</span>
            </div>
            <span className="badge badge-warning">{humanReviewItems.length} Pending Sign-Off</span>
          </div>

          {humanReviewItems.length === 0 ? (
            <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <CheckCircle2 size={32} color="var(--status-compliant)" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>All Operator Items Reviewed</h4>
              <p style={{ fontSize: '12.5px' }}>Every ambiguous configuration has been verified or assigned an exception.</p>
            </div>
          ) : (
            humanReviewItems.map(item => (
              <div key={item.id} className="triage-card card-amber">
                <div className="triage-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span className="badge badge-warning" style={{ fontSize: '10px' }}>{item.id}</span>
                      <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                        {item.controlCode}
                      </span>
                    </div>
                    <h4 className="triage-card-title">{item.title}</h4>
                  </div>

                  <div className="confidence-meter" style={{ color: 'var(--status-warning)' }}>
                    <span>{item.confidence}%</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>conf</span>
                  </div>
                </div>

                {/* AI Explanation of Ambiguity */}
                <div className="triage-reasoning" style={{ backgroundColor: 'var(--status-warning-bg)', borderColor: 'var(--status-warning-border)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-warning)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={12} />
                    <span>WHY AI FLAGGED FOR HUMAN SIGN-OFF:</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.45' }}>
                    {item.confidenceReason}
                  </p>
                </div>

                {/* Operator Guidance */}
                {item.operatorNote && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', padding: '0 4px' }}>
                    <strong>Operator note:</strong> {item.operatorNote}
                  </div>
                )}

                {/* Proposed CLI fix preview */}
                <div style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ color: 'var(--text-tertiary)' }}># Staged fix awaiting approval:</span><br />
                  {item.remediationScript}
                </div>

                {/* Interactive Action Buttons */}
                <div className="triage-actions">
                  <span className="badge badge-warning">
                    Risk: {item.riskTier}
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleException(item.id)}
                      style={{ fontSize: '11px' }}
                    >
                      <FileCheck size={12} />
                      <span>Exception</span>
                    </button>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleConfirmItem(item.id)}
                      style={{ fontSize: '11.5px', padding: '5px 12px' }}
                    >
                      <Check size={13} />
                      <span>Confirm & Apply Fix</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
