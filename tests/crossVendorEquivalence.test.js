import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRealConfig } from '../src/data/auditParser.js';

describe('Cross-Vendor Semantic Equivalence & AST Normalization', () => {
  test('evaluates compliant SSHv2 across all 4 divergent vendor syntaxes', () => {
    // 1. Cisco IOS-XE imperative flat syntax
    const ciscoConfig = `
      hostname cisco-core
      ip ssh version 2
      line vty 0 4
        transport input ssh
        exec-timeout 15 0
    `;
    const ciscoRes = evaluateRealConfig('cisco.cfg', ciscoConfig, 'sha256:c1');
    const ciscoSsh = ciscoRes.controls.find(c => c.id === 'CIS-2.1.4');
    assert.equal(ciscoSsh.status, 'passed', 'Cisco SSHv2 should pass');

    // 2. Juniper Junos hierarchical syntax
    const juniperConfig = `
      system {
          services {
              ssh {
                  protocol-version v2;
              }
          }
      }
    `;
    const juniperRes = evaluateRealConfig('juniper.conf', juniperConfig, 'sha256:j1');
    const juniperSsh = juniperRes.controls.find(c => c.id === 'CIS-2.1.4');
    assert.equal(juniperSsh.status, 'passed', 'Juniper SSHv2 should pass');

    // 3. Fortinet negative assertion syntax ("disable v1" => enables v2)
    const fortinetConfig = `
      config system global
          set admin-ssh-v1 disable
      end
    `;
    const fortinetRes = evaluateRealConfig('fortigate.conf', fortinetConfig, 'sha256:f1');
    const fortinetSsh = fortinetRes.controls.find(c => c.id === 'CIS-2.1.4');
    assert.equal(fortinetSsh.status, 'passed', 'Fortinet SSHv2 should pass');

    // 4. Palo Alto XML schema syntax
    const paloAltoConfig = `
      <config version="10.2.0">
        <mgt-config>
          <services>
            <ssh>
              <version>2</version>
            </ssh>
          </services>
        </mgt-config>
      </config>
    `;
    const paloRes = evaluateRealConfig('paloalto.xml', paloAltoConfig, 'sha256:p1');
    const paloSsh = paloRes.controls.find(c => c.id === 'CIS-2.1.4');
    assert.equal(paloSsh.status, 'passed', 'Palo Alto SSHv2 should pass');
  });

  test('flags legacy Telnet across all 4 vendor platforms uniformly', () => {
    const ciscoTelnet = 'line vty 0 4\n transport input telnet\n';
    assert.equal(evaluateRealConfig('cisco.cfg', ciscoTelnet, 'h1').controls.find(c => c.id === 'CIS-2.1.4').status, 'violation');

    const ciscoAll = 'line vty 0 4\n transport input all\n';
    assert.equal(evaluateRealConfig('cisco.cfg', ciscoAll, 'h2').controls.find(c => c.id === 'CIS-2.1.4').status, 'violation');

    const fortiTelnet = 'config system global\n set admin-telnet enable\n end\n';
    assert.equal(evaluateRealConfig('forti.conf', fortiTelnet, 'h3').controls.find(c => c.id === 'CIS-2.1.4').status, 'violation');

    const junperTelnet = 'system {\n services { telnet; }\n}\n';
    assert.equal(evaluateRealConfig('juniper.conf', junperTelnet, 'h4').controls.find(c => c.id === 'CIS-2.1.4').status, 'violation');
  });
});
