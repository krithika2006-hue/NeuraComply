import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  detectVendorAndOS,
  detectProtocols,
  countInterfaces,
  evaluateRealConfig,
  generateChecksum
} from '../src/data/auditParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleConfigsDir = path.resolve(__dirname, '../sample_configs');

describe('Multi-Vendor Parser & AST Normalization Engine', () => {
  describe('Vendor & OS Detection', () => {
    test('identifies Cisco IOS-XE from CLI keyword syntax', () => {
      const ciscoSnippet = `
        hostname core-sw01
        boot-start-marker
        service timestamps debug datetime msec
        version 17.6
      `;
      const result = detectVendorAndOS('core-switch.cfg', ciscoSnippet);
      assert.equal(result.vendor, 'Cisco Systems');
      assert.equal(result.vendorType, 'cisco');
      assert.match(result.os, /IOS-XE/);
      assert.equal(result.role, 'Core Switch / L3 Gateway');
    });

    test('identifies Juniper Junos OS from hierarchical curly brace syntax', () => {
      const junperSnippet = `
        system {
            host-name perimeter-gw01;
            root-authentication {
                encrypted-password "$6$encrypted";
            }
            services {
                ssh { protocol-version v2; }
            }
        }
      `;
      const result = detectVendorAndOS('perimeter-gw.conf', junperSnippet);
      assert.equal(result.vendor, 'Juniper Networks');
      assert.equal(result.vendorType, 'juniper');
      assert.match(result.os, /Junos/);
      assert.equal(result.role, 'Perimeter Security Gateway');
    });

    test('identifies Fortinet FortiOS from config block directives', () => {
      const fortinetSnippet = `
        config system global
            set hostname "edge-fw01"
            set admin-ssh-v1 disable
        end
        config firewall policy
            edit 1
                set name "Trust-to-Untrust"
            next
        end
      `;
      const result = detectVendorAndOS('fortigate.conf', fortinetSnippet);
      assert.equal(result.vendor, 'Fortinet');
      assert.equal(result.vendorType, 'fortinet');
      assert.match(result.os, /FortiOS/);
      assert.equal(result.role, 'Enterprise Campus Edge Security');
    });

    test('identifies Palo Alto Networks PAN-OS from XML configuration schema', () => {
      const paloAltoSnippet = `<?xml version="1.0" encoding="UTF-8"?>
        <config version="10.2.0">
          <mgt-config>
            <users>
              <entry name="admin"/>
            </users>
          </mgt-config>
        </config>
      `;
      const result = detectVendorAndOS('pa-firewall.xml', paloAltoSnippet);
      assert.equal(result.vendor, 'Palo Alto Networks');
      assert.equal(result.vendorType, 'paloalto');
      assert.match(result.os, /PAN-OS/);
      assert.equal(result.role, 'Next-Generation Firewall');
    });

    test('defaults unknown network device configurations gracefully to Cisco IOS-XE', () => {
      const unknownSnippet = `hostname generic-router-99\nip address 10.0.0.1 255.255.255.0`;
      const result = detectVendorAndOS('unknown.txt', unknownSnippet);
      assert.equal(result.vendor, 'Cisco Systems');
      assert.equal(result.vendorType, 'cisco');
    });
  });

  describe('Protocol Footprint Extraction', () => {
    test('detects full enterprise protocol footprint accurately', () => {
      const config = `
        router ospf 1
        router bgp 65001
        snmp-server community public RO
        ntp server 192.168.1.1
        aaa new-model
        crypto ikev2 policy IPSEC-POL
        ip http server
        transport input ssh
      `;
      const protocols = detectProtocols(config);
      assert.ok(protocols.includes('OSPFv2'), 'Should detect OSPFv2');
      assert.ok(protocols.includes('BGP (AS 65001)'), 'Should detect BGP');
      assert.ok(protocols.includes('SNMPv2c'), 'Should detect SNMPv2c');
      assert.ok(protocols.includes('NTP'), 'Should detect NTP');
      assert.ok(protocols.includes('AAA/RADIUS'), 'Should detect AAA');
      assert.ok(protocols.includes('IPsec IKEv2'), 'Should detect IPsec');
      assert.ok(protocols.includes('HTTP/HTTPS'), 'Should detect HTTP/HTTPS');
      assert.ok(protocols.includes('SSHv2'), 'Should detect SSHv2');
    });

    test('flags cleartext Telnet protocol in footprint', () => {
      const config = 'line vty 0 4\n transport input telnet\n';
      const protocols = detectProtocols(config);
      assert.ok(protocols.includes('Telnet (Cleartext)'), 'Should detect cleartext Telnet');
    });

    test('returns baseline fallback protocols when no explicit matches found', () => {
      const protocols = detectProtocols('empty minimal config');
      assert.deepEqual(protocols, ['SSHv2', 'Syslog', 'NTP']);
    });
  });

  describe('Interface & Topology Node Counting', () => {
    test('counts Cisco style interface definitions', () => {
      const config = `
        interface GigabitEthernet0/0/0
        interface GigabitEthernet0/0/1
        interface TenGigabitEthernet0/1/0
        interface TenGigabitEthernet0/1/1
        interface Vlan10
        interface Loopback0
      `;
      const count = countInterfaces(config);
      assert.equal(count, 6);
    });

    test('counts Juniper ge-* and Fortigate port* interfaces', () => {
      const junper = `edit "ge-0/0/0"\nedit "ge-0/0/1"\nedit "ge-0/0/2"\nedit "ge-0/0/3"\nedit "ge-0/0/4"\n`;
      assert.equal(countInterfaces(junper), 5);

      const forti = `edit "port1"\nedit "port2"\nedit "port3"\nedit "port4"\nedit "port5"\nedit "port6"\n`;
      assert.equal(countInterfaces(forti), 6);
    });

    test('enforces a minimum baseline of 4 interfaces', () => {
      const minimal = 'interface GigabitEthernet0/0\n';
      assert.equal(countInterfaces(minimal), 4);
    });
  });

  describe('Deterministic Compliance Evaluation on Real Sample Configs', () => {
    test('audits enterprise Cisco Catalyst 9300 and flags critical CIS violations', () => {
      const filePath = path.join(sampleConfigsDir, 'cisco_catalyst9300_enterprise.cfg');
      const content = fs.readFileSync(filePath, 'utf8');

      const evaluation = evaluateRealConfig('cisco_catalyst9300_enterprise.cfg', content, 'sha256:test1234');
      assert.ok(evaluation.parsedConfig);
      assert.equal(evaluation.parsedConfig.vendor, 'Cisco Systems');
      assert.ok(evaluation.parsedConfig.lineCount > 100);

      // Verify CIS-2.1.4 (Telnet / SSH violation)
      const sshCtrl = evaluation.controls.find(c => c.id === 'CIS-2.1.4');
      assert.ok(sshCtrl, 'CIS-2.1.4 should be evaluated');
      assert.equal(sshCtrl.status, 'violation', 'Cisco Catalyst enterprise config should fail CIS-2.1.4');
      assert.ok(sshCtrl.offendingSnippet, 'Offending code snippet must be extracted');
      assert.ok(sshCtrl.offendingSnippet.content.length > 0);

      // Verify CIS-1.2.1 (SNMP public community violation)
      const snmpCtrl = evaluation.controls.find(c => c.id === 'CIS-1.2.1');
      assert.ok(snmpCtrl, 'CIS-1.2.1 should be evaluated');
      assert.equal(snmpCtrl.status, 'violation', 'Default SNMP community string must be flagged');

      // Verify CIS-2.2.2 (Cleartext HTTP server violation)
      const httpCtrl = evaluation.controls.find(c => c.id === 'CIS-2.2.2');
      assert.ok(httpCtrl, 'CIS-2.2.2 should be evaluated');
      assert.equal(httpCtrl.status, 'violation', 'HTTP daemon must be flagged');

      // Verify scoring math
      const expectedScore = Math.round(
        ((evaluation.parsedConfig.controlsPassed * 1.0 + evaluation.parsedConfig.controlsWarning * 0.5) /
          evaluation.controls.length) * 100
      );
      assert.equal(evaluation.parsedConfig.initialScore, Math.max(65, expectedScore));
      assert.equal(evaluation.parsedConfig.whatIfScore, 100);
    });

    test('audits hardened PCI-DSS Cisco config and validates compliant posture', () => {
      const filePath = path.join(sampleConfigsDir, 'cisco_hardened_pci_dss.cfg');
      const content = fs.readFileSync(filePath, 'utf8');

      const evaluation = evaluateRealConfig('cisco_hardened_pci_dss.cfg', content, 'sha256:pci998');
      assert.ok(evaluation.parsedConfig);

      const sshCtrl = evaluation.controls.find(c => c.id === 'CIS-2.1.4');
      assert.equal(sshCtrl.status, 'passed');

      const snmpCtrl = evaluation.controls.find(c => c.id === 'CIS-1.2.1');
      assert.equal(snmpCtrl.status, 'passed');

      const httpCtrl = evaluation.controls.find(c => c.id === 'CIS-2.2.2');
      assert.equal(httpCtrl.status, 'passed');

      assert.ok(evaluation.parsedConfig.initialScore >= 85, 'Hardened config should achieve high score');
    });

    test('generates fallback deterministic checksum string if WebCrypto is unavailable', async () => {
      const checksum = await generateChecksum('sample-network-configuration-line');
      assert.match(checksum, /^sha256:[0-9a-fA-F]+/);
    });
  });
});
