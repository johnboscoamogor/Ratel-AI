import { GeneratedVideo, Video } from '@google/genai';
import { GenerateVideoParams } from '../veoTypes';
import { ai } from './geminiService';

// FIX: Implemented the video generation service to call the backend API.
export const generateVideo = async (params: GenerateVideoParams): Promise<{ objectUrl: string; generatedVideo: GeneratedVideo; }> => {
    const {
        model,
        prompt,
        resolution,
        aspectRatio,
        startFrame,
        endFrame,
        inputVideoObject,
    } = params;

    const config: any = {
        numberOfVideos: 1,
        resolution,
        aspectRatio,
    };
    
    const payload: any = { model, prompt, config };

    if (startFrame) {
        payload.image = { imageBytes: startFrame.base64, mimeType: startFrame.file.type };
    }
    if (endFrame) {
        config.lastFrame = { imageBytes: endFrame.base64, mimeType: endFrame.file.type };
    }
    if (inputVideoObject) {
        payload.video = inputVideoObject;
    }
    
    let operation = await ai.models.generateVideos(payload);

    // Poll for the result
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }

    const generatedVideo = operation.response?.generatedVideos?.[0];
    if (!generatedVideo?.video?.uri) {
        if (operation.error) {
            console.error("Veo generation error:", operation.error);
            throw new Error(operation.error.message || "Video generation failed in operation.");
        }
        throw new Error("Video generation did not return a valid video URI.");
    }
    
    const downloadLink = generatedVideo.video.uri;
    // The API key is injected by the environment and is appended for accessing the video URL.
    const objectUrl = `${downloadLink}&key=${process.env.API_KEY}`;
    
    return { objectUrl, generatedVideo };
};