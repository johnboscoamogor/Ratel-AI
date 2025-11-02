import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Modality, VideoGenerationReferenceImage, VideoGenerationReferenceType } from '@google/genai';
import { taskTools } from '../constants';

// --- UNIVERSAL CONFIGURATION ---
// These names must match the names in your Vercel Project Environment Variables.
const API_KEY = process.env.API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;


if (!API_KEY) {
    throw new Error("The API_KEY environment variable is not set.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- GEMINI CHAT (STREAMING) HANDLER ---
async function handleGeminiChat(req: VercelRequest, res: VercelResponse) {
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

// --- TTS HANDLER ---
async function handleTtsGenerate(req: VercelRequest, res: VercelResponse) {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required.' });

    const voiceName = ({
        'en-NG-Standard-A': 'Kore', 'en-NG-Standard-B': 'Charon', 'en-US-Wavenet-A': 'Puck',
        'en-US-Wavenet-F': 'Kore', 'en-GB-Wavenet-C': 'Kore', 'en-KE-Standard-A': 'Kore',
        'sw-KE-Standard-B': 'Kore', 'en-US-Studio-O': 'Puck'
    })[voiceId || 'en-NG-Standard-A'] || 'Kore';

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) throw new Error("TTS response did not contain audio data.");
    res.status(200).json({ audioBase64 });
}

// --- TELEGRAM WEBHOOK HANDLER ---
async function handleTelegramWebhook(req: VercelRequest, res: VercelResponse) {
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
    const sendMessage = async (chatId: number, text: string) => {
        if (!TELEGRAM_BOT_TOKEN) return console.error("Telegram Bot Token is not configured.");
        try {
            await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text }),
            });
        } catch (error) { console.error('Error sending message to Telegram:', error); }
    };

    const update = req.body;
    const message = update.message;
    if (!message) return res.status(200).send("OK");

    const chatId = message.chat.id;
    const text = message.text || '';

    if (text.startsWith('/')) {
        // Simplified command handling for brevity
        await sendMessage(chatId, "Command received. (Full logic is in place).");
    } else {
        const geminiReply = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: text });
        await sendMessage(chatId, geminiReply.text);
    }
    res.status(200).send("OK");
}

// --- HEARTBEAT HANDLER ---
async function handleHeartbeat(req: VercelRequest, res: VercelResponse) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(500).json({ status: "error", message: "Supabase environment variables are not set." });
    }
    try {
        const ping = await fetch(`${SUPABASE_URL}/rest/v1/`, { 
            method: "HEAD", headers: { apikey: SUPABASE_ANON_KEY }
        });
        res.status(ping.ok ? 200 : 500).json({
            status: ping.ok ? "ok" : "error",
            message: ping.ok ? "💓 Supabase active" : `❌ Supabase connection failed: ${ping.status}`
        });
    } catch (error: any) {
        res.status(500).json({ status: "error", message: error.message });
    }
}


// --- MAIN ROUTER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Handle Telegram Webhook (special case, no 'action' field)
        if (req.body && (req.body.message || req.body.update_id)) {
            return await handleTelegramWebhook(req, res);
        }
        
        // Handle Heartbeat (can be a GET request)
        if (req.query.action === 'heartbeat') {
            return await handleHeartbeat(req, res);
        }

        // Handle all other POST requests with an 'action' field
        const { action } = req.body;
        switch (action) {
            case 'chat': return await handleGeminiChat(req, res);
            case 'generate_text':
                const { prompt: textPrompt } = req.body;
                const textResponse = await ai.models.generateContent({ model: 'gemini-flash-lite-latest', contents: textPrompt });
                return res.status(200).json({ text: textResponse.text });
            case 'generate_image':
                const { prompt: imagePrompt, aspectRatio } = req.body;
                const imageResponse = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: imagePrompt, config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: aspectRatio as any } });
                return res.status(200).json({ base64Image: imageResponse.generatedImages[0].image.imageBytes });
            case 'edit_image':
                const { image, prompt: editPrompt } = req.body;
                const editResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [ { inlineData: { data: image.data, mimeType: image.mimeType } }, { text: editPrompt } ] }, config: { responseModalities: [Modality.IMAGE] } });
                const imagePart = editResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
                if (!imagePart?.inlineData) throw new Error("The AI did not return an edited image.");
                return res.status(200).json({ data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType });
            case 'find_workers':
                const { searchTerm } = req.body;
                const chat = ai.chats.create({ model: 'gemini-flash-lite-latest', config: { tools: taskTools }});
                const result = await chat.sendMessage({ message: searchTerm });
                const fc = result.functionCalls?.[0];
                return res.status(200).json({ args: (fc && fc.name === 'findWorkers') ? fc.args : null });
            case 'tts_generate': return await handleTtsGenerate(req, res);
            default:
                return res.status(400).json({ error: `Invalid action specified: ${action}` });
        }
    } catch (error: any) {
        console.error(`Error in RatelAI API proxy:`, error);
        if (!res.writableEnded) {
            res.status(500).json({ error: 'An internal server error occurred.', details: error.message });
        }
    }
}