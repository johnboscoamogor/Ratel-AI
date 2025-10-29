import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';
import { taskTools } from '../../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY is not configured on the server.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- HANDLER FOR STREAMING CHAT ---
async function handleChat(req: VercelRequest, res: VercelResponse) {
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
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of resultStream) {
        res.write(JSON.stringify(chunk) + '\n');
    }
    res.end();
}

// --- HANDLER FOR SIMPLE TEXT GENERATION ---
async function handleGenerateText(req: VercelRequest, res: VercelResponse) {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required." });
    
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt
    });
    res.status(200).json({ text: response.text });
}

// --- HANDLER FOR IMAGE GENERATION ---
async function handleGenerateImage(req: VercelRequest, res: VercelResponse) {
    const { prompt, aspectRatio } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required." });

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: aspectRatio as any }
    });
    const base64Image = response.generatedImages[0].image.imageBytes;
    res.status(200).json({ base64Image });
}

// --- HANDLER FOR IMAGE EDITING ---
async function handleEditImage(req: VercelRequest, res: VercelResponse) {
    const { image, prompt } = req.body;
    if (!image || !prompt) return res.status(400).json({ error: "Image and prompt are required." });

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
}

// --- HANDLER FOR FINDING WORKERS (FUNCTION CALL) ---
async function handleFindWorkers(req: VercelRequest, res: VercelResponse) {
    const { searchTerm } = req.body;
    if (!searchTerm) return res.status(400).json({ error: "searchTerm is required." });

    const chat = ai.chats.create({ 
        model: 'gemini-flash-lite-latest', 
        config: { tools: taskTools }
    });
    const result = await chat.sendMessage({ message: searchTerm });
    const fc = result.functionCalls?.[0];

    if (fc && fc.name === 'findWorkers') {
        return res.status(200).json({ args: fc.args });
    } else {
        return res.status(200).json({ args: null });
    }
}

// --- MAIN ROUTER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action } = req.body;
        switch (action) {
            case 'chat':
                return await handleChat(req, res);
            case 'generate_text':
                return await handleGenerateText(req, res);
            case 'generate_image':
                return await handleGenerateImage(req, res);
            case 'edit_image':
                return await handleEditImage(req, res);
            case 'find_workers':
                return await handleFindWorkers(req, res);
            default:
                return res.status(400).json({ error: 'Invalid action specified.' });
        }
    } catch (error: any) {
        console.error(`Error in Gemini API proxy (action: ${req.body.action}):`, error);
        if (!res.writableEnded) {
            res.status(500).json({ error: error.message });
        }
    }
}
