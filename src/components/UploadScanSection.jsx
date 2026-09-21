import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  FileCode,
  ArrowRight,
  RefreshCw,
  Cpu,
  Server,
  Shield,
  Sparkles,
  Download,
  FileText,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { VENDOR_PRESETS, COMPLIANCE_FRAMEWORKS } from '../data/mockData';
import { generateChecksum, evaluateRealConfig } from '../data/auditParser';

export const REAL_SAMPLE_CONFIGS = [
  {
    id: 'cisco-enterprise-real',
    name: 'Cisco Catalyst 9300 Enterprise',
    fileName: 'cisco_catalyst9300_enterprise.cfg',
    url: '/sample_configs/cisco_catalyst9300_enterprise.cfg',
    vendor: 'Cisco Systems',
    os: 'Cisco IOS-XE 17.06.05',
    tag: 'Telnet & SNMP Findings',
    tagType: 'violation',
    desc: 'Core switch config with active routing (OSPF/BGP), AAA, VLANs, and intentional CIS violations (Telnet VTY, SNMP public).'
  },
  {
    id: 'cisco-hardened-real',
    name: 'Cisco IOS-XE PCI-DSS Hardened',
    fileName: 'cisco_hardened_pci_dss.cfg',
    url: '/sample_configs/cisco_hardened_pci_dss.cfg',
    vendor: 'Cisco Systems',
    os: 'Cisco IOS-XE 17.06.05',
    tag: '100% Compliant Pass',
    tagType: 'compliant',
    desc: 'Fully hardened baseline with SSHv2 exclusively, scrypt encryption, legal banners, restricted vty ACLs, and SNMPv3 authPriv.'
  },
  {
    id: 'juniper-srx-real',
    name: 'Juniper SRX340 Perimeter Gateway',
    fileName: 'juniper_srx340_perimeter.conf',
    url: '/sample_configs/juniper_srx340_perimeter.conf',
    vendor: 'Juniper Networks',
    os: 'Junos OS 21.4R3-S2.4',
    tag: 'Security Zones & Web-Mgmt',
    tagType: 'warning',
    desc: 'Real JunOS security policy with trust/untrust zones, syslog logging, root authentication, and interface definitions.'
  },
  {
    id: 'fortigate-100f-real',
    name: 'Fortinet FortiGate 100F Edge',
    fileName: 'fortigate_100f_edge.conf',
    url: '/sample_configs/fortigate_100f_edge.conf',
    vendor: 'Fortinet',
    os: 'FortiOS v7.2.5 build1517',
    tag: 'UTM Policies & SNMP',
    tagType: 'warning',
    desc: 'Campus perimeter firewall with UTM inspection, dedicated management interfaces, and admin access profiles.'
  },
  {
    id: 'paloalto-3220-real',
    name: 'Palo Alto PA-3220 Firewall',
    fileName: 'paloalto_pa3220_firewall.xml',
    url: '/sample_configs/paloalto_pa3220_firewall.xml',
    vendor: 'Palo Alto Networks',
    os: 'PAN-OS 10.2.4-h2',
    tag: 'Hierarchical XML Tree',
    tagType: 'accent',
    desc: 'Native PAN-OS XML configuration structure with deviceconfig, threat update schedules, and service configuration.'
  }
];

