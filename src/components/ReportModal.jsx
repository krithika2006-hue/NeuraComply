import React from 'react';
import { X, ShieldCheck, Printer, CheckCircle, Award, FileText } from 'lucide-react';
import { EXECUTIVE_SUMMARY_STATS, VENDOR_PRESETS } from '../data/mockData';

export default function ReportModal({ isOpen, onClose, selectedPreset, whatIfEnabled, auditBlocks = [], user }) {
  if (!isOpen) return null;

  const preset = VENDOR_PRESETS.find(p => p.id === selectedPreset) || VENDOR_PRESETS[0];
  const score = whatIfEnabled ? preset.whatIfScore : preset.initialScore;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-icon" style={{ width: '28px', height: '28px' }}>
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Executive Compliance Certificate & Brief</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                Report ID: AEGIS-2026-SIH-{preset.id.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ fontSize: '11px' }}
            >
              <Printer size={13} />
              <span>Print Brief</span>
            </button>
            <button
              className="btn btn-subtle btn-sm"
              onClick={onClose}
              style={{ padding: '4px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Certificate Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Authenticated Lead Auditor Sign-off Banner */}
          {user && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: user.avatarBg || '#0F4C5C',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10.5px',
                  fontWeight: 700
                }}>
                  {user.avatarText || user.name.charAt(0)}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Certified Lead Auditor:</span>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{user.name} ({user.email})</span>
                </div>
              </div>
              <span className="badge badge-compliant" style={{ fontSize: '10px', padding: '2px 8px' }}>
                Google SSO Authenticated
              </span>
            </div>
          )}

          {/* Target Network Device Banner */}
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Target System</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{preset.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Role: {preset.role}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Post-Audit Score</div>
              <div style={{
                fontSize: '28px',
                fontWeight: 800,
                color: whatIfEnabled ? 'var(--status-compliant)' : 'var(--accent-primary)',
                lineHeight: 1
              }}>
                {score}%
              </div>
              <span className="badge badge-compliant" style={{ marginTop: '4px' }}>
                {whatIfEnabled ? 'Remediated & Verified' : 'Baseline Scanned'}
              </span>
            </div>
          </div>

          {/* Audit Scope */}
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Standards Audited
            </span>
            <ul style={{ listStyle: 'none', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {EXECUTIVE_SUMMARY_STATS.standardsCovered.map((std, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={14} color="var(--status-compliant)" />
                  <span>{std}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Findings Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            padding: '16px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Evaluated Rules</div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>42 Controls</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Critical Violations</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: whatIfEnabled ? 'var(--status-compliant)' : 'var(--status-violation)' }}>
                {whatIfEnabled ? '0 (Remediated)' : '3 Remediable'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Confidence Triage</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-compliant)' }}>
                100% Accounted
              </div>
            </div>
          </div>

          {/* Cryptographic Audit Ledger Anchor Section */}
          <div style={{
            padding: '14px 16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '6px',
            border: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <span className="badge badge-accent" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                  Hyperledger Fabric v2.5 Anchor
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Block #{auditBlocks[0]?.blockNumber || auditBlocks[0]?.index || 4} &bull; Channel: neura-compliance-channel
                </span>
              </div>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                TxID: {auditBlocks[0]?.txId || auditBlocks[0]?.currentBlockHash || auditBlocks[0]?.currentHash || 'e78d91b4a2c0918274615243dfb9081234567890abcdef1234567890abcdef12'}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                Dual-Peer Endorsement Verified (Org1MSP + AuditorMSP) &bull; Raft Consensus Committed
              </div>
            </div>

            <div style={{
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: 'var(--status-compliant-bg)',
              border: '1px solid var(--status-compliant-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--status-compliant)',
              whiteSpace: 'nowrap'
            }}>
              <CheckCircle size={13} />
              <span>Immutable Verified</span>
            </div>
          </div>

          {/* Hackathon Attestation Block */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11.5px',
            color: 'var(--text-tertiary)'
          }}>
            <div>
              <div>Smart India Hackathon (SIH) 2026 Evaluation Prototype</div>
              <div>Track: AI-Driven Multi-Vendor Network Compliance Auditor</div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} color="var(--accent-primary)" />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>NeuraComply AI Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
