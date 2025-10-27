import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { taskTools } from '../../constants';

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
        const { history, message, image, systemInstruction } = req.body;

        const userParts = [];
        if (message) userParts.push({ text: message });
        if (image) userParts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });

        const contents = [...(history || []), { role: 'user', parts: userParts }];

        const resultStream = await ai.models.generateContentStream({
            model: 'gemini-flash-lite-latest',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                tools: taskTools,
            },
        });
        
        // Set headers for streaming
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of resultStream) {
            // Each chunk is a GenerateContentResponse, we stringify it and send it
            // with a newline delimiter.
            res.write(JSON.stringify(chunk) + '\n');
        }

        res.end(); // End the stream

    } catch (error: any) {
        console.error('Error in chat stream proxy:', error);
        // If stream hasn't started, send a 500. If it has, just end it.
        if (!res.writableEnded) {
            res.status(500).json({ error: error.message });
        }
    }
}