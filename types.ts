// FIX: Added all missing type definitions to resolve import errors across the application.
import { Modality, type LiveServerMessage, type Blob as GenaiBlob } from "@google/genai";

export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export type RatelMode = 'hustle' | 'learn' | 'market' | 'general';
export type RatelTone = 'normal' | 'funny' | 'pidgin';

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  reminder?: string;
  reminderFired?: boolean;
}

export interface Story {
  id: string;
  prompt: string;
  title: string;
  script: {
    title: string;
    scenes: {
      sceneNumber: number;
      description: string;
      narration: string;
    }[];
    lesson: string;
  };
  videoUrl: string;
  audioUrl: string; // Blob URL
  timestamp: number;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  imageUrl?: string;
  originalImageUrl?: string; // for user uploads
  videoUrl?: string;
  tasks?: Task[];
  sources?: { uri: string; title: string }[];
  imagePrompt?: string; // The prompt used to generate an image
  videoPrompt?: string; // The prompt used to generate a video
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export interface UserProfile {
  name: string;
  email: string;
  level: number;
  xp: number;
  communityPoints: number;
  interests: { [key in RatelMode]?: number };
  joinedDate: string;
  isAdmin?: boolean;
  telegramUsername?: string;
  totalRedeemed?: number;
  stories?: Story[];
}

export interface AppSettings {
  language: 'en' | 'fr' | 'am' | 'ng' | 'sw';
  chatTone: RatelTone;
  customInstructions: {
    nickname: string;
    aboutYou: string;
    expectations: string;
  };
  appearance: {
    theme: 'light' | 'dark';
    backgroundImage: string;
  };
  memory: {
    referenceSavedMemories: boolean;
    referenceChatHistory: boolean;
  };
  voice: {
    selectedVoice: string;
  };
  security: {
    mfaEnabled: boolean;
  };
  notifications: {
    pushEnabled: boolean;
  };
}

export interface Comment {
    id: string;
    authorName: string;
    authorId: string; // user email
    content: string;
    timestamp: number;
}

export interface CommunityPost {
    id: string;
    authorName: string;
    authorId: string; // user email
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    likes: string[]; // array of user emails
    comments: Comment[];
    timestamp: number;
    source: 'ratel' | 'telegram';
}

export interface LeaderboardEntry {
    email: string;
    name: string;
    points: number;
}


export interface VoiceOption {
  id: string;
  name: string;
  type: 'gemini' | 'browser';
  voice?: SpeechSynthesisVoice;
}

export interface RedemptionRequest {
  id: string;
  userId: string; // user email
  userName: string;
  telegramUsername?: string;
  amountPoints: number;
  amountCash: number;
  method: 'airtime' | 'bank';
  details: string; // phone number or bank details
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface CommunityAdminSettings {
    enableTelegramNotifications: boolean;
}

export interface MarketItemLocation {
  country: string;
  state: string;
  city: string;
  area: string;
}

export interface MarketItem {
  id: string;
  sellerId: string; // user email
  sellerName: string;
  itemName: string;
  description: string;
  price: number;
  currency: 'NGN' | 'GHS' | 'KES' | 'USD';
  imageUrl: string;
  contactPhone: string;
  contactEmail: string;
  location: MarketItemLocation;
  timestamp: number;
  isSold?: boolean;
  websiteUrl?: string;
}

export interface MarketPayment {
  id: string;
  created_at: string;
  sellerId: string;
  transaction_ref: string;
  amount: number;
  currency: string;
  status: 'successful' | 'failed';
}