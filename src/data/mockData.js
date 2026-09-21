// Mock Network Configurations and Compliance Datasets for NeuraComply

export const VENDOR_PRESETS = [
  {
    id: 'cisco-cat9300',
    name: 'Cisco Catalyst 9300 (IOS-XE 17.6)',
    role: 'Core Branch Switch / L3 Gateway',
    vendor: 'Cisco Systems',
    os: 'Cisco IOS-XE 17.06.05',
    checksum: 'sha256:4a8b7921c3...e91',
    lineCount: 1248,
    interfacesDetected: 48,
    protocolFootprint: ['OSPFv2', 'BGP (AS 65001)', 'SSHv1/v2', 'SNMPv2c', 'NTP'],
    initialScore: 87,
    whatIfScore: 98,
    controlsPassed: 34,
    controlsWarning: 5,
    controlsViolation: 3,
    fileName: 'cisco_cat9300_edge_gw.cfg',
    rawSnippet: `! Last configuration change at 14:22:10 UTC by netadmin
version 17.6
service timestamps debug datetime msec
service timestamps log datetime msec
no service password-encryption
!
hostname EDGE-CAT9300-01
!
boot-start-marker
boot-end-marker
!
enable secret 9 $9$vDqY$y6T87M...
!
aaa new-model
aaa authentication login default local
aaa authorization exec default local
!
ip domain name corp.defense.gov
ip name-server 10.100.1.10 10.100.1.11
!
snmp-server community public RO
snmp-server community secretmgr RW 10
snmp-server location BLDG-4-RACK-02
!
interface GigabitEthernet1/0/1
 description UPLINK-TO-WAN-PRIMARY
 ip address 198.51.100.2 255.255.255.252
 no shutdown
!
interface Vlan10
 description MGMT-OOB
 ip address 10.250.1.1 255.255.255.0
!
router ospf 100
 router-id 10.250.1.1
 network 10.250.1.0 0.0.0.255 area 0
!
ip http server
no ip http secure-server
!
line con 0
 exec-timeout 15 0
 stopbits 2
line vty 0 4
 transport input all
 exec-timeout 0 0
 login local
!
end`,
  },
  {
    id: 'juniper-srx340',
    name: 'Juniper SRX340 (JunOS 21.4R3)',
    role: 'Perimeter Security Gateway',
    vendor: 'Juniper Networks',
    os: 'Junos OS 21.4R3-S2.4',
    checksum: 'sha256:d82e117a0b...3c4',
    lineCount: 986,
    interfacesDetected: 16,
    protocolFootprint: ['BGP (AS 65120)', 'IPsec IKEv2', 'J-Flow', 'Syslog TLS'],
    initialScore: 91,
    whatIfScore: 100,
    controlsPassed: 38,
    controlsWarning: 3,
    controlsViolation: 1,
    fileName: 'junos_srx340_perimeter.conf',
    rawSnippet: `## Last commit: 2026-08-14 09:12:00 EDT by srxadmin
version 21.4R3-S2.4;
system {
    host-name SRX-PERIMETER-01;
    root-authentication {
        encrypted-password "$6$bK3$19a2...";
    }
    services {
        ssh {
            protocol-version v2;
            rate-limit 5;
        }
        web-management {
            http {
                interface ge-0/0/0.0;
            }
        }
    }
    syslog {
        archive size 100k files 3;
        user * {
            any emergency;
        }
    }
}
security {
    policies {
        from-zone trust to-zone untrust {
            policy default-permit {
                match {
                    source-address any;
                    destination-address any;
                    application any;
                }
                then {
                    permit;
                }
            }
        }
    }
}`,
  },
  {
    id: 'paloalto-pa3220',
    name: 'Palo Alto PA-3220 (PAN-OS 10.2)',
    role: 'Data Center Next-Gen Firewall',
    vendor: 'Palo Alto Networks',
    os: 'PAN-OS 10.2.4-h2',
    checksum: 'sha256:bc314e9f82...77a',
    lineCount: 1640,
    interfacesDetected: 24,
    protocolFootprint: ['App-ID', 'WildFire API', 'OSPFv3', 'GlobalProtect'],
    initialScore: 89,
    whatIfScore: 97,
    controlsPassed: 36,
    controlsWarning: 4,
    controlsViolation: 2,
    fileName: 'panos_pa3220_datacenter.xml',
    rawSnippet: `<config version="10.2.0">
  <mgt-config>
    <users>
      <entry name="admin">
        <phash>$1$xyz$...</phash>
        <permissions>rolebased</permissions>
      </entry>
    </users>
  </mgt-config>
  <devices>
    <entry name="localhost.localdomain">
      <deviceconfig>
        <system>
          <type>
            <static/>
          </type>
          <update-schedule>
            <threats>
              <recurring>
                <every-30-mins/>
              </recurring>
            </threats>
          </update-schedule>
          <service>
            <disable-telnet>yes</disable-telnet>
            <disable-http>no</disable-http>
          </service>
        </system>
      </deviceconfig>
    </entry>
  </devices>
</config>`,
  },
  {
    id: 'fortinet-100f',
    name: 'Fortinet FortiGate 100F (FortiOS 7.2)',
    role: 'Enterprise Campus Edge Security',
    vendor: 'Fortinet',
    os: 'FortiOS v7.2.5 build1517',
    checksum: 'sha256:fe92100cb4...109',
    lineCount: 1120,
    interfacesDetected: 22,
    protocolFootprint: ['SD-WAN', 'FortiLink', 'BGP', 'AV/IPS', 'SSL-VPN'],
    initialScore: 85,
    whatIfScore: 96,
    controlsPassed: 32,
    controlsWarning: 7,
    controlsViolation: 3,
    fileName: 'fortigate_100f_campus.conf',
    rawSnippet: `config system global
    set hostname "FGT100F-CAMPUS-01"
    set timezone 04
    set admin-sport 443
    set admin-ssh-port 22
    set admin-telnet disable
    set strong-crypto enable
end
config system admin
    edit "admin"
        set trusthost1 0.0.0.0 0.0.0.0
    next
end
config system snmp community
    edit 1
        set name "public"
        set status enable
    next
end`,
  }
];

