
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, VideoGenerationReferenceImage, VideoGenerationReferenceType } from '@google/genai';
import { GenerateVideoParams, GenerationMode } from '../../veoTypes';

const GEMINI_API_KEY = process.env.API_KEY;

const initializeAi = () => {
    if (!GEMINI_API_KEY) {
        throw new Error("The API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    try {
        const params: GenerateVideoParams = req.body;
        const ai = initializeAi();

        // Build config
        const config: any = {
            numberOfVideos: 1,
            resolution: params.resolution,
        };
        if (params.mode !== GenerationMode.EXTEND_VIDEO) {
            config.aspectRatio = params.aspectRatio;
        }

        // Build payload
        const generateVideoPayload: any = {
            model: params.model,
            config: config,
        };
        if (params.prompt) {
            generateVideoPayload.prompt = params.prompt;
        }

        // Handle different modes
        if (params.mode === GenerationMode.IMAGE_ANIMATION) {
            if (params.startFrame) { 
                generateVideoPayload.image = {
                    imageBytes: params.startFrame.base64,
                    mimeType: params.startFrame.file.type,
                };
            }
        } else if (params.mode === GenerationMode.FRAMES_TO_VIDEO) {
            if (params.startFrame) {
                generateVideoPayload.image = {
                    imageBytes: params.startFrame.base64,
                    mimeType: params.startFrame.file.type,
                };
            }
            const finalEndFrame = params.isLooping ? params.startFrame : params.endFrame;
            if (finalEndFrame) {
                generateVideoPayload.config.lastFrame = {
                    imageBytes: finalEndFrame.base64,
                    mimeType: finalEndFrame.file.type,
                };
            }
        } else if (params.mode === GenerationMode.REFERENCES_TO_VIDEO) {
            const referenceImagesPayload: VideoGenerationReferenceImage[] = [];
            if (params.referenceImages) {
                for (const img of params.referenceImages) {
                    referenceImagesPayload.push({
                    image: { imageBytes: img.base64, mimeType: img.file.type },
                    referenceType: VideoGenerationReferenceType.ASSET,
                    });
                }
            }
            if (params.styleImage) {
                 referenceImagesPayload.push({
                    image: { imageBytes: params.styleImage.base64, mimeType: params.styleImage.file.type },
                    referenceType: VideoGenerationReferenceType.STYLE,
                });
            }
            if (referenceImagesPayload.length > 0) {
                generateVideoPayload.config.referenceImages = referenceImagesPayload;
            }
        } else if (params.mode === GenerationMode.EXTEND_VIDEO) {
             if (params.inputVideoObject) {
                generateVideoPayload.video = params.inputVideoObject;
            } else {
                throw new Error('An input video object is required to extend a video.');
            }
        }

        // --- Start Generation & Polling ---
        let operation = await ai.models.generateVideos(generateVideoPayload);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        // --- Process Response ---
        const firstVideo = operation.response?.generatedVideos?.[0];
        const downloadLink = firstVideo?.video?.uri;

        if (!downloadLink) {
            throw new Error("Video generation succeeded but no download link was returned.");
        }
        
        const videoResponse = await fetch(`${downloadLink}&key=${GEMINI_API_KEY}`);
        if (!videoResponse.ok) {
            const errorBody = await videoResponse.text();
            throw new Error(`Failed to download generated video: ${videoResponse.statusText}. Details: ${errorBody}`);
        }
        
        const videoArrayBuffer = await videoResponse.arrayBuffer();
        // FIX: Replaced Node.js 'Buffer' with environment-agnostic 'btoa' to resolve type error.
        const uint8Array = new Uint8Array(videoArrayBuffer);
        let binaryString = '';
        uint8Array.forEach((byte) => {
            binaryString += String.fromCharCode(byte);
        });
        const videoBase64 = btoa(binaryString);
        const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;

        res.status(200).json({
            objectUrl: videoDataUrl,
            generatedVideo: firstVideo
        });

    } catch (error: any) {
        console.error('Video generation pipeline failed:', error);
        res.status(500).json({ error: 'Failed to generate video', details: error.message });
    }
}
