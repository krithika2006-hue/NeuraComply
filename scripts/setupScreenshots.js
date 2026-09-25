import fs from 'fs';
import path from 'path';

const brain = 'C:\\Users\\KRITHIKA .S\\.gemini\\antigravity-ide\\brain\\f0863646-77ed-4d6f-91db-7fcffe83a596';

const copies = [
  ['screenshots/02_scanner_upload.png', 'screenshots/01_configuration_input.png'],
  [path.join(brain, 'uss_semantic_intent_1790351506127.png'), 'screenshots/02_security_intent_normalization.png'],
  ['screenshots/04_confidence_triage.png', 'screenshots/03_confidence_triage.png'],
  [path.join(brain, 'cross_vendor_equivalence_1790351656392.png'), 'screenshots/04_cross_vendor_equivalence.png'],
  [path.join(brain, 'triage_item_approved_1790343701870.png'), 'screenshots/05_hitl_triage.png'],
  ['screenshots/03_compliance_posture.png', 'screenshots/06_compliance_result.png'],
  ['screenshots/05_executive_pdf_report.png', 'screenshots/07_audit_evidence_pdf.png'],
  ['screenshots/05_audit_ledger.png', 'screenshots/08_fabric_immutable_ledger.png'],
  ['screenshots/06_fabric_docker_containers.png', 'screenshots/09_fabric_docker_execution.png']
];

for (const [src, dest] of copies) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} -> ${dest} (${fs.statSync(dest).size} bytes)`);
  } else {
    console.error(`Source missing: ${src}`);
  }
}
