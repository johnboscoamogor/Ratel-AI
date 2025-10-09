// FIX: Removed circular import of 'Role' from './types'.
export enum Role {
  USER,
  MODEL,
}

export interface UserProfile {
  name: string;
  email: string;
  xp: number;
  level: number;
  interests: Record<string, number>;
  communityPoints: number;
  telegramUsername?: string;
}

export interface Task {
  id: string;
  description: string;
  completed: boolean;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  imageUrl?: string;
  originalImageUrl?: string;
  tasks?: Task[];
  imagePrompt?: string;
  videoUrl?: string;
  videoPrompt?: string;
  sources?: { uri: string; title: string }[];
}

export interface ChatSession {
  id:string;
  title: string;
  messages: Message[];
}

export interface Comment {
  id: string;
  authorName: string;
  authorId: string;
  content: string;
  timestamp: number;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likes: string[]; // Array of user emails/IDs
  comments: Comment[];
  timestamp: number;
  source?: 'ratel' | 'telegram';
}

export interface LeaderboardEntry {
    name: string;
    email: string;
    points: number;
}


export type RatelTone = 'normal' | 'funny' | 'pidgin';
export type RatelMode = 'hustle' | 'learn' | 'community' | 'market';

export interface AppSettings {
  customInstructions: {
    aboutYou: string;
    nickname: string;
    expectations: string;
  };
  memory: {
    referenceSavedMemories: boolean;
    referenceChatHistory: boolean;
  };
  notifications: {
    pushEnabled: boolean;
  };
  security: {
    mfaEnabled: boolean;
  };
  voice: {
    selectedVoice: string;
  };
  appearance: {
    backgroundImage: string;
  };
  language: 'en' | 'fr' | 'am' | 'ng' | 'sw';
  chatTone: RatelTone;
}
