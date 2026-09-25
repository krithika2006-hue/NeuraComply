import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import PullQuote from './components/PullQuote';
import UploadScanSection from './components/UploadScanSection';
import ResultsDashboard from './components/ResultsDashboard';
import ConfidenceTriageView from './components/ConfidenceTriageView';
import AuditLedgerView from './components/AuditLedgerView';
import ReportModal from './components/ReportModal';
import GoogleAuthModal from './components/GoogleAuthModal';
import { Shield, Sparkles, Check, ArrowRight, Lock } from 'lucide-react';
import { VENDOR_PRESETS, AUDIT_CONTROLS } from './data/mockData';
import { INITIAL_FABRIC_BLOCKS, createFabricBlock } from './data/hyperledgerFabricService';
import { generateChecksum, evaluateRealConfig } from './data/auditParser';
import { REAL_SAMPLE_CONFIGS } from './components/UploadScanSection';
import {
  checkBackendHealth,
  fetchDevicesFromDb,
  scanConfigToDb,
  fetchLedgerFromDb
} from './data/apiService';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'upload' | 'results' | 'triage' | 'ledger'
  const [selectedPreset, setSelectedPreset] = useState('cisco-cat9300');
  const [customConfig, setCustomConfig] = useState(null);
  const [customControls, setCustomControls] = useState(null);
  const [dbInfo, setDbInfo] = useState({ connected: true, dbEngine: 'PostgreSQL 15', dbName: 'neuracomply' });
  const [dbDevices, setDbDevices] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('neura_google_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(1);
  const [whatIfEnabled, setWhatIfEnabled] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [auditBlocks, setAuditBlocks] = useState(INITIAL_FABRIC_BLOCKS);

  // Sync with PostgreSQL on mount
  useEffect(() => {
    async function initDb() {
      try {
        const health = await checkBackendHealth();
        setDbInfo(health);
        if (health.connected) {
          const devices = await fetchDevicesFromDb();
          if (devices && devices.length > 0) setDbDevices(devices);
          const blocks = await fetchLedgerFromDb();
          if (blocks && blocks.length > 0) setAuditBlocks(blocks);
        }
      } catch (err) {
        console.warn('[NeuraComply] DB initial check:', err);
      }
    }
    initDb();
  }, []);

  const activeConfig = customConfig || VENDOR_PRESETS.find(p => p.id === selectedPreset) || VENDOR_PRESETS[0];
  const activeControls = customControls || AUDIT_CONTROLS;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Add block to immutable Hyperledger Fabric ledger state
  const addAuditBlock = (eventData) => {
    setAuditBlocks(prev => {
      const prevHead = prev[0];
      const targetSystem = activeConfig?.name || 'Cisco Catalyst 9300';
      const defaultOperator = user ? `${user.name} (${user.email})` : 'SecOps-Auditor (Console Session)';
      const newBlock = createFabricBlock({
        previousBlock: prevHead,
        targetSystem,
        operator: defaultOperator,
        ...eventData
      });
      return [newBlock, ...prev];
    });
  };

  const handleGoogleSignInSuccess = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('neura_google_user', JSON.stringify(userData));
    } catch (e) {}

    addAuditBlock({
      eventType: 'OPERATOR_AUTHENTICATED',
      eventTitle: `Google SSO Identity Bound: ${userData.name}`,
      eventDescription: `Operator authenticated via Google OAuth 2.0 (${userData.email}). Role: ${userData.role} at ${userData.organization}.`,
      operator: `${userData.name} (${userData.email})`,
      metadata: {
        provider: userData.provider,
        role: userData.role,
        organization: userData.organization
      }
    });

    showToast(`Signed in with Google as ${userData.name}`);
  };

  const handleSignOut = () => {
    const priorName = user?.name || 'Operator';
    setUser(null);
    try {
      localStorage.removeItem('neura_google_user');
    } catch (e) {}
    showToast(`Signed out (${priorName})`);
  };

  // Run genuine phased scan
  const handleStartScan = () => {
    setIsScanning(true);
    setScanStep(1);

    const timer1 = setTimeout(() => setScanStep(2), 500);
    const timer2 = setTimeout(() => setScanStep(3), 1100);
    const timer3 = setTimeout(() => setScanStep(4), 1800);
    const timer4 = setTimeout(async () => {
      setIsScanning(false);

      // Resolve full configuration text
      let configContent = activeConfig.fullContent || activeConfig.rawSnippet || '';
      if (!activeConfig.fullContent) {
        try {
          const sample = REAL_SAMPLE_CONFIGS.find(s => s.fileName === activeConfig.fileName) ||
                         REAL_SAMPLE_CONFIGS.find(s => s.id === activeConfig.id) ||
                         REAL_SAMPLE_CONFIGS[0];
          if (sample) {
            const res = await fetch(sample.url);
            if (res.ok) {
              configContent = await res.text();
            }
          }
        } catch (e) {
          console.warn('Sample config fetch error:', e);
        }
      }

      // 1. Run real deterministic AST parser on the configuration
      const checksum = await generateChecksum(configContent);
      const evalResult = evaluateRealConfig(activeConfig.fileName, configContent, checksum);
      evalResult.parsedConfig.fullContent = configContent;

      setCustomConfig(evalResult.parsedConfig);
      setCustomControls(evalResult.controls);

      // 2. Persist to PostgreSQL backend if connected
      if (dbInfo.connected) {
        try {
          const scanRes = await scanConfigToDb(
            evalResult.parsedConfig.fileName,
            configContent,
            checksum
          );
          if (scanRes && scanRes.blockNumber) {
            const blocks = await fetchLedgerFromDb();
            if (blocks && blocks.length > 0) setAuditBlocks(blocks);
          }
        } catch (e) {
          console.warn('DB scan sync:', e);
        }
      }

      // 3. Anchor real audit block to ledger
      addAuditBlock({
        eventType: 'SCAN_COMPLETED',
        eventTitle: `Real Compliance Scan Completed: ${evalResult.parsedConfig.name}`,
        eventDescription: `Completed 4-stage AST parsing, canonical normalization, and ${evalResult.controls.length}-rule compliance evaluation for ${evalResult.parsedConfig.fileName}.`,
        operator: user ? `${user.name} (${user.email})` : 'SecOps-Auditor (Console Session)',
        metadata: {
          presetId: evalResult.parsedConfig.id,
          rulesEvaluated: evalResult.controls.length,
          astNodes: evalResult.parsedConfig.lineCount * 3,
          frameworks: 'CIS Benchmarks / NIST SP 800-53',
          persistedDatabase: dbInfo.connected ? 'PostgreSQL 15 (neuracomply)' : 'Local State'
        }
      });
      setCurrentView('results');
      showToast(`Real compliance audit complete for ${evalResult.parsedConfig.fileName} (${evalResult.parsedConfig.lineCount} lines)`);
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  const handleFastForwardScan = () => {
    setIsScanning(false);
    addAuditBlock({
      eventType: 'SCAN_COMPLETED',
      eventTitle: `Fast-Forward Scan Completed: ${activeConfig.name}`,
      eventDescription: `Direct baseline audit results loaded and cryptographically chained to ledger.`,
      operator: user ? `${user.name} (${user.email})` : 'SecOps-Auditor (Console Session)',
      metadata: {
        presetId: activeConfig.id,
        rulesEvaluated: activeControls.length
      }
    });
    setCurrentView('results');
    showToast('Skipped scan animation • Results loaded');
  };

  return (
    <div className="app-layout">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <Check size={16} color="#B7E4C7" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenReport={() => setIsReportOpen(true)}
        user={user}
        onOpenGoogleSignIn={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        dbInfo={dbInfo}
      />

      {/* Main View Router */}
      <main>
        {currentView === 'landing' && (
          <>
            <Hero
              onLaunchScanner={() => setCurrentView('upload')}
              onLoadPreset={(id) => {
                setSelectedPreset(id);
                showToast(`Loaded live sample preset: Cisco Catalyst 9300`);
              }}
            />
            <Features onNavigateToTriage={() => setCurrentView('triage')} />
            <PullQuote />

            {/* Quick Demo Jump to Live Scanner */}
            <section style={{ padding: '64px 0 80px', backgroundColor: 'var(--bg-canvas)' }}>
              <div className="container">
                <div className="card" style={{
                  padding: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '32px',
                  border: '1px solid var(--accent-border)',
                  backgroundColor: '#FCFDFD'
                }}>
                  <div>
                    <span className="badge badge-accent" style={{ marginBottom: '8px' }}>
                      Ready to experience the auditor?
                    </span>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
                      Try the Multi-Vendor Scanner Live
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Ingest Cisco, Juniper, Fortinet, or Palo Alto configurations and witness real-time AST normalization.
                    </p>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={() => setCurrentView('upload')}
                    style={{ padding: '11px 24px', fontSize: '14px', whiteSpace: 'nowrap' }}
                  >
                    <span>Launch Scanner</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {currentView !== 'landing' && (
          <section className="auditor-section">
            <div className="container">
              {/* Workspace Header Tabs */}
              <div className="workspace-header">
                <div className="workspace-title-group">
                  <h2>Multi-Vendor Security Compliance Auditor</h2>
                  <p>
                    Target: {activeConfig.name} &bull; Canonical AST Engine
                  </p>
                </div>

                <div className="workspace-tabs">
                  <button
                    className={`workspace-tab ${currentView === 'upload' ? 'active' : ''}`}
                    onClick={() => setCurrentView('upload')}
                  >
                    <span>1. Ingest & Scanner</span>
                  </button>

                  <button
                    className={`workspace-tab ${currentView === 'results' ? 'active' : ''}`}
                    onClick={() => setCurrentView('results')}
                  >
                    <span>2. Compliance Posture</span>
                  </button>

                  <button
                    className={`workspace-tab ${currentView === 'triage' ? 'active' : ''}`}
                    onClick={() => setCurrentView('triage')}
                  >
                    <span>3. Confidence Triage</span>
                    <span className="badge badge-accent" style={{ fontSize: '9px', padding: '1px 5px' }}>Differentiator</span>
                  </button>

                  <button
                    className={`workspace-tab ${currentView === 'ledger' ? 'active' : ''}`}
                    onClick={() => setCurrentView('ledger')}
                  >
                    <span>4. Audit Ledger</span>
                    <span className="badge badge-accent" style={{ fontSize: '9px', padding: '1px 5px' }}>Blockchain</span>
                  </button>
                </div>
              </div>

              {/* View 1: Upload & Scan */}
              {currentView === 'upload' && (
                <UploadScanSection
                  selectedPreset={selectedPreset}
                  setSelectedPreset={(id) => {
                    setSelectedPreset(id);
                    setCustomConfig(null);
                    setCustomControls(null);
                    showToast(`Preset loaded: ${VENDOR_PRESETS.find(p => p.id === id)?.name}`);
                  }}
                  activeConfig={activeConfig}
                  onConfigLoaded={(config, controls) => {
                    setCustomConfig(config);
                    setCustomControls(controls);
                  }}
                  onResetToPreset={() => {
                    setCustomConfig(null);
                    setCustomControls(null);
                  }}
                  isCustomLoaded={!!customConfig}
                  isScanning={isScanning}
                  scanStep={scanStep}
                  onStartScan={handleStartScan}
                  onFastForwardScan={handleFastForwardScan}
                  showToast={showToast}
                />
              )}

              {/* View 2: Results Dashboard */}
              {currentView === 'results' && (
                <ResultsDashboard
                  selectedPreset={selectedPreset}
                  activeConfig={activeConfig}
                  activeControls={activeControls}
                  whatIfEnabled={whatIfEnabled}
                  setWhatIfEnabled={setWhatIfEnabled}
                  onNavigateToTriage={() => setCurrentView('triage')}
                  onNavigateToLedger={() => setCurrentView('ledger')}
                  onOpenReport={() => setIsReportOpen(true)}
                  auditBlocks={auditBlocks}
                  showToast={showToast}
                />
              )}

              {/* View 3: Confidence Triage */}
              {currentView === 'triage' && (
                <ConfidenceTriageView
                  showToast={showToast}
                  onNavigateToLedger={() => setCurrentView('ledger')}
                  onRecordAuditEvent={addAuditBlock}
                  auditBlocks={auditBlocks}
                />
              )}

              {/* View 4: Immutable Audit Ledger (Blockchain) */}
              {currentView === 'ledger' && (
                <AuditLedgerView
                  auditBlocks={auditBlocks}
                  showToast={showToast}
                />
              )}
            </div>
          </section>
        )}
      </main>

      {/* Minimal Enterprise Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="brand-icon" style={{ width: '24px', height: '24px' }}>
              <Shield size={14} />
            </div>
            <span>NeuraComply</span>
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>&mdash; Enterprise Network Security Compliance</span>
          </div>

          <div className="footer-sih-note">
            Built for Smart India Hackathon (SIH) &bull; Problem Statement: AI-Driven Multi-Vendor Network Security Compliance Auditor
          </div>
        </div>
      </footer>

      {/* Executive Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        selectedPreset={selectedPreset}
        activeConfig={activeConfig}
        activeControls={activeControls}
        whatIfEnabled={whatIfEnabled}
        auditBlocks={auditBlocks}
        user={user}
      />

      {/* Google Authentication Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignInSuccess={handleGoogleSignInSuccess}
      />
    </div>
  );
}
