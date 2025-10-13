import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// --- ENVIRONMENT VARIABLES ---
const AI_KEY = process.env.AI_STUDIO_API_KEY;

let ai: GoogleGenAI | null = null;
if (AI_KEY && AI_KEY !== 'YOUR_GEMINI_API_KEY') {
    ai = new GoogleGenAI({ apiKey: AI_KEY });
} else {
    console.warn("Gemini API key (AI_STUDIO_API_KEY) is not set. Storyteller will use placeholder data.");
}

// --- MASTER PROMPT FOR GEMINI ---
const MASTER_PROMPT = `You are RATEL Storyteller assistant. The user gives a prompt. Produce:
1) A short title.
2) A story script ~300-700 words for a short video (3-5 scenes). Keep language simple and vivid.
3) A scene-by-scene breakdown array (3-5 scenes). For each scene include:
   - scene_index (1-based)
   - scene_duration_seconds (integer between 5 and 10)
   - visual_prompt (one-sentence prompt for the scene)
   - narration_text (1-3 sentences)
   - subtitle_text (short subtitle)
4) A single short "video_prompt" summarizing overall mood and style.
Return JSON only (no extra text) with keys: { "title": "...", "script": "...", "scenes": [ ... ], "video_prompt": "..." }
If user asks for Pidgin or another language, write narration_text in that language accordingly.`;


// --- HARDCODED PLACEHOLDER FOR RELIABILITY ---
const getPlaceholderStory = () => ({
    id: crypto.randomUUID(),
    title: "The Wise Tortoise",
    script: "A story about a wise tortoise who teaches the village about patience.",
    scenes: [
        { scene_index: 1, scene_duration_seconds: 7, visual_prompt: "A peaceful African village at sunrise, cinematic, warm colors.", narration_text: "In a quiet village, the sun rose, casting a golden light. Everyone was always in a hurry." },
        { scene_index: 2, scene_duration_seconds: 7, visual_prompt: "A wise old tortoise sitting under a baobab tree.", narration_text: "But under the great baobab tree, sat the wise old tortoise, who moved slow and steady." },
        { scene_index: 3, scene_duration_seconds: 7, visual_prompt: "The villagers rushing and making mistakes, a pot falling and breaking.", narration_text: "He watched as the villagers rushed, always making mistakes. A dropped pot here, a missed step there." },
        { scene_index: 4, scene_duration_seconds: 8, visual_prompt: "The tortoise slowly and carefully building a small, perfect wall.", narration_text: "One day, the tortoise taught them, 'The race is not always for the swift.' He showed them how patience builds stronger walls and creates better results." },
    ],
    sceneVideoUrls: [
        'https://videos.pexels.com/video-files/853879/853879-hd_1280_720_30fps.mp4',
        'https://videos.pexels.com/video-files/3209828/3209828-hd_1280_720_25fps.mp4',
        'https://videos.pexels.com/video-files/5495832/5495832-hd_1280_720_25fps.mp4',
        'https://videos.pexels.com/video-files/4434246/4434246-hd_1280_720_24fps.mp4',
    ],
    // Audible placeholder audio: "This is a placeholder for the story narration. Please configure your API keys to generate custom audio."
    audioBase64: "SUQzBAAAAAAB9AMBACABAFRoZSBzaWxlbmNlIGlzIGdvbGRlbgBUU1NFAAAAAA Lavf58.29.100AAAAA/+M4ADkAAAAAGgAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAA==",
    message: "Placeholder story generated. Please configure API keys for live generation."
});


// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // If AI is not configured, immediately return the reliable placeholder.
  if (!ai) {
      return res.status(200).json(getPlaceholderStory());
  }

  try {
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

    // 2) Generate videos and audio IN PARALLEL to be fast
    const narrationCombined = storyJson.scenes.map((s: any) => s.narration_text).join(" ");
    
    // For live generation, we still use placeholder videos and silent audio
    // to prevent timeouts and reliance on other paid services for this example.
    const placeholderData = getPlaceholderStory();
    const sceneVideoUrls = placeholderData.sceneVideoUrls.slice(0, storyJson.scenes.length);
    const audioBase64 = placeholderData.audioBase64; // Use silent audio placeholder

    // 3) Return the final combined response
    return res.status(200).json({
      id: crypto.randomUUID(),
      title: storyJson.title,
      script: storyJson.script,
      scenes: storyJson.scenes,
      sceneVideoUrls,
      audioBase64,
      message: "Live story generated with placeholder media."
    });

  } catch (err: any) {
    console.error("[STORY GENERATION ERROR]", err);
    res.status(500).json({ error: err.message || 'An unknown error occurred during story generation.' });
  }
}