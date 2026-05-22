const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

const SCHEMAS = {
  'drone-mission-plan': `{"mission_name":string,"estimated_duration_minutes":number,"drone_count":number,"flight_paths":[{"drone_id":string,"aisles":[string],"altitude_band":string,"scan_density":string}],"exceptions_handling":[string],"abort_triggers":[string],"summary":string}`,
  'sku-reconcile': `{"total_skus_scanned":number,"discrepancies":[{"sku":string,"location":string,"scanned_qty":number,"expected_qty":number,"delta":number,"severity":"low"|"medium"|"high"|"critical"}],"shrinkage_estimate_pct":number,"recommended_recounts":[string],"summary":string}`,
  'maintenance-forecast': `{"fleet_health_score":number,"predictions":[{"drone_id":string,"component":string,"failure_window_hours":number,"urgency":"routine"|"urgent"|"critical","action":string}],"fleet_recommendations":[string],"estimated_downtime_avoided_hours":number,"summary":string}`,
  'anomaly-classify': `{"is_anomaly":boolean,"severity":"low"|"medium"|"high"|"critical","category":string,"likely_cause":string,"recommended_action":string,"summary":string}`,
  'route-optimizer': `{"plan":[{"drone_id":string,"sequence":[string],"distance_m":number,"duration_minutes":number}],"total_duration_minutes":number,"coverage_pct":number,"summary":string}`,
  'demand-forecast': `{"forecast":[{"sku":string,"qty_next_period":number,"confidence_interval":[number,number],"trend":"up"|"down"|"flat","driver":string}],"reorder_recommendations":[string],"summary":string}`,
  'swarm-coordinator': `{"swarm_plan":[{"drone_id":string,"role":string,"path_hint":string}],"coordination_strategy":string,"collision_avoidance_rules":[string],"abort_triggers":[string],"summary":string}`,
  'exception-routing': `{"queue":string,"assigned_to":string,"sla_minutes":number,"escalation_path":[string],"automation_attempted":boolean,"summary":string}`,
  'mis-pick-detect': `{"mis_picks":[{"sku":string,"location":string,"expected_sku":string,"observed_sku":string,"confidence":number,"severity":"low"|"medium"|"high"|"critical","reason":string}],"total_mis_picks":number,"hot_aisles":[string],"recommended_actions":[string],"summary":string}`,
  'slot-occupancy-forecast': `{"forecast":[{"slot":string,"current_occupancy_pct":number,"forecast_occupancy_pct":number,"horizon_days":number,"trend":"up"|"down"|"flat","saturation_risk":"low"|"medium"|"high","driver":string}],"hot_slots":[string],"rebalance_recommendations":[string],"summary":string}`,
  'anomaly-narrate': `{"headline":string,"narrative":string,"timeline":[{"time":string,"event":string}],"impact":string,"root_cause_hypothesis":string,"recommended_next_steps":[string],"audience":"ops"|"exec"|"engineering","summary":string}`,
  'scan-failure-rca': `{"root_causes":[{"cause":string,"likelihood":"low"|"medium"|"high","evidence":[string]}],"correlated_signals":[string],"fix_recommendations":[string],"prevention_plan":[string],"estimated_recurrence_pct":number,"summary":string}`,
  'photo-damage-classify': `{"damage_detected":boolean,"damage_type":string,"severity":"none"|"minor"|"moderate"|"severe","confidence":number,"affected_components":[string],"recommended_action":string,"requires_quarantine":boolean,"summary":string}`
};

