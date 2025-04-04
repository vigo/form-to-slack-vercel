import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_SECRET
});

const VERSION = '0.0.3';
const CACHE_EXPIRE = 3 * 60;
const MAX_AGE = CACHE_EXPIRE * 1000;

const ALLOWED_ORIGINS = [
    'https://bilusteknoloji.com',
    'http://localhost:3000',
    'http://localhost:4567',
    'http://localhost:9001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4567',
    'http://127.0.0.1:9001',
];

function log(...args) {
    if (process.env.VERCEL_ENV === 'development') {
        console.log('[log]', ...args);
    }
}


async function validateToken(token) {
    if (!token) return false;

    const nowGuess = Date.now().toString(36);
    const tsLen = nowGuess.length;

    const tsPart = token.substring(0, tsLen);
    const ts = parseInt(tsPart, 36);

    if (isNaN(ts)) return false;

    const age = Date.now() - ts;
    log('age', age, 'MAX_AGE', MAX_AGE);
    if (age < 0 || age > MAX_AGE) return false;

    const wasUsed = await redis.get(`csrf:${token}`);
    log('wasUsed', wasUsed);
    
    if (wasUsed) return false;
    await redis.set(`csrf:${token}`, '1', { ex: CACHE_EXPIRE });
    
    return true
}

export default async function handler(req, res) {
    const csrf_token = req.body.csrf_token || '';
    
    if (!csrf_token) {
        return res.status(400).json({ error: 'Missing CSRF token' });
    }
    
    if (!await validateToken(csrf_token)) {
        return res.status(403).json({ error: 'CSRF Token expired' });
    }
    
    const origin = req.headers.origin;

    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    } else {
        return res.status(403).json({ error: 'Forbidden' });
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { text, website } = req.body;
    
    if (website) {
        return res.status(400).json({ error: 'Spam detected' });
    }

    if (!text) return res.status(400).json({ error: 'Missing text' });
    
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const message = `${text}IP:\`\`\`${ip}\`\`\`\nVersion:\`\`\`${VERSION}\`\`\``;

    if (process.env.VERCEL_ENV == 'development') {
        log('debug mode, will not post to slack');
        log('ip', ip);
        log('message', message);
        log('csrf_token', csrf_token);

        return res.status(200).json({ success: true });
    }

    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
    });

    if (!response.ok) {
        return res.status(500).json({ error: 'Slack webhook failed' });
    }

    return res.status(200).json({ success: true });
}
