import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!API_KEY) {
        return res.status(500).json({ error: "API_KEY is not configured on the server." });
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        res.status(200).json({ text: response.text });
        
    } catch (error: any) {
        console.error('Error in generate-text proxy:', error);
        res.status(500).json({ error: error.message });
    }
}