const SAMPLES = {
  'drone-mission-plan': [
    { label: 'Reno cycle-count', values: {"warehouse":"Reno DC zone B aisles 1-12","sku_priority":"cycle-count","time_window":"23:00-04:00"} },
    { label: 'Memphis high-velocity', values: {"warehouse":"Memphis Hub all zones","sku_priority":"high-velocity","time_window":"02:00-05:00"} },
    { label: 'Newark exception-only', values: {"warehouse":"Newark FC zone C only","sku_priority":"exception-only","time_window":"01:00-03:00"} }
  ],
  'sku-reconcile': [
    { label: 'Reno zone B', values: {"scan_results_text":"SKU-A-001 loc A-1-3 count 142\nSKU-A-002 loc A-1-4 count 0","wms_expected_text":"SKU-A-001 A-1-3 142\nSKU-A-002 A-1-4 50"} },
    { label: 'Memphis HV', values: {"scan_results_text":"SKU-X-100 loc F-12-1 count 880","wms_expected_text":"SKU-X-100 F-12-1 1000"} },
    { label: 'Newark zone C', values: {"scan_results_text":"SKU-C-451 loc C-3-1 count 580","wms_expected_text":"SKU-C-451 C-3-1 440"} }
  ],
  'maintenance-forecast': [
    { label: 'Current fleet', values: {"fleet_state_text":"DR-001 flight_hrs 412 motor_temp 64C battery_cycles 287\nDR-003 flight_hrs 891 motor_temp 78C battery_cycles 642"} },
    { label: 'High battery cycles', values: {"fleet_state_text":"DR-002 flight_hrs 518 battery_cycles 362\nDR-005 flight_hrs 1240 battery_cycles 920"} },
    { label: 'Hot motors', values: {"fleet_state_text":"DR-007 motor_temp 91C\nDR-008 motor_temp 88C\nDR-009 motor_temp 65C"} }
  ],
  'anomaly-classify': [
    { label: 'Sudden delta spike', values: {"observation":"Zone B SKU shrinkage went from 0.4% to 4.1% week over week.","context_hint":"Reno DC"} },
    { label: 'Drone deviation', values: {"observation":"DR-002 reported 3 obstacle-detected events in aisle A-1.","context_hint":"Memphis Hub"} },
    { label: 'WMS mismatch cluster', values: {"observation":"14 SKUs in C aisle show +50% qty vs WMS","context_hint":"Newark FC"} }
  ],
  'route-optimizer': [
    { label: 'Reno 30 SKUs 3 drones', values: {"warehouse":"Reno DC","targets":"30 cycle-count SKUs across zone B","drone_count":3} },
    { label: 'Memphis full pass', values: {"warehouse":"Memphis Hub","targets":"all 8 zones","drone_count":5} },
    { label: 'Newark exception-only', values: {"warehouse":"Newark FC","targets":"18 flagged locations","drone_count":2} }
  ],
  'demand-forecast': [
    { label: 'Trending SKU', values: {"sku_history_text":"SKU-A-001 daily: 140,142,150,155,162,170,180","horizon_days":14} },
    { label: 'Seasonal', values: {"sku_history_text":"SKU-S-091 weekly: 200,220,260,310,380,420","horizon_days":30} },
    { label: 'Flat SKU', values: {"sku_history_text":"SKU-F-220 weekly: 80,82,79,81,80,81","horizon_days":14} }
  ],
  'swarm-coordinator': [
    { label: '5-drone Memphis', values: {"mission_objective":"Cover 8 zones in 90 min.","drones_available":5,"zone":"all Memphis"} },
    { label: '3-drone Reno', values: {"mission_objective":"Cycle-count zone B.","drones_available":3,"zone":"Reno DC zone B"} },
    { label: '2-drone Newark', values: {"mission_objective":"Re-scan 18 locations.","drones_available":2,"zone":"Newark FC zone C"} }
  ],
  'exception-routing': [
    { label: 'Captcha', values: {"exception_summary":"DR-002 stopped on captcha.","urgency":"urgent"} },
    { label: 'Critical mismatch', values: {"exception_summary":"C-3-1 scanned 580, expected 440.","urgency":"critical"} },
    { label: 'Low battery', values: {"exception_summary":"DR-003 at 8%.","urgency":"urgent"} }
  ],
  'mis-pick-detect': [
    { label: 'Aisle A cluster', values: {"scan_results_text":"A-1-3 expected SKU-A-001 observed SKU-A-002 qty 142\nA-1-4 expected SKU-A-002 observed SKU-A-001 qty 50","pick_list_text":"A-1-3 SKU-A-001 142\nA-1-4 SKU-A-002 50"} },
    { label: 'Zone B mixed', values: {"scan_results_text":"B-2-1 expected SKU-B-220 observed SKU-B-221 qty 60","pick_list_text":"B-2-1 SKU-B-220 60"} },
    { label: 'High-velocity row', values: {"scan_results_text":"F-12-1 expected SKU-X-100 observed SKU-X-100 qty 880\nF-12-2 expected SKU-X-101 observed SKU-X-100 qty 12","pick_list_text":"F-12-1 SKU-X-100 880\nF-12-2 SKU-X-101 12"} }
  ],
  'slot-occupancy-forecast': [
    { label: 'Zone B trending', values: {"slot_history_text":"A-1-1 70%\nA-1-2 82%\nA-1-3 91% (climbing 5%/wk)","horizon_days":14} },
    { label: 'Cold storage', values: {"slot_history_text":"CS-3-1 45%\nCS-3-2 48%\nCS-3-3 50%","horizon_days":30} },
    { label: 'High-velocity rack', values: {"slot_history_text":"F-12-1 95%\nF-12-2 96%\nF-12-3 97%","horizon_days":7} }
  ],
  'anomaly-narrate': [
    { label: 'Shrinkage spike', values: {"anomaly_summary":"Zone B SKU shrinkage went 0.4% -> 4.1% in one week","context_hint":"Reno DC zone B","audience":"exec"} },
    { label: 'Drone deviation', values: {"anomaly_summary":"DR-002 hit 3 obstacle-detected events in aisle A-1","context_hint":"Memphis Hub","audience":"engineering"} },
    { label: 'WMS mismatch cluster', values: {"anomaly_summary":"14 SKUs in C aisle show +50% qty vs WMS","context_hint":"Newark FC","audience":"ops"} }
  ],
  'scan-failure-rca': [
    { label: 'Repeated scan errors', values: {"failure_summary":"DR-003 failed 22 of 80 scans in aisle B-2","telemetry_snippet":"battery_pct dropped 92 -> 41 in 18 min, motor_temp 78C","maintenance_snippet":"Last battery swap 412 hrs ago"} },
    { label: 'WMS gap', values: {"failure_summary":"Aisle C scans rejected by WMS as unknown SKUs","telemetry_snippet":"Drone OK, no errors","maintenance_snippet":"Drone serviced last week"} },
    { label: 'Optics dirty', values: {"failure_summary":"30% scan success in zone D","telemetry_snippet":"Camera contrast dropped 40%","maintenance_snippet":"Optics not cleaned in 60 days"} }
  ],
  'photo-damage-classify': [
    { label: 'Crushed corner', values: {"photo_description":"Pallet corner crushed, plastic wrap torn, contents leaning.","sku":"SKU-A-001","location":"A-1-3"} },
    { label: 'Wet damage', values: {"photo_description":"Cardboard discolored on lower third, possible water exposure.","sku":"SKU-B-220","location":"B-2-1"} },
    { label: 'Clean', values: {"photo_description":"Pallet appears intact, wrap clean, labels readable.","sku":"SKU-C-451","location":"C-3-1"} }
  ]
};

