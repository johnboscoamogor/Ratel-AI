// FIX: Export a global `ai` instance to be used by client-side components.
// This resolves import errors in ChatView, MobileWorkersStudio, and VideoArStudio.
// The coding guidelines state to assume `process.env.API_KEY` is available.
import { GoogleGenAI } from '@google/genai';

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// This file is now a client for our own backend API routes, 
// which securely handle the Gemini API key on the server.

/**
 * Sends a chat message to the backend for processing.
 * Handles streaming responses.
 */
export async function streamChat(
    history: any[], 
    message: string, 
    image: { data: string, mimeType: string } | undefined,
    systemInstruction: string,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, message, image, systemInstruction }),
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
 * Generates a title for a chat.
 */
export async function generateTitle(prompt: string): Promise<string> {
     const response = await fetch('/api/gemini/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate title");
    }
    const data = await response.json();
    return data.text;
}

/**
 * Generates an image.
 */
export async function generateImage(prompt: string, aspectRatio: string): Promise<string> {
    const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
    }
    const data = await response.json();
    return data.base64Image;
}

/**
 * Edits an image.
 */
export async function editImage(image: { data: string; mimeType: string }, prompt: string): Promise<{ data: string; mimeType: string }> {
    const response = await fetch('/api/gemini/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, prompt }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to edit image");
    }
    return await response.json();
}