export const COMPLIANCE_FRAMEWORKS = [
  { id: 'cis', name: 'CIS Benchmarks v4.0.0', desc: 'Center for Internet Security Level 1 & 2 controls' },
  { id: 'nist', name: 'NIST SP 800-53 Rev 5', desc: 'Federal Security & Privacy Controls (AC, SC, CM)' },
  { id: 'stig', name: 'DISA STIG Cat I/II', desc: 'DoD Cybersecurity Configuration Directives' },
];

export const AUDIT_CONTROLS = [
  {
    id: 'CIS-2.1.4',
    code: 'CIS 2.1.4 / NIST SC-8',
    title: 'Require SSH Version 2 and Disable Legacy Telnet Transport',
    category: 'Remote Access & Management',
    severity: 'critical',
    status: 'violation',
    framework: 'CIS / NIST',
    remediatedInWhatIf: true,
    description: 'Telnet transmits all credentials, commands, and cryptographic keys in plaintext. CIS 2.1.4 mandates that all VTY terminal lines strictly permit only SSHv2 (transport input ssh) and disable legacy protocols.',
    offendingSnippet: {
      lineStart: 38,
      lineEnd: 42,
      content: `line vty 0 4
  transport input all     <-- VIOLATION: Telnet & rlogin permitted across vty lines
  exec-timeout 0 0        <-- VIOLATION: Inactivity session timeout disabled
  login local`
    },
    remediationCommand: `line vty 0 4
  transport input ssh
  exec-timeout 15 0
  transport output none
exit`,
    vendorEquivalent: {
      juniper: 'set system services ssh protocol-version v2\ndelete system services telnet',
      fortinet: 'config system global\n  set admin-telnet disable\nend'
    },
    astCanonicalRule: 'remote_management.transport_allowed == ["SSH_V2"] && session.inactivity_timeout_seconds <= 900',
    auditReason: 'Detected `transport input all` allowing cleartext port 23 communication, in violation of NIST SC-8 transmission confidentiality.'
  },
  {
    id: 'CIS-1.2.1',
    code: 'CIS 1.2.1 / STIG NET-088',
    title: 'Eliminate Default SNMP Community Strings ("public" / "private")',
    category: 'Monitoring & Telemetry',
    severity: 'critical',
    status: 'violation',
    framework: 'CIS / STIG',
    remediatedInWhatIf: true,
    description: 'SNMPv1/v2c community string "public" provides unauthenticated read access to MIB trees including ARP tables, routing tables, and interface addresses.',
    offendingSnippet: {
      lineStart: 18,
      lineEnd: 20,
      content: `snmp-server community public RO   <-- CRITICAL: Well-known default string allows reconnaissance
snmp-server community secretmgr RW 10`
    },
    remediationCommand: `no snmp-server community public
snmp-server group SECURE_GRP v3 priv read MIB_VIEW
snmp-server user sec_auditor SECURE_GRP v3 auth sha256 StrongPass123! priv aes 256 StrongKey456!`,
    vendorEquivalent: {
      juniper: 'delete snmp community public',
      fortinet: 'config system snmp community\n  delete 1\nend'
    },
    astCanonicalRule: 'telemetry.snmp.community_strings.disallowed_contains(["public", "private", "admin"])',
    auditReason: 'Default community string `public` discovered. Vulnerable to unauthenticated SNMP enumeration.'
  },
  {
    id: 'CIS-2.2.2',
    code: 'CIS 2.2.2 / NIST AC-2',
    title: 'Disable Unencrypted Plaintext HTTP Server Daemon',
    category: 'Web Administration',
    severity: 'critical',
    status: 'violation',
    framework: 'CIS / NIST',
    remediatedInWhatIf: true,
    description: 'The internal HTTP administrative daemon transmits session cookies and administrative passwords unencrypted over cleartext TCP port 80.',
    offendingSnippet: {
      lineStart: 32,
      lineEnd: 34,
      content: `ip http server               <-- VIOLATION: Insecure cleartext web daemon active
no ip http secure-server      <-- VIOLATION: HTTPS administrative server is disabled`
    },
    remediationCommand: `no ip http server
ip http secure-server
ip http secure-ciphersuite ecdhe-rsa-aes-256-gcm-sha384`,
    vendorEquivalent: {
      juniper: 'delete system services web-management http\nset system services web-management https system-generated-certificate',
      fortinet: 'config system global\n  set admin-http disable\nend'
    },
    astCanonicalRule: 'web_management.cleartext_http == false && web_management.tls_enabled == true',
    auditReason: 'Plaintext HTTP management enabled without TLS encapsulation.'
  },
  {
    id: 'CIS-1.1.2',
    code: 'CIS 1.1.2 / NIST IA-2',
    title: 'Enforce Encrypted Type-8/Type-9 Password Hashes',
    category: 'Authentication',
    severity: 'medium',
    status: 'warning',
    framework: 'CIS / NIST',
    remediatedInWhatIf: true,
    description: 'Global `service password-encryption` is disabled, allowing weak Vigenere or cleartext passwords in configuration backups.',
    offendingSnippet: {
      lineStart: 5,
      lineEnd: 7,
      content: `no service password-encryption   <-- WARNING: Legacy Type-7 or plaintext passwords stored`
    },
    remediationCommand: `service password-encryption
password algorithm scrypt`,
    vendorEquivalent: {
      juniper: 'set system login password format sha-512',
      fortinet: 'config system global\n  set strong-crypto enable\nend'
    },
    astCanonicalRule: 'crypto.local_credentials.min_hashing_algorithm >= "SHA256"',
    auditReason: 'Missing reversible password suppression directive.'
  },
  {
    id: 'CIS-3.1.5',
    code: 'CIS 3.1.5 / STIG NET-140',
    title: 'Configure Standard Warning Login Banner (Legal Notice)',
    category: 'Legal & Warning Banners',
    severity: 'low',
    status: 'warning',
    framework: 'CIS / STIG',
    remediatedInWhatIf: true,
    description: 'DISA STIG and CIS mandate that all interactive sessions display a legal notice advising that unauthorized access is prohibited and subject to monitoring.',
    offendingSnippet: {
      lineStart: 1,
      lineEnd: 2,
      content: `! Notice: No "banner motd" or "banner login" definition found in configuration AST.`
    },
    remediationCommand: `banner login ^C
*******************************************************************************
* WARNING: Unauthorized access to this network system is strictly prohibited. *
* All activities are monitored and logged. Disconnect immediately.           *
*******************************************************************************^C`,
    vendorEquivalent: {
      juniper: 'set system login message "UNAUTHORIZED ACCESS PROHIBITED - MONITORED SYSTEM"',
      fortinet: 'config system global\n  set pre-login-banner enable\nend'
    },
    astCanonicalRule: 'system.banners.legal_notice_present == true',
    auditReason: 'No statutory warning banner detected prior to authentication prompt.'
  },
  {
    id: 'CIS-4.2.1',
    code: 'CIS 4.2.1 / NIST AC-3',
    title: 'Apply Infrastructure Access Control List (iACL) on Inbound Management',
    category: 'Control Plane Protection',
    severity: 'medium',
    status: 'warning',
    framework: 'NIST',
    remediatedInWhatIf: false, // Remains human review in default mode
    description: 'VTY and SSH interfaces should restrict source IP addresses to trusted bastion subnets (e.g. 10.250.0.0/16) to mitigate brute-force attacks.',
    offendingSnippet: {
      lineStart: 38,
      lineEnd: 40,
      content: `line vty 0 4
  ! No "access-class" directive bound to VTY interfaces`
    },
    remediationCommand: `ip access-list standard VTY-PROTECT
 permit 10.250.1.0 0.0.0.255
 permit 10.100.50.0 0.0.0.255
 deny any log
!
line vty 0 4
 access-class VTY-PROTECT in vrf-also`,
    vendorEquivalent: {
      juniper: 'set firewall filter PROTECT-RE term MGMT from source-prefix-list BASTION-HOSTS\nset firewall filter PROTECT-RE term MGMT then accept',
      fortinet: 'config system admin\n  edit admin\n    set trusthost1 10.250.1.0 255.255.255.0\n  next\nend'
    },
    astCanonicalRule: 'control_plane.inbound_management.source_ip_filter_applied == true',
    auditReason: 'Management interfaces accept ingress SYN packets from all routable interfaces without perimeter iACL filtering.'
  },
  {
    id: 'CIS-5.1.1',
    code: 'CIS 5.1.1 / NIST AU-12',
    title: 'NTP Cryptographic Authentication & Redundant Peers',
    category: 'Time Synchronization',
    severity: 'info',
    status: 'passed',
    framework: 'CIS / NIST',
    remediatedInWhatIf: true,
    description: 'System synchronizes clock with authenticated authoritative time servers to preserve forensic log integrity.',
    offendingSnippet: null,
    remediationCommand: null,
    astCanonicalRule: 'time_synchronization.peers.count >= 2 && time_synchronization.stratum <= 3',
    auditReason: 'Two authoritative internal NTP peers configured with millisecond timestamp logging.'
  },
  {
    id: 'CIS-6.3.2',
    code: 'CIS 6.3.2 / STIG NET-090',
    title: 'AAA Authentication & Authorization Framework Activated',
    category: 'Identity & Access',
    severity: 'info',
    status: 'passed',
    framework: 'CIS / STIG',
    remediatedInWhatIf: true,
    description: 'Device enforces centralized AAA authentication with local fallback authentication.',
    offendingSnippet: null,
    remediationCommand: null,
    astCanonicalRule: 'aaa.new_model == true && aaa.login_default != null',
    auditReason: 'AAA new-model active with centralized authorization failover.'
  }
];

