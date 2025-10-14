import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, VideoIcon, DownloadIcon } from '../constants';
import { playSound } from '../services/audioService';

interface VideoStudioProps {
  onClose: () => void;
  onGenerate: (prompt: string, image?: { data: string; mimeType: string }, dialogue?: string, ambiance?: string) => void;
  isLoading: boolean;
  initialPrompt?: string;
  initialDialogue?: string;
  initialAmbiance?: string;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ onClose, onGenerate, isLoading, initialPrompt, initialDialogue, initialAmbiance }) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [dialogue, setDialogue] = useState(initialDialogue || '');
    const [ambiance, setAmbiance] = useState(initialAmbiance || '');

    const handleGenerate = () => {
        if (!prompt.trim() || isLoading) return;
        playSound('send');
        onGenerate(prompt, undefined, dialogue, ambiance);
    };
    
    const handleClose = () => {
        playSound('click');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <VideoIcon className="w-5 h-5 text-green-600"/>
                        {t('videoStudio.title')}
                    </h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-700">{t('videoStudio.promptLabel')}</label>
                        <textarea
                            id="video-prompt"
                            rows={3}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            placeholder={t('videoStudio.promptPlaceholder')}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="video-dialogue" className="block text-sm font-medium text-gray-700">{t('videoStudio.dialogueLabel')}</label>
                        <textarea
                            id="video-dialogue"
                            rows={2}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            placeholder={t('videoStudio.dialoguePlaceholder')}
                            value={dialogue}
                            onChange={(e) => setDialogue(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                     <div>
                        <label htmlFor="video-ambiance" className="block text-sm font-medium text-gray-700">{t('videoStudio.ambianceLabel')}</label>
                        <textarea
                            id="video-ambiance"
                            rows={2}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            placeholder={t('videoStudio.ambiancePlaceholder')}
                            value={ambiance}
                            onChange={(e) => setAmbiance(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                    >
                        {isLoading ? t('common.generating') : t('videoStudio.generateButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoStudio;