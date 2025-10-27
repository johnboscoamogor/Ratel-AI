import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { taskTools } from '../../constants'; // Adjust path as needed

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
        const { searchTerm } = req.body;
        if (!searchTerm) {
            return res.status(400).json({ error: "searchTerm is required." });
        }
        
        const chat = ai.chats.create({ 
            model: 'gemini-flash-lite-latest', 
            config: { tools: taskTools }
        });

        const result = await chat.sendMessage({ message: searchTerm });

        const fc = result.functionCalls?.[0];

        if (fc && fc.name === 'findWorkers') {
            return res.status(200).json({ args: fc.args });
        } else {
            // If the model didn't call the function, return null
            return res.status(200).json({ args: null });
        }
        
    } catch (error: any) {
        console.error('Error in find-workers proxy:', error);
        res.status(500).json({ error: error.message });
    }
}