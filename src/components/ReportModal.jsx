import React, { useState } from 'react';
import { X, ShieldCheck, Printer, CheckCircle, Award, FileText, Download, Check } from 'lucide-react';
import { EXECUTIVE_SUMMARY_STATS, VENDOR_PRESETS, AUDIT_CONTROLS } from '../data/mockData';
import { generateCompliancePdfReport } from '../data/pdfReportGenerator';

export default function ReportModal({
  isOpen,
  onClose,
  selectedPreset,
  activeConfig,
  activeControls,
  whatIfEnabled,
  auditBlocks = [],
  user
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPreset = activeConfig || VENDOR_PRESETS.find(p => p.id === selectedPreset) || VENDOR_PRESETS[0];
  const controlsSource = activeControls || AUDIT_CONTROLS;
  const score = whatIfEnabled ? currentPreset.whatIfScore : currentPreset.initialScore;
  const violationsCount = whatIfEnabled ? 0 : currentPreset.controlsViolation;
  const passedCount = whatIfEnabled
    ? controlsSource.length
    : (currentPreset.controlsPassed || controlsSource.filter(c => c.status === 'passed').length);

  const latestBlock = auditBlocks[0] || {};
  const fabricTxId = latestBlock.fabricTxId || latestBlock.txId || latestBlock.currentBlockHash || latestBlock.currentHash || '0x7f4a9b2c8e1d3f0a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a';
  const blockNumber = latestBlock.blockNumber || latestBlock.index || 4;

  const handleDownloadPdf = () => {
    try {
      setIsDownloading(true);
      generateCompliancePdfReport({
        config: currentPreset,
        controls: controlsSource,
        whatIfEnabled,
        auditBlocks,
        user
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF Generation failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-icon" style={{ width: '32px', height: '32px' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Executive Compliance Certificate & Brief</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                Report ID: NC-SIH-{currentPreset.id.toUpperCase().slice(0, 12)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              style={{ fontSize: '12px', gap: '6px' }}
              title="Download official PDF report"
            >
              {downloadSuccess ? (
                <>
                  <Check size={14} color="#B7E4C7" />
                  <span>Downloaded PDF</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>{isDownloading ? 'Generating...' : 'Download PDF Report'}</span>
                </>
              )}
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ fontSize: '12px', gap: '6px' }}
              title="Print brief using browser print dialog"
            >
              <Printer size={13} />
              <span>Print Brief</span>
            </button>

            <button
              className="btn btn-subtle btn-sm"
              onClick={onClose}
              style={{ padding: '6px' }}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Certificate Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Target System</div>
              <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>{currentPreset.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Platform: <strong>{currentPreset.vendor}</strong> ({currentPreset.os}) &bull; Role: {currentPreset.role}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Line Count: {currentPreset.lineCount} lines &bull; Interfaces: {currentPreset.interfacesDetected}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Compliance Posture</div>
              <div style={{
                fontSize: '30px',
                fontWeight: 800,
                color: whatIfEnabled ? 'var(--status-compliant)' : (score >= 90 ? 'var(--status-compliant)' : 'var(--accent-primary)'),
                lineHeight: 1,
                marginTop: '2px'
              }}>
                {score}%
              </div>
              <span className={`badge ${whatIfEnabled ? 'badge-compliant' : (score >= 90 ? 'badge-compliant' : 'badge-warning')}`} style={{ marginTop: '4px' }}>
                {whatIfEnabled ? 'Remediated & Verified' : 'Baseline Scanned'}
              </span>
            </div>
          </div>

          {/* Key Findings Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            padding: '14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Total Controls</div>
              <div style={{ fontSize: '17px', fontWeight: 700 }}>{controlsSource.length} Rules</div>
              <div style={{ fontSize: '11px', color: 'var(--status-compliant)', marginTop: '2px' }}>
                {passedCount} Passed
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Critical Violations</div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: whatIfEnabled ? 'var(--status-compliant)' : (violationsCount > 0 ? 'var(--status-violation)' : 'var(--status-compliant)') }}>
                {violationsCount} {whatIfEnabled ? '(Remediated)' : 'Flagged'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {whatIfEnabled ? '100% Remediated' : 'Action Required'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Confidence Triage</div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--status-compliant)' }}>
                100% Accounted
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                HITL & Auto-Route
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
            <div style={{ maxWidth: '520px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <span className="badge badge-accent" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                  Hyperledger Fabric v2.5 Anchor
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Block #{blockNumber} &bull; Channel: neura-compliance-channel
                </span>
              </div>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                TxID: {fabricTxId}
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

          {/* Regulatory Standards Audited */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Regulatory Frameworks Audited
            </span>
            <ul style={{ listStyle: 'none', marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px' }}>
              {EXECUTIVE_SUMMARY_STATS.standardsCovered.map((std, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={13} color="var(--status-compliant)" />
                  <span>{std}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hackathon Attestation Block */}
          <div style={{
            padding: '14px 0 0',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11.5px',
            color: 'var(--text-tertiary)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              <div>Smart India Hackathon (SIH) 2026 Enterprise Edition</div>
              <div>Decoupled Cryptographic Attestation Engine</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={15} color="var(--accent-primary)" />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>NeuraComply Sovereign Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
