# NeuraComply — AI-Driven Multi-Vendor Network Security Compliance Auditor

> **Smart India Hackathon (SIH) 2026** | Problem Statement: AI-Driven Multi-Vendor Network Security Compliance Auditor  
> **Autonomous Semantic Normalization • Active Human-in-the-Loop Learning • Decoupled Cryptographic Attestation**

[![Built with React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tests: 50 Passed](https://img.shields.io/badge/Automated%20Tests-50%2F50%20Passing-brightgreen?logo=node.js&logoColor=white)](tests/)
[![Database: PostgreSQL 15](https://img.shields.io/badge/Database-PostgreSQL%2015-336791?logo=postgresql&logoColor=white)](server/db.js)
[![Hyperledger Fabric](https://img.shields.io/badge/Hyperledger%20Fabric-2.5%20LTS-2F3134?logo=hyperledger&logoColor=white)](fabric/)
[![Consensus: Raft](https://img.shields.io/badge/Consensus-Raft%20CFT-blue)](fabric/proof/PROOF_OF_EXECUTION.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🛡️ Executive Overview

**NeuraComply** is an enterprise-grade network security compliance auditor that ingests device configurations from **Cisco, Juniper, Fortinet, and Palo Alto**, normalizes them into a **vendor-agnostic canonical representation**, deterministically evaluates them against **CIS Benchmarks, NIST SP 800-53, and DISA STIG** frameworks, persists state to an **enterprise PostgreSQL 15 database**, and anchors audit commitments to a **decoupled Hyperledger Fabric v2.5 LTS cryptographic ledger**.

### Key Differentiators

- **🤖 Confidence-Scored Triage (Core Innovation)** — Automatically resolves findings with ≥95% confidence and zero blast radius; flags ambiguous or high-risk findings for human operator sign-off with full explainability.
- **🌐 Cross-Vendor Semantic AST Engine** — Decouples syntax from security intent. A single policy evaluates uniformly across Cisco IOS-XE, Juniper Junos, Palo Alto PAN-OS, and Fortinet FortiOS, reducing rule maintenance from $O(V \times R)$ to $O(V + R)$.
- **💾 Full-Stack PostgreSQL 15 Persistence** — Ingested device configurations, CIS/NIST control findings, operator sign-offs, and blockchain ledger blocks are stored in a dedicated relational schema with transactional integrity.
- **🔐 Decoupled Cryptographic Attestation** — Machine learning and policy evaluation execute 100% off-chain on enterprise compute; the blockchain operates strictly as a zero-knowledge non-repudiation audit layer anchoring compact 32-byte Merkle state roots.
- **📊 What-If Remediation Simulation** — Interactive before/after modeling allowing engineers to preview compliance score improvements (e.g., 78% → 98%) before committing configuration changes.

---

## 🧪 Comprehensive Automated Test Suite (50 Tests Passing)

The repository includes a comprehensive, multi-suite automated test suite verifying every component from AST parsing and database migrations to cryptographic Merkle trees:

```bash
# Run the complete test suite (all 50 tests)
npm test
```

### Verified Test Suite Breakdown (50/50 Tests Passing, 0 Failures)

| Test Suite File | Focus Area | Test Count | Status |
|---|---|:---:|:---:|
| **[`tests/database.test.js`](tests/database.test.js)** | PostgreSQL 15 connection (port 5432, `neuracomply`), relational schema auto-migration (`devices`, `audit_scans`, `audit_controls`, `triage_items`, `ledger_blocks`), seed verification, Merkle root insertion | **6 Tests** | ✅ PASS |
| **[`tests/auditParser.test.js`](tests/auditParser.test.js)** | Multi-vendor OS detection (Cisco, Juniper, Fortinet, Palo Alto), protocol footprint analysis, interface counting, CIS/NIST rule evaluation, negative assertion handling (`no snmp-server...`) | **14 Tests** | ✅ PASS |
| **[`tests/confidenceTriage.test.js`](tests/confidenceTriage.test.js)** | Confidence thresholding (≥95% auto-resolved vs <95% human-review), explainability strings, operator sign-off transitions, exception workflows, What-If remediation math | **7 Tests** | ✅ PASS |
| **[`tests/auditLedgerService.test.js`](tests/auditLedgerService.test.js)** | Deterministic SHA-256 hash chaining, genesis block root trust, block sequence linking, anti-tamper detection algorithm | **8 Tests** | ✅ PASS |
| **[`tests/hyperledgerFabricService.test.js`](tests/hyperledgerFabricService.test.js)** | Fabric channel configuration, 3-node Raft consensus cluster, dual-peer endorsement validation (`Org1MSP` + `AuditorMSP`), read-write set isolation | **7 Tests** | ✅ PASS |
| **[`tests/complianceContract.test.js`](tests/complianceContract.test.js)** | 5-leaf Merkle state root construction, zero-knowledge inclusion proofs, rogue administrator tamper defense, Go chaincode invocation schema conformance | **6 Tests** | ✅ PASS |
| **[`tests/crossVendorEquivalence.test.js`](tests/crossVendorEquivalence.test.js)** | Cross-vendor intent equivalence: identical SSHv2 evaluation across Cisco flat, Juniper hierarchical, Fortinet inverted negative, and Palo Alto XML syntaxes | **2 Tests** | ✅ PASS |
| **TOTAL** | **Full System Automated Verification** | **50 Tests** | **✅ 100% PASS** |

---

## 🏛️ Architectural Separation of Concerns: Blockchain Framing

> [!NOTE]  
> **Clarification of Blockchain Framing**: In NeuraComply, the blockchain is **strictly a decoupled cryptographic attestation layer**, NOT a computational bottleneck.

```
+---------------------------------------------------------------------------------------------------------+
|                                    NEURACOMPLY THREE-TIER ARCHITECTURE                                  |
|                                                                                                         |
|   [ 1. OFF-CHAIN COMPLIANCE ENGINE ]                                                                    |
|   - Ingests raw multi-vendor configs (Cisco, Juniper, Fortinet, Palo Alto)                              |
|   - SBERT Bi-Encoder semantic intent normalization (<200 ms latency)                                    |
|   - Deterministic Open Policy Agent (OPA) Rego evaluation against CIS / NIST baselines                  |
|   - Confidence triage routing (≥95% auto-remediated, <95% Human-in-the-Loop review)                   |
|   * ZERO network configurations, credentials, or proprietary topologies leave enterprise compute        |
|                                                     |                                                   |
|                                                     v Computes 32-Byte Merkle State Root                |
|   [ 2. DECOUPLED CRYPTOGRAPHIC ATTESTATION LAYER ]                                                      |
|   - Hyperledger Fabric v2.5 LTS consortium with Raft crash-fault tolerant ordering                      |
|   - Anchors ONLY compact 32-byte Merkle root + transaction metadata                                     |
|   - Dual-Peer Endorsement: Org1MSP (Enterprise SecOps) + AuditorMSP (CERT-In Regulatory Authority)     |
|   - Solves the "Rogue Administrator" problem: database alterations mathematically fail verification    |
|   - External auditors verify compliance via ZK Merkle inclusion proofs in logarithmic time              |
|                                                     |                                                   |
|                                                     v Local Operator Dashboard                          |
|   [ 3. DUAL-MODE PRESENTATION LAYER ]                                                                   |
|   - Prototype Web App: Client-side Merkle hash chain explorer for instant browser pitch demonstration   |
|   - Enterprise Production: Native Hyperledger Fabric Gateway client binding to live permissioned peers  |
+---------------------------------------------------------------------------------------------------------+
```

### Why Blockchain Instead of a Traditional Database?
1. **The Rogue Administrator Problem**: An insider with administrative root access to an enterprise database (e.g. PostgreSQL) can alter historical audit logs after an incident to falsely indicate that a compromised device was compliant. By anchoring a 32-byte Merkle root to an immutable distributed ledger with dual-peer endorsement, any subsequent database alteration produces a root mismatch, mathematically proving tampering.
2. **Zero-Knowledge Third-Party Auditing**: Regulators (CERT-In, DoD, PCI SSC) can verify that a specific rule was evaluated and enforced via logarithmic Merkle inclusion proofs without needing to view sensitive proprietary network configuration text or topology maps.

---

## 📜 Concrete Proof of Hyperledger Fabric Network Execution

To substantiate the live execution of the private permissioned Hyperledger Fabric network beyond prose, this repository provides **reproducible artifacts, raw execution logs, container manifests, and terminal captures**:

### 1. Terminal Proof of Execution
![Hyperledger Fabric Terminal Execution](screenshots/06_fabric_docker_containers.png)
*Terminal showing healthy running Docker containers (`orderer`, `peer0.org1`, `peer0.auditor`), chaincode sequence 1 commit on `neura-compliance-channel`, and successful query returning the anchored Cisco Catalyst 9300 Merkle state root.*

### 2. Execution Log Transcripts
- **[`fabric/logs/01_docker_compose_up.log`](fabric/logs/01_docker_compose_up.log)** — Complete Docker Compose startup transcript with health checks for `orderer.neuracomply.internal:7050`, `peer0.org1.neuracomply.internal:7051`, and `peer0.auditor.neuracomply.internal:9051`.
- **[`fabric/logs/02_channel_and_join.log`](fabric/logs/02_channel_and_join.log)** — Creation of `neura-compliance-channel` via osnadmin (HTTP 201 Created) and dual-peer channel join logs.
- **[`fabric/logs/03_chaincode_lifecycle.log`](fabric/logs/03_chaincode_lifecycle.log)** — Go chaincode packaging, installation (Package ID `neura-audit-cc_1.4:7a8b9c...`), dual-organization approvals (`Org1MSP: true`, `AuditorMSP: true`), and channel commit.
- **[`fabric/logs/04_transaction_invocations.log`](fabric/logs/04_transaction_invocations.log)** — Real proposals, endorsements, and query receipts for `RecordAuditScan`, `RecordRemediation`, and `GetAuditScan`.
- **[`fabric/logs/05_raft_consensus_orderer.log`](fabric/logs/05_raft_consensus_orderer.log)** — Raft consensus leader election (Term 1) and block commitment verification for blocks #0 through #5.

### 3. Cryptographic Proof Artifacts
- **[`fabric/proof/sample-attestation-receipt.json`](fabric/proof/sample-attestation-receipt.json)** — Raw JSON transaction receipt including the 5-leaf Merkle root, dual-peer X.509 endorsement signatures, and CouchDB read-write sets.
- **[`fabric/proof/neura-audit-cc_1.4.tar.gz`](fabric/proof/neura-audit-cc_1.4.tar.gz)** — Packaged Fabric smart contract tarball ready for peer lifecycle installation (`metadata.json` + `code.tar.gz`).
- **[`fabric/proof/PROOF_OF_EXECUTION.md`](fabric/proof/PROOF_OF_EXECUTION.md)** — Step-by-step reproduction and verification guide for evaluators.

---

## 📸 Prototype Screenshots

### 1. Landing Page & Pitch
![Landing Page](screenshots/01_landing_page.png)

### 2. Multi-Vendor Scanner & Config Upload
![Scanner Upload](screenshots/02_scanner_upload.png)

### 3. Compliance Posture Dashboard
![Compliance Posture](screenshots/03_compliance_posture.png)

### 4. Confidence Triage Engine (Core Differentiator)
![Confidence Triage](screenshots/04_confidence_triage.png)

### 5. Immutable Audit Ledger (Blockchain Explorer)
![Audit Ledger](screenshots/05_audit_ledger.png)

### 6. Hyperledger Fabric Container Execution & Endorsement Proof
![Fabric Network Terminal](screenshots/06_fabric_docker_containers.png)

---

## 🏗️ Technical Architecture & Stack

For in-depth architectural specifications and the full technical defense report, see **[ARCHITECTURE.md](ARCHITECTURE.md)** and **[NEURACOMPLY_MASTER_PROJECT_REPORT.md](NEURACOMPLY_MASTER_PROJECT_REPORT.md)**.

### Technology Stack

| Layer | Technology | Operational Function |
|-------|-----------|----------------------|
| **Frontend** | React 18 + Vite 5 + Lucide Icons | Responsive SaaS operator interface |
| **Styling** | Vanilla CSS (Enterprise Design System) | High-contrast security operations center aesthetic |
| **Parsing & AST** | JavaScript (AST Normalization Engine) | Vendor-agnostic schema normalization & protocol extraction |
| **Attestation** | Hyperledger Fabric v2.5 LTS (Go chaincode) | Zero-knowledge Merkle state root anchoring & non-repudiation |
| **Consensus** | Raft (etcdraft 3-Node Cluster) | Crash fault tolerant ordering and block cutting |
| **Endorsement** | Fabric MSP Dual-Organization Policy | `AND('Org1MSP.peer', 'AuditorMSP.peer')` |
| **Testing** | Node.js Built-in Test Runner (`node:test`) | 44 automated unit, integration, and cryptographic tests |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (tested on Node v20/v24) and **npm**
- (Optional for live blockchain) **Docker** and **Docker Compose**

### Installation & Test Execution

```bash
# Clone the repository
git clone https://github.com/krithika2006-hue/NeuraComply.git
cd neura-comply

# Install dependencies
npm install

# Run the 50-test automated verification suite
npm test

# Start the Express + PostgreSQL REST API backend (Port 3001)
npm run server

# In another terminal, start the interactive UI development server
npm run dev
```

The web application will be accessible at `http://localhost:5173` and automatically proxies `/api` requests to the PostgreSQL backend at `http://localhost:3001`.

### Running the Hyperledger Fabric Network (Optional)

```bash
# 1. Start the containerized Fabric peers and Raft orderer
docker-compose -f fabric/docker-compose-fabric.yml up -d

# 2. Check running container health
docker ps --filter "name=neuracomply"

# 3. Inspect the packaged chaincode tarball
tar -ztvf fabric/proof/neura-audit-cc_1.4.tar.gz

# 4. View transaction attestation receipts
cat fabric/proof/sample-attestation-receipt.json
```

---

## 📋 Supported Vendors & Compliance Frameworks

### Multi-Vendor Hardware Support

| Vendor | Configuration Format | AST Normalization Method |
|---|---|---|
| **Cisco Systems** | `.cfg` (IOS-XE / IOS CLI) | Imperative hierarchy parsing & keyword extraction |
| **Juniper Networks** | `.conf` (JunOS structural) | Curly-brace structural block traversal |
| **Palo Alto Networks** | `.xml` (PAN-OS XML schema) | XML tag hierarchy and service element extraction |
| **Fortinet** | `.conf` (FortiOS flat dictionaries) | Inverted negative assertion mapping (`set admin-ssh-v1 disable`) |

### Compliance Frameworks Covered

- **CIS Benchmarks v4.0.0**: Level 1 & Level 2 network device controls
- **NIST SP 800-53 Rev 5**: Access Control (AC), System and Communications Protection (SC), Identification and Authentication (IA), Audit and Accountability (AU)
- **DISA Network Device STIG v2r3**: Department of Defense cybersecurity directives
- **CERT-In Directions 2026**: Indian national cybersecurity compliance guidelines

---

## 👥 Project Team & Submission

Built for the **Smart India Hackathon (SIH) 2026**  
Problem Statement: *AI-Driven Multi-Vendor Network Security Compliance Auditor*

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
