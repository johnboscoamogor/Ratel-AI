import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from '../types';
import ChatMessage from './ChatMessage';
import { RatelLogo } from '../constants';
import { playSound } from '../services/audioService';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  speakingMessageId: string | null;
  onPlayAudio: (id: string, text: string) => void;
  onStopAudio: () => void;
  onDeleteMessage: (id: string) => void;
  onToggleTask: (taskId: string) => void;
  onSendSuggestion: (message: string) => void;
  onEditPrompt: (prompt: string) => void;
  onEditVideoPrompt: (prompt: string) => void;
}

const SuggestionChip: React.FC<{text: string, onClick: () => void}> = ({text, onClick}) => (
    <button
        onClick={onClick}
        className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors rounded-lg px-4 py-2 text-sm font-medium"
    >
        {text}
    </button>
);

const Placeholder: React.FC<{onSendSuggestion: (message: string) => void}> = ({ onSendSuggestion }) => {
    const { t } = useTranslation();
    const suggestions = [
        t('chatWindow.suggestion1'),
        t('chatWindow.suggestion2'),
        t('chatWindow.suggestion3'),
        t('chatWindow.suggestion4'),
    ];

    const handleSuggestionClick = (suggestion: string) => {
        playSound('click');
        onSendSuggestion(suggestion);
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <RatelLogo className="w-24 h-24 text-gray-300 mb-6"/>
            <h2 className="text-4xl font-bold text-gray-600">{t('chatWindow.placeholderTitle')}</h2>
            <p className="text-lg text-gray-500 mt-2 max-w-xl">{t('chatWindow.placeholderSubtitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 max-w-lg w-full">
                {suggestions.map((s, i) => (
                    <SuggestionChip key={i} text={s} onClick={() => handleSuggestionClick(s)} />
                ))}
            </div>
        </div>
    );
};


const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, speakingMessageId, onPlayAudio, onStopAudio, onDeleteMessage, onToggleTask, onSendSuggestion, onEditPrompt, onEditVideoPrompt }) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full w-full">
      {messages.length === 0 ? (
        <Placeholder onSendSuggestion={onSendSuggestion} />
      ) : (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
          {messages.map((msg, index) => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              isLoading={isLoading && index === messages.length - 1}
              speakingMessageId={speakingMessageId}
              onPlayAudio={onPlayAudio}
              onStopAudio={onStopAudio}
              onDeleteMessage={onDeleteMessage}
              onToggleTask={onToggleTask}
              onEditPrompt={onEditPrompt}
              onEditVideoPrompt={onEditVideoPrompt}
            />
          ))}
          <div ref={endOfMessagesRef} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;