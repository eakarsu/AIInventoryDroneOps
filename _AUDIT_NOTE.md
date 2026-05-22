# Audit Note — AIInventoryDroneOps

Stack: Node + Express + React + Postgres + OpenRouter.
Domain: warehouse inventory drone operations — autonomous cycle counts, slot-level scans, anomaly reports, fleet scheduling.

## Inventory observed

Backend routes mounted in `backend/server.js`:
`auth`, `warehouses`, `drones`, `missions`, `scan-results`, `discrepancies`, `zones`, `sku-master`, `wms-snapshots`, `work-orders`, `maintenance-events`, `telemetry`, `ai`, `notifications`, `attachments`, `webhooks`, `dashboard`, `custom-views`.

AI endpoints in `backend/routes/ai.js`:
`/samples`, `/history`, `/drone-mission-plan`, `/sku-reconcile`, `/maintenance-forecast`, `/anomaly-classify`, `/route-optimizer`, `/demand-forecast`, `/swarm-coordinator`, `/exception-routing`.

Frontend pages: 8 AI pages (mission-plan, sku-reconcile, maintenance-forecast, anomaly-classify, route-optimizer, demand-forecast, swarm-coordinator, exception-routing) + CRUD pages for each entity + dashboards / workbenches.

Schema (`backend/migrations/001_schema.sql`, `002_extras.sql`): users, ai_results, notifications, attachments, webhooks, webhook_deliveries, warehouses, drones, missions, scan_results, discrepancies, zones, sku_master, wms_snapshots, work_orders, maintenance_events, telemetry.

## Gap analysis

### AI — Missing
- **scan-route optimizer** — PARTIAL. `/route-optimizer` exists; verify it is slot-aware vs. generic.
- **mis-pick detection** — MISSING. No dedicated endpoint; `anomaly-classify` is generic.
- **slot-occupancy forecaster** — MISSING. `demand-forecast` is SKU-level, not slot-level.
- **photo-based damage classifier** — MISSING. `attachments` route exists; no vision-classify endpoint.
- **anomaly-report narrator** — MISSING. `anomaly-classify` returns structured tags, not narrative.
- **scan-failure root-cause** — MISSING. No RCA endpoint over scan_results/telemetry/maintenance_events.

### Non-AI — Missing
- **WMS integration** — PARTIAL. `wms-snapshots` table + route present (pull/snapshot model); no live push/pull connector or webhook-driven sync.
- **scan schedule CRUD** — PARTIAL. `missions` covers individual missions; no recurring `scan_schedules` table/route (cron-like cycle-count plans).
- **drone fleet CRUD** — IMPLEMENTED. `drones` route + table.
- **no-fly zones** — PARTIAL. `zones` exists; no explicit `no_fly` flag/type or exclusion-geometry route inspected.
- **audit log** — MISSING. No `audit_log` table or middleware writing per-mutation events.

### Custom — Missing
- **blockchain proof-of-count** — MISSING. No hashing/anchor table for immutable count attestations.
- **cross-DC reconciliation** — MISSING. `sku-reconcile` AI is intra-DC; no multi-warehouse reconciliation endpoint/table.
- **technician dispatch on anomaly** — MISSING. `work_orders` + `maintenance_events.technician` column exist; no auto-dispatch trigger off discrepancies/anomalies.

## Implemented (this round)

None — audit-only.

## Backlog (prioritized)

1. **MECHANICAL** mis-pick detection, slot-occupancy forecaster, anomaly-report narrator, scan-failure RCA, photo-damage classifier (5 AI endpoints — reuse `services/ai.js` + `ai_results`).
2. **MECHANICAL** `scan_schedules` table + CRUD; `audit_log` table + write-through middleware; `no_fly` flag on `zones`.
3. **MECHANICAL** cross-DC reconciliation endpoint; technician auto-dispatch (discrepancy → work_order) handler.
4. **NEEDS-PRODUCT-DECISION** blockchain proof-of-count (chain choice, anchoring cadence, key custody).
5. **NEEDS-CREDS** live WMS connector (SAP EWM / Manhattan / Blue Yonder credentials).

