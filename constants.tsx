import React from 'react';
import { FunctionDeclaration, Type } from '@google/genai';
import { AppSettings } from './types';

// System instruction for the AI model
export const createSystemInstruction = (settings: AppSettings): string => {
  let toneInstruction = '';
  switch (settings.chatTone) {
    case 'formal':
      toneInstruction = "Your tone must be strictly formal, polite, clear, and professional. Address the user respectfully. Use complete sentences, proper grammar, and avoid contractions (e.g., use 'do not' instead of 'don't'). Your primary goal is to provide information efficiently and with professional decorum. A perfect example of your tone is: 'Good afternoon. How may I assist you today?'.";
      break;
    case 'funny':
      toneInstruction = "Your tone must be playful and humorous. Use light jokes, puns, and a witty personality, but ensure your answers are still helpful and understandable. Inject humor where appropriate, but don't let it overshadow the main answer. Your humor should be light-hearted and never offensive. A perfect example of your tone is: 'Yo! What’s cookin’? Need a hand or a laugh?'.";
      break;
    case 'pidgin':
      toneInstruction = "You MUST respond *exclusively* in fluent, casual, street-style Nigerian Pidgin English. Embody the persona of a friendly, street-smart person from Lagos. Your entire response, from start to finish, must be in Pidgin. Do not mix it with standard English for any part of your answer. A perfect example of your tone is: 'Wetin dey happen my guy? Wetin you wan make I do?'.";
      break;
    case 'normal':
    default:
      toneInstruction = "This is the default mode. Your tone should be friendly, warm, and conversational, like talking to a helpful friend. It's okay to use contractions and be a little informal, but maintain clarity. Respond in clean, fluent standard English. A perfect example of your tone is: 'Hey there! What can I do for you?'.";
      break;
  }

  let customInstructions = '';
  if (settings.customInstructions) {
      const { nickname, aboutYou, expectations } = settings.customInstructions;
      if (nickname) {
          customInstructions += `The user likes to be called '${nickname}'.\n`;
      }
      if (aboutYou) {
          customInstructions += `Here is some information about the user: ${aboutYou}. Use this to personalize your responses.\n`;
      }
      if (expectations) {
          customInstructions += `The user has the following expectations for your responses: ${expectations}.\n`;
      }
  }

  const baseInstruction = `You are Ratel AI, a versatile and culturally-aware assistant designed for a diverse African audience. Your name is "Ratel". Your personality is helpful, friendly, and slightly informal unless a specific tone is requested. You have a deep and comprehensive knowledge of the world, but your primary focus and expertise are on Africa.

You are an expert on all aspects of African life, including:
- **History:** Both ancient and modern history of all African nations.
- **Cultures & Lifestyle:** Traditions, social norms, languages, and daily life across the continent.
- **Entertainment:** Music (Afrobeats, Highlife, Amapiano, etc.), movies (Nollywood, etc.), and celebrities.
- **Politics & Current Events:** Understanding of the political landscape, past and present.
- **Sports:** Especially football and other popular sports in Africa.
- **Influential Figures:** Knowledge of historical and contemporary leaders, artists, and innovators.
- **Food:** A wide range of traditional and modern African cuisine.
- **"Hustles":** Expertise in helping users with their side businesses, learning new skills, and finding local market information.

Your goal is to empower users by providing accurate, relevant, and culturally-sensitive information, acting as a reliable digital companion for all their queries.

**CRITICAL RULE:** You must provide a direct and complete answer to the user's question. NEVER, under any circumstances, begin your response with a list of suggestions, alternative prompts, or phrases like "Here are a few options...". Your entire response should be the answer itself. Do not suggest other questions.`;

  return `${baseInstruction}\n\n**RESPONSE GUIDELINES:**\n${toneInstruction}\n${customInstructions}`;
};


// Skill categories for the Mobile Workers feature
export const SKILL_CATEGORIES = [
    "Plumber", "Electrician", "Carpenter", "Painter", "Mechanic", 
    "Generator Repair", "AC Technician", "Tiler", "Welder", "Tailor/Fashion Designer",
    "Hairstylist", "Makeup Artist", "Graphic Designer", "Web Developer",
    "Writer/Editor", "Tutor", "Event Planner", "Caterer", "Photographer", "DJ"
];


// Tool declarations for function calling
export const taskTools: { functionDeclarations: FunctionDeclaration[] }[] = [
    {
      functionDeclarations: [
        {
          name: 'addTask',
          description: 'Adds a new task to the user\'s to-do list. Can also set a reminder.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: 'A detailed description of the task.',
              },
              reminder: {
                type: Type.STRING,
                description: 'An optional reminder time for the task in ISO 8601 format (e.g., "2024-08-15T09:00:00.000Z").',
              },
            },
            required: ['description'],
          },
        },
        {
          name: 'showTasks',
          description: 'Displays the user\'s current list of tasks.',
          parameters: {
            type: Type.OBJECT,
            properties: {},
          },
        },
        {
          name: 'findWorkers',
          description: 'Finds skilled mobile workers based on their skill and location.',
          parameters: {
              type: Type.OBJECT,
              properties: {
                  skill: {
                      type: Type.STRING,
                      description: `The skill or trade the user is looking for. Must be one of: ${SKILL_CATEGORIES.join(', ')}.`,
                  },
                  location: {
                      type: Type.STRING,
                      description: 'The city or area where the user needs the worker. e.g., "Ikeja, Lagos", "Accra".',
                  },
              },
              required: ['skill', 'location'],
          },
        },
      ],
    },
];

