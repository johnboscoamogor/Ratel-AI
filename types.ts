// FIX: Added all missing type definitions to resolve import errors across the application.
import { Modality, type LiveServerMessage, type Blob as GenaiBlob } from "@google/genai";
import { ai } from './services/geminiService';

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