## Status

Audit-only. No code modified. Counts: 18 backend routes mounted, 10 AI endpoints (8 generative + 2 utility), 26 frontend pages, 17 domain tables. Gaps: 6 AI missing/partial, 5 non-AI missing/partial, 3 custom missing.

## Apply pass 7 (full backlog implementation)

Full backlog (MECHANICAL + NEEDS-PRODUCT-DECISION + NEEDS-SCHEMA) implemented.
Live WMS connector is a 503 stub until creds are wired.
Blockchain proof-of-count implemented as deterministic SHA-256 Merkle-tree-of-scans; only the root hash + leaves are persisted per scan session (no external chain).

### New / modified endpoints (mounted before any 404 handler in `backend/server.js`)

AI (POST):
- `/api/ai/mis-pick-detect`
- `/api/ai/slot-occupancy-forecast`
- `/api/ai/anomaly-narrate`
- `/api/ai/scan-failure-rca`
- `/api/ai/photo-damage-classify`

Non-AI:
- `/api/scan-schedules` (full CRUD + bulk-import + attachments via `_crudFactory`)
- `/api/audit-log` (`GET /`, `GET /:id`) — writes occur via `middleware/auditLog.js` on every mutating request after `authenticateToken`
- `/api/wms-live/status`, `/api/wms-live/pull`, `/api/wms-live/push`, `/api/wms-live/sync`, `/api/wms-live/webhook-sync` — all 503 unless `WMS_ADAPTER`, `WMS_BASE_URL`, `WMS_API_KEY` are set in env
- `/api/scan-proofs` (`GET /`, `GET /:id`, `POST /generate`, `POST /:id/verify`) — SHA-256 Merkle, algorithm `sha256-merkle-v1`
- `/api/cross-dc-reconciliations` (`GET /`, `GET /:id`, `POST /run`) — aggregates `scan_results` across warehouses vs `sku_master.expected_qty`
- `/api/technician-dispatches` (`GET /`, `GET /:id`, `POST /from-discrepancy/:id`, `POST /from-anomaly`) — creates a `work_orders` row and `technician_dispatches` row with SLA-driven `scheduled_for`

### New frontend pages (routed in `frontend/src/App.js`, linked in `Sidebar.js`)
- `/ai/mis-pick-detect`, `/ai/slot-occupancy-forecast`, `/ai/anomaly-narrate`, `/ai/scan-failure-rca`, `/ai/photo-damage-classify`
- `/scan-schedules` (CRUD), `/audit-log`, `/wms-live`, `/scan-proofs`, `/cross-dc-reconciliations`, `/technician-dispatches`

### Schema (`backend/migrations/003_backlog.sql`)
- `scan_schedules` (CRUD-backing)
- `audit_log` (+ indexes)
- `zones.no_fly BOOLEAN`, `zones.exclusion_geometry JSONB`
- `scan_proofs` (Merkle root + leaves + algorithm + metadata)
- `cross_dc_reconciliations` (run history + JSON result)
- `technician_dispatches` (source/work-order link)

### Syntax verification
`node --check` ran clean on every modified backend file (`server.js`, `routes/ai.js`, six new route files, `middleware/auditLog.js`). Frontend `.js` files are JSX (CRA / babel) and follow existing page patterns exactly.

### Skips
- Live WMS connector kept as a 503 stub (NEEDS-CREDS).
- No new npm deps; Merkle tree uses the built-in `crypto` module.
- No feature-page JSX rewrites; only additions + sidebar/App wiring.

### Status
Apply pass 7 complete. Implementation lands all MECHANICAL items, the NEEDS-PRODUCT-DECISION blockchain item as a self-anchored Merkle root, and every NEEDS-SCHEMA delta as a forward-only migration.
