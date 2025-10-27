import React, { useEffect, useRef } from 'react';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import LanguageSwitcher from './LanguageSwitcher';
import { ChatSession, AppSettings, ChatMessage, UserProfile } from '../types';
import { MenuIcon, CoffeeIcon, RatelLogo } from '../constants';

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
  // FIX: Added userProfile prop to satisfy component requirements.
  userProfile: UserProfile;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatSession, isLoading, onToggleSidebar, onSendMessage, onNewChat, onOpenSupportModal, settings, setSettings, onEditVideoPrompt, userProfile
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatSession?.messages, isLoading]);
  
  const ExamplePromptButton: React.FC<{prompt: string, title: string, description: string}> = ({prompt, title, description}) => (
      <button 
          onClick={() => onSendMessage(prompt)} 
          className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-xl text-left text-sm text-white hover:bg-white/20 transition-colors"
      >
          <span className="font-semibold">{title}</span>
          <span className="text-gray-300 block">{description}</span>
      </button>
  );

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
      
      <div className={`flex-1 overflow-y-auto ${chatSession && chatSession.messages.length > 0 ? 'p-4' : 'p-0'}`}>
        {chatSession && chatSession.messages.length > 0 ? (
          <div className="space-y-4">
            {chatSession.messages.map((msg) => (
              // FIX: Passed onEditVideoPrompt prop down to the message component.
              <ChatMessageComponent key={msg.id} message={msg} onEditVideoPrompt={onEditVideoPrompt} />
            ))}
             <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
            {/* Background Video */}
            <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover z-0"
                src="https://videos.pexels.com/video-files/6833663/6833663-hd_1280_720_25fps.mp4"
                poster="https://images.pexels.com/videos/6833663/pexels-photo-6833663.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
            >
                Your browser does not support the video tag.
            </video>
            
            {/* Overlay */}
            <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-60 z-10"></div>
            
            {/* Content */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center text-white p-4">
                <RatelLogo className="w-16 h-16 text-white mb-4" />
                <h1 className="text-5xl font-bold">Ratel AI</h1>
                <p className="mt-2 mb-8 max-w-md text-gray-200">Your friendly AI companion for Africa. How can I help you today?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                    <ExamplePromptButton 
                        title="Get hustle ideas" 
                        description="...for a student in Lagos" 
                        prompt="Give me 5 side hustle ideas for a student in Lagos"
                    />
                    <ExamplePromptButton 
                        title="Create an image" 
                        description="...of a futuristic matatu flying over Nairobi" 
                        prompt="Create a photorealistic image of a futuristic matatu flying over Nairobi"
                    />
                    <ExamplePromptButton 
                        title="Explain a concept" 
                        description="...like 'inflation' using Nigerian examples" 
                        prompt="Explain 'inflation' to me like I'm 10, using Nigerian examples"
                    />
                     <ExamplePromptButton 
                        title="Tell a story" 
                        description="...about Anansi the Spider" 
                        prompt="Tell me a short story about Anansi the Spider"
                    />
                </div>
            </div>
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