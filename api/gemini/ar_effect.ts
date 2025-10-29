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
        const { frame, prompt } = req.body;
        if (!frame || !prompt) {
            return res.status(400).json({ error: "Frame and prompt are required." });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
                parts: [ 
                    { inlineData: { data: frame.data, mimeType: frame.mimeType } }, 
                    { text: prompt } 
                ] 
            },
            // FIX: Corrected the config to only request an image modality, which is what this model is designed for.
            config: { 
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const blockReason = response.promptFeedback?.blockReason;
        if (blockReason) {
            throw new Error(`Request blocked due to ${blockReason}. Please modify your prompt.`);
        }

        const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

        if (imagePart?.inlineData) {
            res.status(200).json({ data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType });
        } else {
             const textPart = response.candidates?.[0]?.content?.parts.find(p => p.text);
             if (textPart && textPart.text) {
                throw new Error(`AI response: ${textPart.text}`);
             }
            throw new Error("The AI did not return an image. Please try rephrasing your prompt.");
        }
        
    } catch (error: any) {
        console.error('Error in ar-effect proxy:', error);
        res.status(500).json({ error: error.message });
    }
}