export const TRIAGE_ITEMS = [
  {
    id: 'TR-101',
    ruleId: 'CIS-2.1.4',
    title: 'Telnet Transport Permitted on Management Lines',
    vendor: 'Cisco IOS-XE',
    controlCode: 'CIS 2.1.4 / NIST SC-8',
    category: 'Remote Access',
    type: 'auto-resolved',
    confidence: 99.4,
    confidenceReason: 'Unambiguous deterministic AST match: AST node `line_vty.transport_input` contains literal token `all`. Remediation `transport input ssh` has 0% blast radius to running control plane.',
    actionTaken: 'Auto-Remediation Candidate Generated',
    riskTier: 'Critical',
    remediationScript: 'line vty 0 4\n  transport input ssh\n  exec-timeout 15 0',
    rollbackScript: 'line vty 0 4\n  transport input all',
    canConfirm: false,
    confirmed: true,
  },
  {
    id: 'TR-102',
    ruleId: 'CIS-1.2.1',
    title: 'Default SNMPv2c Community String "public" Active',
    vendor: 'Cisco IOS-XE',
    controlCode: 'CIS 1.2.1 / STIG NET-088',
    category: 'Telemetry',
    type: 'auto-resolved',
    confidence: 98.7,
    confidenceReason: 'Exact string match against known CVE/CWE dictionary (`CWE-1188`). String `public` is read-only on non-critical MIB view. Zero routing impact upon revocation.',
    actionTaken: 'Auto-Remediation Script Staged',
    riskTier: 'Critical',
    remediationScript: 'no snmp-server community public',
    rollbackScript: 'snmp-server community public RO',
    canConfirm: false,
    confirmed: true,
  },
  {
    id: 'TR-103',
    ruleId: 'CIS-2.2.2',
    title: 'Cleartext HTTP Daemon Active (TCP/80)',
    vendor: 'Cisco IOS-XE',
    controlCode: 'CIS 2.2.2 / NIST AC-2',
    category: 'Web Admin',
    type: 'auto-resolved',
    confidence: 97.5,
    confidenceReason: 'AST confirms `ip http server` is active while `ip http secure-server` is absent. Unambiguous mandate under CIS 2.2.2. Safe to decommission cleartext daemon.',
    actionTaken: 'Staged for Automatic Commit',
    riskTier: 'High',
    remediationScript: 'no ip http server\nip http secure-server',
    rollbackScript: 'ip http server\nno ip http secure-server',
    canConfirm: false,
    confirmed: true,
  },
  {
    id: 'TR-201',
    ruleId: 'CIS-4.2.1',
    title: 'Management VTY Ingress ACL Subnet Allocation',
    vendor: 'Cisco IOS-XE',
    controlCode: 'NIST AC-3 / CIS 4.2.1',
    category: 'Access Control',
    type: 'human-review',
    confidence: 84.2,
    confidenceReason: 'Semantic ambiguity: The configuration contains ACL `101` applied on GigabitEthernet1/0/1, but VTY lacks an explicit `access-class`. The AI detected legacy subnet `10.250.1.0/24` in interface descriptions, but cannot verify if out-of-band bastion host `10.100.50.0/24` should be granted administrative ingress without operator sign-off.',
    actionTaken: 'Awaiting Operator Sign-Off',
    riskTier: 'Medium',
    remediationScript: 'ip access-list standard VTY-SECURE\n  permit 10.250.1.0 0.0.0.255\n  permit 10.100.50.0 0.0.0.255\n  deny any log\nline vty 0 4\n  access-class VTY-SECURE in',
    rollbackScript: 'line vty 0 4\n  no access-class VTY-SECURE in',
    canConfirm: true,
    confirmed: false,
    operatorNote: 'Verify that 10.100.50.0/24 contains your active bastion jumphosts before locking down VTY.'
  },
  {
    id: 'TR-202',
    ruleId: 'CIS-3.1.2',
    title: 'OSPF Area 0 Authentication Key Rotation',
    vendor: 'Cisco IOS-XE',
    controlCode: 'CIS 3.1.2 / STIG NET-065',
    category: 'Routing Protocols',
    type: 'human-review',
    confidence: 76.8,
    confidenceReason: 'Contextual protocol risk: `router ospf 100` area 0 is currently operating in plaintext authentication mode. While CIS mandates cryptographic MD5 or HMAC-SHA authentication, applying MD5 key rotation without coordinated change on adjacent peer `10.250.1.254` will immediately sever OSPF adjacency and cause WAN link flap.',
    actionTaken: 'Flagged: High Route Flap Risk',
    riskTier: 'High',
    remediationScript: 'interface GigabitEthernet1/0/1\n  ip ospf message-digest-key 1 md5 Secr3tKey987\n  ip ospf authentication message-digest',
    rollbackScript: 'interface GigabitEthernet1/0/1\n  no ip ospf authentication message-digest',
    canConfirm: true,
    confirmed: false,
    operatorNote: 'Requires synchronized commit with core uplink router to prevent BGP/OSPF peer drop.'
  }
];

export const EXECUTIVE_SUMMARY_STATS = {
  totalScannedDevices: 1,
  totalControlsEvaluated: 42,
  overallComplianceScore: 87,
  remediatedScore: 98,
  highSeverityViolations: 3,
  mediumSeverityWarnings: 4,
  lowSeverityAdvisories: 1,
  autoRemediableItems: 3,
  humanReviewRequired: 2,
  standardsCovered: ['CIS Cisco IOS 17 Benchmark v4.0.0', 'NIST SP 800-53 Rev 5', 'DISA Network Device STIG v2r3', 'CERT-In Cyber Security Directions 2026']
};
