import { GoogleGenAI } from '@google/genai';

// Initialize ai and apiKeyError as exportable variables.
let ai: GoogleGenAI | null = null;
let apiKeyError: string | null = null;

try {
    // Check for the existence of the API_KEY environment variable.
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set. Please add it to your Vercel project settings and redeploy.");
    }
    // Initialize the client if the key exists.
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (e) {
    // Catch any error during initialization and store the message.
    if (e instanceof Error) {
        apiKeyError = e.message;
        console.error("Gemini AI Initialization Error:", e.message);
    } else {
        apiKeyError = "An unknown error occurred during AI client initialization.";
        console.error("Gemini AI Initialization Error:", e);
    }
}

// Export both the client instance (which may be null) and the error message.
export { ai, apiKeyError };
