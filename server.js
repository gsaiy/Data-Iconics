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

        const response = await axios.get(targetUrl, { timeout: 30000 });
        res.json(response.data);
    } catch (error) {
        console.error('FAOSTAT Proxy Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from FAOSTAT', details: error.message });
    }
});

// Proxy for WHO Health Data
app.get('/api/health/who/:indicator', async (req, res) => {
    const { indicator } = req.params;
    const baseUrl = `https://ghoapi.azureedge.net/api/${indicator}`;

    try {
        // Build the target URL manually to ensure %20 is used for spaces
        // OData on Azure is highly sensitive to space encoding (+)
        const queryParams = Object.entries(req.query)
            .map(([key, value]) => `${key}=${String(value).replace(/ /g, '%20')}`)
            .join('&');

        const targetUrl = `${baseUrl}${queryParams ? '?' + queryParams : ''}`;
        console.log(`[WHO Proxy] → ${targetUrl}`);

        const response = await axios.get(targetUrl, {
            timeout: 20000,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'UrbanNexus-Dashboard/1.2'
            }
        });
        res.json(response.data);
    } catch (error) {
        const errorStatus = error.response?.status || 500;
        const errorData = error.response?.data || error.message;
        console.error(`[WHO Proxy] Error ${errorStatus} for ${indicator}:`, errorData);
        res.status(errorStatus).json({
            error: 'WHO API Proxy Error',
            details: errorData
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

// Health check
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: 'UrbanNexus Proxy Server Running' });
});

app.listen(PORT, () => {
    console.log(`UrbanNexus Proxy Server listening on port ${PORT}`);
});
