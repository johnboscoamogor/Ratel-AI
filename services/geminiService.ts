import { GoogleGenAI } from '@google/genai';

// Initialize the Google AI client as per the project guidelines.
// The API key is expected to be available in the process.env.API_KEY environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export { ai };
