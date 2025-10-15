import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import LanguageSwitcher from './LanguageSwitcher';
import { ChatSession, AppSettings, ChatMessage, UserProfile } from '../types';
import { MenuIcon, CoffeeIcon, RatelLogo, UserIcon, SettingsIcon, LogoutIcon, ChevronDownIcon } from '../constants';
import { playSound } from '../services/audioService';
import AdBanner from './AdBanner';

interface ChatWindowProps {
  chatSession: ChatSession | undefined;
  isLoading: boolean;
  onToggleSidebar: () => void;
  onSendMessage: (message: string, image?: { data: string; mimeType: string }) => void;
  onNewChat: () => void;
  onOpenSupportModal: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onEditVideoPrompt: (originalMessage: ChatMessage) => void;
  userProfile: UserProfile;
  onLogout: () => void;
  setPage: (page: 'settings' | 'contact' | 'community') => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatSession, isLoading, onToggleSidebar, onSendMessage, onNewChat, onOpenSupportModal, settings, setSettings, onEditVideoPrompt, userProfile, onLogout, setPage
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatSession?.messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-gray-900 relative">
      <MainHeader 
        chatSession={chatSession}
        onToggleSidebar={onToggleSidebar}
        onOpenSupportModal={onOpenSupportModal}
        settings={settings}
        setSettings={setSettings}
        userProfile={userProfile}
        onLogout={onLogout}
        setPage={setPage}
      />
      
      <div className={`flex-1 overflow-y-auto ${chatSession && chatSession.messages.length > 0 ? 'p-4' : 'p-0'}`}>
        {chatSession && chatSession.messages.length > 0 ? (
          <div className="p-4 space-y-4">
            {chatSession.messages.map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} onEditVideoPrompt={onEditVideoPrompt} />
            ))}
             <div ref={messagesEndRef} />
          </div>
        ) : (
          <EmptyChatView onSendMessage={onSendMessage} isLoading={isLoading} onNewChat={onNewChat} />
        )}
      </div>
      
      <footer className="flex-shrink-0">
        {chatSession && chatSession.messages.length > 0 && (
          <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} onNewChat={onNewChat} />
        )}
        <AdBanner />
      </footer>
    </div>
  );
};

// --- Sub-components specific to ChatWindow ---

const MainHeader: React.FC<Pick<ChatWindowProps, 'chatSession' | 'onToggleSidebar' | 'onOpenSupportModal' | 'settings' | 'setSettings' | 'userProfile' | 'onLogout' | 'setPage'>> = 
({ chatSession, onToggleSidebar, onOpenSupportModal, settings, setSettings, userProfile, onLogout, setPage }) => {
  return (
    <header className="flex-shrink-0 flex justify-between items-center p-2 md:p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2 min-w-0"> {/* Add min-w-0 for truncation to work */}
            <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-gray-700 md:hidden">
                <MenuIcon className="w-6 h-6 text-gray-400" />
            </button>
            <h2 className="font-semibold text-lg text-white truncate">{chatSession?.title || ''}</h2>
        </div>
        <div className="flex items-center gap-2">
           <ModeSelector settings={settings} setSettings={setSettings} />
           <button onClick={onOpenSupportModal} className="hidden sm:flex items-center gap-2 bg-yellow-400/10 text-yellow-300 font-semibold py-1.5 px-3 rounded-full text-sm hover:bg-yellow-400/20 transition-colors">
              <CoffeeIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Support Us</span>
           </button>
           <LanguageSwitcher
             currentLang={settings.language}
             onChangeLang={(lang) => setSettings(prev => ({ ...prev, language: lang }))}
           />
           <UserMenu userProfile={userProfile} onLogout={onLogout} setPage={setPage} />
        </div>
      </header>
  );
};

