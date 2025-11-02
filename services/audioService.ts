import { ai } from './geminiService';
import { Modality } from '@google/genai';


let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
            return null;
        }
    }
    return audioContext;
};

type SoundType = 'send' | 'receive' | 'click';

export const playSound = (type: SoundType) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (type) {
        case 'send':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(700, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.2);
            break;

        case 'receive':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
            break;

        case 'click':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
            break;
    }
};

// Updated list of high-quality Google Cloud TTS voices.
// The 'id' is a composite of language code and voice name for the backend.
export const gcpVoices = [
    { name: 'Ada (Nigerian)', id: 'en-NG-Standard-A', gender: 'Female', lang: 'en-NG' },
    { name: 'Abioye (Nigerian)', id: 'en-NG-Standard-B', gender: 'Male', lang: 'en-NG' },
    { name: 'Wavenet A (US)', id: 'en-US-Wavenet-A', gender: 'Male', lang: 'en-US' },
    { name: 'Wavenet F (US)', id: 'en-US-Wavenet-F', gender: 'Female', lang: 'en-US' },
    { name: 'Wavenet C (UK)', id: 'en-GB-Wavenet-C', gender: 'Female', lang: 'en-GB' },
    { name: 'Asilia (Kenyan)', id: 'en-KE-Standard-A', gender: 'Female', lang: 'en-KE' },
    { name: 'Swahili Male', id: 'sw-KE-Standard-B', gender: 'Male', lang: 'sw-KE' },
];

export interface VoiceOption {
  id: string;
  name: string;
  type: 'gcp' | 'browser';
  gender: string;
  lang: string;
  voice?: SpeechSynthesisVoice;
}

let cachedVoices: VoiceOption[] | null = null;

export const getAvailableVoices = (): VoiceOption[] => {
    if (cachedVoices) {
        return cachedVoices;
    }

    const allVoices: VoiceOption[] = gcpVoices.map(v => ({
        ...v,
        type: 'gcp',
    }));
    
    cachedVoices = allVoices;
    return allVoices;
}

/**
 * Generates an audio blob by calling our secure backend endpoint,
 * which in turn calls the Google Cloud Text-to-Speech API.
 * @param text The text to synthesize.
 * @param voiceId The composite ID for the desired voice (e.g., 'en-NG-Standard-A').
 * @returns A Promise that resolves to an audio Blob.
 */
export const generateAudioBlob = async (text: string, voiceId: string): Promise<Blob> => {
    try {
        const voiceName = ({
            'en-NG-Standard-A': 'Kore', 'en-NG-Standard-B': 'Charon', 'en-US-Wavenet-A': 'Puck',
            'en-US-Wavenet-F': 'Kore', 'en-GB-Wavenet-C': 'Kore', 'en-KE-Standard-A': 'Kore',
            'sw-KE-Standard-B': 'Kore'
        })[voiceId || 'en-NG-Standard-A'] || 'Kore';

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: { 
                responseModalities: [Modality.AUDIO], 
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } 
            },
        });

        const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioBase64) {
            throw new Error("TTS response did not contain audio data.");
        }
        
        // Decode the Base64 string into a byte array
        const byteCharacters = atob(audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        // Create a Blob from the byte array
        return new Blob([byteArray], { type: 'audio/mp3' });

    } catch (error) {
        console.error("Audio generation failed:", error);
        throw error; // Re-throw the error to be handled by the component
    }
};

// No longer needed for Audio Studio, can be safely removed or kept for other features.
export const cancelAndCloseAllAudioSessions = () => {
    // This function is now a no-op as we are not using persistent live sessions for TTS.
};