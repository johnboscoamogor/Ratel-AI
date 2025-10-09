import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import ConfirmationDialog from './ConfirmationDialog';
import ImageStudio from './ImageStudio';
import AudioStudio from './AudioStudio';
import VideoStudio from './VideoStudio';
import LanguageSwitcher from './LanguageSwitcher';
import SupportModal from './SupportModal';
import ProModal from './ProModal';
import HustleStudio from './HustleStudio';
import LearnStudio from './LearnStudio';
import ProfileStudio from './ProfileStudio';
import MarketStudio from './MarketStudio';
import { Message, Role, ChatSession, AppSettings, Task, UserProfile, RatelMode, RatelTone } from '../types';
import { ai } from '../services/geminiService';
import { SYSTEM_INSTRUCTION, taskTools, CoffeeIcon, MenuIcon, ChevronDownIcon } from '../constants';
import { GenerateContentResponse, Modality, Chat, FunctionCallPart, Part, ContentUnion } from '@google/genai';
import { playSound, generateAudioBlob, getAvailableVoices, cancelCurrentAudioGeneration } from '../services/audioService';
import { useTranslation } from 'react-i18next';

interface ChatViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setPage: (page: 'chat' | 'settings' | 'contact' | 'community' | 'admin') => void;
  onLogout: () => void;
  addXp: (points: number) => void;
  trackInterest: (mode: RatelMode) => void;
  onLevelUp: (newLevel: number, newXp: number) => Promise<void>;
}

const MAX_MESSAGES_PER_CHAT_HISTORY = 50;

const sanitizeHistoryForStorage = (history: ChatSession[]): ChatSession[] => {
  return history.map(chat => {
    // Take the last N messages to prevent excessively long histories
    const recentMessages = chat.messages.slice(-MAX_MESSAGES_PER_CHAT_HISTORY);

    // Remove large data fields that don't need to be persisted or are temporary
    const sanitizedMessages = recentMessages.map(({ imageUrl, originalImageUrl, videoUrl, ...rest }) => rest);

    return { ...chat, messages: sanitizedMessages };
  });
};


