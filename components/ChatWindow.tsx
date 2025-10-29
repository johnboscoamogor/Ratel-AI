import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import { ChatSession, AppSettings, UserProfile, ChatMessage } from '../types';
import { MenuIcon, CoffeeIcon, ChevronDownIcon, UserIcon, RatelLogo } from '../constants';
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
  onOpenProfileStudio: () => void;
  onEditVideoPrompt: (originalMessage: ChatMessage) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatSession, isLoading, onToggleSidebar, onSendMessage, onNewChat, onOpenSupportModal, settings, setSettings, userProfile, onOpenProfileStudio, onEditVideoPrompt
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
          className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-xl text-left text-sm text-white hover:bg-white/20 transition-colors w-full"
      >
          <p className="font-semibold">{title}</p>
          <p className="text-gray-300 block">{description}</p>
      </button>
  );

  return (
    <div className="flex flex-col h-full bg-transparent text-gray-200 relative">
      <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-700/50 bg-gray-800/80 backdrop-blur-sm relative z-40">
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
            <button
              onClick={() => { playSound('click'); setIsModeOpen(!isModeOpen); }}
              className="flex items-center gap-2 bg-gray-700 py-1.5 px-3 rounded-md text-sm text-white hover:bg-gray-600"
              role="button"
              aria-expanded={isModeOpen}
              aria-haspopup="true"
              tabIndex={0}
            >
                <span>Mode: <span className="font-semibold capitalize">{settings.chatTone}</span></span>
                <ChevronDownIcon className="w-4 h-4" />
            </button>
            {isModeOpen && (
                <div role="menu" className="absolute top-full right-0 mt-2 w-40 bg-gray-700 rounded-md shadow-lg border border-gray-600 z-50">
                    {(['normal', 'formal', 'funny', 'pidgin'] as const).map(tone => (
                        <button
                            key={tone}
                            onClick={() => {
                                playSound('click');
                                setSettings(prev => ({ ...prev, chatTone: tone }));
                                setIsModeOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 capitalize"
                            role="menuitem"
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
          
          <button onClick={onOpenProfileStudio} className="flex items-center gap-2 text-gray-300 rounded-lg p-1 hover:bg-gray-700 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm hidden lg:block truncate max-w-24">{userProfile.name}</span>
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        {chatSession && chatSession.messages.length > 0 ? (
          <div className="p-4 space-y-4 w-full">
            {chatSession.messages.map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} onEditVideoPrompt={onEditVideoPrompt} />
            ))}
             <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-start h-full text-center p-4 pt-16 text-white">
            <div className="mb-8">
                <RatelLogo className="w-16 h-16 text-white mx-auto mb-4" />
                <h1 className="text-5xl font-bold">Ratel AI</h1>
                <p className="mt-2 max-w-md mx-auto text-gray-300">Your friendly AI companion for Africa.</p>
            </div>
            <div className="w-full max-w-lg">
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
          </div>
        )}
      </div>
      
      <div className={`flex-shrink-0 p-4 ${chatSession && chatSession.messages.length > 0 ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-transparent'}`}>
        <ChatInput 
            onSendMessage={onSendMessage} 
            isLoading={isLoading} 
            onNewChat={onNewChat} 
            isTransparent={!chatSession || chatSession.messages.length === 0} 
        />
      </div>

      {/* Ad Banner Area */}
      <div className={`flex-shrink-0 w-full flex justify-center items-center py-1 ${chatSession && chatSession.messages.length > 0 ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-transparent'}`}>
        <div id="ad-banner" className="w-full max-w-[728px] h-[50px] sm:h-[60px] lg:h-[90px] flex items-center justify-center">
            {/* This is a visual placeholder. The actual ad will be injected here. */}
            <div className="w-full h-full bg-gray-700/50 text-gray-500 text-xs sm:text-sm flex items-center justify-center rounded-md">
                Ad Banner Placeholder (e.g., 728x90 / 468x60 / 320x50)
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;