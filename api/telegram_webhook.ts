/**
 * NOTE: To deploy this, deploy your project to Vercel.
 * You must set the Gemini and Telegram API keys as environment variables in your Vercel project settings:
 * - API_KEY="YOUR_GEMINI_API_KEY"
 * - TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN"
 * Your webhook URL will be https://your-app.vercel.app/api/telegram_webhook
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

// --- CONFIGURATION ---
// Access environment variables set in Vercel project settings
const API_KEY = process.env.API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// --- INITIALIZE GEMINI AI ---
let ai: GoogleGenAI;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("API_KEY is not set in Vercel environment variables.");
}

// --- DATABASE SIMULATION ---
// In a real application, these functions would interact with a database like Firebase Firestore or Vercel Postgres.
const db_simulation = {
    getLeaderboard: async () => {
        // TODO: Replace with your actual database call
        return [
            { username: 'johnbosco', points: 120 },
            { username: 'ratelfam', points: 90 },
            { username: 'creativeboy', points: 80 },
            { username: 'hustler_1', points: 75 },
            { username: 'learner_bee', points: 60 },
        ];
    },
    getUserPoints: async (userId: number) => {
        // TODO: Replace with your actual database call
        console.log(`Fetching points for user ID: ${userId}`);
        return 50; // Return a static value
    },
    savePost: async (userId: number, username: string, text: string) => {
        // TODO: Replace with your actual database call
        console.log(`Saving post for user ${username} (${userId}): "${text}"`);
        await db_simulation.addUserPoints(userId, 10);
        return { success: true };
    },
    addUserPoints: async (userId: number, points: number) => {
        // TODO: Replace with your actual database call
        console.log(`Adding ${points} points to user ID: ${userId}`);
        return { success: true };
    }
};

// --- TELEGRAM HELPER ---
const sendMessage = async (chatId: number, text: string) => {
    if (!TELEGRAM_BOT_TOKEN) {
        console.error("Telegram Bot Token is not configured.");
        return;
    }
    const url = `${TELEGRAM_API_URL}/sendMessage`;
    const payload = { chat_id: chatId, text };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const json = await response.json();
        if (!response.ok) {
            console.error('Telegram API Error:', json);
        }
    } catch (error) {
        console.error('Error sending message to Telegram:', error);
    }
};


// --- GEMINI AI HELPER ---
const getGeminiReply = async (prompt: string): Promise<string> => {
    if (!ai) {
        return "Sorry, my AI brain is taking a break right now. Please try again later.";
    }
    try {
        const systemInstruction = `You are Ratel AI, a helpful and friendly assistant for the "Ratel Community" Telegram group, which serves a diverse African audience. Your primary goal is to be engaging and supportive.
**CRITICAL RULE:** You MUST detect the language of the user's message and respond in the SAME language.
- If the user writes in English, you reply in clear, friendly English.
- If the user writes in Nigerian Pidgin, you reply in fluent, casual Nigerian Pidgin.
- If the user writes in another language like French or Swahili, you reply in that language.
Maintain a friendly, casual, and helpful tone across all languages. Keep your replies concise.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating content with Gemini:", error);
        return "Sorry, it seems there's a network issue. I can't process your request right now. Please try again later.";
    }
};


// --- MAIN WEBHOOK FUNCTION ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }

    const update = req.body;
    console.log("Received update from Telegram:", JSON.stringify(update));

    const message = update.message;
    if (!message) {
        res.status(200).send("OK");
        return;
    }

    const chatId = message.chat.id;
    const from = message.from;
    const text = message.text || '';

    // Handle New Users Joining
    if (message.new_chat_members && message.new_chat_members.length > 0) {
        const newMember = message.new_chat_members[0];
        const welcomeText = `Welcome to the Ratel AI Family, @${newMember.username || newMember.first_name}! We're happy to have you here. Type /help to see how you can interact.`;
        await sendMessage(chatId, welcomeText);
        res.status(200).send("OK");
        return;
    }

    // Handle Commands
    if (text.startsWith('/')) {
        const [command, ...args] = text.split(' ');
        const postContent = args.join(' ');

        switch (command) {
            case '/start':
                await sendMessage(chatId, "🔥 Welcome to Ratel AI Family! Type /help to see what I can do.");
                break;

            case '/help':
                await sendMessage(chatId, "Available commands:\n/post <your message> - Share ideas with the community.\n/rank - View the weekly leaderboard.\n/reward - Check your points balance.");
                break;

            case '/rank':
                const leaderboard = await db_simulation.getLeaderboard();
                const rankText = "🏆 Top Ratel AI Members:\n" +
                                 leaderboard.map((user, index) => `${index + 1}. @${user.username} – ${user.points}pts`).join('\n');
                await sendMessage(chatId, rankText);
                break;

            case '/reward':
                const points = await db_simulation.getUserPoints(from.id);
                await sendMessage(chatId, `You currently have ${points} Ratel Points 🎁 Keep engaging to earn more!`);
                break;
                
            case '/post':
                if (postContent) {
                    await db_simulation.savePost(from.id, from.username || from.first_name, postContent);
                    await sendMessage(chatId, "Thanks for sharing! Your post is now live in the Ratel AI community feed and you've earned 10 points.");
                } else {
                    await sendMessage(chatId, "To share a post, type /post followed by your message. For example: /post I just learned how to use Canva!");
                }
                break;

            default:
                await sendMessage(chatId, "Sorry, I don't recognize that command. Type /help to see what I can do.");
                break;
        }
    } else {
        // Handle Casual Chat with Gemini
        const aiReply = await getGeminiReply(text);
        await sendMessage(chatId, aiReply);
    }

    res.status(200).send("OK");
}