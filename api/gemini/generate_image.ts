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
        const { prompt, aspectRatio } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: aspectRatio as any }
        });
        
        const base64Image = response.generatedImages[0].image.imageBytes;

        res.status(200).json({ base64Image });
        
    } catch (error: any) {
        console.error('Error in generate-image proxy:', error);
        res.status(500).json({ error: error.message });
    }
}