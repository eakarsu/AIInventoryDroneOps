# Inventory Drone Operations runbook

## Trust boundary

The application records plans, approvals, telemetry evidence, and requested control actions. It does not become the flight controller. A qualified operator remains authoritative, and the autopilot, remote-ID, weather, airspace, fleet, and WMS adapters remain disabled until credentials, contracts, staging evidence, and an operational acceptance decision exist.

The mission workflow is `validated -> approved -> dispatched -> in_flight -> returning|contingency|landed -> closed`. Approval requires two distinct approvers who are not the mission operator. Closure requires operator-signature, telemetry-digest, and inventory-receipt evidence. Telemetry policy fails malformed input safe to land and records non-routine actions in the transactional outbox for an adapter worker.

## Explicit lifecycle

1. Copy `.env.example` to an untracked environment source and replace every placeholder. Use a secret manager in deployed environments.
2. Run `./scripts/bootstrap.sh` to install exactly the dependency lockfiles. It does not touch the database.
3. Back up the target database, review migrations, then run `ALLOW_SCHEMA_MUTATION=yes DATABASE_URL=... ./scripts/migrate.sh`.
4. Development seed data is optional and separately guarded with `ALLOW_DEVELOPMENT_SEED=yes`; never enable it in production.
5. Run `./start.sh`. It refuses missing dependencies, weak secrets, incomplete database configuration, or occupied ports and never kills unrelated processes.

## Adapter operations

`GET /api/mission-operations/integrations/readiness` reports adapter state without disclosing credentials. Every adapter needs explicit enablement, an endpoint, and a runtime credential. Disabled or incomplete adapters return unavailable and must not silently fall back to mock data. Delivery workers must claim outbox records, use bounded exponential retry, and move exhausted requests to `dead_letter`; they must write sanitized details to `integration_failures`.

## Acceptance evidence still required

- Simulator scenarios for route safety, perception, energy reserve, link loss, localization loss, geofence breach, collision risk, and emergency landing.
- Controlled field tests approved by aviation and warehouse safety owners.
- Contract tests against authorized fleet/autopilot, maps/weather/airspace, remote-ID, WMS/dispatch, and operator-console sandboxes.
- Backup/restore rehearsal, migration rehearsal, penetration testing, load testing, alert exercises, and incident rollback.
- Qualified aviation, safety, security, privacy, and regulatory sign-off. Source code and local tests do not satisfy these gates.