async function record(feature, input, output) {
  try {
    await pool.query('INSERT INTO ai_results (feature, input, output) VALUES ($1, $2, $3)',
      [feature, input || {}, output || {}]);
  } catch (e) { console.warn('[ai] record failed:', e.message); }
}

router.get('/samples', (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    if (!feature) return res.json({ features: Object.keys(SAMPLES) });
    const samples = SAMPLES[feature];
    if (!samples) return res.status(404).json({ error: `unknown feature: ${feature}` });
    res.json({ feature, samples });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/history', async (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    const r = feature
      ? await pool.query('SELECT id, feature, input, output, created_at FROM ai_results WHERE feature=$1 ORDER BY created_at DESC LIMIT $2', [feature, limit])
      : await pool.query('SELECT id, feature, input, output, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/drone-mission-plan', async (req, res) => {
  try {
    const result = await ai.runFeature('drone-mission-plan', SCHEMAS['drone-mission-plan'], req.body || {});
    await record('drone-mission-plan', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sku-reconcile', async (req, res) => {
  try {
    const result = await ai.runFeature('sku-reconcile', SCHEMAS['sku-reconcile'], req.body || {});
    await record('sku-reconcile', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/maintenance-forecast', async (req, res) => {
  try {
    const result = await ai.runFeature('maintenance-forecast', SCHEMAS['maintenance-forecast'], req.body || {});
    await record('maintenance-forecast', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/anomaly-classify', async (req, res) => {
  try {
    const result = await ai.runFeature('anomaly-classify', SCHEMAS['anomaly-classify'], req.body || {});
    await record('anomaly-classify', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/route-optimizer', async (req, res) => {
  try {
    const result = await ai.runFeature('route-optimizer', SCHEMAS['route-optimizer'], req.body || {});
    await record('route-optimizer', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/demand-forecast', async (req, res) => {
  try {
    const result = await ai.runFeature('demand-forecast', SCHEMAS['demand-forecast'], req.body || {});
    await record('demand-forecast', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/swarm-coordinator', async (req, res) => {
  try {
    const result = await ai.runFeature('swarm-coordinator', SCHEMAS['swarm-coordinator'], req.body || {});
    await record('swarm-coordinator', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/exception-routing', async (req, res) => {
  try {
    const result = await ai.runFeature('exception-routing', SCHEMAS['exception-routing'], req.body || {});
    await record('exception-routing', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mis-pick-detect', async (req, res) => {
  try {
    const result = await ai.runFeature('mis-pick-detect', SCHEMAS['mis-pick-detect'], req.body || {});
    await record('mis-pick-detect', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/slot-occupancy-forecast', async (req, res) => {
  try {
    const result = await ai.runFeature('slot-occupancy-forecast', SCHEMAS['slot-occupancy-forecast'], req.body || {});
    await record('slot-occupancy-forecast', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/anomaly-narrate', async (req, res) => {
  try {
    const result = await ai.runFeature('anomaly-narrate', SCHEMAS['anomaly-narrate'], req.body || {});
    await record('anomaly-narrate', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/scan-failure-rca', async (req, res) => {
  try {
    const result = await ai.runFeature('scan-failure-rca', SCHEMAS['scan-failure-rca'], req.body || {});
    await record('scan-failure-rca', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/photo-damage-classify', async (req, res) => {
  try {
    const result = await ai.runFeature('photo-damage-classify', SCHEMAS['photo-damage-classify'], req.body || {});
    await record('photo-damage-classify', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
