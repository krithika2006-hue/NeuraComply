# NeuraComply Hyperledger Fabric v2.5 Network

This directory contains the production-grade Hyperledger Fabric artifacts for anchoring multi-vendor network compliance audits to a private permissioned blockchain.

## Network Architecture
- **Channel**: `neura-compliance-channel`
- **Chaincode**: `neura-audit-cc` (Go 1.20+, Contract API v2)
- **Consensus**: Raft (Crash Fault Tolerant)
- **Organizations**:
  - `Org1MSP`: Defense Enterprise Operations (`peer0.secops.defense.gov:7051`)
  - `AuditorMSP`: National CERT-In Auditor (`peer0.auditor.certin.gov:9051`)
  - `OrdererOrg`: Raft Consensus Ordering Service (`orderer0.fabric.defense.gov:7050`)
- **Endorsement Policy**: `AND('Org1MSP.member', 'AuditorMSP.member')`

## Files
1. `chaincode/compliance_contract.go` - The smart contract recording audit scans, deterministic AST hashes, and remediation commitments.
2. `connection-profile.json` - Common Connection Profile (CCP) for client SDK & Fabric Gateway connection.
3. `docker-compose-fabric.yml` - Docker Compose configuration to spin up the local 2-Org Hyperledger Fabric peer cluster.

## Running the Real Hyperledger Fabric Network Locally

```bash
# 1. Start the Fabric peer containers and Raft orderer
docker-compose -f fabric/docker-compose-fabric.yml up -d

# 2. Package and install the Go chaincode
peer lifecycle chaincode package neura-audit-cc.tar.gz --path ./fabric/chaincode --lang golang --label neura-audit-cc_1.4

# 3. Commit chaincode definition to channel
peer lifecycle chaincode commit -o localhost:7050 --channelID neura-compliance-channel --name neura-audit-cc --version 1.4 --sequence 1
```
