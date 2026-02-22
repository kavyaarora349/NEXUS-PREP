import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

console.log('Key:', process.env.GEMINI_API_KEY ? 'SET (' + process.env.GEMINI_API_KEY.slice(-6) + ')' : 'MISSING');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];
for (const m of models) {
    try {
        const r = await ai.models.generateContent({ model: m, contents: 'Say: {"ok":true}' });
        console.log(`OK: ${m} -> ${r.text?.substring(0, 40)}`);
        break;
    } catch (e) {
        const msg = e.message || '';
        console.log(`FAIL: ${m} -> ${msg.substring(0, 80)}`);
    }
}
process.exit(0);
