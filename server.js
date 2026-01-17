import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Proxy for FAOSTAT
app.get('/api/agri/india', async (req, res) => {
    try {
        const baseUrl = 'https://fenixservices.fao.org/faostat/api/v1/en/data/QCL/356';
        const filters = 'element=5419,5510&item=15,27&year=2022,2021,2020';
        const targetUrl = `${baseUrl}?${filters}`;

        console.log(`[FAOSTAT Proxy] Fetching: ${targetUrl}`);

        const response = await axios.get(targetUrl, {
            timeout: 45000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'UrbanNexus-Dashboard/1.5'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error(`[FAOSTAT Proxy] Fail: ${error.message}`);
        res.status(500).json({
            error: 'Failed to fetch data from FAOSTAT',
            details: error.message,
            hint: 'This API is often slow; try refreshing.'
        });
    }
});

// Proxy for WHO Health Data
app.get('/api/health/who/:indicator', async (req, res) => {
    try {
        const { indicator } = req.params;
        const baseUrl = `https://ghoapi.azureedge.net/api/${indicator}`;

        // We use req.originalUrl to get the exact raw query string sent by the browser
        // This prevents Express from messing with encoding during parsing.
        const fullUrl = req.originalUrl || '';
        const queryIdx = fullUrl.indexOf('?');
        const rawQuery = queryIdx !== -1 ? fullUrl.substring(queryIdx + 1) : '';

        // Azure OData services (like WHO) fail on '+' but succeed on '%20'
        const normalizedQuery = rawQuery.replace(/\+/g, '%20');
        const targetUrl = `${baseUrl}${normalizedQuery ? '?' + normalizedQuery : ''}`;

        console.log(`[WHO Proxy] → ${targetUrl}`);

        const response = await axios.get(targetUrl, {
            timeout: 30000, // 30s timeout for slow Azure instances
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'UrbanNexus-Dashboard/1.5'
            }
        });
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const data = error.response?.data || error.message;
        console.error(`[WHO Proxy] Fail ${status}:`, typeof data === 'string' ? data.substring(0, 200) : 'Check logs');
        res.status(status).json({
            error: 'WHO API Proxy Error',
            upstreamStatus: status,
            details: data
        });
    }
});

// Proxy for TomTom Traffic (using key from env)
app.get('/api/traffic/flow', async (req, res) => {
    try {
        const { point, unit } = req.query;
        const key = process.env.VITE_TOMTOM_KEY;
        const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json`;

        const response = await axios.get(url, {
            params: {
                key,
                point,
                unit: unit || 'KMPH'
            },
            timeout: 5000
        });
        res.json(response.data);
    } catch (error) {
        console.error('TomTom Proxy Error:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Traffic service unavailable' });
    }
});

// Proxy for TomTom Traffic Incidents
app.get('/api/traffic/incidents', async (req, res) => {
    try {
        const { bbox } = req.query; // bbox format: minLon,minLat,maxLon,maxLat
        const key = process.env.VITE_TOMTOM_KEY;
        const url = `https://api.tomtom.com/traffic/services/4/incidentDetails/s3/${bbox}/10/-1/json`;

        console.log(`[TomTom Incidents] Fetching for BBox: ${bbox}`);

        const response = await axios.get(url, {
            params: { key },
            timeout: 10000
        });
        res.json(response.data);
    } catch (error) {
        console.error('TomTom Incidents Error:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Incidents service unavailable' });
    }
});
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: 'UrbanNexus Proxy Server Running' });
});

app.listen(PORT, () => {
    console.log(`UrbanNexus Proxy Server listening on port ${PORT}`);
});