const EmptyChatView: React.FC<{
  onSendMessage: (message: string, image?: { data: string; mimeType: string }) => void;
  isLoading: boolean;
  onNewChat: () => void;
}> = ({ onSendMessage, isLoading, onNewChat }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white">Ratel AI</h1>
        <p className="mt-2 mb-6 max-w-md text-gray-300">{t('chatWindow.welcomeSubtitle')}</p>
        
        <div className="w-full max-w-2xl mx-auto mb-6">
          <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} onNewChat={onNewChat} />
        </div>

        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div>
                <h3 className="font-semibold text-gray-400 mb-2">Examples</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                    <ExamplePromptButton onClick={() => onSendMessage(t('chatWindow.examples.hustle_prompt'))} title={t('chatWindow.examples.hustle_title')} description={t('chatWindow.examples.hustle_desc')} />
                    <ExamplePromptButton onClick={() => onSendMessage(t('chatWindow.examples.image_prompt'))} title={t('chatWindow.examples.image_title')} description={t('chatWindow.examples.image_desc')} />
                    <ExamplePromptButton onClick={() => onSendMessage(t('chatWindow.examples.explain_prompt'))} title={t('chatWindow.examples.explain_title')} description={t('chatWindow.examples.explain_desc')} />
                    <ExamplePromptButton onClick={() => onSendMessage(t('chatWindow.examples.story_prompt'))} title={t('chatWindow.examples.story_title')} description={t('chatWindow.examples.story_desc')} />
                </div>
            </div>
            
            <div>
                <h3 className="font-semibold text-gray-400 mb-2">Video Example (what you can generate)</h3>
                <div className="max-w-md mx-auto rounded-lg overflow-hidden shadow-lg aspect-video">
                    <iframe
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/xkz3agPTcbo?autoplay=1&mute=1&loop=1&playlist=xkz3agPTcbo&controls=0&modestbranding=1&showinfo=0&rel=0"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        </div>
    </div>
  );
}

const ExamplePromptButton: React.FC<{onClick: () => void, title: string, description: string}> = ({onClick, title, description}) => (
    <button 
        onClick={onClick} 
        className="bg-gray-800 border border-gray-700 p-3 rounded-xl text-left text-sm text-white hover:bg-gray-700 transition-colors"
    >
        <span className="font-semibold">{title}</span>
        <span className="text-gray-400 block">{description}</span>
    </button>
);


const ModeSelector: React.FC<{settings: AppSettings, setSettings: React.Dispatch<React.SetStateAction<AppSettings>>}> = ({ settings, setSettings }) => {
    const {t} = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const modes: {key: AppSettings['chatTone'], label: string}[] = [
        {key: 'normal', label: t('chatWindow.modeNormal')},
        {key: 'formal', label: t('chatWindow.modeFormal')},
        {key: 'humorous', label: t('chatWindow.modeHumorous')},
        {key: 'pidgin', label: t('chatWindow.modePidgin')},
        {key: 'advanced', label: t('chatWindow.modeAdvanced')}
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleSelect = (mode: AppSettings['chatTone']) => {
        setSettings(prev => ({ ...prev, chatTone: mode }));
        setIsOpen(false);
    }

    return (
        <div ref={ref} className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 bg-gray-700 text-white font-semibold py-1.5 px-3 rounded-full text-sm hover:bg-gray-600 transition-colors">
                <span>Mode: <span className="capitalize">{settings.chatTone}</span></span>
                <ChevronDownIcon className="w-4 h-4" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-700 rounded-md shadow-lg border border-gray-600 z-30">
                     {modes.map(mode => (
                         <button
                            key={mode.key}
                            onClick={() => handleSelect(mode.key)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                         >{mode.label}</button>
                     ))}
                </div>
            )}
        </div>
    );
};

const UserMenu: React.FC<{userProfile: UserProfile, onLogout: () => void, setPage: (page: 'settings' | 'contact') => void}> = ({ userProfile, onLogout, setPage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const {t} = useTranslation();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-700">
                <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-300"/>
                </div>
                <span className="hidden lg:inline font-semibold text-sm text-white truncate">{userProfile.name}</span>
            </button>
             {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg border border-gray-600 z-30">
                     <button onClick={() => { setPage('settings'); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">
                        <SettingsIcon className="w-4 h-4 mr-3 text-gray-400"/>
                        <span>{t('sidebar.settings')}</span>
                    </button>
                    <div className="border-t border-gray-600 my-1"></div>
                    <button onClick={onLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/20">
                       <LogoutIcon className="w-4 h-4 mr-3 text-red-400"/>
                       <span>{t('sidebar.logout')}</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default ChatWindow;