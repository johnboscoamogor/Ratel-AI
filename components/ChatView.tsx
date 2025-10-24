import React, { useState, useEffect, useCallback } from 'react';
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
import { ChatSession, UserProfile, AppSettings, ChatMessage, RatelMode, Task, Story } from '../types';
import { playSound } from '../services/audioService';
// FIX: Changed imports to use the backend proxy functions instead of a direct 'ai' instance.
import { streamChat, generateTitle, generateImage, editImage } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
// FIX: Imported the `createSystemInstruction` function instead of the non-existent `SYSTEM_INSTRUCTION` constant.
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

  // --- Task Management ---
  const handleAddTask = useCallback((args: { description: string, reminder?: string }) => {
      const newTask: Task = {
          id: crypto.randomUUID(),
          description: args.description,
          completed: false,
          reminder: args.reminder,
      };
      setTasks(prev => [...prev, newTask]);
      addMessageToChat({
          id: crypto.randomUUID(),
          role: 'model',
          parts: [{ type: 'text', content: `✅ Okay, I've added "${args.description}" to your to-do list.` }],
          timestamp: Date.now(),
      });
  }, [addMessageToChat]);

  const handleShowTasks = useCallback(() => {
      addMessageToChat({
          id: crypto.randomUUID(),
          role: 'model',
          parts: [{ type: 'tasks', content: { tasks, onToggleTask: (taskId: string) => handleToggleTask(taskId) } }],
          timestamp: Date.now(),
      });
  }, [addMessageToChat, tasks]);

  const handleToggleTask = (taskId: string) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };
  
  // Update the show tasks message whenever tasks change
  useEffect(() => {
      if(currentChatId) {
          updateCurrentChat(chat => ({
              ...chat,
              messages: chat.messages.map(msg => {
                  if (msg.parts[0]?.type === 'tasks') {
                      return { ...msg, parts: [{ type: 'tasks', content: { tasks, onToggleTask: handleToggleTask }}]};
                  }
                  return msg;
              })
          }))
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, currentChatId]);


  // --- Message Sending & Streaming ---
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
    addXp(5);

    // Auto-generate title for the first message
    if (currentChat && currentChat.messages.length <= 1) {
        generateTitle(`Create a very short, concise title (4-5 words max) for this user's first prompt: "${message}"`)
            .then(newTitle => onRenameChat(currentChatId, newTitle.replace(/"/g, '')))
            .catch(e => console.error("Title generation failed:", e));
    }
    
    // Process stream from backend
    try {
        const geminiHistory = (currentChat?.messages || [])
            .filter(m => m.role !== 'system' && m.parts[0]?.type !== 'error' && m.parts[0]?.type !== 'loading')
            .map(m => ({
                role: m.role,
                parts: m.parts.map(p => {
                    if (p.type === 'image') return { inlineData: { mimeType: p.mimeType, data: p.content } };
                    return { text: p.content };
                })
            }));

        const reader = await streamChat(geminiHistory, message, image, createSystemInstruction(settings));
        
        const messageId = crypto.randomUUID();
        addMessageToChat({ id: messageId, role: 'model', parts: [{ type: 'loading', content: '' }], timestamp: Date.now() });

        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let functionCalls: any[] = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;
                try {
                    const chunk: GenerateContentResponse = JSON.parse(line);
                    
                    if (chunk.text) {
                        fullText += chunk.text;
                        updateCurrentChat(chat => ({
                            ...chat,
                            messages: chat.messages.map(msg => msg.id === messageId ? { ...msg, parts: [{ type: 'text', content: fullText }] } : msg)
                        }));
                    }
                    if (chunk.functionCalls) {
                        functionCalls.push(...chunk.functionCalls);
                    }
                } catch (e) {
                    console.error("Error parsing stream chunk:", e, "Line:", line);
                }
            }
        }
        
        if (functionCalls.length > 0) {
            // Remove the loading message
            updateCurrentChat(chat => ({...chat, messages: chat.messages.filter(msg => msg.id !== messageId)}));
            for (const fc of functionCalls) {
                if (fc.name === 'addTask') handleAddTask(fc.args);
                if (fc.name === 'showTasks') handleShowTasks();
            }
        } else {
            // Finalize the text message
            updateCurrentChat(chat => ({
                ...chat,
                messages: chat.messages.map(msg => msg.id === messageId ? { ...msg, parts: [{ type: 'text', content: fullText }] } : msg)
            }));
        }

    } catch (e) {
      console.error("Failed to send message:", e);
      addMessageToChat({
        id: crypto.randomUUID(),
        role: 'model',
        parts: [{ type: 'error', content: e instanceof Error ? e.message : "An unknown error occurred." }],
        timestamp: Date.now()
      });
    } finally {
        setIsLoading(false);
    }
  }, [currentChatId, addMessageToChat, addXp, currentChat, onRenameChat, settings, updateCurrentChat, handleAddTask, handleShowTasks]);

  // --- Studio Handlers ---

  const handleGenerateImage = async (prompt: string, aspectRatio: string) => {
    setShowImageStudio(false);
    trackInterest('image');
    addXp(10);
    addMessageToChat({ id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', content: `Generate an image: ${prompt}` }], timestamp: Date.now() });
    const loadingId = crypto.randomUUID();
    addMessageToChat({ id: loadingId, role: 'model', parts: [{ type: 'loading', content: 'Generating image...' }], timestamp: Date.now() });
    
    try {
        const base64Image = await generateImage(prompt, aspectRatio);
        updateCurrentChat(chat => ({ ...chat, messages: chat.messages.filter(m => m.id !== loadingId) }));
        addMessageToChat({ id: crypto.randomUUID(), role: 'model', parts: [{ type: 'image', content: base64Image, mimeType: 'image/png' }], timestamp: Date.now() });
    } catch (e) {
        updateCurrentChat(chat => ({ ...chat, messages: chat.messages.map(m => m.id === loadingId ? { ...m, parts: [{ type: 'error', content: e instanceof Error ? e.message : 'Image generation failed.' }] } : m) }));
    }
  };
  
  const handleEditImage = async (image: { data: string, mimeType: string }, prompt: string) => {
      setShowImageStudio(false);
      trackInterest('image');
      addXp(15);
      addMessageToChat({ id: crypto.randomUUID(), role: 'user', parts: [ { type: 'text', content: prompt }, { type: 'image', content: image.data, mimeType: image.mimeType } ], timestamp: Date.now() });
      const loadingId = crypto.randomUUID();
      addMessageToChat({ id: loadingId, role: 'model', parts: [{ type: 'loading', content: 'Editing image...' }], timestamp: Date.now() });

      try {
            const editedImage = await editImage(image, prompt);
            updateCurrentChat(chat => ({...chat, messages: chat.messages.filter(m => m.id !== loadingId)}));
            addMessageToChat({ id: crypto.randomUUID(), role: 'model', parts: [{ type: 'image', content: editedImage.data, mimeType: editedImage.mimeType }], timestamp: Date.now() });
      } catch (e) {
          updateCurrentChat(chat => ({ ...chat, messages: chat.messages.map(m => m.id === loadingId ? { ...m, parts: [{ type: 'error', content: e instanceof Error ? e.message : 'Image editing failed.' }] } : m) }));
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
    <div className="flex h-screen bg-gray-900 overflow-hidden">
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
