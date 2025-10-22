import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import { ChatSession, AppSettings } from '../types';
import { MenuIcon, CoinIcon, RatelLogo, ChevronDownIcon } from '../constants';

interface ChatWindowProps {
  chatSession: ChatSession | undefined;
  isLoading: boolean;
  onToggleSidebar: () => void;
  onSendMessage: (message: string, image?: { data: string; mimeType: string }) => void;
  onNewChat: () => void;
  onOpenSupportModal: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const ChatToneSwitcher: React.FC<{
  currentTone: AppSettings['chatTone'];
  onChangeTone: (tone: AppSettings['chatTone']) => void;
}> = ({ currentTone, onChangeTone }) => {
  const { t } = useTranslation();
  const tones: AppSettings['chatTone'][] = ['normal', 'formal', 'funny', 'pidgin'];

  return (
    <div className="relative">
      <select
        value={currentTone}
        onChange={(e) => onChangeTone(e.target.value as AppSettings['chatTone'])}
        className="bg-gray-700 text-white text-sm font-semibold rounded-full pl-3 pr-8 py-1.5 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
        aria-label={t('chatWindow.chatTone')}
      >
        {tones.map(tone => (
          <option key={tone} value={tone}>
            {t(`chatWindow.tones.${tone}`)}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <ChevronDownIcon className="w-4 h-4" />
      </div>
    </div>
  );
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatSession, isLoading, onToggleSidebar, onSendMessage, onNewChat, onOpenSupportModal, settings, setSettings
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatSession && chatSession.messages.length > 0) {
      scrollToBottom();
    }
  }, [chatSession?.messages, isLoading]);
  
  const ExamplePromptButton: React.FC<{title: string, description: string, prompt: string}> = ({title, description, prompt}) => (
      <button 
          onClick={() => onSendMessage(prompt)} 
          className="bg-gray-800 border border-gray-700 p-4 rounded-lg text-left hover:bg-gray-700 transition-colors w-full"
      >
          <p className="font-semibold text-white">{title}</p>
          <p className="text-gray-400 text-sm">{description}</p>
      </button>
  );

  const VideoExample: React.FC = () => {
    const videoId = 'xkz3agPTcbo';
    // Construct the embed URL with autoplay, mute, and loop.
    // To loop an autoplaying video, you need to use the playlist parameter with the video ID.
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&playsinline=1`;

    return (
      <div 
        className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden text-white aspect-video relative group"
      >
        <iframe
          src={embedUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video Example"
          className="w-full h-full"
        ></iframe>
      </div>
    );
  };


  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-200">
      <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center">
            <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-gray-700 md:hidden mr-2">
                <MenuIcon className="w-6 h-6 text-gray-400" />
            </button>
            <h2 className="font-semibold text-lg text-white truncate">{chatSession?.title || 'Chat'}</h2>
        </div>
        <div className="flex items-center gap-2">
           <ChatToneSwitcher
             currentTone={settings.chatTone}
             onChangeTone={(tone) => setSettings(prev => ({ ...prev, chatTone: tone }))}
           />
           <button onClick={onOpenSupportModal} className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-1.5 px-4 rounded-full text-sm hover:bg-yellow-500 transition-colors">
              <CoinIcon className="w-5 h-5" />
              <span>Support Us</span>
           </button>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col min-h-0">
        {chatSession && chatSession.messages.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatSession.messages.map((msg) => (
                <ChatMessageComponent key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-900">
              <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} onNewChat={onNewChat} />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start pt-8 md:pt-16 pb-8">
            <div className="w-full max-w-3xl mx-auto text-center px-4">
              <h1 className="text-5xl md:text-6xl font-bold text-white">Ratel AI</h1>
              <p className="mt-4 text-lg text-gray-400">Your friendly AI companion for Africa.</p>
              
              <div className="mt-8 max-w-xl mx-auto">
                 <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} onNewChat={onNewChat} />
              </div>

              <h2 className="mt-12 mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Examples</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                    <ExamplePromptButton 
                        title="Get hustle ideas" 
                        description="...for a student in Lagos" 
                        prompt="Give me 5 side hustle ideas for a student in Lagos"
                    />
                    <ExamplePromptButton 
                        title="Make money with AI" 
                        description="...as a freelancer in Africa" 
                        prompt="Give me practical ways I can make money with AI as a freelancer in Africa."
                    />
                    <ExamplePromptButton 
                        title="Learn Digital Marketing" 
                        description="...and create a marketing plan" 
                        prompt="Teach me the basics of digital marketing and help me create a simple marketing plan for my online store."
                    />
                     <ExamplePromptButton 
                        title="Learn African History" 
                        description="...about the Mali Empire" 
                        prompt="Tell me about the history of the Mali Empire and its most famous ruler."
                    />
              </div>

              <h2 className="mt-12 mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Video Example (what you can generate)</h2>
              <div className="mt-4 max-w-lg mx-auto">
                 <VideoExample />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;