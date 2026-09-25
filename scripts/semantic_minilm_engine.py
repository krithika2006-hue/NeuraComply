#!/usr/bin/env python3
"""
NeuraComply — SentenceTransformer (all-MiniLM-L6-v2) Semantic Intent Engine
SIH Problem Statement: PS 26155 — AI-Driven Multi-Vendor Network Security Compliance Auditor

Provides dense 384-dimensional neural semantic embedding normalization for multi-vendor network syntax
(Cisco IOS-XE, Juniper Junos, Fortinet FortiOS, Palo Alto PAN-OS) to the Unified Security Schema (USS).
"""

import json
import os
import sys
import numpy as np
from sentence_transformers import SentenceTransformer

# 1. Canonical Security Intents in the Unified Security Schema (USS)
CANONICAL_INTENTS = {
    "SSH_PROTOCOL_VERSION": {
        "description": "Enforce SSH protocol version 2 and deprecate legacy SSH version 1",
        "category": "secure_management",
        "protocol": "SSH",
        "parameter": "protocol_version",
        "minimum_version": "2",
        "cis_rule": "CIS-2.1.4",
        "nist_rule": "NIST SC-8",
        "prototypes": [
            "ip ssh version 2",
            "set system services ssh protocol-version v2",
            "set admin-ssh-v1 disable",
            "<ssh><version>2</version></ssh>",
            "enforce secure shell version 2 only"
        ]
    },
    "TELNET_DISABLED": {
        "description": "Prohibit cleartext Telnet daemon and disable telnet transport input",
        "category": "insecure_services",
        "protocol": "Telnet",
        "parameter": "service_state",
        "target_value": "DISABLED",
        "cis_rule": "CIS-2.1.4",
        "nist_rule": "NIST SC-8",
        "prototypes": [
            "no transport input telnet",
            "delete system services telnet",
            "set admin-telnet disable",
            "<disable-telnet>yes</disable-telnet>",
            "disable unencrypted telnet management daemon"
        ]
    },
    "TELNET_ENABLED": {
        "description": "Permit or activate cleartext unencrypted Telnet transport service",
        "category": "insecure_services",
        "protocol": "Telnet",
        "parameter": "service_state",
        "target_value": "ENABLED",
        "cis_rule": "CIS-2.1.4",
        "nist_rule": "NIST SC-8",
        "prototypes": [
            "transport input telnet",
            "set system services telnet",
            "set admin-telnet enable",
            "<disable-telnet>no</disable-telnet>",
            "enable telnet administrative login"
        ]
    },
    "SNMP_INSECURE_COMMUNITY_ACTIVE": {
        "description": "Default insecure SNMP community string public or private active with read access",
        "category": "telemetry_monitoring",
        "protocol": "SNMP",
        "parameter": "community_string_state",
        "target_value": "INSECURE_ACTIVE",
        "cis_rule": "CIS-1.2.1",
        "nist_rule": "NIST IA-2",
        "prototypes": [
            "snmp-server community public RO",
            "set snmp community public authorization read-only",
            "set name public",
            "<snmp-community>public</snmp-community>",
            "active default public snmp community string"
        ]
    },
    "SNMP_INSECURE_COMMUNITY_DISABLED": {
        "description": "Remove or negate default SNMP community string",
        "category": "telemetry_monitoring",
        "protocol": "SNMP",
        "parameter": "community_string_state",
        "target_value": "DISABLED",
        "cis_rule": "CIS-1.2.1",
        "nist_rule": "NIST IA-2",
        "prototypes": [
            "no snmp-server community public",
            "delete snmp community public",
            "unset snmp community public",
            "<snmp-community><deleted/></snmp-community>"
        ]
    },
    "HTTP_CLEARTEXT_ACTIVE": {
        "description": "Enable unencrypted HTTP administrative web server daemon on TCP port 80",
        "category": "secure_management",
        "protocol": "HTTP",
        "parameter": "http_cleartext_state",
        "target_value": "ACTIVE",
        "cis_rule": "CIS-2.2.2",
        "nist_rule": "NIST AC-2",
        "prototypes": [
            "ip http server",
            "set system services web-management http",
            "set admin-sport 80",
            "<disable-http>no</disable-http>",
            "enable unencrypted web administration server"
        ]
    },
    "HTTP_CLEARTEXT_DISABLED": {
        "description": "Disable unencrypted HTTP server daemon in favor of secure TLS HTTPS",
        "category": "secure_management",
        "protocol": "HTTP",
        "parameter": "http_cleartext_state",
        "target_value": "DISABLED",
        "cis_rule": "CIS-2.2.2",
        "nist_rule": "NIST AC-2",
        "prototypes": [
            "no ip http server",
            "delete system services web-management http",
            "set admin-sport 443",
            "<disable-http>yes</disable-http>",
            "disable plain text http management server"
        ]
    },
    "PASSWORD_ENCRYPTION_ACTIVE": {
        "description": "Enforce strong password hashing algorithm such as scrypt or type 9",
        "category": "authentication",
        "protocol": "AAA",
        "parameter": "password_encryption",
        "target_value": "STRONG_HASH",
        "cis_rule": "CIS-1.1.2",
        "nist_rule": "NIST IA-2",
        "prototypes": [
            "service password-encryption",
            "enable secret 9",
            "set system root-authentication encrypted-password",
            "config system admin edit admin set password"
        ]
    },
    "BANNER_LEGAL_NOTICE_ACTIVE": {
        "description": "Display statutory legal authorization and warning banner on login",
        "category": "legal_warning",
        "protocol": "CONSOLE_VTY",
        "parameter": "motd_banner",
        "target_value": "CONFIGURED",
        "cis_rule": "CIS-3.1.5",
        "nist_rule": "NIST AC-8",
        "prototypes": [
            "banner motd ^C Authorized Access Only ^C",
            "set system login message Authorized Access Only",
            "config system global set pre-login-banner enable"
        ]
    },
    "MANAGEMENT_ACL_ACTIVE": {
        "description": "Restrict inbound management access via access-class or firewall filter",
        "category": "network_perimeter",
        "protocol": "VTY_MGMT",
        "parameter": "inbound_acl",
        "target_value": "ENFORCED",
        "cis_rule": "CIS-4.2.1",
        "nist_rule": "NIST AC-3",
        "prototypes": [
            "access-class 101 in",
            "set firewall filter protect-re term mgmt-access",
            "set trusthost1 10.250.1.0 255.255.255.0"
        ]
    }
}

