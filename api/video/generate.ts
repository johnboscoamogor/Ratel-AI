import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.API_KEY;

// This function is defined here, but not exported, so it's private to this module.
const initializeAi = () => {
    if (!GEMINI_API_KEY) {
        throw new Error("The API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// Helper to generate audio using Gemini TTS
const generateAudio = async (ai: GoogleGenAI, text: string | undefined, voiceId: string): Promise<string | null> => {
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

        if (!prompt || !image) {
            return res.status(400).json({ error: 'Prompt and image are required for video ad generation.' });
        }
        
        console.log(`Received video ad request with prompt: "${prompt}"`);

        // Initialize the AI client for this request
        const ai = initializeAi();

        // Asynchronously generate audio tracks while generating video
        const dialogueAudioPromise = generateAudio(ai, dialogue, voiceId);
        const ambianceAudioPromise = generateAudio(ai, `[Sound effect of ${ambiance}]`, 'en-US-Studio-O');

        // Start video generation
        let videoOperation = await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: image.data, // base64 string
                mimeType: image.mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '1:1' // Good for product/portrait animations
            }
        });
        
        // Poll for video completion
        while (!videoOperation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            videoOperation = await ai.operations.getVideosOperation({ operation: videoOperation });
        }

        const downloadLink = videoOperation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation succeeded but no download link was returned.");
        }

        // Fetch video bytes on the server to keep the API key secure
        const videoResponse = await fetch(`${downloadLink}&key=${GEMINI_API_KEY}`);
        if (!videoResponse.ok) {
            // Forward the error from Google's server if fetching fails
            const errorBody = await videoResponse.text();
            console.error(`Failed to download generated video. Status: ${videoResponse.status}. Body: ${errorBody}`);
            throw new Error(`Failed to download generated video: ${videoResponse.statusText}`);
        }
        // @ts-ignore - buffer() is available in node-fetch
        const videoBuffer = await videoResponse.buffer();
        const videoBase64 = videoBuffer.toString('base64');
        const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;


        // Await audio generation
        const [dialogueAudio, ambianceAudio] = await Promise.all([
            dialogueAudioPromise,
            ambianceAudioPromise
        ]);

        res.status(200).json({
            videoUrl: videoDataUrl,
            dialogueAudioBase64: dialogueAudio,
            ambianceAudioBase64: ambianceAudio,
        });

    } catch (error: any) {
        console.error('Video generation pipeline failed:', error);
        res.status(500).json({ error: 'Failed to generate video', details: error.message });
    }
}