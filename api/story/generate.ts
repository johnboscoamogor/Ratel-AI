import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import fetch from 'node-fetch';

// --- ENVIRONMENT VARIABLES ---
// These MUST be set in your Vercel project settings for this to work.
const AI_KEY = process.env.AI_STUDIO_API_KEY;
const RUNWAY_KEY = process.env.RUNWAY_API_KEY;
const GCP_API_KEY = process.env.GCP_API_KEY;

let ai: GoogleGenAI;
if (AI_KEY) {
    ai = new GoogleGenAI({ apiKey: AI_KEY });
} else {
    console.error("Gemini API key (AI_STUDIO_API_KEY) is not set.");
}

// --- MASTER PROMPT FOR GEMINI ---
const MASTER_PROMPT = `You are RATEL Storyteller assistant. The user gives a prompt. Produce:

1) A short title.
2) A story script ~300-700 words for a short video (3-5 scenes). Keep language simple and vivid.
3) A scene-by-scene breakdown array (3-5 scenes). For each scene include:
   - scene_index (1-based)
   - scene_duration_seconds (integer between 5 and 10)
   - visual_prompt (one-sentence prompt to generate an image/video for the scene — describe style, environment, characters)
   - narration_text (what the narrator will say for the scene; 1-3 sentences)
   - subtitle_text (short subtitle text)
4) A single short "video_prompt" summarizing overall mood, colors, camera, and soundtrack suggestions.

Return JSON only (no extra text) with keys:
{ "title": "...", "script": "...", "scenes": [ {scene objects} ], "video_prompt": "..." }

If user asks for Pidgin or another specified language, write narration_text in that language accordingly.
`;

// --- SIMULATION & HELPER FUNCTIONS ---

// Simulates calling RunwayML to generate a video for a scene.
// In a real app, this would involve polling for completion.
async function generateSceneVideo(scene: any, storyTitle: string): Promise<string | null> {
    const runwayPrompt = `${storyTitle} - Scene ${scene.scene_index}: ${scene.visual_prompt}. Style: cinematic, filmic lighting, warm earthy tones. Camera: slow dolly, cinematic framing. Duration: ${scene.scene_duration_seconds}s.`;
    console.log(`[RUNWAY SIM] Generating video for Scene ${scene.scene_index} with prompt: "${runwayPrompt}"`);
    
    // Simulate API call and polling delay
    // REDUCED DELAY: Shortened from ~8s to ~1.5s to prevent timeouts and improve UX.
    await new Promise(r => setTimeout(r, 1500));
    
    // Return a placeholder URL. Replace these with more varied videos if desired.
    const placeholders = [
        'https://videos.pexels.com/video-files/3209828/3209828-hd_1280_720_25fps.mp4',
        'https://videos.pexels.com/video-files/853879/853879-hd_1280_720_30fps.mp4',
        'https://videos.pexels.com/video-files/4434246/4434246-hd_1280_720_24fps.mp4',
        'https://videos.pexels.com/video-files/5495832/5495832-hd_1280_720_25fps.mp4',
        'https://videos.pexels.com/video-files/854255/854255-hd_1280_720_25fps.mp4'
    ];
    return placeholders[scene.scene_index % placeholders.length];
}

// Simulates calling Google Cloud TTS to generate audio.
async function generateNarrationAudio(text: string, language: string): Promise<string> {
    console.log(`[GCP TTS SIM] Generating audio for language "${language}" with text: "${text.substring(0, 50)}..."`);
    // REDUCED DELAY: Shortened from 4s to 1s to prevent timeouts.
    await new Promise(r => setTimeout(r, 1000));
    
    // This is a Base64 representation of a short, silent MP3 file.
    // It's used as a placeholder so the frontend audio player works correctly.
    // In a real app, the `audioContent` from the real GCP API response would be used here.
    return "SUQzBAAAAAAB9AMBACABAFRoZSBzaWxlbmNlIGlzIGdvbGRlbgBUU1NFAAAAAA Lavf58.29.100AAAAA/+M4ADkAAAAAGgAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAA=";
}

// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!ai) {
        throw new Error("AI Service is not initialized. Check API keys.");
    }

    const { prompt, language = "english" } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Missing prompt" });
    }

    // 1) Ask Gemini to generate JSON story + scenes
    const fullPrompt = `${MASTER_PROMPT}\n\nUserPrompt: ${prompt}\nLanguage: ${language}`;
    const gmResp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: { responseMimeType: 'application/json' },
    });
    
    let storyJson;
    try {
        storyJson = JSON.parse(gmResp.text);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", gmResp.text);
        throw new Error("The AI returned an invalid story format.");
    }
    
    if (!storyJson || !Array.isArray(storyJson.scenes)) {
      throw new Error("Invalid story structure from AI");
    }

    // 2) For each scene, generate video using Runway (SIMULATED)
    const sceneVideoPromises = storyJson.scenes.map((scene: any) => 
        generateSceneVideo(scene, storyJson.title)
    );
    const sceneVideoUrls = await Promise.all(sceneVideoPromises);

    // 3) Generate TTS audio from combined narration (SIMULATED)
    const narrationCombined = storyJson.scenes.map((s: any) => s.narration_text).join(" ");
    const audioBase64 = await generateNarrationAudio(narrationCombined, language);
    
    // 4) Return the final combined response
    return res.status(200).json({
      id: crypto.randomUUID(),
      title: storyJson.title,
      script: storyJson.script,
      scenes: storyJson.scenes,
      sceneVideoUrls,
      audioBase64,
      message: "Playback data successfully generated."
    });

  } catch (err: any) {
    console.error("[STORY GENERATION ERROR]", err);
    res.status(500).json({ error: err.message || 'An unknown error occurred during story generation.' });
  }
}