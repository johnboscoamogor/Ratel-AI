import React, { useEffect, useRef } from 'react';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import LanguageSwitcher from './LanguageSwitcher';
import { ChatSession, AppSettings, ChatMessage } from '../types';
import { MenuIcon, CoffeeIcon } from '../constants';

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
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatSession, isLoading, onToggleSidebar, onSendMessage, onNewChat, onOpenSupportModal, settings, setSettings, onEditVideoPrompt
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatSession?.messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center">
            <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-gray-100 md:hidden mr-2">
                <MenuIcon className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="font-semibold text-lg text-gray-800 truncate">{chatSession?.title || 'Chat'}</h2>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onOpenSupportModal} className="hidden sm:flex items-center gap-2 bg-yellow-100 text-yellow-800 font-semibold py-1.5 px-3 rounded-full text-sm hover:bg-yellow-200 transition-colors">
              <CoffeeIcon className="w-4 h-4" />
              <span>Support Us</span>
           </button>
           <LanguageSwitcher
             currentLang={settings.language}
             onChangeLang={(lang) => setSettings(prev => ({ ...prev, language: lang }))}
           />
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4">
        {chatSession && chatSession.messages.length > 0 ? (
          <div className="space-y-4">
            {chatSession.messages.map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} onEditVideoPrompt={onEditVideoPrompt} />
            ))}
             <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <h1 className="text-4xl font-bold text-gray-800">Ratel AI</h1>
            <p className="mt-2">Your friendly AI companion for Africa.</p>
            {/* You could add example prompts here */}
          </div>
        )}
      </div>
      
      <div className="flex-shrink-0">
        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} onNewChat={onNewChat} />
      </div>
    </div>
  );
};

export default ChatWindow;