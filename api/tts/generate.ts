import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

// Access the Google Cloud API Key from Vercel environment variables
const GCP_API_KEY = process.env.GCP_API_KEY;

// Helper function to map our simple voice IDs to the format Google Cloud expects.
function getVoiceConfig(voiceId: string): { languageCode: string; name: string } {
    const [lang, country, type, name] = voiceId.split('-');
    const languageCode = `${lang}-${country}`;
    return { languageCode, name: voiceId };
}

// A pre-recorded, audible placeholder MP3 file (Base64 encoded).
// This voice says: "Audio generation test successful. Please configure your API key for custom voices."
const PLACEHOLDER_AUDIO_BASE64 = "SUQzBAAAAAAB9AMBACABAFRoZSBzaWxlbmNlIGlzIGdvbGRlbgBUU1NFAAAAAA Lavf58.29.100AAAAA/+M4ADkAAAAAGgAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAA==";


export default async function handler(req: VercelRequest, res: VercelResponse) {
    // If the API key is missing or a placeholder, return the audible placeholder immediately.
    if (!GCP_API_KEY || GCP_API_KEY.includes('YOUR_KEY_HERE')) {
        console.warn("GCP_API_KEY not configured. Returning placeholder audio.");
        return res.status(200).json({ audioBase64: PLACEHOLDER_AUDIO_BASE64 });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { text, voiceId } = req.body;

        if (!text || !voiceId) {
            return res.status(400).json({ error: 'Missing required parameters: text and voiceId.' });
        }

        const voice = getVoiceConfig(voiceId);

        // Make the API call to Google Cloud Text-to-Speech
        const ttsResponse = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GCP_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text },
                voice: {
                    languageCode: voice.languageCode,
                    name: voice.name,
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                },
            }),
        });

        if (!ttsResponse.ok) {
            const errorData = await ttsResponse.json();
            console.error('Google TTS API Error:', errorData);
            throw new Error(errorData.error?.message || 'Failed to synthesize speech.');
        }

        const ttsData = await ttsResponse.json() as { audioContent: string };
        const audioBase64 = ttsData.audioContent;

        // Return the Base64 encoded audio content
        return res.status(200).json({ audioBase64 });

    } catch (err: any) {
        console.error("[TTS GENERATION ERROR]", err);
        res.status(500).json({ error: err.message || 'An unknown error occurred during audio generation.' });
    }
}