import { GeneratedVideo } from '@google/genai';
import { GenerateVideoParams } from '../veoTypes';

// FIX: Implemented the video generation service to call the backend API.
export const generateVideo = async (params: GenerateVideoParams): Promise<{ objectUrl: string; generatedVideo: GeneratedVideo; }> => {
    const response = await fetch('/api/ratelai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'veo_generate', ...params }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to generate video from the server.");
    }
    
    return await response.json();
};
