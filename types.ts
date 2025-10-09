// Enums for specific roles and modes
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export type RatelMode = 'hustle' | 'learn' | 'market' | 'community' | 'general';
export type RatelTone = 'normal' | 'funny' | 'pidgin';

// Core message structure
export interface Message {
  id: string;
  role: Role;
  content: string;
  imageUrl?: string;
  originalImageUrl?: string; // For user-uploaded images before processing
  imagePrompt?: string;
  videoUrl?: string;
  videoPrompt?: string;
  tasks?: Task[];
  sources?: { uri: string; title: string }[];
}

// Represents a single chat conversation
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

// Task structure for the to-do list feature
export interface Task {
  id: string;
  description: string;
  completed: boolean;
}

// User profile and progress
export interface UserProfile {
  name: string;
  email: string;
  level: number;
  xp: number;
  communityPoints: number;
  interests: Partial<Record<RatelMode, number>>; // Tracks usage of different modes
  joinedDate: string;
  telegramUsername?: string;
  isAdmin?: boolean;
}

// Application settings structure
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


// Community Feature Types
export interface Comment {
    id: string;
    authorName: string;
    authorId: string; // user's email
    content: string;
    timestamp: number;
}

export interface CommunityPost {
    id: string;
    authorName: string;
    authorId: string; // user's email
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