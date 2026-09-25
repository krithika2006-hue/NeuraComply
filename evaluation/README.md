# NeuraComply Cross-Vendor Evaluation Dataset & Benchmark

**SIH Problem Statement:** PS 26155 — AI-Driven Multi-Vendor Network Security Compliance Auditor  
**Execution Command:** `npm run evaluate`  
**Dataset File:** `cross_vendor_cases.json`  
**Runner File:** `../scripts/evaluateSemanticEngine.js`

---

## Overview

This directory contains the standardized evaluation dataset used to benchmark NeuraComply's **Semantic Security Intent Normalization Pipeline** against conventional **Heuristic / Regular Expression Parsing**.

The objective is to prove that divergent vendor configuration syntaxes expressing the **same security requirement** converge to the **same canonical security intent** in the Unified Security Schema (USS).

---

## Dataset Schema (`cross_vendor_cases.json`)

Each test case contains:

```json
{
  "id": "CV-001",
  "vendor": "Cisco",
  "configuration": "ip ssh version 2",
  "expected_intent": "SSH_PROTOCOL_VERSION",
  "security_property": "Enforce SSH version 2 protocol"
}
```

### Coverage Across Vendor Operating Systems (34 Real Cases)
- **Cisco Systems (IOS-XE 17.6):** 11 cases (Flat imperative CLI)
- **Juniper Networks (Junos OS 21.4):** 8 cases (Hierarchical block structures)
- **Fortinet (FortiOS v7.2):** 7 cases (Block directives and negative syntax flags)
- **Palo Alto Networks (PAN-OS 10.2):** 6 cases (Structured XML configuration elements)
- **Novel / Unseen / Noise:** 2 cases (Allied Telesis and non-security loopback interface definitions)

---

## How to Run the Benchmark

```bash
# From workspace root
npm run evaluate
```

The script evaluates all 34 cases concurrently through:
1. **Method A (Baseline Heuristic Parser):** String matching and regex.
2. **Method B (NeuraComply Semantic AI Pipeline):** Dense continuous vector projection ($\mathbb{R}^{128}$), cosine prototype similarity, and calibrated confidence classification.

The benchmark outputs:
- Intent Classification Accuracy (%)
- Cross-Vendor Equivalence Group Convergence Rate (%)
- Human-in-the-Loop (HITL) Review Routing Rate (%)
- Live Demonstration of SSHv2 convergence across Cisco, Juniper, Fortinet, and Palo Alto.
- Full machine-readable results saved to `evaluation/evaluation_report.json`.
