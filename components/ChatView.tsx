import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ImageStudio from './ImageStudio';
import AudioStudio from './AudioStudio';
import VideoStudio from './VideoStudio';
import HustleStudio from './HustleStudio';
import LearnStudio from './LearnStudio';
import MarketSquare from './MarketStudio';
import StorytellerStudio from './StorytellerStudio';
import MobileWorkersStudio from './MobileWorkersStudio';
import ProfileStudio from './ProfileStudio';
import ProModal from './ProModal';
import SupportModal from './SupportModal';
import ExamplesStudio from './ExamplesStudio';
import VideoArStudio from './VideoArStudio';
import { ChatSession, UserProfile, AppSettings, ChatMessage, MessagePart, RatelMode, Task, Story } from '../types';
import { playSound } from '../services/audioService';
import { ai } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
// FIX: Changed import from SYSTEM_INSTRUCTION to the createSystemInstruction function.
import { createSystemInstruction, taskTools } from '../constants';

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
  const [showVideoStudio, setShowVideoStudio] = useState(false);
  const [showHustleStudio, setShowHustleStudio] = useState(false);
  const [showLearnStudio, setShowLearnStudio] = useState(false);
  const [showMarketSquare, setShowMarketSquare] = useState(false);
  const [showMobileWorkersStudio, setShowMobileWorkersStudio] = useState(false);
  const [showStorytellerStudio, setShowStorytellerStudio] = useState(false);
  const [showProfileStudio, setShowProfileStudio] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [proModalMessage, setProModalMessage] = useState<string | undefined>(undefined);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showExamplesStudio, setShowExamplesStudio] = useState(false);
  const [showVideoArStudio, setShowVideoArStudio] = useState(false);

  const [initialStudioData, setInitialStudioData] = useState<any>({});
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  
  const chatSessionsRef = useRef<Map<string, any>>(new Map());

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

      const savedStories = localStorage.getItem('ratel_stories');
      if(savedStories) setStories(JSON.parse(savedStories));

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
    localStorage.setItem('ratel_stories', JSON.stringify(stories));
  }, [stories]);

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

  const streamMessageToChat = useCallback((stream: AsyncGenerator<GenerateContentResponse>) => {
    const messageId = crypto.randomUUID();
    
    const placeholderMessage: ChatMessage = {
      id: messageId,
      role: 'model',
      parts: [{ type: 'loading', content: '' }],
      timestamp: Date.now()
    };
    addMessageToChat(placeholderMessage);

    let fullText = "";
    let groundingChunks: any[] = [];
    
    const processStream = async () => {
        for await (const chunk of stream) {
            fullText += chunk.text;
            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                groundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
            }
            
            updateCurrentChat(chat => ({
                ...chat,
                messages: chat.messages.map(msg => 
                    msg.id === messageId 
                    ? { ...msg, parts: [{ type: 'text', content: fullText, groundingChunks }] } 
                    : msg
                )
            }));
        }
        
        updateCurrentChat(chat => ({
            ...chat,
            messages: chat.messages.map(msg => {
                if(msg.id === messageId) {
                    const finalPart: MessagePart = { type: 'text', content: fullText.trim() };
                    if(groundingChunks.length > 0) finalPart.groundingChunks = groundingChunks;
                    return { ...msg, parts: [finalPart] };
                }
                return msg;
            })
        }));
    };
    
    processStream().catch(err => {
        console.error("Error processing stream:", err);
        const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'model',
            parts: [{ type: 'error', content: "Sorry, I couldn't process that. Please try again." }],
            timestamp: Date.now()
        };
        updateCurrentChat(chat => ({
            ...chat,
            messages: chat.messages.filter(msg => msg.id !== messageId).concat(errorMessage)
        }));
    }).finally(() => setIsLoading(false));

  }, [addMessageToChat, updateCurrentChat]);


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
            // FIX: Call createSystemInstruction with the current settings.
            systemInstruction: createSystemInstruction(settings)
        }
    });

    chatSessionsRef.current.set(chatId, newChatInstance);
    return newChatInstance;

  // FIX: Add settings to the dependency array.
  }, [history, settings]);
  
  // FIX: Moved `onRenameChat` before `handleSendMessage` to resolve usage-before-declaration error.
  const onRenameChat = useCallback((id: string, newTitle: string) => {
    setHistory(prev => prev.map(chat => chat.id === id ? { ...chat, title: newTitle } : chat));
  }, []);

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

    try {
        const chat = await getOrCreateChatSession(currentChatId);
        if (!chat) throw new Error("Could not initialize chat session.");

        const parts: any[] = message ? [{ text: message }] : [];
        if(image) {
            parts.push({ inlineData: { mimeType: image.mimeType, data: image.data }});
        }
        
        const resultStream = await chat.sendMessageStream({ message: { parts }});
        
        streamMessageToChat(resultStream);
        
        addXp(5);
        
        if (currentChat && currentChat.messages.length <= 1) {
            const titlePrompt = `Create a very short, concise title (4-5 words max) for this user's first prompt: "${message}"`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: titlePrompt });
            const newTitle = response.text.replace(/"/g, '');
            onRenameChat(currentChatId, newTitle);
        }

    } catch (e) {
      console.error("Failed to send message:", e);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        parts: [{ type: 'error', content: e instanceof Error ? e.message : "An unknown error occurred." }],
        timestamp: Date.now()
      };
      addMessageToChat(errorMessage);
      setIsLoading(false);
    }
  }, [currentChatId, addMessageToChat, streamMessageToChat, addXp, getOrCreateChatSession, currentChat, onRenameChat]);

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
    setHistory(prev => prev.filter(chat => chat.id !== id));
    if (currentChatId === id) {
        const remainingChats = history.filter(chat => chat.id !== id);
        if(remainingChats.length > 0) {
            const sorted = [...remainingChats].sort((a,b) => b.timestamp - a.timestamp);
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
          setShowVideoStudio(true);
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

  const handleGenerateVideo = async (prompt: string, image?: { data: string; mimeType: string }, dialogue?: string, ambiance?: string) => {
    setShowVideoStudio(false);
    trackInterest('video');
    addXp(50);

    const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text', content: `Create a video: ${prompt}` }],
        timestamp: Date.now()
    };
    addMessageToChat(userMessage);

    const loadingMessageId = crypto.randomUUID();
    addMessageToChat({
        id: loadingMessageId, role: 'model', parts: [{ type: 'loading', content: '' }], timestamp: Date.now()
    });

    try {
        const loadingMessages = [
            t('videoStudio.generating.video'), t('videoStudio.generating.audio'), t('videoStudio.generating.final')
        ];
        let msgIndex = 0;
        const updateLoadingMessage = (message: string) => {
            updateCurrentChat(chat => ({
                ...chat,
                messages: chat.messages.map(msg => msg.id === loadingMessageId ? { ...msg, parts: [{ type: 'loading', content: message }] } : msg)
            }));
        };
        updateLoadingMessage(loadingMessages[msgIndex]);
        const interval = setInterval(() => {
            msgIndex = (msgIndex + 1) % loadingMessages.length;
            updateLoadingMessage(loadingMessages[msgIndex]);
        }, 4000);

        // Call the new backend function
        const response = await fetch('/api/video/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt, 
                image, 
                dialogue, 
                ambiance,
                voiceId: settings.voice.selectedVoice 
            })
        });
        
        clearInterval(interval);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Video generation failed.');
        }

        const data = await response.json();
        
        const finalMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'model',
            parts: [{ type: 'video', content: { url: data.videoUrl, prompt } }],
            timestamp: Date.now(),
            ...(data.dialogueAudioBase64 && { audioUrl: `data:audio/mp3;base64,${data.dialogueAudioBase64}` }),
            ...(dialogue && { videoDialogue: dialogue }),
            ...(data.ambianceAudioBase64 && { ambianceUrl: `data:audio/mp3;base64,${data.ambianceAudioBase64}` }),
            ...(ambiance && { videoAmbiance: ambiance }),
        };

        updateCurrentChat(chat => ({ ...chat, messages: chat.messages.filter(msg => msg.id !== loadingMessageId).concat(finalMessage) }));

    } catch (e) {
        console.error(e);
        updateCurrentChat(chat => ({
            ...chat,
            messages: chat.messages.map(msg => msg.id === loadingMessageId ? {
                id: loadingMessageId, role: 'model', parts: [{ type: 'error', content: e instanceof Error ? e.message : "Video generation failed." }], timestamp: Date.now()
            } : msg)
        }));
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
  
  const handleStoryGenerated = (story: Story) => {
      setStories(prev => [story, ...prev]);
      addXp(25);
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
        onOpenVideoStudio={() => openStudio(setShowVideoStudio)}
        onOpenHustleStudio={() => openStudio(setShowHustleStudio)}
        onOpenLearnStudio={() => openStudio(setShowLearnStudio)}
        onOpenMarketSquare={() => openStudio(setShowMarketSquare)}
        onOpenMobileWorkersStudio={() => openStudio(setShowMobileWorkersStudio)}
        onOpenStorytellerStudio={() => openStudio(setShowStorytellerStudio)}
        onOpenProfileStudio={() => openStudio(setShowProfileStudio)}
        onOpenProModal={() => { setProModalMessage(undefined); setShowProModal(true); }}
        onOpenVideoArStudio={() => openStudio(setShowVideoArStudio)}
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
          onEditVideoPrompt={handleEditVideoPrompt}
        />
      </main>
      
      {/* Modals and Studios */}
      {showImageStudio && <ImageStudio onClose={() => setShowImageStudio(false)} onGenerate={handleGenerateImage} onEdit={handleEditImage} isLoading={isLoading} initialPrompt={initialStudioData.initialPrompt} />}
      {showAudioStudio && <AudioStudio onClose={() => setShowAudioStudio(false)} />}
      {showVideoStudio && <VideoStudio onClose={() => setShowVideoStudio(false)} onGenerate={handleGenerateVideo} isLoading={isLoading} {...initialStudioData} />}
      {showHustleStudio && <HustleStudio onClose={() => setShowHustleStudio(false)} isLoading={isLoading} onAction={(type, data) => handleStudioAction('hustle', `Give me hustle ideas based on: ${data.input}`)} />}
      {showLearnStudio && <LearnStudio onClose={() => setShowLearnStudio(false)} onAction={(skill, isTutor) => handleStudioAction('learn', isTutor ? `I want to learn about ${skill}. Act as an expert tutor.` : `Teach me the basics of ${skill}.`)} />}
      {showMarketSquare && <MarketSquare onClose={() => setShowMarketSquare(false)} isLoading={isLoading} onAiSearch={(item, location) => handleStudioAction('market', `Find a ${item} for sale in ${location}`)} userProfile={userProfile} />}
      {showMobileWorkersStudio && <MobileWorkersStudio onClose={() => setShowMobileWorkersStudio(false)} userProfile={userProfile} />}
      {showStorytellerStudio && <StorytellerStudio onClose={() => setShowStorytellerStudio(false)} onStoryGenerated={handleStoryGenerated} settings={settings} onOpenProModal={(msg) => { setProModalMessage(msg); setShowProModal(true); }} />}
      {showProfileStudio && <ProfileStudio onClose={() => setShowProfileStudio(false)} userProfile={userProfile} setUserProfile={setUserProfile} />}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} message={proModalMessage} />}
      {showSupportModal && <SupportModal onClose={() => setShowSupportModal(false)} />}
      {showExamplesStudio && <ExamplesStudio onClose={() => setShowExamplesStudio(false)} onSelectExample={prompt => { setShowExamplesStudio(false); handleSendMessage(prompt); }} />}
      {showVideoArStudio && <VideoArStudio onClose={() => setShowVideoArStudio(false)} />}
    </div>
  );
};

export default ChatView;
