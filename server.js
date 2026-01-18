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
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(express.json());

// Catch-all logger to debug 404s
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

// Helper for debugging API keys
const checkKeys = () => {
    const keys = {
        TOMTOM: !!process.env.VITE_TOMTOM_KEY,
        OPENWEATHER: !!process.env.VITE_OPENWEATHER_KEY,
        RAPIDAPI: !!process.env.VITE_RAPIDAPI_KEY
    };
    console.log('[Status] API Keys Status:', keys);
    return keys;
};

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
        res.status(200).json({
            isError: true,
            error: 'FAOSTAT currently unavailable',
            fallback: true,
            data: []
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
        console.error(`[WHO Proxy] Upstream Error ${status}:`, error.message);
        // Return 200 with an error flag so the frontend can use its fallback
        res.status(200).json({
            isError: true,
            error: 'WHO API unavailable',
            fallback: true,
            value: []
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
// Proxy for TomTom Search/Geocoding
app.get('/api/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const key = process.env.VITE_TOMTOM_KEY;
        const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query)}.json`;

        console.log(`[TomTom Search] Proxying: ${query}`);

        const response = await axios.get(url, {
            params: {
                key,
                limit: 5,
                typeahead: true
            },
            timeout: 5000
        });
        res.json(response.data);
    } catch (error) {
        console.error('TomTom Search Error:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Search service unavailable' });
    }
});

// Proxy for OpenWeatherMap Current
app.get('/api/weather/current', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const key = process.env.VITE_OPENWEATHER_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather`;

        const response = await axios.get(url, {
            params: { lat, lon, appid: key, units: 'metric' },
            timeout: 10000
        });
        res.json(response.data);
    } catch (error) {
        console.error('Weather Proxy Error:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Weather service unavailable' });
    }
});

// Proxy for OpenWeatherMap Forecast
app.get('/api/weather/forecast', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const key = process.env.VITE_OPENWEATHER_KEY;
        const url = `https://api.openweathermap.org/data/2.5/forecast`;

        const response = await axios.get(url, {
            params: { lat, lon, appid: key, units: 'metric' },
            timeout: 10000
        });
        res.json(response.data);
    } catch (error) {
        console.error('Forecast Proxy Error:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Forecast service unavailable' });
    }
});

// Proxy for OpenWeatherMap Pollution
app.get('/api/weather/pollution', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const key = process.env.VITE_OPENWEATHER_KEY;
        const url = `https://api.openweathermap.org/data/2.5/air_pollution`;

        const response = await axios.get(url, {
            params: { lat, lon, appid: key },
            timeout: 10000
        });

        // Basic validation of response structure
        if (!response.data || !response.data.list) {
            console.error('[OpenWeather Proxy] Invalid response structure:', response.data);
            return res.status(502).json({ error: 'Upstream returned invalid data' });
        }

        res.json(response.data);
    } catch (error) {
        console.error('Pollution Proxy Error:', error.message);
        if (error.response?.data) {
            console.error('Upstream Detail:', JSON.stringify(error.response.data));
        }
        res.status(error.response?.status || 500).json({
            error: 'Pollution service unavailable',
            details: error.response?.data?.message || error.message
        });
    }
});

// Proxy for OpenWeatherMap Pollution History
app.get('/api/weather/pollution/history', async (req, res) => {
    try {
        const { lat, lon, start, end } = req.query;
        const key = process.env.VITE_OPENWEATHER_KEY;
        const url = `https://api.openweathermap.org/data/2.5/air_pollution/history`;

        const response = await axios.get(url, {
            params: { lat, lon, start, end, appid: key },
            timeout: 10000
        });
        res.json(response.data);
    } catch (error) {
        console.error('Pollution History Proxy Error:', error.message);
        res.status(error.response?.status || 500).json({ error: 'History service unavailable' });
    }
});

// Proxy for Meteostat Daily History
app.get('/api/history/daily', async (req, res) => {
    try {
        const { lat, lon, start, end } = req.query;
        const key = process.env.VITE_RAPIDAPI_KEY;
        const url = `https://meteostat.p.rapidapi.com/point/daily`;

        console.log(`[Meteostat Proxy] → ${lat}, ${lon} [${start} to ${end}]`);

        const response = await axios.get(url, {
            params: { lat, lon, start, end },
            headers: {
                'x-rapidapi-key': key,
                'x-rapidapi-host': 'meteostat.p.rapidapi.com'
            },
            timeout: 10000
        });
        res.json(response.data);
    } catch (error) {
        console.error('Meteostat Proxy Error:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Meteostat service unavailable' });
    }
});

