import React from 'react';
import { ArrowRight, Play, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';
import ConvergenceVisual from './ConvergenceVisual';

export default function Hero({ onLaunchScanner, onLoadPreset }) {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          {/* Left: Pitch Messaging */}
          <div>
            <div className="hero-badge-row">
              <span className="badge badge-accent">
                <Cpu size={12} />
                <span>AI-Assisted Deterministic Network Governance</span>
              </span>
              <span className="badge" style={{ backgroundColor: 'var(--status-compliant-bg)', color: 'var(--status-compliant)', border: '1px solid var(--status-compliant-border)' }}>
                <span>🔒 Tamper-Evident Audit Ledger</span>
              </span>
            </div>

            <h1 className="hero-title">
              Compliance across every vendor. <br />
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                One unified posture.
              </span>
            </h1>

            <p className="hero-subtitle">
              Any vendor’s configuration — Cisco, Juniper, Fortinet, or Palo Alto — automatically normalized into an abstracted semantic AST and rigorously validated against CIS Benchmarks, NIST SP 800-53, and DISA STIG.
            </p>

            <div className="hero-cta-group">
              <button
                className="btn btn-primary"
                onClick={onLaunchScanner}
                style={{ padding: '10px 22px', fontSize: '14.5px' }}
              >
                <span>Try the scanner</span>
                <ArrowRight size={16} />
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  onLoadPreset('cisco-cat9300');
                  onLaunchScanner();
                }}
                style={{ padding: '10px 18px', fontSize: '14px' }}
              >
                <Play size={14} fill="currentColor" />
                <span>Load Live Sample (Cisco IOS)</span>
              </button>
            </div>

            {/* Built For / Trust Strip */}
            <div className="trust-strip">
              <span className="trust-label">
                Engineered for critical infrastructure & sovereign networks
              </span>
              <div className="trust-badges">
                <div className="trust-badge-item">
                  <CheckCircle size={13} color="var(--status-compliant)" />
                  <span>CIS Benchmark v4.0.0</span>
                </div>
                <div className="trust-badge-item">
                  <CheckCircle size={13} color="var(--status-compliant)" />
                  <span>NIST SP 800-53 Rev 5</span>
                </div>
                <div className="trust-badge-item">
                  <CheckCircle size={13} color="var(--status-compliant)" />
                  <span>DISA STIG Cat I/II</span>
                </div>
                <div className="trust-badge-item">
                  <CheckCircle size={13} color="var(--status-compliant)" />
                  <span>CERT-In Directions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Convergence Visual */}
          <div>
            <ConvergenceVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
