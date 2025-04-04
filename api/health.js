import { VERSION, BUILD } from '../lib/version.js';

export default function handler(req, res) {
    return res.status(200).json({
        version: VERSION,
        build: BUILD
    });
}
