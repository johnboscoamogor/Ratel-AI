import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import { ChatSession, AppSettings, ChatMessage, UserProfile } from '../types';
import { MenuIcon, CoffeeIcon, ChevronDownIcon, UserIcon } from '../constants';
import LanguageSwitcher from './LanguageSwitcher';
import { playSound } from '../services/audioService';

interface ChatWindowProps {
  chatSession: ChatSession | undefined;
  isLoading: boolean;
  onToggleSidebar: () => void;
  onSendMessage: (message: string, image?: { data: string; mimeType: string }) => void;
  onNewChat: () => void;
  onOpenSupportModal: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  userProfile: UserProfile;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatSession, isLoading, onToggleSidebar, onSendMessage, onNewChat, onOpenSupportModal, settings, setSettings, userProfile
}) => {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isModeOpen, setIsModeOpen] = useState(false);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
            setIsModeOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatSession?.messages?.length) {
        scrollToBottom();
    }
  }, [chatSession?.messages, isLoading]);
  
  const ExamplePromptButton: React.FC<{title: string, description: string, prompt: string}> = ({title, description, prompt}) => (
      <button 
          onClick={() => onSendMessage(prompt)} 
          className="bg-gray-700 p-3 rounded-xl text-left text-sm text-white hover:bg-gray-600 transition-colors w-full"
      >
          <p className="font-semibold">{title}</p>
          <p className="text-gray-400 block">{description}</p>
      </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-800 text-gray-200 relative">
      <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
            <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-gray-700 md:hidden">
                <MenuIcon className="w-6 h-6 text-gray-300" />
            </button>
            <h2 className="font-semibold text-lg truncate text-white">
              {chatSession && chatSession.messages.length > 0 ? chatSession.title : t('sidebar.newChat')}
            </h2>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div ref={modeDropdownRef} className="relative">
            <button onClick={() => { playSound('click'); setIsModeOpen(!isModeOpen); }} className="flex items-center gap-2 bg-gray-700 py-1.5 px-3 rounded-md text-sm text-white hover:bg-gray-600">
                <span>Mode: <span className="font-semibold capitalize">{settings.chatTone}</span></span>
                <ChevronDownIcon className="w-4 h-4" />
            </button>
            {isModeOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-gray-700 rounded-md shadow-lg border border-gray-600 z-10">
                    {(['normal', 'formal', 'funny', 'pidgin'] as const).map(tone => (
                        <button
                            key={tone}
                            onClick={() => {
                                playSound('click');
                                setSettings(prev => ({ ...prev, chatTone: tone }));
                                setIsModeOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 capitalize"
                        >
                            {tone}
                        </button>
                    ))}
                </div>
            )}
          </div>

          <button onClick={onOpenSupportModal} className="hidden sm:flex items-center gap-1.5 border border-yellow-400 text-yellow-400 font-semibold py-1.5 px-3 rounded-md text-sm hover:bg-yellow-400/10 transition-colors">
              <CoffeeIcon className="w-4 h-4" />
              <span>Support Us</span>
          </button>
          
          <LanguageSwitcher
            currentLang={settings.language}
            onChangeLang={(lang) => setSettings(prev => ({ ...prev, language: lang }))}
          />
          
          <div className="flex items-center gap-2 text-gray-300">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm hidden lg:block truncate max-w-24">{userProfile.name}</span>
          </div>
        </div>
      </header>
      
      <div className={`flex-1 overflow-y-auto ${chatSession && chatSession.messages.length > 0 ? 'p-4' : ''}`}>
        {chatSession && chatSession.messages.length > 0 ? (
          <div className="space-y-4">
            {chatSession.messages.map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} />
            ))}
             <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="relative min-h-full w-full flex items-start justify-center p-4">
            <div className="relative z-20 flex flex-col items-center text-center text-white w-full">
                <div className="w-full pt-8 sm:pt-12">
                    <h1 className="text-5xl font-bold">Ratel AI</h1>
                    <p className="mt-2 mb-6 max-w-md mx-auto text-gray-300">Your friendly AI companion for Africa.</p>
                </div>
                
                <div className="w-full max-w-2xl mx-auto space-y-6 pb-8">
                    <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} onNewChat={onNewChat} isTransparent={true} />

                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2 text-center">Examples</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                          <ExamplePromptButton 
                              title={t('chatWindow.examples.hustle_title')}
                              description={t('chatWindow.examples.hustle_desc')}
                              prompt={t('chatWindow.examples.hustle_prompt')}
                          />
                          <ExamplePromptButton 
                              title={t('chatWindow.examples.image_title')}
                              description={t('chatWindow.examples.image_desc')}
                              prompt={t('chatWindow.examples.image_prompt')}
                          />
                          <ExamplePromptButton 
                              title={t('chatWindow.examples.explain_title')}
                              description={t('chatWindow.examples.explain_desc')}
                              prompt={t('chatWindow.examples.explain_prompt')}
                          />
                          <ExamplePromptButton 
                              title={t('chatWindow.examples.story_title')}
                              description={t('chatWindow.examples.story_desc')}
                              prompt={t('chatWindow.examples.story_prompt')}
                          />
                      </div>
                    </div>
                    
                    <div className="max-w-lg mx-auto">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2 text-center">Video Example (what you can generate)</h3>
                        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                            <iframe
                                className="w-full h-full"
                                src="https://www.youtube.com/embed/xkz3agPTcbo"
                                title="YouTube video player - Pet Honey Badger"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
      
      {chatSession && chatSession.messages.length > 0 && (
          <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800">
            <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} onNewChat={onNewChat} />
          </div>
      )}
    </div>
  );
};

export default ChatWindow;
