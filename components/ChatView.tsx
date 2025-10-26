import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ImageStudio from './ImageStudio';
import AudioStudio from './AudioStudio';
import HustleStudio from './HustleStudio';
import LearnStudio from './LearnStudio';
import MarketSquare from './MarketStudio';
import MobileWorkersStudio from './MobileWorkersStudio';
import ProfileStudio from './ProfileStudio';
import ProModal from './ProModal';
import SupportModal from './SupportModal';
import ExamplesStudio from './ExamplesStudio';
import { ChatSession, UserProfile, AppSettings, ChatMessage, MessagePart, RatelMode, Task } from '../types';
import { playSound } from '../services/audioService';
import { streamChat, generateTitle, generateImage, editImage } from '../services/geminiService';
import { createSystemInstruction } from '../constants';
import { GenerateContentResponse } from '@google/genai';

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
  const [showHustleStudio, setShowHustleStudio] = useState(false);
  const [showLearnStudio, setShowLearnStudio] = useState(false);
  const [showMarketSquare, setShowMarketSquare] = useState(false);
  const [showMobileWorkersStudio, setShowMobileWorkersStudio] = useState(false);
  const [showProfileStudio, setShowProfileStudio] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [proModalMessage, setProModalMessage] = useState<string | undefined>(undefined);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showExamplesStudio, setShowExamplesStudio] = useState(false);

  const [initialStudioData, setInitialStudioData] = useState<any>({});
  
  const [tasks, setTasks] = useState<Task[]>([]);
  
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
  
  const handleSendMessage = useCallback(async (message: string, image?: { data: string; mimeType: string }) => {
    if (!currentChatId || !currentChat) return;

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
        const chatHistoryForApi = currentChat.messages
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

        const reader = await streamChat(chatHistoryForApi, message, image, createSystemInstruction(settings));
        
        const decoder = new TextDecoder();
        let fullText = "";
        let finalChunk: GenerateContentResponse | null = null;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunkStr = decoder.decode(value);
            const lines = chunkStr.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
                try {
                    const chunk = JSON.parse(line) as GenerateContentResponse;
                    if (chunk.text) {
                       fullText += chunk.text;
                    }
                    finalChunk = chunk;
                } catch (e) {
                    console.error("Failed to parse stream chunk:", line, e);
                }
            }
        }

        const groundingChunks = finalChunk?.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        const modelResponsePart: MessagePart = {
            type: 'text',
            content: fullText.trim(),
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
        
        if (currentChat.messages.length <= 2) {
            const titlePrompt = `Create a very short, concise title (4-5 words max) for this user's first prompt: "${message}"`;
            const newTitle = await generateTitle(titlePrompt);
            onRenameChat(currentChatId, newTitle.replace(/"/g, ''));
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
  }, [currentChatId, currentChat, addMessageToChat, addXp, onRenameChat, updateCurrentChat, settings]);

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
  };
  
  const onClearChat = () => {
      if(currentChatId) {
          updateCurrentChat(chat => ({ ...chat, messages: [] }));
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
        const base64ImageBytes = await generateImage(prompt, aspectRatio);
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
            const editedImage = await editImage(image, prompt);
            if(editedImage && editedImage.data) {
                 addMessageToChat({
                    id: crypto.randomUUID(),
                    role: 'model',
                    parts: [{ type: 'image', content: editedImage.data, mimeType: editedImage.mimeType }],
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
          onNewChat={handleNewChat}
          onOpenSupportModal={() => setShowSupportModal(true)}
          settings={settings}
          setSettings={setSettings}
          userProfile={userProfile}
        />
      </main>
      
      {/* Modals and Studios */}
      {showImageStudio && <ImageStudio onClose={() => setShowImageStudio(false)} onGenerate={handleGenerateImage} onEdit={handleEditImage} isLoading={isLoading} initialPrompt={initialStudioData.initialPrompt} />}
      {showAudioStudio && <AudioStudio onClose={() => setShowAudioStudio(false)} />}
      {showHustleStudio && <HustleStudio onClose={() => setShowHustleStudio(false)} isLoading={isLoading} onAction={(type, data) => handleStudioAction('hustle', `Give me hustle ideas based on: ${data.input}`)} />}
      {showLearnStudio && <LearnStudio onClose={() => setShowLearnStudio(false)} onAction={(skill, isTutor) => handleStudioAction('learn', isTutor ? `I want to learn about ${skill}. Act as an expert tutor.` : `Teach me the basics of ${skill}.`)} />}
      {showMarketSquare && <MarketSquare onClose={() => setShowMarketSquare(false)} isLoading={isLoading} onAiSearch={(item, location) => handleStudioAction('market', `Find a ${item} for sale in ${location}`)} userProfile={userProfile} />}
      {showMobileWorkersStudio && <MobileWorkersStudio onClose={() => setShowMobileWorkersStudio(false)} userProfile={userProfile} />}
      {showProfileStudio && <ProfileStudio onClose={() => setShowProfileStudio(false)} userProfile={userProfile} setUserProfile={setUserProfile} />}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} message={proModalMessage} />}
      {showSupportModal && <SupportModal onClose={() => setShowSupportModal(false)} />}
      {showExamplesStudio && <ExamplesStudio onClose={() => setShowExamplesStudio(false)} onSelectExample={prompt => { setShowExamplesStudio(false); handleSendMessage(prompt); }} />}
    </div>
  );
};

export default ChatView;