export default function UploadScanSection({
  selectedPreset,
  setSelectedPreset,
  activeConfig,
  onConfigLoaded,
  onResetToPreset,
  isCustomLoaded,
  isScanning,
  scanStep,
  onStartScan,
  onFastForwardScan,
  showToast
}) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFrameworks, setSelectedFrameworks] = useState(['cis', 'nist', 'stig']);
  const [loadingSampleId, setLoadingSampleId] = useState(null);
  const fileInputRef = useRef(null);

  const displayConfig = activeConfig || VENDOR_PRESETS.find(p => p.id === selectedPreset) || VENDOR_PRESETS[0];

  // Process any uploaded or selected text configuration
  const processConfigContent = async (fileName, text) => {
    try {
      const checksum = await generateChecksum(text);
      const { parsedConfig, controls } = evaluateRealConfig(fileName, text, checksum);
      if (onConfigLoaded) {
        onConfigLoaded(parsedConfig, controls);
      }
      if (showToast) {
        showToast(`Real configuration ingested: ${fileName} (${parsedConfig.lineCount} lines, ${parsedConfig.vendor})`);
      }
    } catch (err) {
      console.error('Failed to parse configuration:', err);
      if (showToast) {
        showToast('Error parsing configuration file');
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          processConfigContent(file.name, text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          processConfigContent(file.name, text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSample = async (sample) => {
    setLoadingSampleId(sample.id);
    try {
      const res = await fetch(sample.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      await processConfigContent(sample.fileName, text);
    } catch (err) {
      console.error('Failed to fetch sample config:', err);
      if (showToast) showToast(`Could not load ${sample.fileName}`);
    } finally {
      setLoadingSampleId(null);
    }
  };

  const toggleFramework = (id) => {
    setSelectedFrameworks(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(f => f !== id) : prev) : [...prev, id]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Upload and Preset Selection Grid */}
      <div className="upload-grid">
        {/* Left: Drag and Drop Zone */}
        <div
          className={`dropzone-card ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".cfg,.conf,.txt,.set,.xml"
          />

          <div className="dropzone-icon">
            <UploadCloud size={24} />
          </div>

          <h4 className="dropzone-title">
            {isCustomLoaded ? `Ingested: ${displayConfig.fileName}` : 'Drop raw network configuration file'}
          </h4>
          <p className="dropzone-hint">
            Supports Cisco IOS/XE, JunOS, PAN-OS XML, and FortiOS (.cfg, .conf, .txt)
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <FileCode size={13} />
              <span>Browse Local File</span>
            </button>

            {isCustomLoaded && onResetToPreset && (
              <button
                type="button"
                className="btn btn-subtle btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onResetToPreset();
                  if (showToast) showToast('Reset to built-in vendor preset');
                }}
                style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}
              >
                <RotateCcw size={12} />
                <span>Reset to Presets</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Pitch Presets */}
        <div className="presets-card">
          <div className="presets-header">
            <span className="presets-title">Live Demonstration Presets</span>
            <span className="badge badge-accent">1-Click Load</span>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Select a real-world multi-vendor configuration to simulate automatic vendor detection and compliance evaluation:
          </p>

          <div className="preset-list">
            {VENDOR_PRESETS.map((preset) => {
              const isSelected = !isCustomLoaded && preset.id === selectedPreset;
              return (
                <div
                  key={preset.id}
                  className={`preset-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (onResetToPreset) onResetToPreset();
                    setSelectedPreset(preset.id);
                  }}
                >
                  <div className="preset-item-info">
                    <span className="preset-item-name">{preset.name}</span>
                    <span className="preset-item-role">{preset.role}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge">
                      {preset.vendor}
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={16} color="var(--accent-primary)" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real Test Configuration Files Section (SIH Pitch & Live Testing Tray) */}
      <div className="card" style={{ padding: '20px', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 700 }}>Real-World Test Configuration Files</span>
              <span className="badge badge-accent" style={{ fontSize: '10px' }}>Ready to Download & Test</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
              Test the auditor with these authentic production configuration files. Click <strong>Test Now</strong> to ingest directly, or <strong>Download</strong> to test your local file upload dialog.
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px'
        }}>
          {REAL_SAMPLE_CONFIGS.map(sample => {
            const isCurrentlyActive = isCustomLoaded && displayConfig.fileName === sample.fileName;
            const isLoadingThis = loadingSampleId === sample.id;

            return (
              <div
                key={sample.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCurrentlyActive ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                  border: isCurrentlyActive ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  transition: 'all 200ms ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {sample.name}
                    </span>
                    <span className={`badge badge-${sample.tagType}`} style={{ fontSize: '9.5px', padding: '1px 6px', whiteSpace: 'nowrap' }}>
                      {sample.tag}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    {sample.fileName}
                  </div>

                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {sample.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '11.5px' }}
                    onClick={() => handleLoadSample(sample)}
                    disabled={isLoadingThis}
                  >
                    {isLoadingThis ? (
                      <>
                        <RefreshCw size={12} className="spin-icon" />
                        <span>Parsing...</span>
                      </>
                    ) : isCurrentlyActive ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Loaded & Active</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        <span>Test Now</span>
                      </>
                    )}
                  </button>

                  <a
                    href={sample.url}
                    download={sample.fileName}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    title={`Download ${sample.fileName}`}
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auto-Detection Badge & Parameters */}
      <div className="detection-strip">
        <div className="detection-meta">
          <div className="detection-vendor-badge">
            <span className="detection-label">
              {isCustomLoaded ? 'Parsed Device & Vendor' : 'Auto-Detected Vendor & OS'}
            </span>
            <span className="detection-val">
              {displayConfig.os || displayConfig.vendor}
            </span>
          </div>

          <div style={{ height: '32px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

          <div>
            <span className="detection-label">AST Line Count</span>
            <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {displayConfig.lineCount} lines parsed
            </div>
          </div>

          <div style={{ height: '32px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

          <div>
            <span className="detection-label">Active Protocols Found</span>
            <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
              {(displayConfig.protocolFootprint || []).slice(0, 4).map(p => (
                <span key={p} className="badge" style={{ fontSize: '10px', padding: '1px 6px' }}>{p}</span>
              ))}
              {(displayConfig.protocolFootprint || []).length > 4 && (
                <span className="badge" style={{ fontSize: '10px', padding: '1px 5px' }}>
                  +{(displayConfig.protocolFootprint || []).length - 4}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Framework Checklist */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginRight: '4px' }}>
            Target Frameworks:
          </span>
          {COMPLIANCE_FRAMEWORKS.map(fw => (
            <button
              key={fw.id}
              onClick={() => toggleFramework(fw.id)}
              className="badge"
              style={{
                cursor: 'pointer',
                backgroundColor: selectedFrameworks.includes(fw.id) ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                borderColor: selectedFrameworks.includes(fw.id) ? 'var(--accent-border)' : 'var(--border-subtle)',
                color: selectedFrameworks.includes(fw.id) ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                fontWeight: selectedFrameworks.includes(fw.id) ? 600 : 400
              }}
            >
              {fw.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Scan Action Button */}
        <div>
          <button
            className="btn btn-primary"
            onClick={onStartScan}
            disabled={isScanning}
            style={{ padding: '9px 20px' }}
          >
            {isScanning ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>Auditing AST...</span>
              </>
            ) : (
              <>
                <Shield size={14} />
                <span>Run Compliance Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Realistic Scanning Progress State */}
      {isScanning && (
        <div className="scanning-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Executing NeuraComply Deterministic Engine</span>
            </div>
            <button
              className="btn btn-subtle btn-sm"
              onClick={onFastForwardScan}
              style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}
            >
              Skip Animation &rarr;
            </button>
          </div>

          <div className="scan-steps">
            <div className={`scan-step ${scanStep >= 1 ? 'completed' : 'active'}`}>
              <CheckCircle2 size={14} />
              <span>1. Ingesting & Tokenizing CLI</span>
            </div>
            <div className={`scan-step ${scanStep >= 2 ? (scanStep > 2 ? 'completed' : 'active') : ''}`}>
              <CheckCircle2 size={14} />
              <span>2. Constructing Canonical AST</span>
            </div>
            <div className={`scan-step ${scanStep >= 3 ? (scanStep > 3 ? 'completed' : 'active') : ''}`}>
              <CheckCircle2 size={14} />
              <span>3. Evaluating 42 CIS/NIST Rules</span>
            </div>
            <div className={`scan-step ${scanStep >= 4 ? 'completed' : ''}`}>
              <CheckCircle2 size={14} />
              <span>4. Computing Confidence Triage</span>
            </div>
          </div>

          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill"
              style={{ width: `${(scanStep / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Raw Configuration Inspection Card */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={15} color="var(--text-secondary)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Configuration AST Preview: {displayConfig.fileName}
            </span>
            {isCustomLoaded && (
              <span className="badge badge-accent" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                Real Ingested File
              </span>
            )}
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            Fingerprint: {displayConfig.checksum}
          </span>
        </div>

        <pre style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11.5px',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-subtle)',
          padding: '14px',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)',
          maxHeight: '220px',
          overflowY: 'auto',
          lineHeight: '1.5'
        }}>
          {displayConfig.rawSnippet}
        </pre>
      </div>
    </div>
  );
}
