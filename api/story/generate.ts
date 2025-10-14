import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

const GEMINI_API_KEY = process.env.API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error("The API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const generateScript = async (prompt: string, language: string) => {
    const scriptPrompt = `
        You are a master African storyteller. Create a short, engaging children's story based on the following prompt. The story should have a clear moral or lesson.
        The story MUST be structured as a JSON object with the following schema:
        - "title": A short, catchy title for the story.
        - "scenes": An array of exactly 3 scene objects. Each scene object must have:
            - "scene_index": The number of the scene (1, 2, or 3).
            - "narration_text": The narrator's part for this scene. Keep it to one or two sentences.
            - "visual_prompt": A rich, descriptive prompt for an AI image generator to create a visual for this scene. Describe the setting, characters, and action in a "cinematic, vibrant, African digital art style".
        - "lesson": A one-sentence summary of the story's moral or lesson.

        The language of the entire JSON output (title, narration, lesson, etc.) MUST be in ${language}.

        User Prompt: "${prompt}"
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: scriptPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    scenes: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                scene_index: { type: Type.NUMBER },
                                narration_text: { type: Type.STRING },
                                visual_prompt: { type: Type.STRING },
                            },
                            required: ['scene_index', 'narration_text', 'visual_prompt']
                        }
                    },
                    lesson: { type: Type.STRING },
                },
                required: ['title', 'scenes', 'lesson']
            }
        },
    });

    return JSON.parse(response.text);
};


const generateAudio = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                },
            },
        });
        const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioBase64) {
            throw new Error("TTS response did not contain audio data.");
        }
        return audioBase64;
    } catch (error) {
        console.error("Error generating audio from Gemini TTS:", error);
        return ""; // Return empty string on failure
    }
};

const generateVideo = async (prompt: string): Promise<string | null> => {
     // This function simulates a call to a video generation API on the backend.
    console.log(`Simulating video generation for prompt: "${prompt}"`);
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Return a placeholder. In a real app, this would be a generated video URL.
    const placeholderVideos = [
        'https://videos.pexels.com/video-files/3209828/3209828-hd_1280_720_25fps.mp4',
        'https://videos.pexels.com/video-files/853878/853878-hd_1280_720_30fps.mp4',
        'https://videos.pexels.com/video-files/2099395/2099395-hd_1280_720_25fps.mp4'
    ];
    return placeholderVideos[Math.floor(Math.random() * placeholderVideos.length)];
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt, language = 'en' } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Step 1: Generate the story script
        const scriptData = await generateScript(prompt, language);
        
        // Step 2: Generate narration audio for the whole story
        const fullNarration = scriptData.scenes.map((s: any) => s.narration_text).join(' ');
        const audioBase64 = await generateAudio(fullNarration);

        // Step 3: Generate video for each scene
        const sceneVideoUrls = await Promise.all(
            scriptData.scenes.map((scene: any) => generateVideo(scene.visual_prompt))
        );

        res.status(200).json({
            id: crypto.randomUUID(),
            title: scriptData.title,
            script: scriptData.script,
            scenes: scriptData.scenes,
            sceneVideoUrls,
            audioBase64,
        });

    } catch (error: any) {
        console.error('Story generation pipeline failed:', error);
        res.status(500).json({ error: 'Failed to generate story', details: error.message });
    }
}