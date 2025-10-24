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
            'en-US-Studio-O': 'Zephyr', // For sound effects
            'en-NG-Standard-A': 'Kore',
            'en-NG-Standard-B': 'Charon'
            // Add other mappings from your audioService here
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
        return null; // Don't fail the whole request for audio
    }
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt, image, dialogue, ambiance, voiceId } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Asynchronously generate video and audio tracks
        const videoPromise = ai.models.generateVideos({
            // FIX: Updated model name to a recommended one from the guidelines.
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            ...(image && { image: { imageBytes: image.data, mimeType: image.mimeType } }),
            config: { numberOfVideos: 1 }
        });

        const dialogueAudioPromise = generateAudio(dialogue, voiceId);
        const ambianceAudioPromise = generateAudio(`[Sound effect of ${ambiance}]`, 'en-US-Studio-O');

        // Await all promises concurrently
        let [videoOperation, dialogueAudio, ambianceAudio] = await Promise.all([
            videoPromise,
            dialogueAudioPromise,
            ambianceAudioPromise
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
            dialogueAudioBase64: dialogueAudio,
            ambianceAudioBase64: ambianceAudio,
        });

    } catch (error: any) {
        console.error('Video generation pipeline failed:', error);
        res.status(500).json({ error: 'Failed to generate video', details: error.message });
    }
}