/**
 * NeuraComply Unified Security Schema (USS) & Canonical Security Intents
 *
 * Defines the vendor-neutral schema representation for network device security configurations.
 * Every vendor-specific syntactic construct maps into a standardized Intent Envelope.
 */

export const INTENT_CATEGORIES = {
  SECURE_MANAGEMENT: 'secure_management',
  INSECURE_SERVICES: 'insecure_services',
  ACCESS_CONTROL: 'access_control',
  SESSION_CONTROL: 'session_control',
  NETWORK_FILTERING: 'network_filtering',
  AUDIT_LOGGING: 'audit_logging',
  SECURE_TIME: 'secure_time'
};

export const CANONICAL_INTENTS = {
  SSH_PROTOCOL_VERSION: {
    id: 'SSH_PROTOCOL_VERSION',
    category: INTENT_CATEGORIES.SECURE_MANAGEMENT,
    description: 'Enforce SSH protocol version 2 and deprecate SSHv1',
    schema: {
      protocol: 'SSH',
      parameter: 'protocol_version',
      target_value: '2',
      minimum_version: '2',
      state: 'ENFORCED'
    },
    cisControlMapping: 'CIS-2.1.4',
    nistMapping: 'NIST-SP-800-53-AC-17',
    canonicalPrototypes: [
      'ip ssh version 2',
      'set system services ssh protocol-version v2',
      'protocol-version v2',
      'set admin-ssh-v1 disable',
      '<ssh><version>2</version></ssh>',
      '<services><ssh><protocol-version>2</protocol-version></services>',
      'ssh server protocol 2',
      'crypto key generate rsa modulus 2048'
    ]
  },

  TELNET_DISABLED: {
    id: 'TELNET_DISABLED',
    category: INTENT_CATEGORIES.INSECURE_SERVICES,
    description: 'Disable unencrypted Telnet management service',
    schema: {
      protocol: 'TELNET',
      parameter: 'service_state',
      target_value: 'disabled',
      state: 'DISABLED'
    },
    cisControlMapping: 'CIS-2.1.4',
    nistMapping: 'NIST-SP-800-53-CM-7',
    canonicalPrototypes: [
      'no transport input telnet',
      'transport input ssh',
      'set admin-telnet disable',
      '<disable-telnet>yes</disable-telnet>',
      'delete system services telnet',
      'no telnet-server enable',
      'undo telnet server enable'
    ]
  },

  TELNET_ENABLED: {
    id: 'TELNET_ENABLED',
    category: INTENT_CATEGORIES.INSECURE_SERVICES,
    description: 'Cleartext Telnet protocol permitted on management lines (Risk)',
    schema: {
      protocol: 'TELNET',
      parameter: 'service_state',
      target_value: 'enabled',
      state: 'ACTIVE_RISK'
    },
    cisControlMapping: 'CIS-2.1.4',
    nistMapping: 'NIST-SP-800-53-CM-7',
    canonicalPrototypes: [
      'transport input telnet',
      'transport input all',
      'set admin-telnet enable',
      'services { telnet; }',
      '<disable-telnet>no</disable-telnet>',
      'telnet-server enable',
      'service telnet'
    ]
  },

  SNMP_INSECURE_COMMUNITY_ACTIVE: {
    id: 'SNMP_INSECURE_COMMUNITY_ACTIVE',
    category: INTENT_CATEGORIES.INSECURE_SERVICES,
    description: 'Well-known or default SNMP community string active (Risk)',
    schema: {
      protocol: 'SNMP',
      parameter: 'community_string',
      target_value: 'public_or_private',
      state: 'ACTIVE_RISK'
    },
    cisControlMapping: 'CIS-1.2.1',
    nistMapping: 'NIST-SP-800-53-IA-2',
    canonicalPrototypes: [
      'snmp-server community public RO',
      'snmp-server community private RW',
      'community public { authorization read-only; }',
      'community private { authorization read-write; }',
      'set name "public"',
      'set name "private"',
      '<snmp-community>public</snmp-community>',
      '<disable-snmp>no</disable-snmp>'
    ]
  },

  SNMP_INSECURE_COMMUNITY_DISABLED: {
    id: 'SNMP_INSECURE_COMMUNITY_DISABLED',
    category: INTENT_CATEGORIES.SECURE_MANAGEMENT,
    description: 'Default SNMP community strings removed and SNMPv3 authPriv enforced',
    schema: {
      protocol: 'SNMP',
      parameter: 'community_string',
      target_value: 'default_removed',
      state: 'ENFORCED'
    },
    cisControlMapping: 'CIS-1.2.1',
    nistMapping: 'NIST-SP-800-53-IA-2',
    canonicalPrototypes: [
      'no snmp-server community public',
      'no snmp-server community private',
      'delete snmp community public',
      'delete snmp community private',
      'set status disable',
      '<disable-snmp>yes</disable-snmp>',
      'snmp-server group SECURE-NMS v3 priv'
    ]
  },

  HTTP_CLEARTEXT_ACTIVE: {
    id: 'HTTP_CLEARTEXT_ACTIVE',
    category: INTENT_CATEGORIES.INSECURE_SERVICES,
    description: 'Unencrypted cleartext HTTP administrative server active (Risk)',
    schema: {
      protocol: 'HTTP',
      parameter: 'web_management_tls',
      target_value: 'cleartext',
      state: 'ACTIVE_RISK'
    },
    cisControlMapping: 'CIS-2.2.2',
    nistMapping: 'NIST-SP-800-53-SC-8',
    canonicalPrototypes: [
      'ip http server',
      'web-management { http; }',
      'web-management { http { interface ge-0/0/0.0; } }',
      'set admin-sport 80',
      '<disable-http>no</disable-http>',
      'http-server enable'
    ]
  },

  HTTP_CLEARTEXT_DISABLED: {
    id: 'HTTP_CLEARTEXT_DISABLED',
    category: INTENT_CATEGORIES.SECURE_MANAGEMENT,
    description: 'Cleartext HTTP disabled in favor of encrypted HTTPS/TLS',
    schema: {
      protocol: 'HTTP',
      parameter: 'web_management_tls',
      target_value: 'disabled_enforce_tls',
      state: 'ENFORCED'
    },
    cisControlMapping: 'CIS-2.2.2',
    nistMapping: 'NIST-SP-800-53-SC-8',
    canonicalPrototypes: [
      'no ip http server',
      'ip http secure-server',
      'delete system services web-management http',
      'set admin-sport 443',
      '<disable-http>yes</disable-http>',
      'undo http-server enable'
    ]
  },

  PASSWORD_ENCRYPTION_ENFORCED: {
    id: 'PASSWORD_ENCRYPTION_ENFORCED',
    category: INTENT_CATEGORIES.ACCESS_CONTROL,
    description: 'Enforce strong irreversible password hashing (scrypt/SHA-512) and password encryption',
    schema: {
      protocol: 'SYSTEM_AUTH',
      parameter: 'password_hashing',
      target_value: 'scrypt_or_type9',
      state: 'ENFORCED'
    },
    cisControlMapping: 'CIS-1.1.2',
    nistMapping: 'NIST-SP-800-53-IA-5',
    canonicalPrototypes: [
      'service password-encryption',
      'password algorithm scrypt',
      'root-authentication { encrypted-password "$6$..."; }',
      'set strong-crypto enable',
      'set password-expire enable',
      '<password-complexity><enabled>yes</enabled><minimum-length>14</minimum-length></password-complexity>',
      'enable secret 9'
    ]
  },

  SESSION_INACTIVITY_TIMEOUT: {
    id: 'SESSION_INACTIVITY_TIMEOUT',
    category: INTENT_CATEGORIES.SESSION_CONTROL,
    description: 'Enforce automatic session timeout for idle administrative consoles',
    schema: {
      protocol: 'MANAGEMENT_PLANE',
      parameter: 'idle_timeout_seconds',
      target_value: '900',
      state: 'ENFORCED'
    },
    cisControlMapping: 'CIS-2.1.4',
    nistMapping: 'NIST-SP-800-53-SC-10',
    canonicalPrototypes: [
      'exec-timeout 10 0',
      'exec-timeout 15 0',
      'ip ssh time-out 60',
      'set admintimeout 15',
      '<idle-timeout>15</idle-timeout>',
      'rate-limit 5',
      'max-pre-authentication-packets 10',
      'idle-timeout 15'
    ]
  },

  STATUTORY_BANNER_ENFORCED: {
    id: 'STATUTORY_BANNER_ENFORCED',
    category: INTENT_CATEGORIES.ACCESS_CONTROL,
    description: 'Enforce statutory monitored-system legal warning banner prior to login',
    schema: {
      protocol: 'MANAGEMENT_PLANE',
      parameter: 'legal_notice',
      target_value: 'statutory_warning',
      state: 'ENFORCED'
    },
    cisControlMapping: 'CIS-3.1.5',
    nistMapping: 'NIST-SP-800-53-AC-8',
    canonicalPrototypes: [
      'banner login ^C NOTICE RESTRICTED PERSONNEL ^C',
      'banner motd ^C WARNING AUTHORIZED ACCESS ONLY ^C',
      'system login message "AUTHORIZED ACCESS ONLY. ALL SESSIONS ARE MONITORED"',
      'set pre-login-banner enable',
      '<login-banner>WARNING: Unauthorized access to this system is strictly prohibited.</login-banner>',
      'header login "UNAUTHORIZED ACCESS PROHIBITED"'
    ]
  },

  INGRESS_MANAGEMENT_ACL_ENFORCED: {
    id: 'INGRESS_MANAGEMENT_ACL_ENFORCED',
    category: INTENT_CATEGORIES.NETWORK_FILTERING,
    description: 'Restrict administrative access to authorized bastion and management subnets',
    schema: {
      protocol: 'ACL_FILTER',
      parameter: 'inbound_management_protection',
      target_value: 'trusted_subnets_only',
      state: 'ENFORCED'
    },
    cisControlMapping: 'CIS-4.2.1',
    nistMapping: 'NIST-SP-800-53-AC-4',
    canonicalPrototypes: [
      'access-class VTY-PROTECT-ACL in',
      'access-class 10 in',
      'set trusthost1 10.100.1.0 255.255.255.0',
      'host-inbound-traffic { system-services { ssh; ping; } }',
      '<permitted-ip><entry name="10.100.1.0/24"/></permitted-ip>',
      'filter protect-re term allow-mgmt'
    ]
  },

  AUTHENTICATED_NTP_ENFORCED: {
    id: 'AUTHENTICATED_NTP_ENFORCED',
    category: INTENT_CATEGORIES.SECURE_TIME,
    description: 'Cryptographically authenticated network time protocol synchronization',
    schema: {
      protocol: 'NTP',
      parameter: 'authentication',
      target_value: 'symmetric_key_or_npa',
      state: 'ENFORCED'
    },
    cisControlMapping: 'CIS-1.3.1',
    nistMapping: 'NIST-SP-800-53-AU-8',
    canonicalPrototypes: [
      'ntp authenticate',
      'ntp trusted-key 1',
      'ntp server 10.200.1.100 prefer',
      'ntp { server 10.100.1.50 prefer; }',
      'set ntp-server "10.100.1.50"',
      '<ntp-servers><primary-ntp-server><ntp-server-address>10.100.1.50</ntp-server-address></primary-ntp-server></ntp-servers>'
    ]
  },

  ENCRYPTED_LOGGING_SYSLOG: {
    id: 'ENCRYPTED_LOGGING_SYSLOG',
    category: INTENT_CATEGORIES.AUDIT_LOGGING,
    description: 'Forward audit logs to centralized secure SIEM / syslog collector',
    schema: {
      protocol: 'SYSLOG',
      parameter: 'remote_collector',
      target_value: 'centralized_siem',
      state: 'ENFORCED'
    },
    cisControlMapping: 'CIS-3.2.1',
    nistMapping: 'NIST-SP-800-53-AU-6',
    canonicalPrototypes: [
      'logging buffered 64000 informational',
      'logging host 10.100.5.50 transport tls',
      'syslog { host 10.100.5.50 { any info; } }',
      'config log syslogd setting set status enable',
      '<syslog><entry name="secops-syslog"><server>10.100.5.50</server><transport>SSL</transport></entry></syslog>'
    ]
  },

  DEFAULT_CREDENTIALS_REMOVED: {
    id: 'DEFAULT_CREDENTIALS_REMOVED',
    category: INTENT_CATEGORIES.ACCESS_CONTROL,
    description: 'Ensure default vendor accounts and credentials are removed or replaced',
    schema: {
      protocol: 'SYSTEM_AUTH',
      parameter: 'default_accounts',
      target_value: 'custom_secret_enforced',
      state: 'ENFORCED'
    },
    cisControlMapping: 'CIS-1.1.1',
    nistMapping: 'NIST-SP-800-53-IA-2',
    canonicalPrototypes: [
      'enable secret 9 $9$vDqY$y6T87M',
      'root-authentication { encrypted-password "$6$..."; }',
      'config system admin edit "admin" set password ...',
      '<users><entry name="admin"><phash>$1$xyz$...</phash></entry></users>'
    ]
  }
};
