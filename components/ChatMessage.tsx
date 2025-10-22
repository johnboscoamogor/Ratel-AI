import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { UserIcon, RatelLogo, CopyIcon, CheckIcon, SpeakerIcon, StopIcon, ExpandIcon, DownloadIcon, GlobeIcon, EditIcon } from '../constants';
import { ChatMessage, MessagePart } from '../types';
import TaskList from './TaskList';
import { playSound, generateAudioBlob } from '../services/audioService';
import CvDisplay from './CvDisplay';

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const { t } = useTranslation();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const isUser = message.role === 'user';
  const isVideoMessage = message.parts.some(p => p.type === 'video');
  
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
        const blob = await generateAudioBlob(text, 'en-NG-Standard-A'); // Use a default voice
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
      handleTextToSpeech={handleTextToSpeech} 
      isAudioPlaying={isAudioPlaying}
    />
  ));

  // Special centered layout for AI-generated video messages
  if (isVideoMessage && !isUser) {
    return (
      <div className="flex justify-center my-4">
        <div className="w-full max-w-lg bg-gray-700 rounded-2xl p-3 space-y-2">
          {messageParts}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
          <RatelLogo className="w-5 h-5 text-green-500" />
        </div>
      )}
      <div className={`max-w-xl ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`p-3 rounded-2xl ${isUser ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
          {messageParts}
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 order-2">
          <UserIcon className="w-5 h-5 text-gray-600" />
        </div>
      )}
    </div>
  );
};

// --- Message Part Component ---
const MessagePartComponent: React.FC<{ part: MessagePart, handleTextToSpeech: (text:string) => void, isAudioPlaying: boolean }> = ({ part, handleTextToSpeech, isAudioPlaying }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    switch (part.type) {
        case 'text':
            return (
                <div>
                  <div className="prose prose-sm max-w-none prose-invert prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-li:my-0">
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // FIX: Destructured `inline` prop and added a check to differentiate between
                        // inline code and code blocks. Removed `...props` from `SyntaxHighlighter` to fix
                        // a 'ref' type incompatibility error caused by recent versions of react-markdown.
                        // FIX: The 'inline' prop is deprecated in recent versions of react-markdown.
                        // Differentiating between code blocks and inline code is now done by checking for a language class.
                        code({ node, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeText = String(children).replace(/\n$/, '');
                          return match ? (
                            <div className="relative">
                              {/* FIX: Cast `oneDark` style to `any` to resolve TypeScript type incompatibility with the SyntaxHighlighter component. */}
                              <SyntaxHighlighter
                                style={oneDark as any}
                                language={match[1]}
                                PreTag="div"
                                /* {...props} was causing a ref type error */
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
                            // FIX: Spreading `...props` here can pass non-standard attributes to the `code` tag, causing a TypeScript error.
                            // Only className and children are needed for inline code.
                            <code className={`bg-gray-600/50 text-gray-200 rounded px-1.5 py-0.5 ${className || ''}`}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {part.content}
                    </Markdown>
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
                  <button onClick={() => handleTextToSpeech(part.content)} className="mt-2 p-1 text-gray-400 hover:text-white">
                    {isAudioPlaying ? <StopIcon className="w-4 h-4" /> : <SpeakerIcon className="w-4 h-4" />}
                  </button>
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
        case 'video':
             return (
                <div className="relative group">
                    <video
                        key={part.content.url}
                        src={part.content.url}
                        controls
                        loop
                        playsInline
                        className="rounded-lg w-full bg-black"
                        aria-label="Generated video"
                    />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={part.content.url} download="ratel-ai-video.mp4" className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/80">
                            <DownloadIcon className="w-4 h-4"/>
                        </a>
                        <button onClick={() => { if(document.fullscreenEnabled) document.querySelector('video')?.requestFullscreen() }} className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/80">
                            <ExpandIcon className="w-4 h-4"/>
                        </button>
                    </div>
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
                    {part.content && <span className="text-sm text-gray-300">{part.content}</span>}
                </div>
            );
        case 'error':
            return <p className="text-red-400 font-medium">{part.content}</p>;
        default:
            return null;
    }
};

export default ChatMessageComponent;