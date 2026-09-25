/**
 * NeuraComply Backend & Database API Client
 *
 * Provides real-time REST API communication between the React frontend
 * and the Express + PostgreSQL backend on port 3001.
 */

const API_BASE = '/api';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { connected: false };
    const data = await res.json();
    return { connected: true, ...data };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

export async function fetchDevicesFromDb() {
  try {
    const res = await fetch(`${API_BASE}/devices`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch devices from DB, using fallback:', err.message);
    return null;
  }
}

export async function fetchDeviceFromDb(id) {
  try {
    const res = await fetch(`${API_BASE}/devices/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch device from DB:', err.message);
    return null;
  }
}

export async function scanConfigToDb(fileName, content, checksum) {
  try {
    const res = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, content, checksum })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not persist scan to PostgreSQL, using client evaluation:', err.message);
    return null;
  }
}

export async function fetchTriageFromDb() {
  try {
    const res = await fetch(`${API_BASE}/triage`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch triage from DB:', err.message);
    return null;
  }
}

export async function confirmTriageItemInDb(id, operatorSignedBy) {
  try {
    const res = await fetch(`${API_BASE}/triage/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorSignedBy })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not confirm triage item in DB:', err.message);
    return null;
  }
}

export async function fetchLedgerFromDb() {
  try {
    const res = await fetch(`${API_BASE}/ledger`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch ledger from DB:', err.message);
    return null;
  }
}

export async function verifyLedgerInDb() {
  try {
    const res = await fetch(`${API_BASE}/ledger/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not verify ledger in DB:', err.message);
    return null;
  }
}

export async function fetchSummaryFromDb() {
  try {
    const res = await fetch(`${API_BASE}/summary`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch summary from DB:', err.message);
    return null;
  }
}
