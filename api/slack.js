const VERSION = '0.0.1';

const ALLOWED_ORIGINS = [
    'https://bilusteknoloji.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4567',
    'http://127.0.0.1:4567'
];

export default async function handler(req, res) {
    const origin = req.headers.origin;

    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    } else {
        return res.status(403).json({ error: 'Forbidden' });
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });
    
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const message = `${text}IP:\`\`\`${ip}\`\`\`\nVersion:\`\`\`${VERSION}\`\`\``;
    
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
