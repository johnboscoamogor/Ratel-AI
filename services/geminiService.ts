// This file is now a client for our own backend API routes,
// which securely handle the Gemini API key on the server.
// FIX: Import GoogleGenAI and export an `ai` instance for direct client-side usage.
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// This instance is for direct client-side calls as used in ChatView.tsx
// The API key is expected to be available in the client environment.
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
    const response = await fetch('/api/gemini/chat', {
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
     const response = await fetch('/api/gemini/chat', {
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
    const response = await fetch('/api/gemini/chat', {
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
    const response = await fetch('/api/gemini/chat', {
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
    const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'find_workers', searchTerm }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to search for workers.");
    }
    const data = await response.json();
    return data.args || null;
}

// FIX: Added missing generateArEffect function for the Video AR Studio.
/**
 * Applies an AR effect to an image frame by calling the backend.
 */
export async function generateArEffect(frame: { data: string; mimeType: string }, prompt: string): Promise<{ data: string; mimeType: string }> {
    const response = await fetch('/api/gemini/ar-effect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame, prompt }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply AR effect");
    }
    return await response.json();
}