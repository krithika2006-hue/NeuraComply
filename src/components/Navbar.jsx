import React, { useState, useRef, useEffect } from 'react';
import { Shield, Sparkles, Terminal, CheckCircle2, SlidersHorizontal, FileText, ChevronDown, LogOut, Database } from 'lucide-react';
import { GoogleLogo } from './GoogleAuthModal';

export default function Navbar({
  currentView,
  setCurrentView,
  onOpenReport,
  user,
  onOpenGoogleSignIn,
  onSignOut,
  dbInfo
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDbConnected = dbInfo?.connected !== false;

  return (
    <>
      {/* Pitch Presenter Quick Navigation Strip */}
      <div className="presenter-bar">
        <div className="container presenter-bar-inner">
          <div className="presenter-tag">
            <Sparkles size={13} />
            <span>SIH 2026 PITCH DEMO</span>
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>| Problem: AI Multi-Vendor Compliance</span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: '8px',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: isDbConnected ? 'rgba(46, 125, 50, 0.12)' : 'rgba(211, 47, 47, 0.1)',
              border: `1px solid ${isDbConnected ? 'rgba(46, 125, 50, 0.3)' : 'rgba(211, 47, 47, 0.25)'}`,
              fontSize: '10.5px',
              fontWeight: 600,
              color: isDbConnected ? '#2E7D32' : '#C62828'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isDbConnected ? '#2E7D32' : '#C62828',
                boxShadow: isDbConnected ? '0 0 4px #2E7D32' : 'none'
              }} />
              <Database size={11} />
              <span>{isDbConnected ? 'PostgreSQL 15: neuracomply (5432)' : 'PostgreSQL: Offline'}</span>
            </div>
          </div>

          <div className="presenter-buttons">
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginRight: '4px' }}>Jump to:</span>
            <button
              className={`p-btn ${currentView === 'landing' ? 'active' : ''}`}
              onClick={() => setCurrentView('landing')}
            >
              1. Landing & Pitch
            </button>
            <button
              className={`p-btn ${currentView === 'upload' ? 'active' : ''}`}
              onClick={() => setCurrentView('upload')}
            >
              2. Upload & Presets
            </button>
            <button
              className={`p-btn ${currentView === 'results' ? 'active' : ''}`}
              onClick={() => setCurrentView('results')}
            >
              3. Results Dashboard
            </button>
            <button
              className={`p-btn ${currentView === 'triage' ? 'active' : ''}`}
              onClick={() => setCurrentView('triage')}
            >
              4. Confidence Triage (Differentiator)
            </button>
            <button
              className={`p-btn ${currentView === 'ledger' ? 'active' : ''}`}
              onClick={() => setCurrentView('ledger')}
            >
              5. Audit Ledger (Blockchain)
            </button>
          </div>
        </div>
      </div>

      {/* Main Enterprise Navbar */}
      <header className="navbar">
        <div className="container nav-container">
          <a
            href="#top"
            className="nav-brand"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('landing');
            }}
          >
            <div className="brand-icon">
              <Shield size={18} />
            </div>
            <div>
              <span className="brand-title">NeuraComply</span>
            </div>
            <span className="brand-meta">v1.4 &bull; SIH Enterprise</span>
          </a>

          <nav>
            <ul className="nav-links">
              <li>
                <span
                  className={`nav-link ${currentView === 'landing' ? 'active' : ''}`}
                  onClick={() => setCurrentView('landing')}
                >
                  Overview
                </span>
              </li>
              <li>
                <span
                  className={`nav-link ${currentView === 'upload' ? 'active' : ''}`}
                  onClick={() => setCurrentView('upload')}
                >
                  Scanner
                </span>
              </li>
              <li>
                <span
                  className={`nav-link ${currentView === 'results' ? 'active' : ''}`}
                  onClick={() => setCurrentView('results')}
                >
                  Auditor Posture
                </span>
              </li>
              <li>
                <span
                  className={`nav-link ${currentView === 'triage' ? 'active' : ''}`}
                  onClick={() => setCurrentView('triage')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Confidence Triage
                  <span className="badge badge-accent" style={{ fontSize: '9px', padding: '1px 5px' }}>Core</span>
                </span>
              </li>
              <li>
                <span
                  className={`nav-link ${currentView === 'ledger' ? 'active' : ''}`}
                  onClick={() => setCurrentView('ledger')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Audit Ledger
                  <span className="badge badge-accent" style={{ fontSize: '9px', padding: '1px 5px' }}>Immutable</span>
                </span>
              </li>
            </ul>
          </nav>

          <div className="nav-actions">
            {/* Google Sign-In / Authenticated User Profile */}
            {user ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="user-profile-trigger"
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  title="Google SSO Authenticated"
                >
                  <div className="user-avatar-circle" style={{ backgroundColor: user.avatarBg || '#0F4C5C' }}>
                    {user.avatarText || user.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <GoogleLogo size={13} />
                  <ChevronDown size={14} color="var(--text-tertiary)" />
                </button>

                {isDropdownOpen && (
                  <div className="user-dropdown-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div
                        className="user-avatar-circle"
                        style={{
                          width: '38px',
                          height: '38px',
                          fontSize: '15px',
                          backgroundColor: user.avatarBg || '#0F4C5C',
                          flexShrink: 0
                        }}
                      >
                        {user.avatarText || user.name.charAt(0)}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '12px',
                      fontSize: '11.5px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--status-compliant)', fontWeight: 600, marginBottom: '3px' }}>
                        <CheckCircle2 size={12} />
                        <span>Google SSO Verified</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Role: <strong>{user.role}</strong>
                      </div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '10.5px', marginTop: '2px' }}>
                        Blockchain Identity Binding: Active
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', justifyContent: 'center', color: 'var(--status-violation)' }}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onSignOut();
                      }}
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn-google"
                onClick={onOpenGoogleSignIn}
                title="Sign in with your Google account"
              >
                <GoogleLogo size={15} />
                <span>Sign in with Google</span>
              </button>
            )}

            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenReport}
              title="Generate Executive Audit PDF Brief"
            >
              <FileText size={14} />
              <span>Audit Brief</span>
            </button>

            {currentView === 'landing' ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentView('upload')}
              >
                <span>Launch Auditor</span>
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentView('upload')}
              >
                <span>New Scan</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
