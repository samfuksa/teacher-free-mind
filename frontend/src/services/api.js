// frontend/src/services/api.js
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

async function parseResponse(res) {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!res.ok && !json.error) {
      json.error = `Chyba serveru (${res.status})`;
    }
    return json;
  } catch (err) {
    // Pokud PHP vrátilo HTML chybu, vyčistíme značky a ukážeme lidsky čitelný text
    const clean = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    return {
      ok: false,
      error: clean || `Chyba komunikace se serverem (${res.status} ${res.statusText})`
    };
  }
}

export async function createRoom(title, authorName) {
  const res = await fetch(`${API_BASE}/create_room.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, authorName })
  });
  return parseResponse(res);
}

export async function joinRoom(code, name, sessionId) {
  const res = await fetch(`${API_BASE}/join_room.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name, sessionId })
  });
  return parseResponse(res);
}

export async function syncGet(code, since, sessionId, name) {
  const params = new URLSearchParams({
    code,
    since: since.toString(),
    sessionId: sessionId || '',
    name: name || ''
  });
  const res = await fetch(`${API_BASE}/sync.php?${params.toString()}`);
  return parseResponse(res);
}

export async function syncPost(code, sessionId, adminToken, { nodes = [], edges = [], deletedNodeIds = [], deletedEdgeIds = [] }) {
  const res = await fetch(`${API_BASE}/sync.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      sessionId,
      adminToken,
      nodes,
      edges,
      deletedNodeIds,
      deletedEdgeIds
    })
  });
  return parseResponse(res);
}

export async function toggleRoomLock(code, adminToken) {
  const res = await fetch(`${API_BASE}/room_admin.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      adminToken,
      action: 'toggle_lock'
    })
  });
  return parseResponse(res);
}

export async function updateRoomTitle(code, adminToken, title) {
  const res = await fetch(`${API_BASE}/room_admin.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      adminToken,
      action: 'update_title',
      title
    })
  });
  return parseResponse(res);
}

export async function exportRoomJson(code) {
  const res = await fetch(`${API_BASE}/export.php?code=${encodeURIComponent(code)}`);
  return parseResponse(res);
}

export async function importRoomJson(jsonData) {
  const res = await fetch(`${API_BASE}/import.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonData)
  });
  return parseResponse(res);
}
