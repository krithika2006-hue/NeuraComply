import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Search,
  Sliders,
  Terminal,
  Zap,
  RotateCcw,
  Sparkles,
  Lock,
  ArrowRight,
  Link2,
  FileText,
  Cpu
} from 'lucide-react';
import { AUDIT_CONTROLS, VENDOR_PRESETS } from '../data/mockData';
import NetworkTopologyGraphic from './NetworkTopologyGraphic';
import { truncateHash } from '../data/auditLedgerService';

export default function ResultsDashboard({
  selectedPreset,
  activeConfig,
  activeControls,
  whatIfEnabled,
  setWhatIfEnabled,
  onNavigateToTriage,
  onNavigateToLedger,
  onOpenReport,
  auditBlocks = [],
  showToast
}) {
  const [activeFrameworkFilter, setActiveFrameworkFilter] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedControlId, setExpandedControlId] = useState('CIS-2.1.4'); // Default open for pitch demo
  const [copiedScriptId, setCopiedScriptId] = useState(null);

  const currentPreset = activeConfig || VENDOR_PRESETS.find(p => p.id === selectedPreset) || VENDOR_PRESETS[0];
  const controlsSource = activeControls || AUDIT_CONTROLS;

  // Dynamically compute score based on what-if state
  const currentScore = whatIfEnabled ? currentPreset.whatIfScore : currentPreset.initialScore;
  const violationCount = whatIfEnabled ? 0 : currentPreset.controlsViolation;
  const compliantCount = whatIfEnabled ? (currentPreset.controlsPassed + currentPreset.controlsViolation) : currentPreset.controlsPassed;

  // Filter controls
  const filteredControls = controlsSource.filter(control => {
    // Framework filter
    if (activeFrameworkFilter !== 'all') {
      if (!control.framework.toLowerCase().includes(activeFrameworkFilter.toLowerCase())) {
        return false;
      }
    }
    // Status filter
    if (activeStatusFilter !== 'all') {
      const effectiveStatus = (whatIfEnabled && control.remediatedInWhatIf && control.status === 'violation')
        ? 'passed'
        : control.status;
      if (effectiveStatus !== activeStatusFilter) return false;
    }
    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = control.title.toLowerCase().includes(q);
      const matchCode = control.code.toLowerCase().includes(q);
      const matchCat = control.category.toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchCat) return false;
    }
    return true;
  });

  const handleCopy = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedScriptId(id);
    showToast('Remediation CLI script copied to clipboard');
    setTimeout(() => setCopiedScriptId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Posture Score Banner */}
      <div className="posture-banner">
        {/* SVG Radial Gauge */}
        <div className="gauge-wrap">
          <svg className="gauge-svg" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="var(--bg-subtle)"
              strokeWidth="8"
            />
            {/* Value Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={whatIfEnabled ? 'var(--status-compliant)' : 'var(--accent-primary)'}
              strokeWidth="8"
              strokeDasharray={`${(currentScore / 100) * 251.2} 251.2`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 600ms cubic-bezier(0.16, 1, 0.3, 1), stroke 300ms ease' }}
            />
            <text
              x="50"
              y="56"
              textAnchor="middle"
              fontSize="22"
              fontWeight="700"
              fontFamily="var(--font-sans)"
              fill="var(--text-primary)"
            >
              {currentScore}%
            </text>
          </svg>

          <div className="gauge-text">
            <span style={{ fontSize: '15px', fontWeight: 700 }}>
              {whatIfEnabled ? 'Simulated Posture' : 'Current Compliance Score'}
            </span>
            <span className="gauge-label">
              Evaluated against CIS v4.0 &bull; {currentPreset.name.split('(')[0]}
            </span>
            {whatIfEnabled && (
              <span className="badge badge-compliant" style={{ marginTop: '6px', alignSelf: 'flex-start' }}>
                <Sparkles size={11} />
                <span>+11% Score Lift Remediated</span>
              </span>
            )}
          </div>
        </div>

        {/* Middle KPI Breakdown */}
        <div className="kpi-row">
          <div className="kpi-item">
            <span className="kpi-num" style={{ color: 'var(--status-compliant)' }}>
              {compliantCount}
            </span>
            <span className="kpi-title">Passed Controls</span>
          </div>

          <div className="kpi-item">
            <span className="kpi-num" style={{ color: 'var(--status-warning)' }}>
              {currentPreset.controlsWarning}
            </span>
            <span className="kpi-title">Advisories</span>
          </div>

          <div className="kpi-item">
            <span className="kpi-num" style={{ color: violationCount > 0 ? 'var(--status-violation)' : 'var(--status-compliant)' }}>
              {violationCount}
            </span>
            <span className="kpi-title">Critical Violations</span>
          </div>
        </div>

        {/* What-If Simulation Toggle Switch */}
        <div className="what-if-card">
          <div className="what-if-info">
            <div className="what-if-title">
              <Zap size={14} color="var(--accent-primary)" />
              <span>What-If Simulator</span>
            </div>
            <span className="what-if-subtitle">
              Preview score if AI remediations commit
            </span>
          </div>

          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={whatIfEnabled}
              onChange={(e) => {
                setWhatIfEnabled(e.target.checked);
                showToast(
                  e.target.checked
                    ? 'What-If Simulation Active: Previewing 98% remediated state'
                    : 'Simulation reset to baseline audit state'
                );
              }}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* Network Infrastructure Topology Graphic */}
      <NetworkTopologyGraphic whatIfEnabled={whatIfEnabled} />

      {/* Immutable Audit Trail Quick Banner */}
      <div className="card" style={{
        padding: '16px 20px',
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-icon" style={{ width: '32px', height: '32px' }}>
            <Lock size={15} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Hyperledger Fabric Ledger Active</span>
              <span className="badge badge-accent" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                Channel: neura-compliance-channel
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Block #{auditBlocks[0]?.blockNumber || auditBlocks[0]?.index || 4} &bull; Head Anchor: <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{truncateHash(auditBlocks[0]?.currentBlockHash || auditBlocks[0]?.currentHash, 10, 6)}</span> &bull; Raft Consensus
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenReport}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            title="Generate & Download Executive PDF Compliance Report"
          >
            <FileText size={13} />
            <span>Generate PDF Report</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onNavigateToLedger}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Link2 size={13} />
            <span>View Ledger</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Unified Security Schema (USS) & Semantic Intent Normalization Card */}
      <div className="card" style={{
        padding: '16px 20px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Unified Security Schema (USS) &bull; Semantic Intent Normalization</span>
            <span className="badge badge-accent" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
              Vector Space R^128
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Cross-Vendor Equivalence Layer (Cisco &bull; Juniper &bull; Fortinet &bull; Palo Alto)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {(currentPreset.normalizedIntents && currentPreset.normalizedIntents.length > 0
            ? currentPreset.normalizedIntents
            : [
                { intent: 'SSH_PROTOCOL_VERSION', category: 'secure_management', confidence: 0.86, status: 'AUTO_ACCEPTED', raw_config: 'ip ssh version 2' },
                { intent: 'TELNET_DISABLED', category: 'insecure_services', confidence: 0.85, status: 'AUTO_ACCEPTED', raw_config: 'no transport input telnet' },
                { intent: 'SNMP_INSECURE_COMMUNITY_DISABLED', category: 'secure_management', confidence: 0.85, status: 'AUTO_ACCEPTED', raw_config: 'no snmp-server community public' },
                { intent: 'HTTP_CLEARTEXT_DISABLED', category: 'secure_management', confidence: 0.85, status: 'AUTO_ACCEPTED', raw_config: 'no ip http server' }
              ]
          ).slice(0, 4).map((item, idx) => (
            <div key={idx} style={{
              padding: '10px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className="font-mono" style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '11.5px' }}>
                  {item.intent}
                </span>
                <span className="badge badge-compliant" style={{ fontSize: '9px', padding: '0 5px' }}>
                  {(item.confidence * 100).toFixed(0)}% Conf
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>
                Category: <span style={{ color: 'var(--text-primary)' }}>{item.category || 'secure_management'}</span>
              </div>
              <div className="font-mono" style={{
                fontSize: '10.5px',
                color: 'var(--text-tertiary)',
                backgroundColor: 'var(--bg-card)',
                padding: '4px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Syntax: {item.raw_config}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-toolbar">
        {/* Framework & Status Pills */}
        <div className="filter-pills">
          <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginRight: '6px' }}>
            Framework:
          </span>
          {['all', 'cis', 'nist', 'stig'].map(f => (
            <button
              key={f}
              className={`pill-btn ${activeFrameworkFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFrameworkFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}

          <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border-subtle)', margin: '0 6px' }} />

          <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginRight: '6px' }}>
            Status:
          </span>
          {['all', 'violation', 'warning', 'passed'].map(s => (
            <button
              key={s}
              className={`pill-btn ${activeStatusFilter === s ? 'active' : ''}`}
              onClick={() => setActiveStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="search-input-wrap">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search rules, CIS IDs, syntax..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Rules Table / Accordion List */}
      <div className="rule-table-card">
        {filteredControls.map(control => {
          const isExpanded = expandedControlId === control.id;
          const isRemediated = whatIfEnabled && control.remediatedInWhatIf && control.status === 'violation';

          return (
            <div key={control.id} className="rule-row">
              {/* Row Header */}
              <div
                className="rule-row-header"
                onClick={() => setExpandedControlId(isExpanded ? null : control.id)}
              >
                {/* Status Indicator Icon */}
                <div>
                  {isRemediated ? (
                    <span className="badge badge-compliant" title="Remediated in What-If Simulator">
                      <Sparkles size={11} />
                      <span>Remediated</span>
                    </span>
                  ) : control.status === 'violation' ? (
                    <span className="badge badge-violation">
                      <AlertOctagon size={11} />
                      <span>Violation</span>
                    </span>
                  ) : control.status === 'warning' ? (
                    <span className="badge badge-warning">
                      <AlertTriangle size={11} />
                      <span>Warning</span>
                    </span>
                  ) : (
                    <span className="badge badge-compliant">
                      <CheckCircle2 size={11} />
                      <span>Passed</span>
                    </span>
                  )}
                </div>

                {/* Rule Title & Category */}
                <div className="rule-title-group">
                  <span className="rule-title">{control.title}</span>
                  <span className="rule-category">{control.category} &bull; {control.framework}</span>
                </div>

                {/* Code / CIS identifier */}
                <span className="rule-code">{control.code}</span>

                {/* Severity Badge */}
                <span className={`badge ${
                  control.severity === 'critical' ? 'badge-violation' :
                  control.severity === 'medium' ? 'badge-warning' : 'badge-info'
                }`}>
                  {control.severity.toUpperCase()}
                </span>

                {/* Expand / Collapse Chevron */}
                <div style={{ color: 'var(--text-tertiary)' }}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expandable Deep-Dive Drawer */}
              {isExpanded && (
                <div className="rule-row-details">
                  {/* Explanation & Rationale */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Control Requirement & Rationale
                    </span>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {control.description}
                    </p>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      <strong>AST Canonical Validation Expression:</strong> <code>{control.astCanonicalRule}</code>
                    </div>
                  </div>

                  {/* Side-by-Side Diff or Passed Rationale */}
                  {control.offendingSnippet ? (
                    <div className="diff-grid">
                      {/* Left: Offending Configuration Snippet */}
                      <div className="code-box">
                        <div className="code-box-header">
                          <span style={{ color: 'var(--status-violation)' }}>
                            Offending Config (Lines {control.offendingSnippet.lineStart}-{control.offendingSnippet.lineEnd})
                          </span>
                          <span className="badge badge-violation" style={{ fontSize: '10px' }}>Non-Compliant</span>
                        </div>
                        <pre className="code-content offending">
                          {control.offendingSnippet.content}
                        </pre>
                      </div>

                      {/* Right: Suggested AI Remediation Script */}
                      <div className="code-box">
                        <div className="code-box-header">
                          <span style={{ color: 'var(--status-compliant)' }}>
                            Suggested Remediation (Ready to apply)
                          </span>
                          <button
                            className="btn btn-subtle btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(control.id, control.remediationCommand);
                            }}
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                          >
                            {copiedScriptId === control.id ? (
                              <>
                                <Check size={12} color="var(--status-compliant)" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy CLI</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="code-content remediation">
                          {control.remediationCommand}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--status-compliant-bg)',
                      border: '1px solid var(--status-compliant-border)',
                      fontSize: '12.5px',
                      color: 'var(--status-compliant)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <CheckCircle2 size={16} />
                        <span>Audit Requirement Satisfied</span>
                      </div>
                      <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {control.auditReason}
                      </p>
                    </div>
                  )}

                  {/* Vendor Equivalent Syntax Strip */}
                  {control.vendorEquivalent && (
                    <div style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '12px 16px'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Multi-Vendor Equivalents (AST Cross-Translation)
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                        <div>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', fontWeight: 600 }}>JUNIPER JUNOS:</span>
                          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {control.vendorEquivalent.juniper}
                          </pre>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', fontWeight: 600 }}>FORTINET FORTIOS:</span>
                          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {control.vendorEquivalent.fortinet}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