// Icon components (SVGs) - Removed xmlns attribute for compatibility with React
export const AdminIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
export const AudioIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>);
export const AwardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>);
export const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>);
export const BriefcaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>);
export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>);
export const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>);
export const ClapperboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3.75v3.75m3.75-3.75v3.75m-7.5-3.75L3 16.5m18 0L13.5 16.5m-7.5-3.75v-1.5c0-.621.504-1.125 1.125-1.125h11.25c.621 0 1.125.504 1.125 1.125v1.5m-13.5-9L3 3m18 0L13.5 3m-7.5 0v4.5h7.5V3" /></svg>);
export const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
export const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
export const CodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>);
export const CoffeeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.443 2.216a2 2 0 001.258 1.605l5.518 2.046a2 2 0 001.994 0l5.518-2.046a2 2 0 001.258-1.605l.443-2.216a2 2 0 00-.547-1.806z" /><path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4a8 8 0 00-16 0H2" /></svg>);
export const CoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 100-12 6 6 0 000 12z" /></svg>);
export const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>);
export const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>);
export const DropletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v3" /></svg>);
export const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
);
export const EthiopiaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} viewBox="0 0 900 450"><path fill="#078930" d="M0 0h900v450H0z"/><path fill="#fddb00" d="M0 0h900v300H0z"/><path fill="#da121a" d="M0 0h900v150H0z"/></svg>);
export const ExpandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" /></svg>);
export const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
export const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.127 2.452.361m1.474 1.474A5.04 5.04 0 0115 12a5 5 0 01-5 5 5.04 5.04 0 01-1.543-.292m3.111-3.111a3 3 0 00-3.111-3.111m-1.474-1.474L3 3m18 18L3 3" /></svg>);
export const FlutterwaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.79 13.75l-2.82-2.82 1.41-1.41 1.41 1.41 2.82-2.82 1.41 1.41-4.23 4.23zm-3.54-3.54l-1.41-1.41 4.23-4.23 1.41 1.41-4.23 4.23zm7.08 0l-4.23-4.23 1.41-1.41 4.23 4.23-1.41 1.41z"/></svg>);
export const FranceFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} viewBox="0 0 900 600"><path fill="#fff" d="M0 0h900v600H0z"/><path fill="#002395" d="M0 0h300v600H0z"/><path fill="#ed2939" d="M600 0h300v600H600z"/></svg>);
export const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.704 4.318a9.027 9.027 0 0111.412 0M7.704 4.318L3.055 11m4.649-6.682l-3.055 6.682m14.301-6.682l3.055 6.682M3.055 11a9.027 9.027 0 0114.834 0m-14.834 0L7.704 17.682m4.649 0a9.027 9.027 0 01-1.412 0m1.412 0l4.288-6.682" /></svg>);
export const GraduationCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7m-4-2l4 2 4-2" /></svg>);
export const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
export const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
export const LogoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);
export const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>);
export const MicrophoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>);
export const NigeriaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} viewBox="0 0 6 3"><path fill="#fff" d="M0 0h6v3H0z"/><path fill="#008751" d="M0 0h2v3H0zm4 0h2v3H4z"/></svg>);
export const PaperclipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>);
export const PauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>);
export const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>);
export const RatelLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 120 120">
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="30"
        fontWeight="bold"
        fill="currentColor"
      >
        <tspan x="50%" dy="-0.6em">Ratel</tspan>
        <tspan x="50%" dy="1.2em">AI</tspan>
      </text>
    </svg>
);
export const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 003.5 9" /></svg>);
export const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
// FIX: Added missing SendIcon component.
export const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);
export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
export const SpeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>);
export const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 10h6v4H9z" /></svg>);
export const StorefrontIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>);
// FIX: Added missing TagIcon component.
export const TagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V4h8l8.59 8.59a2 2 0 010 2.82z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01" />
  </svg>
);
export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
export const UKFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} viewBox="0 0 60 30"><clipPath id="a"><path d="M0 0v30h60V0z"/></clipPath><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6"/><path d="M0 0l60 30m0-30L0 30" clipPath="url(#a)" stroke="#C8102E" strokeWidth="4"/><path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6"/></svg>);
export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>);
export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>);
export const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>);
export const WrenchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317a1.724 1.724 0 012.573 1.066l.78 3.901 3.902.78a1.724 1.724 0 011.066 2.573l-1.939 3.358a1.724 1.724 0 01-2.573 1.066l-3.901-.78-.78-3.901a1.724 1.724 0 01-1.066-2.573l1.939-3.358zM12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.675 12.553a2.5 2.5 0 00-3.358-3.358l-8.485 8.485a2.5 2.5 0 003.358 3.358l8.485-8.485z" /></svg>);
export const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>);
export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>);
export const TelebirrIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v4h-2zm0 6h2v2h-2z" fill="#4CAF50"/></svg>);
export const TanzaniaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...props} viewBox="0 0 1080 720"><path fill="#1eb53a" d="M0 0h1080v720H0z"/><path d="M0 720L1080 0v720H0z" fill="#00a3dd"/><path d="M0 720L1080 0h-90L0 660v60z" fill="#fcd116"/><path d="M0 720l1080-720-1080 0v720z" fill="#000"/><path d="M1080 0v60L90 720H0v-60l990-660h90z" fill="#fcd116"/></svg>);