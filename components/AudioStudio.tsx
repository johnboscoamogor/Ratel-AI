import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, SpeakerIcon, StopIcon, TrashIcon, DownloadIcon, ChevronDownIcon, PlayIcon } from '../constants';
import { playSound } from '../services/audioService';
import { generateAudioBlob, gcpVoices, cancelAndCloseAllAudioSessions } from '../services/audioService';

interface AudioStudioProps {
  onClose: () => void;
}

const AudioStudio: React.FC<AudioStudioProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const [generatedAudio, setGeneratedAudio] = useState<{ id: string; text: string; blobUrl: string } | null>(null);
    const [feedback, setFeedback] = useState<{ message: string; type: 'info' | 'error' } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState<string>(gcpVoices[0].id);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [previewState, setPreviewState] = useState<{ voiceId: string | null; status: 'idle' | 'loading' | 'playing' }>({ voiceId: null, status: 'idle' });
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // Cleanup sessions on unmount
    useEffect(() => {
        return () => {
            cancelAndCloseAllAudioSessions();
        };
    }, []);
    
    // Setup audio elements
    useEffect(() => {
        audioRef.current = new Audio();
        previewAudioRef.current = new Audio();
        
        const mainAudio = audioRef.current;
        const previewAudio = previewAudioRef.current;
        
        const handleMainEnd = () => setIsPlaying(false);
        const handlePreviewEnd = () => setPreviewState({ voiceId: null, status: 'idle' });
        
        mainAudio.addEventListener('ended', handleMainEnd);
        previewAudio.addEventListener('ended', handlePreviewEnd);
        
        return () => {
            mainAudio.removeEventListener('ended', handleMainEnd);
            previewAudio.removeEventListener('ended', handlePreviewEnd);
        }
    }, []);

    // Effect for the main generated audio
    useEffect(() => {
        const audioElement = audioRef.current;
        if (!audioElement) return;

        if (generatedAudio) {
            audioElement.src = generatedAudio.blobUrl;
        } else {
            audioElement.pause();
            audioElement.removeAttribute('src');
            setIsPlaying(false);
        }
    }, [generatedAudio]);

    // Effect for handling clicks outside the custom dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleGenerate = async () => {
        playSound('click');
        if (!text.trim() || isGenerating || !selectedVoice) return;

        setIsGenerating(true);
        setFeedback({ message: t('audioStudio.generatingFeedback'), type: 'info' });
        if (generatedAudio) {
            URL.revokeObjectURL(generatedAudio.blobUrl);
            setGeneratedAudio(null);
        }

        try {
            const audioBlob = await generateAudioBlob(text, selectedVoice);
            
            setGeneratedAudio({
                id: crypto.randomUUID(),
                text: text,
                blobUrl: URL.createObjectURL(audioBlob),
            });
            setFeedback(null);
        } catch (error) {
            console.error("Audio generation failed:", error);
            const errorMessage = error instanceof Error ? error.message : t('audioStudio.unknownError');
            setFeedback({ message: t('audioStudio.generationFailed', { error: errorMessage }), type: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = () => {
        playSound('click');
        if (generatedAudio) {
            URL.revokeObjectURL(generatedAudio.blobUrl);
            setGeneratedAudio(null);
            setFeedback(null);
        }
    };
    
    const handlePlayPause = () => {
        playSound('click');
        const audioElement = audioRef.current;
        if (!audioElement) return;

        if (isPlaying) {
            audioElement.pause();
        } else {
            audioElement.play().catch(error => {
                console.error("Audio playback error:", error);
                setFeedback({ message: t('audioStudio.playbackFailed', { error: error.message }), type: 'error' });
            });
        }
    }
    
    const handleDownload = () => {
        playSound('click');
        if (!generatedAudio) return;

        const link = document.createElement('a');
        link.href = generatedAudio.blobUrl;
        const selectedVoiceName = gcpVoices.find(v => v.id === selectedVoice)?.name.toLowerCase().replace(/ /g, '-') || 'audio';
        link.download = `ratel-ai-${selectedVoiceName}-${Date.now()}.mp3`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleStopPreview = () => {
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current.currentTime = 0;
        }
        setPreviewState({ voiceId: null, status: 'idle' });
    }

    const handlePreviewVoice = async (voiceId: string) => {
        playSound('click');
        if (previewState.status !== 'idle') {
            handleStopPreview();
            if (previewState.voiceId === voiceId) return;
        }

        setPreviewState({ voiceId, status: 'loading' });
        try {
            const audioBlob = await generateAudioBlob(t('audioStudio.previewText'), voiceId);
            const blobUrl = URL.createObjectURL(audioBlob);

            if (previewAudioRef.current) {
                previewAudioRef.current.src = blobUrl;
                previewAudioRef.current.play().catch(e => {
                   console.error("Preview playback failed:", e);
                   handleStopPreview();
                });
                setPreviewState({ voiceId, status: 'playing' });
            }
        } catch (error) {
            console.error("Preview generation failed:", error);
            setFeedback({ message: t('audioStudio.previewFailed'), type: 'error' });
            handleStopPreview();
        }
    };
    
    const handleSelectVoice = (voiceId: string) => {
        playSound('click');
        setSelectedVoice(voiceId);
        setIsDropdownOpen(false);
    }

    const handleClose = () => {
        playSound('click');
        onClose();
    }
    
    const currentVoice = gcpVoices.find(v => v.id === selectedVoice);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">{t('audioStudio.title')}</h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="tts-text" className="block text-sm font-medium text-gray-700">{t('audioStudio.textLabel')}</label>
                        <textarea
                            id="tts-text"
                            rows={5}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                            placeholder={t('audioStudio.textPlaceholder')}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={isGenerating}
                        />
                    </div>
                    
                    <div>
                        <label id="voice-select-label" className="block text-sm font-medium text-gray-700">{t('audioStudio.voiceLabel')}</label>
                        <div ref={dropdownRef} className="relative mt-1">
                            <button
                                type="button"
                                onClick={() => { playSound('click'); setIsDropdownOpen(!isDropdownOpen); }}
                                className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:text-sm text-gray-900"
                                aria-haspopup="listbox"
                                aria-expanded={isDropdownOpen}
                                aria-labelledby="voice-select-label"
                                disabled={isGenerating || previewState.status !== 'idle'}
                            >
                                <span className="flex items-center">
                                    <span className="ml-3 block truncate">{currentVoice?.name} ({currentVoice?.lang})</span>
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                </span>
                            </button>
                            {isDropdownOpen && (
                                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" role="listbox">
                                    {gcpVoices.map((voice) => (
                                        <li key={voice.id} className="text-gray-900 relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-gray-100 group" role="option" aria-selected={voice.id === selectedVoice}>
                                            <div className="flex items-center justify-between" onClick={() => handleSelectVoice(voice.id)}>
                                                <span className={`${voice.id === selectedVoice ? 'font-semibold' : 'font-normal'} ml-3 block truncate`}>
                                                    {voice.name} <span className="text-gray-500">({voice.gender}, {voice.lang})</span>
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handlePreviewVoice(voice.id)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-green-600 hover:text-green-800"
                                                disabled={previewState.status !== 'idle' && previewState.voiceId !== voice.id}
                                                aria-label={t('audioStudio.previewVoice', { voiceName: voice.name })}
                                            >
                                                {previewState.voiceId === voice.id && previewState.status === 'loading' && (
                                                    <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                )}
                                                {previewState.voiceId === voice.id && previewState.status === 'playing' && <StopIcon className="h-5 w-5" />}
                                                {previewState.status === 'idle' && <PlayIcon className="h-5 w-5" />}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={!text.trim() || isGenerating || previewState.status !== 'idle'}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>{t('common.generating')}</span>
                            </>
                        ) : (
                            <span>{t('audioStudio.generateButton')}</span>
                        )}
                    </button>

                    {feedback && (
                        <div className={`p-3 rounded-md text-sm ${feedback.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            {feedback.message}
                        </div>
                    )}

                    {generatedAudio && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">{t('audioStudio.generatedAudio')}</h3>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600 italic truncate mb-3">"{generatedAudio.text}"</p>
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={handlePlayPause}
                                        className="flex items-center justify-center gap-2 bg-green-100 text-green-800 font-semibold py-2 px-4 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors text-sm"
                                    >
                                        {isPlaying ? <StopIcon className="w-4 h-4" /> : <SpeakerIcon className="w-4 h-4" />}
                                        <span>{isPlaying ? t('audioStudio.stop') : t('audioStudio.play')}</span>
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center justify-center p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
                                        aria-label={t('audioStudio.download')}
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center justify-center p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                                        aria-label={t('audioStudio.delete')}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <audio
                    ref={audioRef}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default AudioStudio;