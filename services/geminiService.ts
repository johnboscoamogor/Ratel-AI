import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';
import { taskTools } from '../constants';

// This robust check works for both Vercel (import.meta.env) and local AI Studio (process.env).
const API_KEY = (import.meta as any).env?.VITE_API_KEY || (typeof process !== 'undefined' && process.env['API_KEY']);


// Export a flag to check configuration status.
export const isGeminiConfigured = !!API_KEY;

// Conditionally create the client to avoid a hard crash on startup if the key is missing.
const aiClient = isGeminiConfigured ? new GoogleGenAI({ apiKey: API_KEY! }) : null;

if (!isGeminiConfigured) {
    console.warn("Gemini API key is not configured. Please set VITE_API_KEY in your environment variables.");
}

// Export the potentially null client.
export const ai = aiClient;


/**
 * Generates an image using the client-side SDK.
 */
export async function generateImage(prompt: string, aspectRatio: string): Promise<string> {
    if (!ai) throw new Error("Gemini API is not configured. Please set VITE_API_KEY in your environment variables.");
    
    // gemini-2.5-flash-image does not support aspectRatio config directly.
    // We can add it to the prompt as a hint.
    const fullPrompt = `${prompt}, aspect ratio ${aspectRatio}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

    if (imagePart?.inlineData) {
        return imagePart.inlineData.data;
    } else {
        const textPart = response.candidates?.[0]?.content?.parts.find(p => p.text);
        if (textPart?.text) throw new Error(`AI response: ${textPart.text}`);
        throw new Error("The AI did not return an image. Please try rephrasing your prompt.");
    }
}

/**
 * Edits an image using the client-side SDK.
 */
export async function editImage(image: { data: string; mimeType: string }, prompt: string): Promise<{ data: string; mimeType: string }> {
    if (!ai) throw new Error("Gemini API is not configured. Please set VITE_API_KEY in your environment variables.");
    // Construct a more detailed prompt to guide the AI towards higher quality results.
    const enhancedPrompt = `You are a professional photo editor. Your task is to apply the following edit to the image provided, ensuring the result is high-quality, photorealistic, and seamlessly integrated. The user's request is: "${prompt}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [ { inlineData: { data: image.data, mimeType: image.mimeType } }, { text: enhancedPrompt } ] },
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
    if (!ai) throw new Error("Gemini API is not configured. Please set VITE_API_KEY in your environment variables.");
    const chat = ai.chats.create({ model: 'gemini-flash-latest', config: { tools: taskTools }});
    const result = await chat.sendMessage({ message: searchTerm });
    const fc = result.functionCalls?.[0];
    
    return (fc && fc.name === 'findWorkers') ? fc.args as any : null;
}

/**
 * Applies an AR effect to an image frame using the client-side SDK.
 */
export async function generateArEffect(frame: { data: string; mimeType: string }, prompt: string): Promise<{ data: string; mimeType: string }> {
    if (!ai) throw new Error("Gemini API is not configured. Please set VITE_API_KEY in your environment variables.");
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