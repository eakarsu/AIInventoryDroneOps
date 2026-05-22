// Live WMS connector. Returns 503 until credentials are configured.
// Supported adapters: SAP EWM, Manhattan Active WM, Blue Yonder WMS.
const express = require('express');

const router = express.Router();

function credsConfigured() {
  return Boolean(
    process.env.WMS_ADAPTER &&
    process.env.WMS_BASE_URL &&
    process.env.WMS_API_KEY
  );
}

function stubResponse(res, action) {
  return res.status(503).json({
    error: 'WMS live connector not configured',
    status: 'unconfigured',
    action,
    required_env: ['WMS_ADAPTER', 'WMS_BASE_URL', 'WMS_API_KEY'],
    supported_adapters: ['sap-ewm', 'manhattan', 'blue-yonder'],
    docs: 'Set adapter, base URL, and API key in .env to enable live sync.',
  });
}

router.get('/status', (req, res) => {
  if (credsConfigured()) {
    return res.json({
      status: 'configured',
      adapter: process.env.WMS_ADAPTER,
      base_url: process.env.WMS_BASE_URL,
    });
  }
  return res.status(503).json({
    status: 'unconfigured',
    required_env: ['WMS_ADAPTER', 'WMS_BASE_URL', 'WMS_API_KEY'],
  });
});

router.post('/pull', (req, res) => stubResponse(res, 'pull'));
router.post('/push', (req, res) => stubResponse(res, 'push'));
router.post('/sync', (req, res) => stubResponse(res, 'sync'));
router.post('/webhook-sync', (req, res) => stubResponse(res, 'webhook-sync'));

module.exports = router;
