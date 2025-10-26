import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { UserIcon, RatelLogo, CopyIcon, CheckIcon, SpeakerIcon, StopIcon, DownloadIcon, GlobeIcon, EditIcon } from '../constants';
import { ChatMessage, MessagePart } from '../types';
import TaskList from './TaskList';
import { playSound, generateAudioBlob } from '../services/audioService';
import CvDisplay from './CvDisplay';

interface ChatMessageProps {
  message: ChatMessage;
}

// FIX: Made children prop optional and handled the undefined case inside the component.
const CodeBlock = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeText = String(children || '').replace(/\n$/, '');

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return match ? (
        <div className="relative">
            <SyntaxHighlighter
                style={oneDark as any}
                language={match[1]}
                PreTag="div"
            >
                {codeText}
            </SyntaxHighlighter>
            <button
                onClick={() => handleCopy(codeText)}
                className="absolute top-2 right-2 p-1.5 bg-gray-800 rounded-md text-gray-300 hover:bg-gray-900"
            >
                {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
            </button>
        </div>
    ) : (
        <code className={`bg-gray-800 text-green-400 rounded px-1.5 py-0.5 ${className || ''}`}>
            {children}
        </code>
    );
};

const markdownComponents = {
    code({ node, className, children, ...props }: any) {
        return <CodeBlock className={className}>{children || ''}</CodeBlock>;
    }
};

const TypingText: React.FC<{ text: string }> = ({ text }) => {
    const [displayedText, setDisplayedText] = useState('');
    const words = useMemo(() => text.split(/(\s+)/), [text]);

    useEffect(() => {
        if (text === 'Alright...') {
            setDisplayedText(text);
            return;
        }

        setDisplayedText('');
        let isCancelled = false;
        let builtText = '';
        let i = 0;

        const typeWord = () => {
            if (isCancelled || i >= words.length) {
                if (!isCancelled) setDisplayedText(text);
                return;
            }
            builtText += words[i];
            setDisplayedText(builtText);
            i++;
            setTimeout(typeWord, 35);
        };
        
        typeWord();

        return () => { isCancelled = true; };
    }, [text, words]);
    
    return <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{displayedText}</Markdown>;
};


const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const { t } = useTranslation();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const isUser = message.role === 'user';
  
  const handleTextToSpeech = async (text: string) => {
    playSound('click');
    if (isAudioPlaying) {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsAudioPlaying(false);
        return;
    }

    try {
        setIsAudioPlaying(true);
        const blob = await generateAudioBlob(text, 'en-NG-Standard-A');
        const url = URL.createObjectURL(blob);
        
        audioRef.current = new Audio(url);
        audioRef.current.play();
        audioRef.current.onended = () => {
            setIsAudioPlaying(false);
            URL.revokeObjectURL(url);
        };
    } catch (error) {
        console.error("TTS Error:", error);
        alert("Sorry, could not play audio.");
        setIsAudioPlaying(false);
    }
  };
  
  React.useEffect(() => {
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);

  const messageParts = message.parts.map((part, index) => (
    <MessagePartComponent 
      key={`${message.id}-${index}`} 
      part={part}
      fullMessage={message}
      isModelMessage={!isUser}
      handleTextToSpeech={handleTextToSpeech} 
      isAudioPlaying={isAudioPlaying}
    />
  ));

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 ring-4 ring-gray-800">
          <RatelLogo className="w-5 h-5 text-green-500" />
        </div>
      )}
      <div className={`${isUser ? 'order-1 items-end' : 'order-2 items-start'} flex flex-col`}>
        <div className={`p-3 rounded-xl ${isUser ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
          {messageParts}
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 order-2 ring-4 ring-gray-800">
          <UserIcon className="w-5 h-5 text-gray-300" />
        </div>
      )}
    </div>
  );
};

// --- Message Part Component ---
const MessagePartComponent: React.FC<{ 
    part: MessagePart, 
    isModelMessage: boolean, 
    handleTextToSpeech: (text:string) => void, 
    isAudioPlaying: boolean,
    fullMessage: ChatMessage,
}> = ({ part, isModelMessage, handleTextToSpeech, isAudioPlaying, fullMessage }) => {

    switch (part.type) {
        case 'text':
            return (
                <div>
                  <div className="prose prose-sm max-w-none prose-invert prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-li:my-0">
                    {isModelMessage ? (
                        <TypingText text={part.content} />
                    ) : (
                        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {part.content}
                        </Markdown>
                    )}
                  </div>
                   {part.groundingChunks && part.groundingChunks.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-500/50">
                          <h4 className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                              <GlobeIcon className="w-3.5 h-3.5" />
                              Sources
                          </h4>
                          <ul className="text-xs space-y-1">
                              {part.groundingChunks.map((chunk, i) => (
                                <li key={i}>
                                    <a href={chunk.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block">
                                      {chunk.web?.title}
                                    </a>
                                </li>
                              ))}
                          </ul>
                      </div>
                  )}
                  {isModelMessage && part.content !== 'Alright...' && (
                    <button onClick={() => handleTextToSpeech(part.content)} className="mt-2 p-1 text-gray-400 hover:text-white">
                      {isAudioPlaying ? <StopIcon className="w-4 h-4" /> : <SpeakerIcon className="w-4 h-4" />}
                    </button>
                  )}
                </div>
            );
        case 'image':
            return (
                <div>
                    <img
                        src={`data:${part.mimeType};base64,${part.content}`}
                        alt="Generated"
                        className="rounded-lg max-w-full h-auto"
                    />
                </div>
            );
        case 'tasks':
            return <TaskList tasks={part.content.tasks} onToggleTask={part.content.onToggleTask} />;
        case 'cv':
            return <CvDisplay cvData={part.content.cvData} isLoading={part.content.isLoading} />;
        case 'loading':
            return (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    {part.content && <span className="text-sm text-gray-400">{part.content}</span>}
                </div>
            );
        case 'error':
            return <p className="text-red-400 font-medium">{part.content}</p>;
        default:
            return null;
    }
};

export default ChatMessageComponent;