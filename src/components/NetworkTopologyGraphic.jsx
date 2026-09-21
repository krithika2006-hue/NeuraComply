import React, { useState } from 'react';
import {
  Server,
  ShieldCheck,
  ShieldAlert,
  Wifi,
  Activity,
  Cpu,
  Layers,
  CheckCircle2,
  AlertOctagon,
  RefreshCw
} from 'lucide-react';

export default function NetworkTopologyGraphic({ whatIfEnabled }) {
  const [selectedNodeId, setSelectedNodeId] = useState('cisco-core');
  const [isLivePulse, setIsLivePulse] = useState(true);

  const nodes = [
    {
      id: 'cisco-core',
      name: 'Core Distribution Switch',
      vendor: 'Cisco Systems',
      model: 'Catalyst 9300 (IOS-XE 17.9)',
      role: 'Enterprise Campus Distribution',
      ip: '10.200.1.1',
      interfaces: 48,
      astNodes: 3420,
      baselineScore: 78.6,
      whatIfScore: 98.4,
      status: whatIfEnabled ? 'compliant' : 'violation',
      criticalFindings: whatIfEnabled ? 0 : 3,
      x: 320,
      y: 190
    },
    {
      id: 'juniper-edge',
      name: 'Perimeter Gateway Router',
      vendor: 'Juniper Networks',
      model: 'SRX345 (Junos 22.4R1)',
      role: 'Edge BGP & IPsec Termination',
      ip: '198.51.100.1',
      interfaces: 16,
      astNodes: 2890,
      baselineScore: 84.2,
      whatIfScore: 97.8,
      status: 'compliant',
      criticalFindings: 0,
      x: 120,
      y: 90
    },
    {
      id: 'palo-ngfw',
      name: 'Next-Gen Perimeter Firewall',
      vendor: 'Palo Alto Networks',
      model: 'PA-3220 (PAN-OS 11.0)',
      role: 'Zero-Trust Inspection & App-ID',
      ip: '10.100.0.1',
      interfaces: 24,
      astNodes: 4120,
      baselineScore: 91.5,
      whatIfScore: 99.1,
      status: 'compliant',
      criticalFindings: 0,
      x: 520,
      y: 90
    },
    {
      id: 'arista-oob',
      name: 'Out-of-Band Management',
      vendor: 'Arista Networks',
      model: '7050SX3 (EOS 4.30)',
      role: 'Isolated Control Plane & AAA',
      ip: '172.16.1.254',
      interfaces: 32,
      astNodes: 1940,
      baselineScore: 95.0,
      whatIfScore: 99.5,
      status: 'compliant',
      criticalFindings: 0,
      x: 320,
      y: 330
    }
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="topology-card card">
      <div className="topology-header">
        <div className="topology-title-wrap">
          <div className="brand-icon" style={{ width: '28px', height: '28px' }}>
            <Layers size={15} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
              Multi-Vendor Network Infrastructure Topology
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Interactive AST evaluation matrix across perimeter, distribution, and control planes
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-subtle btn-sm"
            onClick={() => setIsLivePulse(!isLivePulse)}
            title="Toggle simulated AST packet inspection animation"
            style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Activity size={13} color={isLivePulse ? 'var(--status-compliant)' : 'var(--text-tertiary)'} />
            <span>{isLivePulse ? 'Live Telemetry Active' : 'Telemetry Paused'}</span>
          </button>
        </div>
      </div>

      <div className="topology-body">
        {/* SVG Interactive Topology Canvas */}
        <div className="topology-canvas-container">
          <svg
            className="topology-svg"
            viewBox="0 0 640 400"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="linkGradActive" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F4C5C" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#2D6A4F" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0F4C5C" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="linkGradViolation" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#982B2B" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#0F4C5C" stopOpacity="0.4" />
              </linearGradient>
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid Pattern */}
            <g opacity="0.35">
              {[60, 140, 220, 300, 380].map(y => (
                <line key={`h-${y}`} x1="20" y1={y} x2="620" y2={y} stroke="var(--border-subtle)" strokeDasharray="3 3" />
              ))}
              {[80, 180, 280, 380, 480, 580].map(x => (
                <line key={`v-${x}`} x1={x} y1="30" x2={x} y2="370" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              ))}
            </g>

            {/* Inter-Node Links */}
            {/* Juniper Edge <-> Cisco Core */}
            <line
              x1="120"
              y1="90"
              x2="320"
              y2="190"
              stroke={whatIfEnabled ? 'var(--status-compliant-border)' : 'var(--status-violation-border)'}
              strokeWidth="2.5"
            />
            {/* Palo Alto NGFW <-> Cisco Core */}
            <line
              x1="520"
              y1="90"
              x2="320"
              y2="190"
              stroke="var(--accent-border)"
              strokeWidth="2.5"
            />
            {/* Cisco Core <-> Arista OOB */}
            <line
              x1="320"
              y1="190"
              x2="320"
              y2="330"
              stroke="var(--accent-border)"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
            {/* Juniper <-> Palo Alto direct transit */}
            <line
              x1="120"
              y1="90"
              x2="520"
              y2="90"
              stroke="var(--border-default)"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />

            {/* Animated AST Pulse Particles */}
            {isLivePulse && (
              <>
                <circle r="4" fill="var(--accent-primary)">
                  <animateMotion
                    path="M 120 90 L 320 190"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r="4" fill={whatIfEnabled ? 'var(--status-compliant)' : 'var(--status-violation)'}>
                  <animateMotion
                    path="M 320 190 L 520 90"
                    dur="2.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r="3.5" fill="var(--accent-primary)">
                  <animateMotion
                    path="M 320 190 L 320 330"
                    dur="2.1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}

            {/* Nodes */}
            {nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isViolation = node.status === 'violation';

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <circle
                      r="36"
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      opacity="0.8"
                    />
                  )}

                  {/* Node Outer Circle */}
                  <circle
                    r="28"
                    fill="var(--bg-surface)"
                    stroke={
                      isViolation
                        ? 'var(--status-violation)'
                        : isSelected
                        ? 'var(--accent-primary)'
                        : 'var(--border-default)'
                    }
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                  />

                  {/* Node Center Icon / Indicator */}
                  <circle
                    r="8"
                    fill={
                      isViolation
                        ? 'var(--status-violation)'
                        : 'var(--status-compliant)'
                    }
                  />

                  {/* Label */}
                  <text
                    y="46"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isSelected ? '700' : '600'}
                    fill="var(--text-primary)"
                    fontFamily="var(--font-sans)"
                  >
                    {node.name}
                  </text>

                  <text
                    y="59"
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="var(--text-tertiary)"
                    fontFamily="var(--font-mono)"
                  >
                    {node.ip}
                  </text>

                  {/* Status Indicator Tag */}
                  {isViolation ? (
                    <g transform="translate(18, -18)">
                      <circle r="9" fill="var(--status-violation)" />
                      <text
                        textAnchor="middle"
                        dy="3.5"
                        fill="#fff"
                        fontSize="9"
                        fontWeight="700"
                        fontFamily="var(--font-sans)"
                      >
                        !
                      </text>
                    </g>
                  ) : (
                    <g transform="translate(18, -18)">
                      <circle r="9" fill="var(--status-compliant)" />
                      <text
                        textAnchor="middle"
                        dy="3.5"
                        fill="#fff"
                        fontSize="8.5"
                        fontWeight="700"
                        fontFamily="var(--font-sans)"
                      >
                        ✓
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Detail Telemetry Panel */}
        <div className="topology-inspector">
          <div className="topology-inspector-header">
            <span className="badge badge-accent" style={{ fontSize: '10px' }}>
              {selectedNode.vendor}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
              {selectedNode.ip}
            </span>
          </div>

          <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '8px 0 2px' }}>
            {selectedNode.name}
          </h4>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            {selectedNode.model} &bull; {selectedNode.role}
          </div>

          {/* Key Metrics Grid */}
          <div className="topology-metric-grid">
            <div className="topo-metric-box">
              <span className="topo-metric-label">Compliance</span>
              <span
                className="topo-metric-val"
                style={{
                  color: selectedNode.status === 'violation' ? 'var(--status-violation)' : 'var(--status-compliant)'
                }}
              >
                {whatIfEnabled ? selectedNode.whatIfScore : selectedNode.baselineScore}%
              </span>
            </div>

            <div className="topo-metric-box">
              <span className="topo-metric-label">AST Nodes</span>
              <span className="topo-metric-val">{selectedNode.astNodes.toLocaleString()}</span>
            </div>

            <div className="topo-metric-box">
              <span className="topo-metric-label">Interfaces</span>
              <span className="topo-metric-val">{selectedNode.interfaces} ports</span>
            </div>

            <div className="topo-metric-box">
              <span className="topo-metric-label">Findings</span>
              <span
                className="topo-metric-val"
                style={{
                  color: selectedNode.criticalFindings > 0 ? 'var(--status-violation)' : 'var(--status-compliant)'
                }}
              >
                {selectedNode.criticalFindings > 0 ? `${selectedNode.criticalFindings} Critical` : 'Clean'}
              </span>
            </div>
          </div>

          {/* Status Alert Note */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              backgroundColor: selectedNode.status === 'violation' ? 'var(--status-violation-bg)' : 'var(--status-compliant-bg)',
              border: `1px solid ${selectedNode.status === 'violation' ? 'var(--status-violation-border)' : 'var(--status-compliant-border)'}`,
              fontSize: '11.5px',
              color: selectedNode.status === 'violation' ? 'var(--status-violation)' : 'var(--status-compliant)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {selectedNode.status === 'violation' ? (
              <>
                <AlertOctagon size={14} />
                <span>Non-compliant policies detected in Line VTY and Crypto cipher suite</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>All evaluated CIS & CERT-In baseline controls satisfied</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
