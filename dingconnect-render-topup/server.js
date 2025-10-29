// server.js - Backend Node/Express minimal pour DingConnect TopUp
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const cache = new NodeCache({ stdTTL: 300 }); // cache 5 min

const DING_API_BASE = process.env.DING_API_BASE || 'https://api.dingconnect.com';
const CLIENT_ID = process.env.DING_CLIENT_ID;
const CLIENT_SECRET = process.env.DING_CLIENT_SECRET;
const API_KEY = process.env.DING_API_KEY || null;

if (!CLIENT_ID && !API_KEY) {
  console.warn('⚠️ Warning: Neither DING_CLIENT_ID nor DING_API_KEY is set. Configure env variables.');
}

// Helper: get OAuth token (client_credentials)
async function getOauthToken() {
  if (API_KEY) return null; // if using API key, no token
  const cacheKey = 'ding_oauth_token';
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  try {
    const tokenUrl = 'https://idp.ding.com/connect/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);

    const res = await axios.post(tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const token = res.data.access_token;
    const expiresIn = res.data.expires_in || 3600;
    cache.set(cacheKey, token, expiresIn - 60);
    return token;
  } catch (err) {
    console.error('Error fetching OAuth token:', err.response ? err.response.data : err.message);
    throw err;
  }
}

// Helper: build headers for Ding requests
async function dingHeaders() {
  const headers = { 'Accept': 'application/json' };
  if (API_KEY) headers['api_key'] = API_KEY;
  else {
    const token = await getOauthToken();
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// GET /api/providers
app.get('/api/providers', async (req, res) => {
  try {
    const cacheKey = 'providers_list';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const headers = await dingHeaders();
    const r = await axios.get(`${DING_API_BASE}/v1/providers`, { headers });
    cache.set(cacheKey, r.data, 600);
    res.json(r.data);
  } catch (err) {
    console.error('providers error', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Failed to fetch providers', details: err.response ? err.response.data : err.message });
  }
});

// GET /api/products?country=BR
app.get('/api/products', async (req, res) => {
  try {
    const country = req.query.country || 'BR';
    const cacheKey = `products_${country}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const headers = await dingHeaders();
    const r = await axios.get(`${DING_API_BASE}/v1/products?country=${country}`, { headers });
    cache.set(cacheKey, r.data, 600);
    res.json(r.data);
  } catch (err) {
    console.error('products error', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Failed to fetch products', details: err.response ? err.response.data : err.message });
  }
});

// POST /api/estimate
app.post('/api/estimate', async (req, res) => {
  try {
    // body: { productSku, accountNumber }
    const body = req.body;
    const headers = await dingHeaders();
    const r = await axios.post(`${DING_API_BASE}/v1/prices/estimate`, body, { headers });
    res.json(r.data);
  } catch (err) {
    console.error('estimate error', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Failed to estimate price', details: err.response ? err.response.data : err.message });
  }
});

// POST /api/recharge
app.post('/api/recharge', async (req, res) => {
  try {
    /* Ex: body = {
      productSku: 'DING-GB-5',
      accountNumber: '5511999887766',
      senderNote: 'Order #123',
      reference: 'yourReference'
    }
    */
    const body = req.body;
    const headers = await dingHeaders();

    // If you want deferred (webhook) behavior, set X-Options header: DeferTransfer
    const options = {};
    if (body.defer) options['X-Options'] = 'DeferTransfer';
    const finalHeaders = { ...headers, ...options };

    const r = await axios.post(`${DING_API_BASE}/v1/transfers/send`, body, { headers: finalHeaders });
    // store transaction in DB in production (omitted here for brevity)
    res.json(r.data);
  } catch (err) {
    console.error('recharge error', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Failed to send transfer', details: err.response ? err.response.data : err.message });
  }
});

// Webhook endpoint for Ding (deferred transfers)
app.post('/webhook/ding', async (req, res) => {
  // IMPORTANT: in production, verify signature and replay protection!
  console.log('Webhook received:', req.headers);
  console.log('Payload:', req.body);
  // validate signature here (RS256) using Ding's JWKS -> omitted for brevity
  // update transaction status in DB
  res.status(200).send('OK');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