class SemanticMiniLMEngine:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        print(f"[MiniLM Engine] Loading SentenceTransformer: {model_name}...")
        self.model = SentenceTransformer(model_name)
        self.intents = CANONICAL_INTENTS
        self.intent_keys = list(self.intents.keys())
        
        # Build canonical prototype vectors
        self.prototype_embeddings = {}
        for key, data in self.intents.items():
            # Combine canonical description with prototype phrases
            phrases = [data["description"]] + data["prototypes"]
            embeddings = self.model.encode(phrases, normalize_embeddings=True)
            # Centroid vector normalized to unit length
            centroid = np.mean(embeddings, axis=0)
            centroid = centroid / np.linalg.norm(centroid)
            self.prototype_embeddings[key] = centroid

        self.knowledge_base = {}

    def record_verified_mapping(self, raw_syntax, intent_key, operator="SecOps-Lead"):
        """Store operator confirmed mapping for active learning loop."""
        self.knowledge_base[raw_syntax.strip()] = {
            "intent": intent_key,
            "operator": operator,
            "verified": True
        }

    def normalize_statement(self, config_line, vendor_hint=None):
        cleaned = config_line.strip()
        if not cleaned:
            return {
                "security_intent": "INVALID_CONFIGURATION",
                "confidence": 0.0,
                "status": "REJECTED"
            }

        # Check Active Learning Knowledge Base first
        if cleaned in self.knowledge_base:
            kb_entry = self.knowledge_base[cleaned]
            intent_key = kb_entry["intent"]
            intent_meta = self.intents.get(intent_key, {})
            return {
                "raw_config": cleaned,
                "security_intent": intent_key,
                "confidence": 0.99,
                "status": "AUTO_ACCEPTED",
                "source": "ACTIVE_LEARNING_KNOWLEDGE_BASE",
                "unified_schema": {
                    "category": intent_meta.get("category", "unknown"),
                    "protocol": intent_meta.get("protocol", "UNKNOWN"),
                    "parameter": intent_meta.get("parameter", "unknown"),
                    "target_value": intent_meta.get("target_value", "CONFIGURED")
                },
                "compliance": {
                    "cis_rule": intent_meta.get("cis_rule"),
                    "nist_rule": intent_meta.get("nist_rule")
                }
            }

        # Neural SentenceTransformer Embedding
        query_vec = self.model.encode([cleaned], normalize_embeddings=True)[0]

        # Cosine similarity against all canonical security prototype centroids
        scores = []
        for key in self.intent_keys:
            proto_vec = self.prototype_embeddings[key]
            sim = float(np.dot(query_vec, proto_vec))
            scores.append((key, sim))

        # Sort descending
        scores.sort(key=lambda x: x[1], reverse=True)
        top_intent, s1 = scores[0]
        runner_up_intent, s2 = scores[1] if len(scores) > 1 else (None, 0.0)

        # Margin separation
        margin = max(0.0, s1 - s2)
        # Calibrated confidence formula: (s1 * 0.75) + (margin * 0.25)
        confidence = round((s1 * 0.75) + (margin * 0.25), 3)

        # Triage boundaries (aligned with NeuraComply production policy: >=80% AUTO_ACCEPTED, 60-79% HUMAN_REVIEW, <60% REJECTED)
        if s1 >= 0.80 and margin >= 0.10:
            status = "AUTO_ACCEPTED"
        elif s1 >= 0.60:
            status = "HUMAN_REVIEW"
        else:
            status = "REJECTED"

        intent_meta = self.intents.get(top_intent, {})

        return {
            "vendor_hint": vendor_hint,
            "raw_config": cleaned,
            "security_intent": top_intent if status != "REJECTED" else "UNMAPPED_CONFIGURATION",
            "cosine_similarity": round(s1, 4),
            "margin_separation": round(margin, 4),
            "confidence": confidence if status != "REJECTED" else 0.0,
            "status": status,
            "runner_up": {"intent": runner_up_intent, "similarity": round(s2, 4)},
            "unified_schema": {
                "category": intent_meta.get("category", "unknown"),
                "protocol": intent_meta.get("protocol", "UNKNOWN"),
                "parameter": intent_meta.get("parameter", "unknown"),
                "target_value": intent_meta.get("target_value", "CONFIGURED")
            } if status != "REJECTED" else None,
            "compliance": {
                "cis_rule": intent_meta.get("cis_rule"),
                "nist_rule": intent_meta.get("nist_rule"),
                "evaluation": "PASS" if "DISABLED" in top_intent or "VERSION" in top_intent or "STRONG" in top_intent else "VIOLATION"
            } if status != "REJECTED" else None
        }

