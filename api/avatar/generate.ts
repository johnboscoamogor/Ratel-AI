import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error("The API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Helper to generate audio using Gemini TTS
const generateAudio = async (text: string, voiceId: string): Promise<string | null> => {
    if (!text) return null;
    try {
        const voiceNameMap: { [key: string]: string } = {
            'en-US-Studio-O': 'Zephyr',
            'en-NG-Standard-A': 'Kore',
            'en-NG-Standard-B': 'Charon',
            'en-US-Wavenet-A': 'Puck',
            'en-US-Wavenet-F': 'Kore',
            'en-GB-Wavenet-C': 'Kore',
            'en-KE-Standard-A': 'Kore',
            'sw-KE-Standard-B': 'Kore'
        };
        const voiceName = voiceNameMap[voiceId] || 'Zephyr'; // Default voice

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) {
        console.error("Error generating audio:", error);
        return null;
    }
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { imageBase64, mimeType, stylePrompt, script, voiceId, audioBase64: importedAudioBase64 } = req.body;

        if (!imageBase64 || !stylePrompt || (!script && !importedAudioBase64)) {
            return res.status(400).json({ error: 'Missing required parameters: imageBase64, stylePrompt, and either a script or audioBase64 are required.' });
        }

        const videoGenPrompt = `Create a short, 4-second video animating the character in the provided image. The style should be: '${stylePrompt}'. The character should appear to be speaking, with natural, subtle head movements, blinking, and facial expressions. The background should be simple and unobtrusive.`;

        // Start video and audio generation in parallel
        const videoPromise = ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: videoGenPrompt,
            image: {
                imageBytes: imageBase64,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                aspectRatio: '1:1', // Square aspect ratio is good for avatars
                resolution: '720p'
            }
        });

        const audioPromise = script 
            ? generateAudio(script, voiceId) 
            : Promise.resolve(importedAudioBase64); // Use imported audio if available

        let [videoOperation, finalAudioBase64] = await Promise.all([
            videoPromise,
            audioPromise
        ]);

        // Poll for video completion
        while (!videoOperation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            videoOperation = await ai.operations.getVideosOperation({ operation: videoOperation });
        }
        
        const downloadLink = videoOperation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation succeeded but no download link was returned.");
        }
        
        // The API key is required to access the temporary video URL
        const videoUrl = `${downloadLink}&key=${GEMINI_API_KEY}`;

        res.status(200).json({
            videoUrl,
            audioBase64: finalAudioBase64,
        });

    } catch (error: any) {
        console.error('Avatar generation pipeline failed:', error);
        res.status(500).json({ error: 'Failed to generate avatar', details: error.message });
    }
}
