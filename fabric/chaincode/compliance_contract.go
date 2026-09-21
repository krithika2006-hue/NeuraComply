package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ComplianceAuditContract provides smart contract functions for managing immutable compliance audit records
type ComplianceAuditContract struct {
	contractapi.Contract
}

// AuditRecord describes an immutable compliance scan anchored to Hyperledger Fabric
type AuditRecord struct {
	DocType            string            `json:"docType"` // "AuditRecord"
	TxID               string            `json:"txId"`
	BlockNumber        uint64            `json:"blockNumber"`
	Timestamp          string            `json:"timestamp"`
	DeviceID           string            `json:"deviceId"`
	Vendor             string            `json:"vendor"`
	OperatingSystem    string            `json:"operatingSystem"`
	ASTChecksum        string            `json:"astChecksum"`
	RulesEvaluated     int               `json:"rulesEvaluated"`
	PassedCount        int               `json:"passedCount"`
	ViolationsCount    int               `json:"violationsCount"`
	ComplianceScore    int               `json:"complianceScore"`
	OperatorIdentity   string            `json:"operatorIdentity"`   // Google SSO email + X.509 subject
	EndorsingPeers     []string          `json:"endorsingPeers"`     // e.g. ["peer0.secops.defense.gov", "peer0.auditor.certin.gov"]
	Metadata           map[string]string `json:"metadata"`
	PreviousRecordHash string            `json:"previousRecordHash"`
}

// RemediationRecord describes an automated or confirmed remediation committed to Fabric
type RemediationRecord struct {
	DocType          string  `json:"docType"` // "RemediationRecord"
	TxID             string  `json:"txId"`
	Timestamp        string  `json:"timestamp"`
	ControlCode      string  `json:"controlCode"`
	ConfidenceScore  float64 `json:"confidenceScore"`
	RemediationCLI   string  `json:"remediationCli"`
	OperatorIdentity string  `json:"operatorIdentity"`
	Status           string  `json:"status"` // "COMMITTED", "STAGED", "CONFIRMED"
}

// InitLedger initializes the ledger with genesis anchor block
func (c *ComplianceAuditContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	txID := ctx.GetStub().GetTxID()
	genesisRecord := AuditRecord{
		DocType:            "AuditRecord",
		TxID:               txID,
		BlockNumber:        1,
		Timestamp:          time.Now().UTC().Format(time.RFC3339),
		DeviceID:           "GENESIS_ROOT_TRUST",
		Vendor:             "NeuraComply Core",
		OperatingSystem:    "Hyperledger Fabric v2.5",
		ASTChecksum:        "0x0000000000000000000000000000000000000000000000000000000000000000",
		RulesEvaluated:     42,
		PassedCount:        42,
		ViolationsCount:    0,
		ComplianceScore:    100,
		OperatorIdentity:   "CN=admin,O=HyperledgerFabric,C=US",
		EndorsingPeers:     []string{"peer0.secops.defense.gov", "peer0.auditor.certin.gov"},
		PreviousRecordHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
		Metadata: map[string]string{
			"channel": "aegis-compliance-channel",
			"policy":  "AND('Org1MSP.member', 'AuditorMSP.member')",
		},
	}

	recordBytes, err := json.Marshal(genesisRecord)
	if err != nil {
		return fmt.Errorf("failed to marshal genesis record: %v", err)
	}

	return ctx.GetStub().PutState("RECORD_GENESIS", recordBytes)
}

// RecordAuditScan writes a new deterministic compliance evaluation to the distributed ledger
func (c *ComplianceAuditContract) RecordAuditScan(
	ctx contractapi.TransactionContextInterface,
	recordKey string,
	deviceID string,
	vendor string,
	os string,
	astChecksum string,
	rulesEvaluated int,
	passed int,
	violations int,
	score int,
	operator string,
	previousHash string,
) (*AuditRecord, error) {
	txID := ctx.GetStub().GetTxID()
	timestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction timestamp: %v", err)
	}

	record := AuditRecord{
		DocType:            "AuditRecord",
		TxID:               txID,
		BlockNumber:        0, // Assigned by Orderer upon block inclusion
		Timestamp:          time.Unix(timestamp.Seconds, int64(timestamp.Nanos)).UTC().Format(time.RFC3339),
		DeviceID:           deviceID,
		Vendor:             vendor,
		OperatingSystem:    os,
		ASTChecksum:        astChecksum,
		RulesEvaluated:     rulesEvaluated,
		PassedCount:        passed,
		ViolationsCount:    violations,
		ComplianceScore:    score,
		OperatorIdentity:   operator,
		EndorsingPeers:     []string{"peer0.secops.defense.gov", "peer0.auditor.certin.gov"},
		PreviousRecordHash: previousHash,
		Metadata: map[string]string{
			"channel":     "aegis-compliance-channel",
			"engine":      "NeuraComply-AST-v1.4",
			"fabric_spec": "Fabric-v2.5-Raft",
		},
	}

	recordBytes, err := json.Marshal(record)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize audit record: %v", err)
	}

	err = ctx.GetStub().PutState(recordKey, recordBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to commit audit record state: %v", err)
	}

	// Emit Fabric Blockchain Event for real-time listener subscribers
	err = ctx.GetStub().SetEvent("AuditScanCommitted", recordBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to emit Fabric chaincode event: %v", err)
	}

	return &record, nil
}

// QueryAuditRecord retrieves a specific immutable audit record by state key
func (c *ComplianceAuditContract) QueryAuditRecord(ctx contractapi.TransactionContextInterface, recordKey string) (*AuditRecord, error) {
	recordBytes, err := ctx.GetStub().GetState(recordKey)
	if err != nil {
		return nil, fmt.Errorf("failed to read from fabric world state: %v", err)
	}
	if recordBytes == nil {
		return nil, fmt.Errorf("the record %s does not exist on channel", recordKey)
	}

	var record AuditRecord
	err = json.Unmarshal(recordBytes, &record)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal record json: %v", err)
	}

	return &record, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&ComplianceAuditContract{})
	if err != nil {
		fmt.Printf("Error creating NeuraComply Hyperledger Fabric chaincode: %s\n", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting NeuraComply Hyperledger Fabric chaincode: %s\n", err.Error())
	}
}
