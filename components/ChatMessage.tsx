import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { UserIcon, RatelLogo, CopyIcon, CheckIcon, SpeakerIcon, StopIcon, ExpandIcon, DownloadIcon, GlobeIcon, EditIcon } from '../constants';
import { ChatMessage, MessagePart } from '../types';
import TaskList from './TaskList';
import { playSound, generateAudioBlob, cancelAndCloseAllAudioSessions } from '../services/audioService';
import CvDisplay from './CvDisplay';

interface ChatMessageProps {
  message: ChatMessage;
  onEditVideoPrompt?: (originalMessage: ChatMessage) => void;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, onEditVideoPrompt }) => {
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
      cancelAndCloseAllAudioSessions();
    };
  }, []);

  const renderPart = (part: MessagePart, index: number) => {
    switch (part.type) {
      case 'text':
        return <TextContent key={index} content={part.content} onTextToSpeech={handleTextToSpeech} isAudioPlaying={isAudioPlaying} groundingChunks={part.groundingChunks} />;
      case 'image':
        return <ImageContent key={index} base64Data={part.content} mimeType={part.mimeType} />;
      case 'video':
        return <VideoContent key={index} content={part.content} onEdit={() => onEditVideoPrompt?.(message)} />;
      case 'loading':
        return <LoadingIndicator key={index} content={part.content} />;
      case 'error':
        return <ErrorMessage key={index} content={part.content} />;
      case 'tasks':
        return <TaskList key={index} tasks={part.content} onToggleTask={() => { /* State is managed in ChatView */ }} />;
      case 'cv':
        return <CvDisplay key={index} cvData={part.content} isLoading={false} />;
      default:
        return <p key={index}>Unsupported content type</p>;
    }
  };

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
          <RatelLogo className="w-5 h-5 text-white" />
        </div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`max-w-xl p-3 rounded-xl shadow-sm ${isUser ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
            {message.parts.map(renderPart)}
            {message.audioUrl && (
              <div className="mt-3 pt-3 border-t border-gray-200/50">
                <p className="text-xs font-semibold mb-1">{t('videoStudio.dialogueLabel')}</p>
                <audio src={message.audioUrl} controls className="w-full h-8" />
              </div>
            )}
             {message.ambianceUrl && (
              <div className="mt-2">
                <p className="text-xs font-semibold mb-1">{t('videoStudio.ambianceLabel')}</p>
                <audio src={message.ambianceUrl} controls className="w-full h-8" />
              </div>
            )}
          </div>
      </div>
       {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-5 h-5 text-gray-600" />
        </div>
      )}
    </div>
  );
};


// --- Sub-components for different content types ---

const TextContent: React.FC<{ content: string, onTextToSpeech: (text: string) => void, isAudioPlaying: boolean, groundingChunks?: any[] }> = ({ content, onTextToSpeech, isAudioPlaying, groundingChunks }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    playSound('click');
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div>
        <div className="relative group">
            <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    ) : (
                        <code className={className} {...props}>
                        {children}
                        </code>
                    );
                    },
                }}
            >
                {content}
            </Markdown>
             <div className="absolute top-0 right-0 flex opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-100/50 rounded-bl-lg">
                <button onClick={() => onTextToSpeech(content)} className="p-1 text-gray-600 hover:text-green-700">
                    {isAudioPlaying ? <StopIcon className="w-4 h-4" /> : <SpeakerIcon className="w-4 h-4" />}
                </button>
                <button onClick={handleCopy} className="p-1 text-gray-600 hover:text-green-700">
                    {copied ? <CheckIcon className="w-4 h-4 text-green-600"/> : <CopyIcon className="w-4 h-4"/>}
                </button>
            </div>
        </div>
        {groundingChunks && groundingChunks.length > 0 && (
             <div className="mt-3 pt-3 border-t border-gray-200/50">
                 <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><GlobeIcon className="w-3 h-3"/> Sources</h4>
                 <div className="flex flex-wrap gap-2">
                     {groundingChunks.map((chunk, i) => chunk.web && (
                         <a href={chunk.web.uri} key={i} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full hover:bg-green-200 hover:underline">
                             {chunk.web.title || new URL(chunk.web.uri).hostname}
                         </a>
                     ))}
                 </div>
             </div>
        )}
    </div>
  );
};

const ImageContent: React.FC<{ base64Data: string, mimeType?: string }> = ({ base64Data, mimeType }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const src = `data:${mimeType || 'image/png'};base64,${base64Data}`;
    
    return (
        <>
            <div className="relative group">
                <img src={src} alt="Generated content" className="rounded-lg max-w-sm max-h-96" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <button onClick={() => setIsModalOpen(true)} className="p-2 bg-white/80 rounded-full text-gray-800 hover:bg-white"><ExpandIcon className="w-5 h-5"/></button>
                    <a href={src} download="ratel-ai-image.png" className="ml-2 p-2 bg-white/80 rounded-full text-gray-800 hover:bg-white"><DownloadIcon className="w-5 h-5"/></a>
                </div>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setIsModalOpen(false)}>
                    <img src={src} alt="Generated content enlarged" className="max-w-[90vw] max-h-[90vh] object-contain" />
                </div>
            )}
        </>
    );
};

const VideoContent: React.FC<{ content: { url: string; prompt: string }; onEdit: () => void; }> = ({ content, onEdit }) => {
    return (
        <div className="relative group">
            <video src={content.url} controls loop className="rounded-lg w-full bg-black" />
            <div className="absolute top-0 right-0 flex opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-900/30 rounded-bl-lg">
                <button onClick={onEdit} className="p-1 text-white hover:text-green-300">
                    <EditIcon className="w-4 h-4" />
                </button>
                <a href={content.url} download="ratel-ai-video.mp4" className="p-1 text-white hover:text-green-300">
                    <DownloadIcon className="w-4 h-4" />
                </a>
            </div>
            <p className="text-xs italic text-gray-500 mt-1 px-1">"{content.prompt}"</p>
        </div>
    );
};


const LoadingIndicator: React.FC<{ content?: string }> = ({ content }) => (
    <div className="flex flex-col items-center gap-2 text-gray-500">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
        </div>
        {content && <p className="text-sm">{content}</p>}
    </div>
);

const ErrorMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="text-red-800 bg-red-100 p-2 rounded-md border border-red-200 text-sm">
    <strong>Error:</strong> {content}
  </div>
);

export default ChatMessageComponent;