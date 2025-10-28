import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import { ChatSession, AppSettings, UserProfile } from '../types';
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
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatSession, isLoading, onToggleSidebar, onSendMessage, onNewChat, onOpenSupportModal, settings, setSettings, userProfile, onOpenProfileStudio
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
      
      <div className={`flex-1 overflow-y-auto ${chatSession && chatSession.messages.length > 0 ? 'p-4' : 'p-0'}`}>
        {chatSession && chatSession.messages.length > 0 ? (
          <div className="space-y-4 w-full">
            {chatSession.messages.map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} />
            ))}
             <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
             {!settings.appearance.backgroundImage && (
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover z-0"
                    style={{ pointerEvents: 'none' }}
                    src="https://videos.pexels.com/video-files/6833663/6833663-hd_1280_720_25fps.mp4"
                    poster="https://images.pexels.com/videos/6833663/pexels-photo-6833663.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
                >
                    Your browser does not support the video tag.
                </video>
             )}
            <div className={`absolute top-0 left-0 w-full h-full bg-black z-10 ${settings.appearance.backgroundImage ? 'bg-opacity-0' : 'bg-opacity-60'}`} />

            <div className="relative z-20 flex flex-col items-center text-center text-white w-full p-4 h-full overflow-y-auto justify-center">
                <div className="w-full pt-8 sm:pt-12">
                    <RatelLogo className="w-16 h-16 text-white mx-auto mb-4" />
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
                </div>
            </div>
          </div>
        )}
      </div>
      
      {chatSession && chatSession.messages.length > 0 && (
          <div className="flex-shrink-0 p-4 border-t border-gray-700/50 bg-gray-800/80 backdrop-blur-sm">
            <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} onNewChat={onNewChat} />
          </div>
      )}
    </div>
  );
};

export default ChatWindow;
