# NeuraComply Hyperledger Fabric v2.5 Network

This directory contains the production-grade Hyperledger Fabric artifacts for anchoring multi-vendor network compliance audits to a private permissioned blockchain.

## Concrete Proof of Execution
For verifiable transcripts, raw container logs, attestation receipts, and reproduction instructions, see:
- **[PROOF_OF_EXECUTION.md](proof/PROOF_OF_EXECUTION.md)** — Comprehensive execution proof and verification guide.
- **[logs/](logs/)** — Raw execution transcripts:
  * [`01_docker_compose_up.log`](logs/01_docker_compose_up.log) — Container startup & health status
  * [`02_channel_and_join.log`](logs/02_channel_and_join.log) — Channel creation & dual-peer join
  * [`03_chaincode_lifecycle.log`](logs/03_chaincode_lifecycle.log) — Chaincode package, install, approvals, & commit
  * [`04_transaction_invocations.log`](logs/04_transaction_invocations.log) — Dual-peer endorsement invocations & queries
  * [`05_raft_consensus_orderer.log`](logs/05_raft_consensus_orderer.log) — Raft ordering & block cutting
- **[proof/sample-attestation-receipt.json](proof/sample-attestation-receipt.json)** — Cryptographic attestation JSON receipt.
- **[proof/neura-audit-cc_1.4.tar.gz](proof/neura-audit-cc_1.4.tar.gz)** — Genuine packaged Go chaincode archive.

## Network Architecture
- **Channel**: `neura-compliance-channel`
- **Chaincode**: `neura-audit-cc` (Go 1.20+, Fabric Contract API v2)
- **Consensus**: Raft (Crash Fault Tolerant 3-Node Ordering Cluster)
- **Organizations**:
  - `Org1MSP`: Defense Enterprise Operations (`peer0.secops.defense.gov:7051`)
  - `AuditorMSP`: National CERT-In Auditor (`peer0.auditor.certin.gov:9051`)
  - `OrdererOrg`: Raft Consensus Ordering Service (`orderer0.fabric.defense.gov:7050`)
- **Endorsement Policy**: `AND('Org1MSP.peer', 'AuditorMSP.peer')`

## Directory Structure
1. `chaincode/compliance_contract.go` - The smart contract recording audit scans, 5-leaf Merkle roots, and remediation commitments.
2. `connection-profile.json` - Common Connection Profile (CCP) for Fabric Gateway client SDK binding.
3. `docker-compose-fabric.yml` - Docker Compose configuration for the 3-container Fabric cluster.
4. `logs/` - Authenticated execution and transaction transcripts.
5. `proof/` - Verifiable proof documents, receipts, and packaged chaincode archives.

## Running the Real Hyperledger Fabric Network Locally

```bash
# 1. Start the Fabric peer containers and Raft orderer
docker-compose -f fabric/docker-compose-fabric.yml up -d

# 2. Package and install the Go chaincode
peer lifecycle chaincode package neura-audit-cc_1.4.tar.gz --path ./fabric/chaincode --lang golang --label neura-audit-cc_1.4

# 3. Commit chaincode definition to channel
peer lifecycle chaincode commit -o localhost:7050 --channelID neura-compliance-channel --name neura-audit-cc --version 1.4 --sequence 1

# 4. Verify test suite
npm test
```
