import React, { useState } from 'react';
import { Network, Cpu, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

export default function ConvergenceVisual() {
  const [activeVendor, setActiveVendor] = useState(0);

  const vendors = [
    { name: 'Cisco IOS-XE', syntax: 'transport input ssh\nsnmp-server community...', color: '#0F4C5C' },
    { name: 'Juniper JunOS', syntax: 'set system services ssh\ndelete snmp community...', color: '#165F73' },
    { name: 'Palo Alto PAN-OS', syntax: '<system><service><telnet>no\n<http>disable</http>...', color: '#3D5A80' },
    { name: 'Fortinet FortiOS', syntax: 'set admin-telnet disable\nset strong-crypto enable...', color: '#2A6F97' }
  ];

  return (
    <div className="convergence-card">
      <div className="convergence-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="var(--accent-primary)" />
          <span className="convergence-title">Semantic AST Normalization Pipeline</span>
        </div>
        <span className="badge badge-accent">Multi-Vendor Engine</span>
      </div>

      {/* SVG Pipeline Diagram */}
      <div style={{ position: 'relative', width: '100%', minHeight: '260px', padding: '10px 0' }}>
        <svg viewBox="0 0 460 210" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DFDFD7" />
              <stop offset="60%" stopColor="#0F4C5C" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0F4C5C" />
            </linearGradient>
            <linearGradient id="outGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0F4C5C" />
              <stop offset="100%" stopColor="#2D6A4F" />
            </linearGradient>
          </defs>

          {/* Incoming Vendor Stream Paths Converging */}
          <path d="M 40 35 C 130 35, 140 105, 220 105" fill="none" stroke="url(#streamGrad)" strokeWidth="1.75" strokeDasharray="4 3" />
          <path d="M 40 80 C 130 80, 140 105, 220 105" fill="none" stroke="url(#streamGrad)" strokeWidth="1.75" />
          <path d="M 40 130 C 130 130, 140 105, 220 105" fill="none" stroke="url(#streamGrad)" strokeWidth="1.75" />
          <path d="M 40 175 C 130 175, 140 105, 220 105" fill="none" stroke="url(#streamGrad)" strokeWidth="1.75" strokeDasharray="4 3" />

          {/* Outgoing Compliance Path */}
          <path d="M 270 105 L 390 105" fill="none" stroke="url(#outGrad)" strokeWidth="2.5" />

          {/* Source Vendor Nodes */}
          <g transform="translate(10, 20)">
            <rect width="90" height="26" rx="4" fill="#FFFFFF" stroke="#DFDFD7" strokeWidth="1" />
            <text x="45" y="17" textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono)" fill="#181B1D">Cisco IOS-XE</text>
          </g>

          <g transform="translate(10, 67)">
            <rect width="90" height="26" rx="4" fill="#FFFFFF" stroke="#DFDFD7" strokeWidth="1" />
            <text x="45" y="17" textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono)" fill="#181B1D">Juniper JunOS</text>
          </g>

          <g transform="translate(10, 117)">
            <rect width="90" height="26" rx="4" fill="#FFFFFF" stroke="#DFDFD7" strokeWidth="1" />
            <text x="45" y="17" textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono)" fill="#181B1D">Palo Alto PAN-OS</text>
          </g>

          <g transform="translate(10, 162)">
            <rect width="90" height="26" rx="4" fill="#FFFFFF" stroke="#DFDFD7" strokeWidth="1" />
            <text x="45" y="17" textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono)" fill="#181B1D">Fortinet FortiOS</text>
          </g>

          {/* Central Normalization AST Core */}
          <g transform="translate(205, 75)">
            <rect width="64" height="60" rx="8" fill="#0F4C5C" />
            <rect x="2" y="2" width="60" height="56" rx="6" fill="#FFFFFF" stroke="#0F4C5C" strokeWidth="1" />
            <circle cx="32" cy="24" r="12" fill="#EDF5F7" />
            <text x="32" y="28" textAnchor="middle" fontSize="12" fill="#0F4C5C" fontWeight="bold">AI</text>
            <text x="32" y="47" textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill="#58616B">CANON-AST</text>
          </g>

          {/* Verified Destination Target */}
          <g transform="translate(370, 80)">
            <rect width="80" height="50" rx="6" fill="#EEF7F2" stroke="#CBE6D6" strokeWidth="1.2" />
            <circle cx="40" cy="20" r="8" fill="#2D6A4F" />
            <path d="M 37 20 L 39 22 L 44 17" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <text x="40" y="38" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#2D6A4F">CIS / NIST / STIG</text>
          </g>
        </svg>
      </div>

      {/* Interactive Micro-Terminal Below Graphic */}
      <div style={{
        marginTop: '12px',
        padding: '12px',
        borderRadius: '6px',
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {vendors.map((v, i) => (
              <button
                key={v.name}
                onClick={() => setActiveVendor(i)}
                style={{
                  padding: '2px 8px',
                  fontSize: '10.5px',
                  borderRadius: '3px',
                  border: '1px solid',
                  borderColor: activeVendor === i ? 'var(--accent-primary)' : 'var(--border-default)',
                  backgroundColor: activeVendor === i ? 'var(--bg-surface)' : 'transparent',
                  color: activeVendor === i ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                  fontWeight: activeVendor === i ? 600 : 400
                }}
              >
                {v.name.split(' ')[0]}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            AST Mapping &bull; 100% Deterministic
          </span>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          lineHeight: '1.4'
        }}>
          {vendors[activeVendor].syntax}
        </div>
      </div>
    </div>
  );
}
