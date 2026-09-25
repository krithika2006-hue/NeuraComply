import React from 'react';
import { Layers, Gauge, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function Features({ onNavigateToTriage }) {
  const features = [
    {
      icon: <Layers size={20} />,
      title: 'Vendor-Agnostic Parsing',
      desc: 'Translates idiosyncratic Cisco IOS, JunOS, FortiOS, and PAN-OS syntaxes into a single canonical Abstract Syntax Tree (AST), eliminating fragile regex matching.',
      tag: 'Semantic Layer'
    },
    {
      icon: <Gauge size={20} />,
      title: 'Confidence-Scored Automation',
      desc: 'Differentiates high-confidence semantic mappings (≥80% confidence, auto-resolved) from ambiguous operator intent (<80% confidence, flagged with AI explanation for human sign-off).',
      tag: 'Core Innovation',
      isHighlight: true
    },
    {
      icon: <ShieldCheck size={20} />,
      title: 'Continuous Multi-Framework Compliance',
      desc: 'A single configuration parse simultaneously audits against CIS Benchmarks, NIST SP 800-53 Rev 5, and DISA STIG without redundant re-scans.',
      tag: 'Cross-Mapped'
    }
  ];

  return (
    <section className="features-section">
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <span className="badge badge-accent" style={{ marginBottom: '8px' }}>Platform Capabilities</span>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Architected for High-Assurance Network Operations</h2>
        </div>

        <div className="features-grid">
          {features.map((feat, idx) => (
            <div
              key={feat.title}
              className="feature-card"
              style={feat.isHighlight ? { borderColor: 'var(--accent-border)', backgroundColor: '#FCFDFD' } : {}}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="feature-icon-wrapper">
                  {feat.icon}
                </div>
                <span className={`badge ${feat.isHighlight ? 'badge-accent' : ''}`}>
                  {feat.tag}
                </span>
              </div>

              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>

              {feat.isHighlight && (
                <button
                  className="btn btn-subtle btn-sm"
                  onClick={onNavigateToTriage}
                  style={{
                    padding: '4px 0',
                    fontSize: '12px',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    justifyContent: 'flex-start'
                  }}
                >
                  <span>Explore the Triage Engine</span>
                  <ArrowUpRight size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