// Proxy for OpenRouter AI
app.post(['/api/ai/openrouter', '/ai/openrouter', '/api/openrouter', '/ai/ai/openrouter'], async (req, res) => {
    try {
        const { prompt } = req.body;
        const key = process.env.VITE_OPENROUTER_API_KEY;
        const url = 'https://openrouter.ai/api/v1/chat/completions';

        console.log(`[OpenRouter Proxy] Incoming request for prompt length: ${prompt?.length}`);

        // Try multiple free reliable models
        const models = [
            "google/gemini-2.0-flash-exp:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "mistralai/mistral-7b-instruct:free"
        ];

        let lastError = null;
        for (const model of models) {
            try {
                console.log(`[OpenRouter Proxy] Attempting model: ${model}`);
                const response = await axios.post(url, {
                    model: model,
                    messages: [
                        { role: "system", content: "You are a specialized urban infrastructure and environmental analysis assistant. Always output valid JSON." },
                        { role: "user", content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`,
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'UrbanNexus Intelligence'
                    },
                    timeout: 25000
                });

                const content = response.data.choices[0].message.content;
                return res.json({
                    candidates: [{
                        content: {
                            parts: [{ text: content }]
                        }
                    }]
                });
            } catch (err) {
                lastError = err;
                console.warn(`[OpenRouter] ${model} failed:`, err.response?.data?.error?.message || err.message);
                if (err.response?.status === 401 || err.response?.status === 403) break; // Don't retry on auth errors
            }
        }

        throw lastError;
    } catch (error) {
        console.error('OpenRouter Proxy Final Failure:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'OpenRouter AI Error',
            details: error.response?.data || error.message
        });
    }
});

// Proxy for DeepSeek AI
app.post(['/api/ai/deepseek', '/ai/deepseek', '/api/deepseek', '/ai/ai/deepseek'], async (req, res) => {
    try {
        const { prompt } = req.body;
        const key = process.env.VITE_DEEPSEEK_API_KEY;
        const url = 'https://api.deepseek.com/chat/completions';

        console.log(`[DeepSeek Proxy] Processing AI request...`);

        const response = await axios.post(url, {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "You are a specialized urban infrastructure and environmental analysis assistant. Always output valid JSON." },
                { role: "user", content: prompt }
            ],
            stream: false,
            response_format: { type: 'json_object' }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            timeout: 30000
        });

        // Map DeepSeek response format to match what our frontend expects (Gemini-like or raw JSON)
        const content = response.data.choices[0].message.content;

        // We return it in a way that matches our expected frontend parsing
        res.json({
            candidates: [{
                content: {
                    parts: [{ text: content }]
                }
            }]
        });
    } catch (error) {
        if (error.response?.status === 402) {
            console.error('[DeepSeek] Payment Required. Please check your balance.');
            return res.status(402).json({
                error: 'AI Credits Exhausted',
                details: 'DeepSeek balance is 0. Please top up your account or switch to Gemini.'
            });
        }
        console.error('DeepSeek Proxy Error:', error.message);
        if (error.response) {
            console.error('Details:', JSON.stringify(error.response.data));
        }
        res.status(error.response?.status || 500).json({
            error: 'DeepSeek AI Error',
            details: error.response?.data || error.message
        });
    }
});

// Proxy for Gemini AI
app.post(['/api/ai-analyze', '/api/ai/analyze', '/ai-analyze', '/ai/analyze'], async (req, res) => {
    console.log(`[Gemini Proxy] Incoming request hit...`);
    res.setHeader('X-Proxy-Source', 'UrbanNexus-AI-Proxy');
    const { prompt } = req.body;
    const key = process.env.VITE_GEMINI_API_KEY || "AIzaSyCZFj4Oop-o54XloVaqJLxYguKjUNCt9mM";

    // List of models to try in order of preference
    const modelsToTry = [
        { name: 'gemini-1.5-flash', version: 'v1beta' },
        { name: 'gemini-1.5-flash-latest', version: 'v1beta' },
        { name: 'gemini-pro', version: 'v1' },
        { name: 'gemini-1.0-pro', version: 'v1' }
    ];

    let lastError = null;

    for (const m of modelsToTry) {
        try {
            const url = `https://generativelanguage.googleapis.com/${m.version}/models/${m.name}:generateContent?key=${key}`;
            console.log(`[Gemini Proxy] Attempting ${m.name} (${m.version})...`);

            const response = await axios.post(url, {
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

            console.log(`[Gemini Proxy] ${m.name} Success!`);
            return res.json(response.data);
        } catch (error) {
            lastError = error;
            const status = error.response?.status;
            const msg = error.response?.data?.error?.message || error.message;
            console.warn(`[Gemini Proxy] ${m.name} failed (${status}): ${msg}`);

            // If it's a 403 (Permission) or 400 (Bad Request), don't keep trying the same key
            if (status === 403 || status === 400) break;
        }
    }

    // If all fail
    console.error('Gemini Proxy: All models failed.');
    res.status(lastError?.response?.status || 500).json({
        error: 'AI Analysis Error',
        details: lastError?.response?.data || lastError?.message
    });
});

// Generic Fetch Proxy
app.get('/api/fetch', async (req, res) => {
    try {
        const { url, timeout, headers, params } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required.' });
        }

        console.log(`[Generic Fetch Proxy] Fetching: ${url}`);

        const config = {
            timeout: parseInt(timeout) || 15000, // Default 15 seconds
            headers: headers ? JSON.parse(headers) : {},
            params: params ? JSON.parse(params) : {}
        };

        const response = await axios.get(url, config);
        res.json(response.data);
    } catch (error) {
        console.error('Generic Fetch Proxy Error:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch data via generic proxy',
            details: error.message,
            upstreamStatus: error.response?.status,
            upstreamData: error.response?.data
        });
    }
});

app.get('/api/status', (req, res) => {
    const keys = checkKeys();
    res.json({
        status: 'ok',
        message: 'UrbanNexus Proxy Server Running',
        keys
    });
});

// Final Catch-all for 404s - MUST be last
app.use((req, res) => {
    console.warn(`[404] Route Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Endpoint not found', path: req.url });
});

app.listen(PORT, () => {
    console.log(`UrbanNexus Proxy Server listening on port ${PORT}`);
    console.log(`- TomTom Key: ${process.env.VITE_TOMTOM_KEY ? 'Loaded' : 'MISSING'}`);
    console.log(`- OpenWeather Key: ${process.env.VITE_OPENWEATHER_KEY ? 'Loaded' : 'MISSING'}`);
    console.log(`- OpenRouter Key: ${process.env.VITE_OPENROUTER_API_KEY ? 'Loaded' : 'MISSING'}`);
});
