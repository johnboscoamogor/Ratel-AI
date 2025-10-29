import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

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
        const { image, prompt } = req.body;
        if (!image || !prompt) {
            return res.status(400).json({ error: "Image and prompt are required." });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [ { inlineData: { data: image.data, mimeType: image.mimeType } }, { text: prompt } ] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

        if (imagePart?.inlineData) {
            res.status(200).json({ data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType });
        } else {
            throw new Error("The AI did not return an edited image.");
        }
        
    } catch (error: any) {
        console.error('Error in edit-image proxy:', error);
        res.status(500).json({ error: error.message });
    }
}