const ChatView: React.FC<ChatViewProps> = ({ userProfile, setUserProfile, settings, setSettings, setPage, onLogout, addXp, trackInterest, onLevelUp }) => {
  const { t } = useTranslation();
  const [allHistory, setAllHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewChatConfirmOpen, setIsNewChatConfirmOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Studio Modals State
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [imageStudioInitialPrompt, setImageStudioInitialPrompt] = useState<string | undefined>();
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState(false);
  const [isVideoStudioOpen, setIsVideoStudioOpen] = useState(false);
  const [videoStudioInitialPrompt, setVideoStudioInitialPrompt] = useState<string | undefined>();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isHustleStudioOpen, setIsHustleStudioOpen] = useState(false);
  const [isLearnStudioOpen, setIsLearnStudioOpen] = useState(false);
  const [isProfileStudioOpen, setIsProfileStudioOpen] = useState(false);
  const [isMarketStudioOpen, setIsMarketStudioOpen] = useState(false);
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const isInitialMount = useRef(true);
  const chatAudioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const toneDropdownRef = useRef<HTMLDivElement>(null);


  // 1. Initial Load from localStorage (History & Tasks)
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('ratel_chat_history');
      if (savedHistory) {
        const history: ChatSession[] = JSON.parse(savedHistory);
        setAllHistory(history);
        const lastChat = history[0];
        if (lastChat) {
          setCurrentChatId(lastChat.id);
        }
      }
      const savedTasks = localStorage.getItem('ratel_tasks');
      if(savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (e) { 
      console.error("Failed to load user data", e); 
    }
  }, []); // Runs only once

  // 2. Save all history & tasks to localStorage when they change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      const sanitizedHistory = sanitizeHistoryForStorage(allHistory);
      localStorage.setItem('ratel_chat_history', JSON.stringify(sanitizedHistory));
      localStorage.setItem('ratel_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save data", e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert("Could not save chat history because storage is full. Please consider clearing some older conversations.");
      }
    }
  }, [allHistory, tasks]);

  // 3. Load messages when the current chat ID changes and cancel any ongoing speech
  useEffect(() => {
    handleStopAudio();
    const currentChat = allHistory.find(c => c.id === currentChatId);
    if (currentChat) {
      setMessages(currentChat.messages);
    } 
    else if (currentChatId === null) {
      setMessages([]);
    }
  }, [currentChatId, allHistory]);

  // 4. Create and configure a new chat session when settings or chat ID change
  useEffect(() => {
    const { customInstructions, language, chatTone } = settings;
    
    let languageInstruction = '';
    switch (language) {
        case 'fr': languageInstruction = 'You must respond in French.'; break;
        case 'am': languageInstruction = 'You must respond in Amharic.'; break;
        case 'ng': languageInstruction = 'You must respond in Nigerian Pidgin.'; break;
        case 'sw': languageInstruction = 'You must respond in Swahili.'; break;
        default: languageInstruction = 'You must respond in English.';
    }

    let toneInstruction = '';
    switch (chatTone) {
        case 'funny': toneInstruction = `Your current style is Funny. Inject light-hearted, culturally relevant Nigerian humor into your responses. Be witty but still helpful.`; break;
        case 'pidgin': toneInstruction = `Your current style is Pidgin. You MUST rewrite all your responses in fluent, friendly Nigerian Pidgin English. Be relatable, use humor, and act like a helpful 'padi'. For example, instead of 'Hello', say 'Wetin dey sup?'`; break;
    }

    const personalizedInstruction = [
        SYSTEM_INSTRUCTION,
        languageInstruction,
        toneInstruction,
        `The user's name is ${userProfile.name}. Address them by their name when appropriate, like 'Alright, ${userProfile.name}' when starting a major new task.`,
        customInstructions.aboutYou ? `The user has provided this info about themself: ${customInstructions.aboutYou}` : '',
        customInstructions.expectations ? `The user expects this: ${customInstructions.expectations}` : '',
    ].filter(Boolean).join('\n\n');
    
    const currentMessages = allHistory.find(c => c.id === currentChatId)?.messages || [];
    const historyForAPI = currentMessages.map(msg => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.content }], // Simplified for history
    }));

    chatSessionRef.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: personalizedInstruction,
        tools: taskTools,
      },
      history: historyForAPI,
    });
  }, [currentChatId, settings, userProfile.name]);


  // 5. Save messages to allHistory after a stream is complete
  useEffect(() => {
    if (!isLoading && currentChatId) {
      setAllHistory(prev => {
        const newHistory = [...prev];
        const chatIndex = newHistory.findIndex(c => c.id === currentChatId);

        if (chatIndex !== -1) {
          newHistory[chatIndex].messages = messages;
           if(newHistory[chatIndex].messages.length <= 2) {
             const firstUserMessage = messages.find(m => m.role === Role.USER);
             if (firstUserMessage) {
                 newHistory[chatIndex].title = firstUserMessage.content.length > 30 ? firstUserMessage.content.substring(0, 27) + '...' : firstUserMessage.content
             }
           }
        } else if (messages.length > 0) {
          const firstUserMessage = messages.find(m => m.role === Role.USER);
          const newTitle = firstUserMessage ? (firstUserMessage.content.length > 30 ? firstUserMessage.content.substring(0, 27) + '...' : firstUserMessage.content) : "New Chat";
          newHistory.unshift({ id: currentChatId, title: newTitle, messages: messages });
        }
        
        return newHistory;
      });
    }
  }, [isLoading, messages, currentChatId]);
  
  // 6. Setup and cleanup for chat audio element & dropdowns
  useEffect(() => {
    chatAudioRef.current = new Audio();
    const audioElement = chatAudioRef.current;
    
    const handlePlaybackEnd = () => setSpeakingMessageId(null);
    audioElement.addEventListener('ended', handlePlaybackEnd);
    audioElement.addEventListener('error', handlePlaybackEnd);
    window.speechSynthesis.cancel();

    const handleClickOutside = (event: MouseEvent) => {
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(event.target as Node)) {
        setIsToneDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
        audioElement.removeEventListener('ended', handlePlaybackEnd);
        audioElement.removeEventListener('error', handlePlaybackEnd);
        audioElement.pause();
        audioElement.src = '';
        window.speechSynthesis.cancel();
        document.removeEventListener('mousedown', handleClickOutside);
        
        const [voiceType, voiceName] = settings.voice.selectedVoice.split('_');
        if (voiceType === 'gemini') cancelCurrentAudioGeneration(voiceName);
    };
  }, [settings.voice.selectedVoice]);

  // 7. Dynamic meta tags
  useEffect(() => {
    // ... (omitted for brevity, no changes)
  }, [currentChatId, allHistory, t]);

    const handleLevelUpMessage = async (newLevel: number) => {
        const prompt = `The user has just reached Level ${newLevel}! Generate a short, exciting, and congratulatory message for them. Be very motivational and use celebratory emojis. Mention their new level by name.`;
        const modelResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const levelUpMessage: Message = {
            id: crypto.randomUUID(),
            role: Role.MODEL,
            content: modelResponse.text,
        };
        setMessages(prev => [...prev, levelUpMessage]);
    };

    useEffect(() => {
        const checkLevelUp = async () => {
            const xpForNextLevel = userProfile.level * 100;
            if (userProfile.xp >= xpForNextLevel) {
                // This logic is now in App.tsx, we just need to react to the change.
                // A simple way is to detect the level change and fire the message.
            }
        };
        checkLevelUp();
    }, [userProfile.xp, userProfile.level]);
    
    const prevLevelRef = useRef(userProfile.level);
    useEffect(() => {
        if (userProfile.level > prevLevelRef.current) {
            handleLevelUpMessage(userProfile.level);
            prevLevelRef.current = userProfile.level;
        }
    }, [userProfile.level]);


  const handleLanguageChange = (lang: 'en' | 'fr' | 'am' | 'ng' | 'sw') => {
    setSettings(prev => ({ ...prev, language: lang }));
  };
  
  const handleToneChange = (tone: RatelTone) => {
    setSettings(prev => ({ ...prev, chatTone: tone }));
    setIsToneDropdownOpen(false);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prevTasks => {
        const newTasks = prevTasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        setMessages(prevMessages => prevMessages.map(msg => {
            if (msg.tasks) return { ...msg, tasks: newTasks };
            return msg;
        }));
        return newTasks;
    });
  };

  const handleGenerateImage = async (prompt: string, aspectRatio: string) => {
    // ... (omitted for brevity, no changes)
  };

  const handleEditImage = async (image: { data: string; mimeType: string }, prompt: string) => {
    // ... (omitted for brevity, no changes)
  };

  const handleGenerateVideo = async (prompt: string, config: { aspectRatio: string; videoQuality: 'standard' | 'high'; image?: { data: string; mimeType: string; } }) => {
    // ... (omitted for brevity, no changes)
  };

  const handleSendMessage = async (content: string, image?: { data: string; mimeType: string }, options?: { addXpPoints?: number, mode?: RatelMode }) => {
    if (isLoading || !chatSessionRef.current) return;

    let activeChatId = currentChatId;
    if (!activeChatId) {
      activeChatId = crypto.randomUUID();
      setCurrentChatId(activeChatId);
    }
    
    const userMessage: Message = { id: crypto.randomUUID(), role: Role.USER, content };
    if (image) {
      userMessage.originalImageUrl = `data:${image.mimeType};base64,${image.data}`;
    }

    playSound('send');
    setIsLoading(true);
    if(options?.mode) trackInterest(options.mode);

    const thinkingMessages = [t('common.thinking1'), t('common.thinking2'), t('common.thinking3')];
    const randomThinkingMessage = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
    const modelPlaceholderId = crypto.randomUUID();

    setMessages(prev => [...prev, userMessage, { id: modelPlaceholderId, role: Role.MODEL, content: randomThinkingMessage }]);
    
    try {
        const messagePayload: ContentUnion = image
          ? [ { text: content }, { inlineData: { data: image.data, mimeType: image.mimeType } } ]
          : content;

        const stream = await chatSessionRef.current.sendMessageStream({ message: messagePayload });
        
        let modelResponse = '';
        let isFirstChunk = true;
        const functionCalls: FunctionCallPart[] = [];
  
        for await (const chunk of stream) {
            if (isFirstChunk) {
                playSound('receive');
                modelResponse = chunk.text;
                isFirstChunk = false;
            } else {
                modelResponse += chunk.text;
            }

            if(chunk.functionCalls) functionCalls.push(...chunk.functionCalls);

            setMessages(prev => prev.map(msg => 
                msg.id === modelPlaceholderId ? { ...msg, content: modelResponse } : msg
            ));
        }
        
        if (functionCalls.length > 0) {
            const fc = functionCalls[0];
            let functionResponsePart: Part[] | null = null;
            
            if (fc.name === 'showTasks') {
                setMessages(prev => prev.map(msg =>
                    msg.id === modelPlaceholderId ? { ...msg, content: '', tasks: [...tasks] } : msg
                ));
                functionResponsePart = [{ functionResponse: { name: 'showTasks', response: { status: 'SUCCESS', tasks: tasks } } }];
            } else if (fc.name === 'addTask' && fc.args.description) {
                const newTask: Task = {
                    id: crypto.randomUUID(),
                    description: fc.args.description as string,
                    completed: false
                };
                setTasks(prev => [...prev, newTask]);
                functionResponsePart = [{ functionResponse: { name: 'addTask', response: { success: true, description: newTask.description } } }];
            }

            if (functionResponsePart) {
                const stream2 = await chatSessionRef.current.sendMessageStream({ message: functionResponsePart });
                let finalModelResponse = '';
                for await (const chunk of stream2) {
                     finalModelResponse += chunk.text;
                     setMessages(prev => prev.map(msg => 
                        msg.id === modelPlaceholderId ? { ...msg, content: finalModelResponse } : msg
                    ));
                }
            }
        }
        if(options?.addXpPoints) addXp(options.addXpPoints);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorContent = t('common.error');
      setMessages(prev => prev.map(msg => 
        msg.id === modelPlaceholderId ? { ...msg, content: errorContent } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Feature Mode Handlers ---
  const handleHustleRequest = (input: string) => {
    setIsHustleStudioOpen(false);
    const prompt = `I am in "Hustle Mode". My budget or skill is: "${input}". Please provide 3-5 realistic small business ideas for Nigeria. End your response with the exact question: "Do you want a step-by-step guide for one of these ideas?"`;
    handleSendMessage(prompt, undefined, { addXpPoints: 10, mode: 'hustle'});
  };

  const handleLearnRequest = (skill: string) => {
    setIsLearnStudioOpen(false);
    const prompt = `I am in "Learn Mode". My chosen skill is "${skill}". Provide Lesson 1 for me. Structure your response with three sections using markdown: a short "Lesson", 3 "Practice Tasks", and an inspiring "Motivation" quote. End with "Reply 'continue' for the next lesson tomorrow."`;
    handleSendMessage(prompt, undefined, { addXpPoints: 10, mode: 'learn'});
  };
  
  const handleMarketFindRequest = async (item: string, location: string) => {
    setIsMarketStudioOpen(false);
    if (isLoading) return;

    const prompt = `I am in "${location}". Find local markets, online vendors, or specific shops where I can buy "${item}". Provide a summary with names, locations, and any available tips. Focus on results within Africa, relevant to the specified location.`;

    let activeChatId = currentChatId;
    if (!activeChatId) {
        activeChatId = crypto.randomUUID();
        setCurrentChatId(activeChatId);
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: Role.USER, content: `Where can I find "${item}" in ${location}?` };

    playSound('send');
    setIsLoading(true);
    trackInterest('market');

    const thinkingMessages = [t('common.thinking1'), t('common.thinking2'), t('common.thinking3')];
    const randomThinkingMessage = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
    const modelPlaceholderId = crypto.randomUUID();

    setMessages(prev => [...prev, userMessage, { id: modelPlaceholderId, role: Role.MODEL, content: randomThinkingMessage }]);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        playSound('receive');

        const modelResponseText = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const uniqueSources = new Map<string, { uri: string; title: string }>();
        groundingChunks.forEach((chunk: any) => {
            if (chunk.web && chunk.web.uri) {
                uniqueSources.set(chunk.web.uri, {
                    uri: chunk.web.uri,
                    title: chunk.web.title || new URL(chunk.web.uri).hostname,
                });
            }
        });

        const sources = Array.from(uniqueSources.values());
        
        setMessages(prev => prev.map(msg =>
            msg.id === modelPlaceholderId
                ? { ...msg, content: modelResponseText, sources }
                : msg
        ));
        addXp(15);
    } catch (error) {
        console.error("Error with Market Finder:", error);
        const errorContent = t('common.error');
        setMessages(prev => prev.map(msg =>
            msg.id === modelPlaceholderId ? { ...msg, content: errorContent, sources: [] } : msg
        ));
    } finally {
        setIsLoading(false);
    }
};


  const handleNewChat = () => { if (messages.length > 0) setIsNewChatConfirmOpen(true); else setCurrentChatId(null); };
  const confirmNewChat = () => { setCurrentChatId(null); setIsNewChatConfirmOpen(false); };
  const cancelNewChat = () => setIsNewChatConfirmOpen(false);
  const handleClearChat = () => { if (!currentChatId || messages.length === 0) return; setAllHistory(prev => prev.map(chat => chat.id === currentChatId ? { ...chat, messages: [] } : chat )); };
  const handleDeleteChat = (id: string) => setChatToDelete(id);
  const confirmDeleteChat = () => { if(!chatToDelete) return; setAllHistory(prev => prev.filter(c => c.id !== chatToDelete)); if (currentChatId === chatToDelete) setCurrentChatId(null); setChatToDelete(null); };
  const handleRenameChat = (id: string, newTitle: string) => setAllHistory(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  const handleSelectChat = (id: string) => { setCurrentChatId(id); setIsSidebarOpen(false); };

  const handleStopAudio = () => { /* ... (omitted for brevity, no changes) */ };
  const handlePlayAudio = async (messageId: string, text: string) => { /* ... (omitted for brevity, no changes) */ };
  const handleDeleteMessage = (messageId: string) => setMessages(prev => prev.filter(msg => msg.id !== messageId));
  const handleEditPrompt = (prompt: string) => { setImageStudioInitialPrompt(prompt); setIsImageStudioOpen(true); };
  const handleEditVideoPrompt = (prompt: string) => { setVideoStudioInitialPrompt(prompt); setIsVideoStudioOpen(true); }
  const handleCloseImageStudio = () => { setIsImageStudioOpen(false); setImageStudioInitialPrompt(undefined); };
  const handleCloseVideoStudio = () => { setIsVideoStudioOpen(false); setVideoStudioInitialPrompt(undefined); }
  
  const mainStyle: React.CSSProperties = settings.appearance?.backgroundImage ? { backgroundImage: `linear-gradient(rgba(249, 250, 251, 0.85), rgba(249, 250, 251, 0.85)), url(${settings.appearance.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {};
  const toneLabels: Record<RatelTone, string> = { normal: t('tones.normal'), funny: t('tones.funny'), pidgin: t('tones.pidgin') };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        history={allHistory}
        currentChatId={currentChatId}
        userProfile={userProfile}
        isCurrentChatEmpty={messages.length === 0}
        isOpenOnMobile={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onClearChat={handleClearChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onOpenImageStudio={() => setIsImageStudioOpen(true)}
        onOpenAudioStudio={() => setIsAudioStudioOpen(true)}
        onOpenVideoStudio={() => setIsVideoStudioOpen(true)}
        onOpenHustleStudio={() => setIsHustleStudioOpen(true)}
        onOpenLearnStudio={() => setIsLearnStudioOpen(true)}
        onOpenMarketStudio={() => setIsMarketStudioOpen(true)}
        onOpenProfileStudio={() => setIsProfileStudioOpen(true)}
        onOpenProModal={() => setIsProModalOpen(true)}
        setPage={setPage}
        onLogout={onLogout}
      />
      <main style={mainStyle} className="flex-1 flex flex-col h-screen max-h-screen relative">
        <header className="flex items-center justify-between p-2 md:p-4 border-b border-gray-200 md:border-none bg-transparent">
            <button
                onClick={() => { playSound('click'); setIsSidebarOpen(true); }}
                className="p-2 rounded-full hover:bg-gray-100/50 md:hidden"
                aria-label={t('sidebar.openMenu')}
            >
                <MenuIcon className="w-6 h-6 text-gray-700"/>
            </button>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                 <div ref={toneDropdownRef} className="relative">
                    <button onClick={() => setIsToneDropdownOpen(p => !p)} className="flex items-center gap-2 bg-white/80 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100/80 transition">
                        <span>{toneLabels[settings.chatTone]}</span>
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    </button>
                    {isToneDropdownOpen && (
                        <div className="absolute top-full mt-2 w-36 bg-white rounded-md shadow-lg border border-gray-200">
                             {(Object.keys(toneLabels) as RatelTone[]).map(tone => (
                                <button key={tone} onClick={() => handleToneChange(tone)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    {toneLabels[tone]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <button
                    onClick={() => { playSound('click'); setIsSupportModalOpen(true); }}
                    className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:bg-gray-100 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                    aria-label={t('sidebar.supportUs')}
                >
                    <CoffeeIcon className="w-6 h-6 text-yellow-500" />
                </button>
                <LanguageSwitcher
                    currentLang={settings.language}
                    onChangeLang={handleLanguageChange}
                />
            </div>
        </header>

        <div className="flex-1 overflow-y-auto">
            <ChatWindow 
              messages={messages} 
              isLoading={isLoading}
              speakingMessageId={speakingMessageId}
              onPlayAudio={handlePlayAudio}
              onStopAudio={handleStopAudio}
              onDeleteMessage={handleDeleteMessage}
              onToggleTask={handleToggleTask}
              onSendSuggestion={handleSendMessage}
              onEditPrompt={handleEditPrompt}
              onEditVideoPrompt={handleEditVideoPrompt}
            />
        </div>
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} onNewChat={handleNewChat} />
        
        {isImageStudioOpen && <ImageStudio onClose={handleCloseImageStudio} onGenerate={handleGenerateImage} onEdit={handleEditImage} isLoading={isLoading} initialPrompt={imageStudioInitialPrompt} />}
        {isAudioStudioOpen && <AudioStudio onClose={() => setIsAudioStudioOpen(false)} />}
        {isVideoStudioOpen && <VideoStudio onClose={handleCloseVideoStudio} onGenerate={handleGenerateVideo} isLoading={isLoading} initialPrompt={videoStudioInitialPrompt} />}
        {isHustleStudioOpen && <HustleStudio onClose={() => setIsHustleStudioOpen(false)} onAction={handleHustleRequest} isLoading={isLoading} />}
        {isLearnStudioOpen && <LearnStudio onClose={() => setIsLearnStudioOpen(false)} onAction={handleLearnRequest} />}
        {isMarketStudioOpen && <MarketStudio onClose={() => setIsMarketStudioOpen(false)} onAction={handleMarketFindRequest} isLoading={isLoading} />}
        {isProfileStudioOpen && <ProfileStudio onClose={() => setIsProfileStudioOpen(false)} userProfile={userProfile} setUserProfile={setUserProfile} />}
        
        {isSupportModalOpen && <SupportModal onClose={() => setIsSupportModalOpen(false)} />}
        {isProModalOpen && <ProModal onClose={() => setIsProModalOpen(false)} />}
        
        <ConfirmationDialog isOpen={isNewChatConfirmOpen} onClose={cancelNewChat} onConfirm={confirmNewChat} title={t('dialogs.newChatTitle')} message={t('dialogs.newChatMessage')} confirmText={t('dialogs.newChatConfirm')} />
        <ConfirmationDialog isOpen={!!chatToDelete} onClose={() => setChatToDelete(null)} onConfirm={confirmDeleteChat} title={t('dialogs.deleteChatTitle')} message={t('dialogs.deleteChatMessage')} confirmText={t('dialogs.deleteChatConfirm')} confirmButtonClass="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500" />
      </main>
    </div>
  );
};

export default ChatView;