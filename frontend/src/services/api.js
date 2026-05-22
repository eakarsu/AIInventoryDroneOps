const API_BASE = 'http://localhost:4061/api';
const TOKEN_KEY = 'inventory_drone_ops_token';
const USER_KEY = 'inventory_drone_ops_user';

export { API_BASE };
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };
export const getStoredUser = () => { try { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
export const setStoredUser = (u) => { try { u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY); } catch {} };
export function logout() { setToken(null); setStoredUser(null); if (typeof window !== 'undefined') window.location.assign('/login'); }
export function getRole() { return (getStoredUser()?.role || 'viewer').toLowerCase(); }
export function canWrite() { return ['commander', 'analyst'].includes(getRole()); }
export function isCommander() { return getRole() === 'commander'; }

async function request(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (res.status === 401 && !url.startsWith('/auth/login')) { logout(); throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function crud(base) {
  return {
    list: () => request(`/${base}`),
    get: (id) => request(`/${base}/${id}`),
    create: (data) => request(`/${base}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d) => request(`/${base}/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    remove: (id) => request(`/${base}/${id}`, { method: 'DELETE' }),
    bulkImport: (csv) => request(`/${base}/bulk-import`, { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: csv }),
    listAttachments: (id) => request(`/${base}/${id}/attachments`),
    uploadAttachment: async (id, file) => {
      const token = getToken();
      const form = new FormData(); form.append('file', file);
      const res = await fetch(`${API_BASE}/${base}/${id}/attachments`, {
        method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      return data;
    },
  };
}

export const login = (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => request('/auth/me');

export const warehousesApi = crud('warehouses');
export const dronesApi = crud('drones');
export const missionsApi = crud('missions');
export const scan_resultsApi = crud('scan-results');
export const discrepanciesApi = crud('discrepancies');
export const zonesApi = crud('zones');
export const sku_masterApi = crud('sku-master');
export const wms_snapshotsApi = crud('wms-snapshots');
export const work_ordersApi = crud('work-orders');
export const maintenance_eventsApi = crud('maintenance-events');
export const telemetryApi = crud('telemetry');

export const aiDroneMissionPlan = (body) => request('/ai/drone-mission-plan', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiSkuReconcile = (body) => request('/ai/sku-reconcile', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiMaintenanceForecast = (body) => request('/ai/maintenance-forecast', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiAnomalyClassify = (body) => request('/ai/anomaly-classify', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiRouteOptimizer = (body) => request('/ai/route-optimizer', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiDemandForecast = (body) => request('/ai/demand-forecast', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiSwarmCoordinator = (body) => request('/ai/swarm-coordinator', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiExceptionRouting = (body) => request('/ai/exception-routing', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiMisPickDetect = (body) => request('/ai/mis-pick-detect', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiSlotOccupancyForecast = (body) => request('/ai/slot-occupancy-forecast', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiAnomalyNarrate = (body) => request('/ai/anomaly-narrate', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiScanFailureRca = (body) => request('/ai/scan-failure-rca', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiPhotoDamageClassify = (body) => request('/ai/photo-damage-classify', { method: 'POST', body: JSON.stringify(body || {}) });

// Apply pass 7 — backlog non-AI helpers
export const scan_schedulesApi = crud('scan-schedules');
export const getAuditLog = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/audit-log${qs ? '?' + qs : ''}`);
};
export const wmsLive = {
  status: () => request('/wms-live/status'),
  pull: (b) => request('/wms-live/pull', { method: 'POST', body: JSON.stringify(b || {}) }),
  push: (b) => request('/wms-live/push', { method: 'POST', body: JSON.stringify(b || {}) }),
  sync: (b) => request('/wms-live/sync', { method: 'POST', body: JSON.stringify(b || {}) }),
};
export const scanProofsApi = {
  list: () => request('/scan-proofs'),
  get: (id) => request(`/scan-proofs/${id}`),
  generate: (b) => request('/scan-proofs/generate', { method: 'POST', body: JSON.stringify(b || {}) }),
  verify: (id, b) => request(`/scan-proofs/${id}/verify`, { method: 'POST', body: JSON.stringify(b || {}) }),
};
export const crossDcApi = {
  list: () => request('/cross-dc-reconciliations'),
  get: (id) => request(`/cross-dc-reconciliations/${id}`),
  run: (b) => request('/cross-dc-reconciliations/run', { method: 'POST', body: JSON.stringify(b || {}) }),
};
export const technicianDispatchApi = {
  list: () => request('/technician-dispatches'),
  fromDiscrepancy: (id, b) => request(`/technician-dispatches/from-discrepancy/${id}`, { method: 'POST', body: JSON.stringify(b || {}) }),
  fromAnomaly: (b) => request('/technician-dispatches/from-anomaly', { method: 'POST', body: JSON.stringify(b || {}) }),
};

export const getAIHistory = (feature, limit = 25) => {
  const qs = new URLSearchParams({ ...(feature ? { feature } : {}), limit: String(limit) }).toString();
  return request(`/ai/history?${qs}`);
};
export const getAISamples = (feature) => {
  const qs = new URLSearchParams({ feature: feature || '' }).toString();
  return request(`/ai/samples?${qs}`);
};

export const getDashboardStats = () => request('/dashboard');

export const getNotifications = () => request('/notifications');
export const getUnreadNotifications = () => request('/notifications/unread');
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => request('/notifications/mark-all-read', { method: 'POST' });

export const webhooksApi = {
  list: () => request('/webhooks'),
  create: (d) => request('/webhooks', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id) => request(`/webhooks/${id}`, { method: 'DELETE' }),
  test: (event, payload) => request('/webhooks/test', { method: 'POST', body: JSON.stringify({ event, payload }) }),
  deliveries: (id) => request(`/webhooks/${id}/deliveries`),
};
