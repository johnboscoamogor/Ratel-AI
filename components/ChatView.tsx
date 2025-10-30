import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ImageStudio from './ImageStudio';
import AudioStudio from './AudioStudio';
import VeoStudio from './VeoStudio';
import HustleStudio from './HustleStudio';
import LearnStudio from './LearnStudio';
import MarketSquare from './MarketStudio';
import MobileWorkersStudio from './MobileWorkersStudio';
import ProfileStudio from './ProfileStudio';
import ProModal from './ProModal';
import SupportModal from './SupportModal';
import ExamplesStudio from './ExamplesStudio';
import ApiKeyModal from './ApiKeyModal';
import FeedbackModal from './FeedbackModal';
import { ChatSession, UserProfile, AppSettings, ChatMessage, MessagePart, RatelMode, Task } from '../types';
import { playSound } from '../services/audioService';
import { ai } from '../services/geminiService';
import { createSystemInstruction } from '../constants';

interface ChatViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setPage: (page: 'landing' | 'chat' | 'settings' | 'contact' | 'community' | 'admin' | 'examples') => void;
  onLogout: () => void;
  addXp: (points: number) => void;
  trackInterest: (mode: RatelMode) => void;
  onLevelUp: (newLevel: number, newXp: number) => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  userProfile, setUserProfile, settings, setSettings, setPage, onLogout, addXp, trackInterest, onLevelUp
}) => {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [showImageStudio, setShowImageStudio] = useState(false);
  const [showAudioStudio, setShowAudioStudio] = useState(false);
  const [showVeoStudio, setShowVeoStudio] = useState(false);
  const [showHustleStudio, setShowHustleStudio] = useState(false);
  const [showLearnStudio, setShowLearnStudio] = useState(false);
  const [showMarketSquare, setShowMarketSquare] = useState(false);
  const [showMobileWorkersStudio, setShowMobileWorkersStudio] = useState(false);
  const [showProfileStudio, setShowProfileStudio] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [proModalMessage, setProModalMessage] = useState<string | undefined>(undefined);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showExamplesStudio, setShowExamplesStudio] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [initialStudioData, setInitialStudioData] = useState<any>({});
  
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const chatSessionsRef = useRef<Map<string, any>>(new Map());
  const postKeySelectionAction = useRef<(() => void) | null>(null);
  const [isApiKeyKnownValid, setIsApiKeyKnownValid] = useState(true);

  const ensureApiKey = async (action: () => void) => {
    try {
        // @ts-ignore
        if (!window.aistudio || typeof window.aistudio.hasSelectedApiKey !== 'function') {
          // Fallback for environments where the aistudio helper isn't available
          action();
          return;
        }

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("API key check timed out after 3 seconds.")), 3000)
        );

        // @ts-ignore
        const hasKey = await Promise.race([
            window.aistudio.hasSelectedApiKey(),
            timeoutPromise
        ]);

        if (hasKey && isApiKeyKnownValid) {
            action();
        } else {
            postKeySelectionAction.current = action;
            setShowApiKeyModal(true);
        }
    } catch (e: any) {
        console.error("Error checking for API key:", e);
        // Show a user-friendly error and don't proceed.
        alert(`Could not verify API key status: ${e.message}. Please try again or refresh the page.`);
    }
  };

  const handleSelectKey = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setShowApiKeyModal(false);
    setIsApiKeyKnownValid(true); // Assume the new key is valid
    if (postKeySelectionAction.current) {
        postKeySelectionAction.current();
        postKeySelectionAction.current = null;
    }
  };

  const handleApiKeyInvalid = () => {
    setIsApiKeyKnownValid(false);
    setShowVeoStudio(false);
  };

  const handleNewChat = useCallback(() => {
    playSound('click');
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      timestamp: Date.now(),
      mode: 'general',
    };
    setHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  }, []);

  // Load data on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('ratel_chat_history');
      if (savedHistory) {
        const parsedHistory: ChatSession[] = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        if (parsedHistory.length > 0) {
            const sorted = [...parsedHistory].sort((a,b) => b.timestamp - a.timestamp);
            setCurrentChatId(sorted[0].id);
        } else {
            handleNewChat();
        }
      } else {
        handleNewChat();
      }
      
      const savedTasks = localStorage.getItem('ratel_tasks');
      if(savedTasks) setTasks(JSON.parse(savedTasks));

    } catch (e) {
      console.error("Failed to load user data:", e);
      handleNewChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem('ratel_chat_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('ratel_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, [settings.language, i18n]);

  useEffect(() => {
    chatSessionsRef.current.clear();
  }, [settings.chatTone, settings.customInstructions]);

  const currentChat = history.find(c => c.id === currentChatId);

  const updateCurrentChat = useCallback((updater: (chat: ChatSession) => ChatSession) => {
    setHistory(prevHistory => {
      return prevHistory.map(chat =>
        chat.id === currentChatId ? updater(chat) : chat
      );
    });
  }, [currentChatId]);

  const addMessageToChat = useCallback((message: ChatMessage) => {
    updateCurrentChat(chat => ({
      ...chat,
      messages: [...chat.messages, message],
      timestamp: Date.now()
    }));
  }, [updateCurrentChat]);

  const onRenameChat = useCallback((id: string, newTitle: string) => {
    setHistory(prev => prev.map(chat => chat.id === id ? { ...chat, title: newTitle } : chat));
  }, []);
  
  const getOrCreateChatSession = useCallback(async (chatId: string) => {
    if (chatSessionsRef.current.has(chatId)) {
        return chatSessionsRef.current.get(chatId);
    }
    
    const chatSession = history.find(c => c.id === chatId);
    if(!chatSession) return null;
    
    const geminiHistory = chatSession.messages
        .filter(m => m.role !== 'system' && m.parts[0]?.type !== 'error' && m.parts[0]?.type !== 'loading')
        .map(m => {
            const content = m.parts.map(p => {
                if (p.type === 'image') {
                    return { inlineData: { mimeType: p.mimeType, data: p.content } };
                }
                return { text: p.content };
            });
            return { role: m.role, parts: content };
        });

    const newChatInstance = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: geminiHistory,
        config: {
            systemInstruction: createSystemInstruction(settings)
        }
    });

    chatSessionsRef.current.set(chatId, newChatInstance);
    return newChatInstance;

  }, [history, settings]);

  const handleSendMessage = useCallback(async (message: string, image?: { data: string; mimeType: string }) => {
    if (!currentChatId) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      parts: image
        ? [{ type: 'text', content: message }, { type: 'image', content: image.data, mimeType: image.mimeType }]
        : [{ type: 'text', content: message }],
      timestamp: Date.now()
    };
    addMessageToChat(userMessage);
    setIsLoading(true);

    const slugMessageId = crypto.randomUUID();
    const slugMessage: ChatMessage = {
        id: slugMessageId,
        role: 'model',
        parts: [{ type: 'text', content: 'Alright...' }],
        timestamp: Date.now()
    };
    addMessageToChat(slugMessage);

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const chat = await getOrCreateChatSession(currentChatId);
        if (!chat) throw new Error("Could not initialize chat session.");

        const parts: any[] = message ? [{ text: message }] : [];
        if(image) {
            parts.push({ inlineData: { mimeType: image.mimeType, data: image.data }});
        }
        
        const result = await chat.sendMessage({ message: { parts } });
        const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;

        const modelResponsePart: MessagePart = {
            type: 'text',
            content: result.text.trim(),
            ...(groundingChunks && { groundingChunks })
        };

        updateCurrentChat(chat => ({
            ...chat,
            messages: chat.messages.map(msg => 
                msg.id === slugMessageId 
                ? { ...msg, parts: [modelResponsePart], timestamp: Date.now() } 
                : msg
            )
        }));
        
        addXp(5);
        
        if (currentChat && currentChat.messages.length <= 2) {
            const titlePrompt = `Create a very short, concise title (4-5 words max) for this user's first prompt: "${message}"`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: titlePrompt });
            const newTitle = response.text.replace(/"/g, '');
            onRenameChat(currentChatId, newTitle);
        }

    } catch (e) {
      console.error("Failed to send message:", e);
      const errorMessagePart: MessagePart = { 
          type: 'error', 
          content: e instanceof Error ? e.message : "An unknown error occurred." 
      };
      updateCurrentChat(chat => ({
          ...chat,
          messages: chat.messages.map(msg => 
              msg.id === slugMessageId 
              ? { ...msg, parts: [errorMessagePart], timestamp: Date.now() } 
              : msg
          )
      }));
    } finally {
        setIsLoading(false);
    }
  }, [currentChatId, addMessageToChat, addXp, getOrCreateChatSession, currentChat, onRenameChat, updateCurrentChat]);

  const onSelectChat = (id: string) => {
    playSound('click');
    setCurrentChatId(id);
  };

  const onDeleteChat = (id: string) => {
    playSound('click');
    const newHistory = history.filter(chat => chat.id !== id);
    setHistory(newHistory);
    if (currentChatId === id) {
        if (newHistory.length > 0) {
            const sorted = [...newHistory].sort((a,b) => b.timestamp - a.timestamp);
            setCurrentChatId(sorted[0].id);
        } else {
             handleNewChat();
        }
    }
    chatSessionsRef.current.delete(id);
  };
  
  const onClearChat = () => {
      if(currentChatId) {
          updateCurrentChat(chat => ({ ...chat, messages: [] }));
          chatSessionsRef.current.delete(currentChatId);
      }
  };
  
  const handleEditVideoPrompt = (originalMessage: ChatMessage) => {
      const videoPart = originalMessage.parts.find(p => p.type === 'video');
      if (videoPart) {
          setInitialStudioData({
              initialPrompt: videoPart.content.prompt,
              initialDialogue: originalMessage.videoDialogue,
              initialAmbiance: originalMessage.videoAmbiance,
          });
          setShowVeoStudio(true);
      }
  };

  // --- Studio Handlers ---

  const handleGenerateImage = async (prompt: string, aspectRatio: string) => {
    setShowImageStudio(false);
    trackInterest('image');
    addXp(10);
    const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text', content: `Generate an image of: ${prompt} (Aspect ratio: ${aspectRatio})` }],
        timestamp: Date.now()
    };
    addMessageToChat(userMessage);
    setIsLoading(true);

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: aspectRatio as any }
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        addMessageToChat({
            id: crypto.randomUUID(),
            role: 'model',
            parts: [{ type: 'image', content: base64ImageBytes, mimeType: 'image/png' }],
            timestamp: Date.now()
        });
    } catch(e) {
        console.error(e);
        addMessageToChat({
            id: crypto.randomUUID(),
            role: 'model',
            parts: [{ type: 'error', content: e instanceof Error ? e.message : "Image generation failed." }],
            timestamp: Date.now()
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleEditImage = async (image: { data: string, mimeType: string }, prompt: string) => {
      setShowImageStudio(false);
      trackInterest('image');
      addXp(15);
      
      const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          parts: [ { type: 'text', content: prompt }, { type: 'image', content: image.data, mimeType: image.mimeType } ],
          timestamp: Date.now()
      };
      addMessageToChat(userMessage);
      setIsLoading(true);
      
       try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [ { inlineData: { data: image.data, mimeType: image.mimeType } }, { text: prompt } ] },
                config: { responseModalities: ['IMAGE'] },
            });
            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

            if(imagePart?.inlineData) {
                 addMessageToChat({
                    id: crypto.randomUUID(),
                    role: 'model',
                    parts: [{ type: 'image', content: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType }],
                    timestamp: Date.now()
                });
            } else { throw new Error("The AI did not return an edited image."); }
        } catch(e) {
            console.error(e);
            addMessageToChat({
                id: crypto.randomUUID(),
                role: 'model',
                parts: [{ type: 'error', content: e instanceof Error ? e.message : "Image editing failed." }],
                timestamp: Date.now()
            });
        } finally {
            setIsLoading(false);
        }
  };

  const handleStudioAction = (mode: RatelMode, prompt: string) => {
    trackInterest(mode);
    addXp(10);
    handleSendMessage(prompt);
    setShowHustleStudio(false);
    setShowLearnStudio(false);
    setShowMarketSquare(false);
  };
  
  const openStudio = (setter: React.Dispatch<React.SetStateAction<boolean>>, initialData = {}) => {
      setInitialStudioData(initialData);
      setter(true);
  }

  return (
    <div className="relative h-screen w-screen bg-gray-800">
        {settings.appearance.backgroundImage && (
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${settings.appearance.backgroundImage})` }}
            >
                <div className="absolute inset-0 bg-black/50" />
            </div>
        )}
        <div className="relative z-10 flex h-full bg-transparent overflow-hidden">
            <Sidebar
                history={history}
                currentChatId={currentChatId}
                userProfile={userProfile}
                isCurrentChatEmpty={!currentChat || currentChat.messages.length === 0}
                isOpenOnMobile={isSidebarOpen}
                onCloseMobile={() => setIsSidebarOpen(false)}
                onNewChat={handleNewChat}
                onSelectChat={onSelectChat}
                onClearChat={onClearChat}
                onDeleteChat={onDeleteChat}
                onRenameChat={onRenameChat}
                onOpenImageStudio={() => openStudio(setShowImageStudio)}
                onOpenAudioStudio={() => openStudio(setShowAudioStudio)}
                onOpenVideoStudio={() => ensureApiKey(() => { trackInterest('video'); openStudio(setShowVeoStudio); })}
                onOpenHustleStudio={() => openStudio(setShowHustleStudio)}
                onOpenLearnStudio={() => openStudio(setShowLearnStudio)}
                onOpenMarketSquare={() => openStudio(setShowMarketSquare)}
                onOpenMobileWorkersStudio={() => openStudio(setShowMobileWorkersStudio)}
                onOpenProfileStudio={() => openStudio(setShowProfileStudio)}
                onOpenProModal={() => { setProModalMessage(undefined); setShowProModal(true); }}
                onOpenExamplesStudio={() => openStudio(setShowExamplesStudio)}
                setPage={setPage}
                onLogout={onLogout}
            />
            <main className="flex-1 flex flex-col min-w-0">
                <ChatWindow
                chatSession={currentChat}
                isLoading={isLoading}
                onToggleSidebar={() => setIsSidebarOpen(p => !p)}
                onSendMessage={handleSendMessage}
                // FIX: Pass the `handleNewChat` function to the `onNewChat` prop instead of the undefined `onNewChat` variable.
                onNewChat={handleNewChat}
                onOpenSupportModal={() => setShowSupportModal(true)}
                onOpenFeedbackModal={() => openStudio(setShowFeedbackModal)}
                settings={settings}
                setSettings={setSettings}
                userProfile={userProfile}
                onOpenProfileStudio={() => openStudio(setShowProfileStudio)}
                onEditVideoPrompt={handleEditVideoPrompt}
                />
            </main>
        </div>
      
      {/* Modals and Studios */}
      {showImageStudio && <ImageStudio onClose={() => setShowImageStudio(false)} onGenerate={handleGenerateImage} onEdit={handleEditImage} isLoading={isLoading} initialPrompt={initialStudioData.initialPrompt} />}
      {showAudioStudio && <AudioStudio onClose={() => setShowAudioStudio(false)} />}
      {showVeoStudio && <VeoStudio onClose={() => setShowVeoStudio(false)} onApiKeyInvalid={handleApiKeyInvalid} />}
      {showHustleStudio && <HustleStudio onClose={() => setShowHustleStudio(false)} isLoading={isLoading} onAction={(type, data) => handleStudioAction('hustle', `Give me hustle ideas based on: ${data.input}`)} />}
      {showLearnStudio && <LearnStudio 
          onClose={() => setShowLearnStudio(false)} 
          onAction={(subjectId, skill, isTutor) => {
              let prompt;
              if (subjectId === 'finance') {
                  prompt = "I need financial advice for a young African. Your persona for this response should be inspired by GehGeh, a popular Nigerian content creator known for his engaging and practical financial literacy content for young Africans. Start your response with a friendly, pidgin-style greeting like 'Wetin dey happen! Just like my guy GehGeh always says, securing your financial future is key...' and then proceed to give actionable financial advice relevant to young people across Africa. Keep the tone encouraging and easy to understand.";
              } else {
                  prompt = isTutor ? `I want to learn about ${skill}. Act as an expert tutor.` : `Teach me the basics of ${skill}.`;
              }
              handleStudioAction('learn', prompt);
          }} 
      />}
      {showMarketSquare && <MarketSquare onClose={() => setShowMarketSquare(false)} isLoading={isLoading} onAiSearch={(item, location) => handleStudioAction('market', `Find a ${item} for sale in ${location}`)} userProfile={userProfile} />}
      {showMobileWorkersStudio && <MobileWorkersStudio onClose={() => setShowMobileWorkersStudio(false)} userProfile={userProfile} />}
      {showProfileStudio && <ProfileStudio onClose={() => setShowProfileStudio(false)} userProfile={userProfile} setUserProfile={setUserProfile} />}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} message={proModalMessage} />}
      {showSupportModal && <SupportModal onClose={() => setShowSupportModal(false)} />}
      {showExamplesStudio && <ExamplesStudio onClose={() => setShowExamplesStudio(false)} onSelectExample={prompt => { setShowExamplesStudio(false); handleSendMessage(prompt); }} />}
      {showApiKeyModal && <ApiKeyModal onClose={() => setShowApiKeyModal(false)} onSelectKey={handleSelectKey} />}
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
    </div>
  );
};

export default ChatView;