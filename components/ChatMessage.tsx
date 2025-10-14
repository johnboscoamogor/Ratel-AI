// FIX: Replaced placeholder content with the actual ChatMessage component implementation to resolve module errors.
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Message, Role, Task, MobileWorker } from '../types';
import { RatelLogo, UserIcon, CopyIcon, CheckIcon, SpeakerIcon, StopIcon, TrashIcon, ExpandIcon, DownloadIcon, EditIcon, GlobeIcon, AwardIcon } from '../constants';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { playSound } from '../services/audioService';
import TaskList from './TaskList';

interface ChatMessageProps {
  message: Message;
  isLoading: boolean;
  speakingMessageId: string | null;
  onPlayAudio: (id: string, text: string) => void;
  onStopAudio: () => void;
  onDeleteMessage: (id: string) => void;
  onToggleTask: (taskId: string) => void;
  onEditPrompt: (prompt: string) => void;
  onEditVideoPrompt: (prompt: string) => void;
}

const CODE_BLOCK_THRESHOLD_LINES = 15;

const WorkerCard: React.FC<{ worker: MobileWorker }> = ({ worker }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <img src={worker.profile_photo_url} alt={worker.full_name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"/>
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900">{worker.full_name}</h4>
                    {worker.verified && <div className="flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full"><AwardIcon className="w-3 h-3"/> {t('mobileWorkersStudio.find.verified')}</div>}
                </div>
                <p className="text-sm text-gray-600">{worker.skill_category} • {worker.location}</p>
                <div className="mt-2 flex gap-2">
                    <a href={`tel:${worker.phone_number}`} className="text-xs bg-blue-100 text-blue-800 font-semibold py-1 px-3 rounded-full hover:bg-blue-200">Call</a>
                    {worker.whatsapp_link && <a href={worker.whatsapp_link} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-100 text-green-800 font-semibold py-1 px-3 rounded-full hover:bg-green-200">WhatsApp</a>}
                </div>
            </div>
        </div>
    );
};


const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading, speakingMessageId, onPlayAudio, onStopAudio, onDeleteMessage, onToggleTask, onEditPrompt, onEditVideoPrompt }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = message.role === Role.USER;
  
  const contentToUse = message.content;
  const isSpeaking = speakingMessageId === message.id;

  const handleCopy = () => {
    playSound('click');
    navigator.clipboard.writeText(contentToUse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayAudio = () => {
    playSound('click');
    onPlayAudio(message.id, contentToUse);
  };

  const handleStopAudio = () => {
    playSound('click');
    onStopAudio();
  };

  const handleDelete = () => {
    playSound('click');
    onDeleteMessage(message.id);
  }

  const handleDownloadImage = () => {
    playSound('click');
    if (!message.imageUrl) return;
    const link = document.createElement('a');
    link.href = message.imageUrl;
    link.download = `ratel-ai-image-${message.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleDownloadVideo = () => {
    playSound('click');
    if (!message.videoUrl) return;
    const link = document.createElement('a');
    link.href = message.videoUrl;
    link.download = `ratel-ai-video-${message.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  const handleEditPrompt = () => {
    if (message.imagePrompt) {
      playSound('click');
      onEditPrompt(message.imagePrompt);
    }
  }

  const handleEditVideoPrompt = () => {
    if (message.videoPrompt) {
        playSound('click');
        onEditVideoPrompt(message.videoPrompt);
    }
  }

  const handleToggleExpand = () => {
    playSound('click');
    setIsExpanded(!isExpanded);
  };

  const ImageModal: React.FC<{ src: string, onClose: () => void }> = ({ src, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="relative max-w-4xl max-h-full">
            <img src={src} alt={t('chatMessage.expandedImageAlt')} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            <button onClick={onClose} className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-2 hover:bg-black focus:outline-none">
                &times;
            </button>
        </div>
    </div>
  );

  const containerClass = isUser ? 'flex-row-reverse' : 'flex-row';
  const bubbleClass = isUser ? 'bg-green-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none';
  const icon = isUser ? (
    <UserIcon className="w-8 h-8 rounded-full bg-gray-200 p-1.5 text-gray-600" />
  ) : (
    <RatelLogo className="w-8 h-8 text-green-600" />
  );
  
  const codeBlockRegex = /(```[\s\S]*?```)/g;
  const codeBlocks = contentToUse.match(codeBlockRegex);
  const firstLongCodeBlock = codeBlocks ? codeBlocks.find(block => block.split('\n').length > CODE_BLOCK_THRESHOLD_LINES) : null;

  let contentToShow = contentToUse;
  let showToggleButton = false;

  if (firstLongCodeBlock && !isExpanded) {
      showToggleButton = true;
      const lines = firstLongCodeBlock.split('\n');
      const truncatedLines = lines.slice(0, CODE_BLOCK_THRESHOLD_LINES);
      const truncatedBlock = truncatedLines.join('\n') + '\n... \n```';
      contentToShow = contentToUse.replace(firstLongCodeBlock, truncatedBlock);
  } else if (firstLongCodeBlock) {
      showToggleButton = true;
  }
  
  return (
    <div className={`flex gap-4 items-start ${containerClass}`}>
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className={`flex-1 min-w-0 p-4 rounded-xl shadow-sm ${bubbleClass}`}>
          <div className="prose prose-sm max-w-none prose-p:my-2 prose-ol:my-2 prose-ul:my-2 prose-headings:my-3">
            {message.originalImageUrl && (
              <div className="mb-2">
                <img src={message.originalImageUrl} alt={t('chatMessage.userUploadAlt')} className="max-w-xs max-h-48 rounded-md border border-gray-300" />
              </div>
            )}
            {isLoading && !contentToUse && !message.imageUrl && !message.tasks ? (
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
              </div>
            ) : (
              <>
                {contentToUse && <Markdown remarkPlugins={[remarkGfm]}>{contentToShow}</Markdown>}
                {message.tasks && <TaskList tasks={message.tasks} onToggleTask={onToggleTask} />}
                {message.workers && message.workers.length > 0 && (
                    <div className="mt-4 border-t border-gray-200/50 -mx-4 px-4 pt-3 space-y-3">
                        {message.workers.map(worker => <WorkerCard key={worker.id} worker={worker} />)}
                    </div>
                )}
                {message.imageUrl && (
                  <div className="mt-2 relative group w-fit">
                      <img 
                          src={message.imageUrl} 
                          alt={t('chatMessage.generatedImageAlt')} 
                          className="max-w-full md:max-w-md max-h-96 rounded-lg border border-gray-300 cursor-pointer outline-none ring-0" 
                          onClick={() => { playSound('click'); setIsImageModalOpen(true); }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           {message.imagePrompt && (
                             <button onClick={handleEditPrompt} className="bg-gray-800/60 text-white p-2 rounded-full hover:bg-black/80" aria-label={t('chatMessage.editPrompt')}>
                                 <EditIcon className="w-4 h-4" />
                             </button>
                           )}
                           <button onClick={() => { playSound('click'); setIsImageModalOpen(true); }} className="bg-gray-800/60 text-white p-2 rounded-full hover:bg-black/80" aria-label={t('chatMessage.expandImage')}>
                              <ExpandIcon className="w-4 h-4" />
                          </button>
                           <button onClick={handleDownloadImage} className="bg-gray-800/60 text-white p-2 rounded-full hover:bg-black/80" aria-label={t('chatMessage.downloadImage')}>
                              <DownloadIcon className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
                )}
                 {message.videoUrl && (
                  <div className="mt-2 relative group w-fit">
                      <video
                          src={message.videoUrl}
                          controls
                          loop
                          muted
                          playsInline
                          className="max-w-full md:max-w-md max-h-96 rounded-lg border border-gray-300"
                          aria-label={t('chatMessage.generatedVideoAlt')}
                      />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {message.videoPrompt && (
                              <button onClick={handleEditVideoPrompt} className="bg-gray-800/60 text-white p-2 rounded-full hover:bg-black/80" aria-label={t('chatMessage.editPrompt')}>
                                  <EditIcon className="w-4 h-4" />
                              </button>
                          )}
                          <button onClick={handleDownloadVideo} className="bg-gray-800/60 text-white p-2 rounded-full hover:bg-black/80" aria-label={t('chatMessage.downloadVideo')}>
                              <DownloadIcon className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
                  )}
              </>
            )}
          </div>
        
        {showToggleButton && (
            <div className="mt-3 pt-2 text-center border-t border-gray-200/50 -mx-4">
                <button
                    onClick={handleToggleExpand}
                    className="text-sm font-semibold text-green-700 hover:text-green-800 hover:underline px-4 py-1"
                >
                    {isExpanded ? t('chatMessage.showLess') : t('chatMessage.showMore')}
                </button>
            </div>
        )}
        {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200/50 -mx-4 px-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600 mb-2">
                    <GlobeIcon className="w-4 h-4" />
                    <span>{t('chatMessage.sources')}</span>
                </h4>
                <ul className="space-y-1.5">
                    {message.sources.map((source, index) => (
                    <li key={index} className="text-sm truncate">
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline inline-flex items-center gap-1.5" title={source.title}>
                        <img src={`https://www.google.com/s2/favicons?sz=16&domain_url=${new URL(source.uri).hostname}`} alt="favicon" className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
                        </a>
                    </li>
                    ))}
                </ul>
            </div>
        )}
        {!isUser && !isLoading && (contentToUse || message.workers) && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200/50 -mx-4 px-4">
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-colors"
              aria-label={t('chatMessage.copy')}
            >
              {copied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <CopyIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={isSpeaking ? handleStopAudio : handlePlayAudio}
              className="p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-colors"
              aria-label={isSpeaking ? t('chatMessage.stopSpeaking') : t('chatMessage.readAloud')}
            >
              {isSpeaking ? <StopIcon className="w-4 h-4 text-red-600" /> : <SpeakerIcon className="w-4 h-4" />}
            </button>
             <div className="flex-grow"></div>
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors"
              aria-label={t('chatMessage.delete')}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
       {isImageModalOpen && message.imageUrl && (
            <ImageModal src={message.imageUrl} onClose={() => { playSound('click'); setIsImageModalOpen(false); }} />
       )}
    </div>
  );
};

export default ChatMessage;