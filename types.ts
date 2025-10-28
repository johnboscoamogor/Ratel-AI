import { FunctionDeclaration } from '@google/genai';

// Represents a user's profile information
export interface UserProfile {
  name: string;
  email: string; // Used as a unique ID
  level: number;
  xp: number;
  interests: { [key in RatelMode]?: number };
  communityPoints: number;
  totalRedeemed?: number;
  joinedDate: string;
  isAdmin?: boolean;
  telegramUsername?: string;
}

// Defines the application's settings structure
export interface AppSettings {
  // FIX: Add 'ng' to the language union type to support Nigerian Pidgin.
  language: 'en' | 'fr' | 'am' | 'sw' | 'ng';
  chatTone: 'normal' | 'formal' | 'funny' | 'pidgin';
  customInstructions: {
    nickname: string;
    aboutYou: string;
    expectations: string;
  };
  appearance: {
    theme: 'light' | 'dark';
    backgroundImage: string; // URL or data URI
  };
  memory: {
    referenceSavedMemories: boolean;
    referenceChatHistory: boolean;
  };
  voice: {
    selectedVoice: string; // e.g., 'gemini_Zephyr' or a GCP voice ID
  };
  security: {
    mfaEnabled: boolean;
  };
  notifications: {
    pushEnabled: boolean;
  };
}

// Represents the different functional modes of the AI
// FIX: Added 'video' to the RatelMode type to support video generation context.
export type RatelMode = 'hustle' | 'learn' | 'market' | 'community' | 'general' | 'image' | 'audio' | 'video';

// Represents a single to-do task
export interface Task {
  id: string;
  description: string;
  completed: boolean;
  reminder?: string; // ISO 8601 string
  reminderFired?: boolean;
}

// FIX: Added Story and StoryScene types to resolve import errors.
// Represents a single scene in a generated story
export interface StoryScene {
  scene_index: number;
  narration_text: string;
  visual_prompt: string;
}

// Represents a generated story from the Storyteller Studio
export interface Story {
  id: string;
  prompt: string;
  title: string;
  script: {
    title: string;
    scenes: StoryScene[];
    lesson: string;
  };
  videoUrl: string;
  audioUrl: string;
  timestamp: number;
}

// Represents a single chat session in the history
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
  mode: RatelMode;
}

// Represents a single message within a chat session
// FIX: Added optional properties to handle context for video generation.
export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  parts: MessagePart[];
  timestamp: number;
  audioUrl?: string;
  ambianceUrl?: string;
  videoDialogue?: string;
  videoAmbiance?: string;
}

// Represents a part of a message (text, image, etc.)
export interface MessagePart {
  type: 'text' | 'image' | 'video' | 'audio' | 'tasks' | 'workers' | 'market' | 'error' | 'loading' | 'cv';
  content: any; // Can be a string for text, or an object for other types
  mimeType?: string; // For images/videos
  groundingChunks?: any[]; // For search grounding results
}

// Represents an item listed in the Market Square
export interface MarketItem {
  id: string;
  sellerId: string; // User's email
  sellerName: string;
  itemName: string;
  description: string;
  price: number;
  currency: 'NGN' | 'GHS' | 'KES' | 'USD';
  location: {
    country: string;
    state: string;
    city: string;
    area: string;
  };
  contactPhone: string;
  contactEmail: string;
  websiteUrl?: string;
  imageUrl: string;
  timestamp: number;
  isSold: boolean;
}

export interface MarketPayment {
    id: string;
    sellerId: string;
    transaction_ref: string;
    amount: number;
    currency: string;
    status: 'successful' | 'failed';
    created_at: string;
}

// Represents a post in the community feed
export interface CommunityPost {
    id: string;
    authorName: string;
    authorId: string; // User's email
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    likes: string[]; // Array of user emails who liked
    comments: Comment[];
    timestamp: number;
    source: 'ratel' | 'telegram';
}

// Represents a comment on a community post
export interface Comment {
    id: string;
    authorName: string;
    authorId: string; // User's email
    content: string;
    timestamp: number;
}

// Represents an entry in the community leaderboard
export interface LeaderboardEntry {
    email: string;
    name: string;
    points: number;
}

// Represents a request to redeem community points
export interface RedemptionRequest {
    id: string;
    userId: string;
    userName: string;
    telegramUsername?: string;
    amountPoints: number;
    amountCash: number;
    method: 'airtime' | 'bank';
    details: string; // Phone number or bank details
    status: 'pending' | 'approved' | 'rejected';
    timestamp: number;
}

// Represents settings for the community module manageable by an admin
export interface CommunityAdminSettings {
    enableTelegramNotifications: boolean;
}

// Represents a skilled mobile worker listing
export interface MobileWorker {
    id: string;
    user_id: string; // User's email
    full_name: string;
    phone_number: string;
    whatsapp_link?: string;
    skill_category: string;
    location: string;
    bio: string;
    profile_photo_url: string;
    verified: boolean;
    created_at: string;
}