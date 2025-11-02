// This file is now a client for our own backend API routes,
// which securely handle the Gemini API key on the server.
// FIX: Import GoogleGenAI and export an `ai` instance for direct client-side usage.
import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';
import { taskTools } from '../constants';

// The API key is injected by the environment and is assumed to be available.
const API_KEY = process.env.API_KEY;


// This instance is for direct client-side calls as used in ChatView.tsx
// The API key is expected to be available in the client environment.
export const ai = new GoogleGenAI({ apiKey: API_KEY! });

/**
 * Sends a chat message to the backend for processing.
 * Handles streaming responses by returning the reader of the response body.
 */
export async function streamChat(
    history: any[],
    message: string,
    image: { data: string, mimeType: string } | undefined,
    systemInstruction: string,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const response = await fetch('/api/ratelai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', history, message, image, systemInstruction }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start chat stream.");
    }

    if (!response.body) {
        throw new Error("Response has no body");
    }

    return response.body.getReader();
}

/**
 * Generates a title for a chat by calling the backend.
 */
export async function generateTitle(prompt: string): Promise<string> {
     const response = await fetch('/api/ratelai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_text', prompt }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate title");
    }
    const data = await response.json();
    return data.text;
}

/**
 * Generates an image by calling the backend.
 */
export async function generateImage(prompt: string, aspectRatio: string): Promise<string> {
    const response = await fetch('/api/ratelai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_image', prompt, aspectRatio }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
    }
    const data = await response.json();
    return data.base64Image;
}

/**
 * Edits an image by calling the backend.
 */
export async function editImage(image: { data: string; mimeType: string }, prompt: string): Promise<{ data: string; mimeType: string }> {
    const response = await fetch('/api/ratelai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit_image', image, prompt }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to edit image");
    }
    return await response.json();
}

/**
 * Uses AI to find skilled workers via a backend function call.
 */
export async function findWorkersWithAi(searchTerm: string): Promise<{ skill: string; location: string } | null> {
    const chat = ai.chats.create({ model: 'gemini-flash-lite-latest', config: { tools: taskTools }});
    const result = await chat.sendMessage({ message: searchTerm });
    const fc = result.functionCalls?.[0];
    
    return (fc && fc.name === 'findWorkers') ? fc.args as any : null;
}

// FIX: Added missing generateArEffect function for the Video AR Studio.
/**
 * Applies an AR effect to an image frame by calling the backend.
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