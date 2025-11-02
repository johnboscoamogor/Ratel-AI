import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';
import { taskTools } from '../constants';

// This robust check works for both Vercel (import.meta.env) and local AI Studio (process.env).
const API_KEY = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;

if (!API_KEY) {
    // This error will be thrown if the environment variable is not set by the platform.
    throw new Error("An API Key must be set. Please check your Vercel/environment variables.");
}

// This instance is for direct client-side calls.
export const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates an image using the client-side SDK.
 */
export async function generateImage(prompt: string, aspectRatio: string): Promise<string> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: aspectRatio as any }
    });
    return response.generatedImages[0].image.imageBytes;
}

/**
 * Edits an image using the client-side SDK.
 */
export async function editImage(image: { data: string; mimeType: string }, prompt: string): Promise<{ data: string; mimeType: string }> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [ { inlineData: { data: image.data, mimeType: image.mimeType } }, { text: prompt } ] },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

    if (imagePart?.inlineData) {
        return { data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType as string };
    } else {
        const textPart = response.candidates?.[0]?.content?.parts.find(p => p.text);
        if (textPart?.text) throw new Error(`AI response: ${textPart.text}`);
        throw new Error("The AI did not return an image. Please try rephrasing your prompt.");
    }
}


/**
 * Uses AI to find skilled workers via a client-side function call.
 */
export async function findWorkersWithAi(searchTerm: string): Promise<{ skill: string; location: string } | null> {
    const chat = ai.chats.create({ model: 'gemini-flash-lite-latest', config: { tools: taskTools }});
    const result = await chat.sendMessage({ message: searchTerm });
    const fc = result.functionCalls?.[0];
    
    return (fc && fc.name === 'findWorkers') ? fc.args as any : null;
}

/**
 * Applies an AR effect to an image frame using the client-side SDK.
 */
export async function generateArEffect(frame: { data: string; mimeType: string }, prompt: string): Promise<{ data: string; mimeType: string }> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [ { inlineData: { data: frame.data, mimeType: frame.mimeType } }, { text: prompt } ] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    
    if (response.promptFeedback?.blockReason) {
        throw new Error(`Request blocked due to ${response.promptFeedback.blockReason}. Please modify your prompt.`);
    }

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

    if (imagePart?.inlineData) {
        return { data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType as string };
    } else {
         const textPart = response.candidates?.[0]?.content?.parts.find(p => p.text);
         if (textPart?.text) throw new Error(`AI response: ${textPart.text}`);
        throw new Error("The AI did not return an image. Please try rephrasing your prompt.");
    }
}