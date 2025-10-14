import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error("The API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { text, voiceId } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required.' });
        }
        
        // Map our internal voice names to Gemini's prebuilt voices
        const getGeminiVoice = (id: string) => {
            const mapping: { [key: string]: string } = {
                'en-NG-Standard-A': 'Kore',
                'en-NG-Standard-B': 'Charon',
                'en-US-Wavenet-A': 'Puck',
                'en-US-Wavenet-F': 'Kore',
                'en-GB-Wavenet-C': 'Kore',
                'en-KE-Standard-A': 'Kore',
                'sw-KE-Standard-B': 'Kore', // No direct Swahili, fallback to a clear voice
                'en-US-Studio-O': 'Zephyr' // A good voice for sound effects
            };
            return mapping[id] || 'Kore'; // Default to Kore
        };
        
        const voiceName = getGeminiVoice(voiceId || 'en-NG-Standard-A');

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
        });
        
        const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!audioBase64) {
            throw new Error("TTS response did not contain audio data.");
        }

        res.status(200).json({ audioBase64 });

    } catch (error: any) {
        console.error('TTS generation failed:', error);
        res.status(500).json({ error: error.message });
    }
}