import { Modality, type LiveServerMessage, type Blob as GenaiBlob } from "@google/genai";
import { ai } from './geminiService';

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

export const geminiVoices = [
    { name: 'Kore', id: 'Kore', gender: 'Female' },
    { name: 'Charon', id: 'Charon', gender: 'Male' },
    { name: 'Zephyr', id: 'Zephyr', gender: 'Female' },
    { name: 'Puck', id: 'Puck', gender: 'Male' },
    { name: 'Fenrir', id: 'Fenrir', gender: 'Male' },
];

export interface VoiceOption {
  id: string;
  name: string;
  type: 'gemini' | 'browser';
  voice?: SpeechSynthesisVoice;
}

let cachedVoices: VoiceOption[] | null = null;

export const getAvailableVoices = (): VoiceOption[] => {
    if (cachedVoices) {
        return cachedVoices;
    }

    const allVoices: VoiceOption[] = geminiVoices.map(v => ({
        id: `gemini_${v.id}`,
        name: v.name,
        type: 'gemini',
    }));

    if (typeof window !== 'undefined' && window.speechSynthesis) {
        const browserVoices = window.speechSynthesis.getVoices().map(v => ({
            id: `browser_${v.name}_${v.lang}`,
            name: `${v.name} (${v.lang})`,
            type: 'browser' as 'browser',
            voice: v,
        }));
        allVoices.push(...browserVoices);
    }
    
    // In some browsers, getVoices() is async, so we might need to listen for the event
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
            cachedVoices = null; // Invalidate cache
        };
    }
    
    cachedVoices = allVoices;
    return allVoices;
}


// Helper to encode Uint8Array to base64 string
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to create a GenAI Blob from Float32Array audio data
function createGenaiBlob(data: Float32Array): GenaiBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp values to [-1, 1] before conversion
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s * 32767;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const encodeWAV = (samples: Float32Array, sampleRate: number): ArrayBuffer => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(view, 44, samples);

    return buffer;
};

class LiveAudioSession {
    private sessionPromise: Promise<any>;
    private currentGeneration: {
        resolve: (blob: Blob) => void;
        reject: (error: Error) => void;
        audioChunks: Uint8Array[];
    } | null = null;
    public voiceName: string;

    constructor(voiceName: string) {
        this.voiceName = voiceName;

        this.sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {},
                onmessage: (message: LiveServerMessage) => {
                    if (!this.currentGeneration) return;

                    const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64EncodedAudioString) {
                        this.currentGeneration.audioChunks.push(decode(base64EncodedAudioString));
                    }

                    if (message.serverContent?.turnComplete) {
                        if (this.currentGeneration.audioChunks.length === 0) {
                            this.currentGeneration.reject(new Error("Audio generation resulted in an empty response from Ratel AI."));
                        } else {
                            const totalLength = this.currentGeneration.audioChunks.reduce((acc, val) => acc + val.length, 0);
                            const combined = new Uint8Array(totalLength);
                            let offset = 0;
                            for (const chunk of this.currentGeneration.audioChunks) {
                                combined.set(chunk, offset);
                                offset += chunk.length;
                            }

                            const dataInt16 = new Int16Array(combined.buffer);
                            const dataFloat32 = new Float32Array(dataInt16.length);
                            for (let i = 0; i < dataInt16.length; i++) {
                                dataFloat32[i] = dataInt16[i] / 32768.0;
                            }
                            
                            const wavBuffer = encodeWAV(dataFloat32, 24000); // Live API output is 24kHz
                            const wavBlob = new window.Blob([wavBuffer], { type: 'audio/wav' });
                            this.currentGeneration.resolve(wavBlob);
                        }
                        this.currentGeneration = null;
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error(`Live session error for voice ${this.voiceName}:`, e);
                    const error = new Error('A Ratel AI connection error occurred during audio generation.');
                    if (this.currentGeneration) {
                        this.currentGeneration.reject(error);
                        this.currentGeneration = null;
                    }
                    this.handleClose();
                },
                onclose: (e: CloseEvent) => {
                    if (this.currentGeneration) {
                        this.currentGeneration.reject(new Error("Audio generation session was closed."));
                        this.currentGeneration = null;
                    }
                    this.handleClose();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voiceName } },
                },
                systemInstruction: `You are a text-to-speech engine. Your sole purpose is to read the user's input aloud clearly and naturally. Do not add any extra words, commentary, or introductory phrases. Only speak the text provided by the user.`,
            },
        });

        this.sessionPromise.catch(e => {
            console.error(`Failed to connect session for voice ${this.voiceName}`, e);
            if (this.currentGeneration) {
                this.currentGeneration.reject(e);
                this.currentGeneration = null;
            }
            this.handleClose();
        });
    }
    
    private handleClose() {
        if (sessionCache.get(this.voiceName) === this) {
            sessionCache.delete(this.voiceName);
        }
    }

    public async generate(text: string): Promise<Blob> {
        if (this.currentGeneration) {
            return Promise.reject(new Error("Another generation is already in progress for this voice. Please wait."));
        }
        
        const session = await this.sessionPromise;

        return new Promise((resolve, reject) => {
            this.currentGeneration = { resolve, reject, audioChunks: [] };
            session.sendRealtimeInput({ text });
        });
    }
    
    public closeAndCancel() {
        // Immediately reject the pending generation to prevent race conditions.
        if (this.currentGeneration) {
            this.currentGeneration.reject(new Error("Audio generation was cancelled."));
            this.currentGeneration = null;
        }
        // Then proceed to close the session connection.
        this.sessionPromise.then(s => s.close()).catch(() => {});
    }
}

const sessionCache = new Map<string, LiveAudioSession>();

export const generateAudioBlob = (text: string, voiceName: string): Promise<Blob> => {
    let session = sessionCache.get(voiceName);
    if (!session) {
        session = new LiveAudioSession(voiceName);
        sessionCache.set(voiceName, session);
    }
    return session.generate(text);
};

export const cancelCurrentAudioGeneration = (voiceName: string) => {
    const session = sessionCache.get(voiceName);
    if (session) {
        session.closeAndCancel();
    }
};

export const cancelAndCloseAllAudioSessions = () => {
    for (const session of sessionCache.values()) {
        session.closeAndCancel();
    }
    sessionCache.clear();
};