def run_evaluation_benchmark():
    engine = SemanticMiniLMEngine()

    print("\n" + "="*80)
    print("   NEURACOMPLY: SENTENCE-TRANSFORMER (all-MiniLM-L6-v2) EVALUATION   ")
    print("="*80 + "\n")

    # Load evaluation dataset
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "evaluation", "cross_vendor_cases.json")
    with open(dataset_path, "r") as f:
        cases = json.load(f)

    print(f"Loaded {len(cases)} cross-vendor test cases from: {dataset_path}")

    correct_intent = 0
    hitl_count = 0
    auto_accepted = 0
    rejected = 0

    results = []

    for case in cases:
        raw_cmd = case.get("configuration") or case.get("raw_config", "")
        expected = case["expected_intent"]
        vendor = case["vendor"]

        res = engine.normalize_statement(raw_cmd, vendor_hint=vendor)
        pred = res["security_intent"]
        status = res["status"]

        is_match = (pred == expected)
        if is_match:
            correct_intent += 1
        
        if status == "AUTO_ACCEPTED":
            auto_accepted += 1
        elif status == "HUMAN_REVIEW":
            hitl_count += 1
        else:
            rejected += 1

        results.append({
            "id": case.get("id"),
            "vendor": vendor,
            "raw": raw_cmd,
            "expected": expected,
            "predicted": pred,
            "confidence": res["confidence"],
            "status": status,
            "correct": is_match
        })

    accuracy = (correct_intent / len(cases)) * 100.0
    hitl_rate = (hitl_count / len(cases)) * 100.0

    print("\n--- MEASURED PERFORMANCE METRICS ---")
    print(f"Total Test Cases:                 {len(cases)}")
    print(f"Intent Classification Accuracy:   {accuracy:.1f}% ({correct_intent}/{len(cases)})")
    print(f"Auto-Accepted Findings:           {auto_accepted} ({auto_accepted/len(cases)*100:.1f}%)")
    print(f"Human-in-the-Loop (HITL) Review:  {hitl_count} ({hitl_rate:.1f}%)")
    print(f"Safely Rejected / Noise:          {rejected} ({rejected/len(cases)*100:.1f}%)")

    # Cross-Vendor Proof for SSHv2
    print("\n--- CROSS-VENDOR EQUIVALENCE: SSHv2 ACROSS 4 VENDORS ---")
    ssh_test_cases = [
        ("Cisco Systems", "ip ssh version 2"),
        ("Juniper Networks", "set system services ssh protocol-version v2"),
        ("Fortinet FortiOS", "set admin-ssh-v1 disable"),
        ("Palo Alto Networks", "<ssh><version>2</version></ssh>")
    ]

    for vendor, raw in ssh_test_cases:
        res = engine.normalize_statement(raw, vendor_hint=vendor)
        print(f"\n[VENDOR] {vendor}")
        print(f"  Statement:     \"{raw}\"")
        print(f"  Mapped Intent: {res['security_intent']}")
        print(f"  Confidence:    {res['confidence']*100:.1f}% [{res['status']}]")
        print(f"  Cosine Sim:    {res['cosine_similarity']}")
        print(f"  Unified Schema: Category={res['unified_schema']['category']} | Protocol={res['unified_schema']['protocol']}")
        print(f"  Compliance:    {res['compliance']['cis_rule']} -> {res['compliance']['evaluation']}")

    # Human-in-the-Loop & Active Learning Demonstration
    print("\n--- ACTIVE LEARNING / KNOWLEDGE REUSE DEMONSTRATION ---")
    novel_syntax = "service ssh version 2"
    print(f"Step 1: Ingest novel syntax from Allied Telesis: \"{novel_syntax}\"")
    res1 = engine.normalize_statement(novel_syntax)
    print(f"  Initial Status: {res1['status']} (Confidence: {res1['confidence']*100:.1f}%)")
    
    print("Step 2: SecOps operator verifies and records mapping to SSH_PROTOCOL_VERSION...")
    engine.record_verified_mapping(novel_syntax, "SSH_PROTOCOL_VERSION", operator="SecOps-Lead-Auditor")

    print(f"Step 3: Re-audit identical syntax on subsequent scan: \"{novel_syntax}\"")
    res2 = engine.normalize_statement(novel_syntax)
    print(f"  Subsequent Status: {res2['status']} (Confidence: {res2['confidence']*100:.1f}%) [Source: {res2.get('source')}]")

    print("\n" + "="*80)
    print("[OK] MiniLM Evaluation successfully completed.")
    print("="*80 + "\n")

if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    run_evaluation_benchmark()
