import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
// FIX: Imported ClapperboardIcon from constants.
import { CloseIcon, ClapperboardIcon, DownloadIcon, InfoIcon, PlayIcon, StopIcon } from '../constants';
import { playSound } from '../services/audioService';
import { AppSettings, Story } from '../types';
import { communityService } from '../services/communityService';

interface StorytellerStudioProps {
  onClose: () => void;
  onStoryGenerated: (story: Story) => void;
  settings: AppSettings;
  onOpenProModal: (message: string) => void;
}

interface StoryApiResponse {
    id: string;
    title: string;
    script: string;
    scenes: any[];
    sceneVideoUrls: (string | null)[];
    audioBase64: string;
}

type GenerationStatus = 'idle' | 'generating' | 'done' | 'error';
const DAILY_STORY_LIMIT = 3;

const StorytellerStudio: React.FC<StorytellerStudioProps> = ({ onClose, onStoryGenerated, settings, onOpenProModal }) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [storyResponse, setStoryResponse] = useState<StoryApiResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isShared, setIsShared] = useState(false);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    
    // Loading message cycle effect
    useEffect(() => {
        // FIX: The return type of setInterval in a browser environment is a number, not NodeJS.Timeout.
        // Changed the type to 'number' to align with the browser's Web APIs.
        let interval: number;
        if (status === 'generating') {
            const messages = [
                t('storytellerStudio.loading.script'),
                t('storytellerStudio.loading.video'),
                t('storytellerStudio.loading.audio'),
                t('storytellerStudio.loading.final'),
            ];
            let msgIndex = 0;
            setLoadingMessage(messages[msgIndex]);
            interval = window.setInterval(() => {
                msgIndex = (msgIndex + 1) % messages.length;
                setLoadingMessage(messages[msgIndex]);
            }, 2500); // Change message every 2.5 seconds
        }
        return () => clearInterval(interval);
    }, [status, t]);


    useEffect(() => {
        audioRef.current = new Audio();
        const audio = audioRef.current;
        const handlePlaybackEnd = () => {
            setIsPlaying(false);
            if(videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
            setCurrentSceneIndex(0); // Reset to first scene
        };
        audio.addEventListener('ended', handlePlaybackEnd);
        return () => audio.removeEventListener('ended', handlePlaybackEnd);
    }, []);
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !storyResponse) return;

        const handleSceneEnd = () => {
            if (currentSceneIndex < storyResponse.sceneVideoUrls.length - 1) {
                setCurrentSceneIndex(prev => prev + 1);
            } else {
                 // Loop back to the start if the audio is still playing
                 video.currentTime = 0;
                 video.play().catch(e => console.error(e));
            }
        };

        video.addEventListener('ended', handleSceneEnd);
        return () => video.removeEventListener('ended', handleSceneEnd);
    }, [currentSceneIndex, storyResponse]);
    
    useEffect(() => {
        const video = videoRef.current;
        if (video && storyResponse && storyResponse.sceneVideoUrls[currentSceneIndex]) {
            video.src = storyResponse.sceneVideoUrls[currentSceneIndex]!;
            if (isPlaying) {
                video.play().catch(e => console.error("Scene transition play failed:", e));
            }
        }
    }, [currentSceneIndex, storyResponse, isPlaying]);


    const checkDailyLimit = (): boolean => {
        const key = `ratel_story_count_${new Date().toISOString().split('T')[0]}`;
        const count = parseInt(localStorage.getItem(key) || '0', 10);
        if (count >= DAILY_STORY_LIMIT) {
            onOpenProModal(`You have reached your free daily limit of ${DAILY_STORY_LIMIT} stories. Please upgrade to Ratel Pro for unlimited story creation!`);
            return false;
        }
        localStorage.setItem(key, (count + 1).toString());
        return true;
    };

    const handleGenerate = async () => {
        playSound('click');
        if (!prompt.trim()) return;
        if (!checkDailyLimit()) return;

        setStatus('generating'); 
        setErrorMessage('');
        setStoryResponse(null);
        setIsShared(false);

        try {
            const response = await fetch('/api/story/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt, 
                    language: settings.language, 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'The server failed to generate the story.');
            }

            const data: StoryApiResponse = await response.json();
            setStoryResponse(data);
            
            // This part is for saving to user profile, might need adjustments
            const newStoryForProfile: Story = {
                id: data.id,
                prompt,
                title: data.title,
                script: { title: data.title, scenes: data.scenes, lesson: '' }, // Reconstruct from available data
                videoUrl: data.sceneVideoUrls[0] || '', // Use first scene as representative
                audioUrl: `data:audio/mp3;base64,${data.audioBase64}`,
                timestamp: Date.now(),
            };
            onStoryGenerated(newStoryForProfile);
            
            setStatus('done');

        } catch (error: any) {
            console.error("Story generation failed:", error);
            // FIX: The error from `generate-video.ts` was not being handled correctly.
            // Now, we properly parse the JSON error response and display it to the user.
            let message = "An unexpected error occurred.";
            if (error.message) {
                try {
                    // Try to parse if the message is a JSON string
                    const errJson = JSON.parse(error.message);
                    message = errJson.error || errJson.details || error.message;
                } catch {
                    // If parsing fails, use the raw message
                    message = error.message;
                }
            }
            setErrorMessage(message);
            setStatus('error');
        }
    };

    const handlePlayPause = () => {
        const audio = audioRef.current;
        const video = videoRef.current;
        if (!audio || !video || !storyResponse) return;

        if (isPlaying) {
            audio.pause();
            video.pause();
            setIsPlaying(false);
        } else {
            video.muted = true;
            if (!audio.src) {
                audio.src = `data:audio/mp3;base64,${storyResponse.audioBase64}`;
            }
            if(video.src !== storyResponse.sceneVideoUrls[currentSceneIndex]) {
                 video.src = storyResponse.sceneVideoUrls[currentSceneIndex]!;
            }
            Promise.all([video.play(), audio.play()]).then(() => {
                setIsPlaying(true);
            }).catch(e => console.error("Playback failed", e));
        }
    };

    const handleShare = () => {
        if (!storyResponse) return;
        communityService.addPost(
            `Check out this story I created with Ratel AI: "${storyResponse.title}"`,
            undefined,
            { name: "You" } as any,
            storyResponse.sceneVideoUrls[0] // Share first scene video
        );
        setIsShared(true);
        setTimeout(() => setIsShared(false), 3000);
    };
    
    const handleTryExample = (examplePrompt: string) => {
        playSound('click');
        setPrompt(examplePrompt);
    };
    
    const storyExamples = t('storytellerStudio.examples', { returnObjects: true }) as string[];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all h-[90vh] flex flex-col">
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ClapperboardIcon className="w-5 h-5 text-green-600" />
                        {t('storytellerStudio.title')}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-6">
                    {status === 'idle' && (
                         <div className="flex flex-col h-full">
                             <label htmlFor="story-prompt" className="block text-sm font-medium text-gray-700">{t('imageStudio.promptLabel')}</label>
                             <textarea
                                 id="story-prompt"
                                 rows={4}
                                 className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                                 placeholder={t('storytellerStudio.promptPlaceholder')}
                                 value={prompt}
                                 onChange={(e) => setPrompt(e.target.value)}
                             />
                            <div className="flex-grow mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-600 text-center mb-3">{t('storytellerStudio.tryExample')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {storyExamples.map((example, index) => (
                                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700 flex justify-between items-center">
                                            <span className="italic pr-2">"{example}"</span>
                                            <button
                                                onClick={() => handleTryExample(example)}
                                                className="ml-2 flex-shrink-0 bg-green-100 text-green-800 text-xs font-bold py-1 px-2 rounded-full hover:bg-green-200 transition-colors"
                                            >
                                                Try it
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                              <button
                                 onClick={handleGenerate}
                                 disabled={!prompt.trim()}
                                 className="mt-4 w-full bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300"
                             >
                                 {t('storytellerStudio.generateButton')}
                             </button>
                         </div>
                    )}

                    {status === 'generating' && (
                        <div className="text-center h-full flex flex-col items-center justify-center">
                            <svg className="animate-spin h-10 w-10 text-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-lg font-semibold text-gray-700">{loadingMessage}</p>
                            <p className="text-sm text-gray-500 mt-2">This can take a moment, please wait...</p>
                        </div>
                    )}
                    
                    {status === 'error' && (
                        <div className="text-center h-full flex flex-col items-center justify-center">
                             <p className="text-red-600 bg-red-50 p-4 rounded-lg">{t('storytellerStudio.error', { error: errorMessage })}</p>
                             <button onClick={() => setStatus('idle')} className="mt-4 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg">Try Again</button>
                        </div>
                    )}
                    
                    {status === 'done' && storyResponse && (
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-center">{storyResponse.title}</h3>
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                <video ref={videoRef} className="w-full h-full object-contain" playsInline />
                                <button onClick={handlePlayPause} className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                                    {isPlaying ? <StopIcon className="w-16 h-16 text-white/80" /> : <PlayIcon className="w-16 h-16 text-white/80" />}
                                </button>
                            </div>
                             <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                                <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span>{t('storytellerStudio.disclaimer')}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <a href={`data:audio/mp3;base64,${storyResponse.audioBase64}`} download={`${storyResponse.title.replace(/\s/g, '_')}_narration.mp3`} className="flex-1 btn-secondary"><DownloadIcon className="w-4 h-4 mr-2"/>{t('storytellerStudio.downloadAudio')}</a>
                                <button onClick={handleShare} className="flex-1 btn-primary" disabled={isShared}>{isShared ? t('storytellerStudio.shared') : t('storytellerStudio.share')}</button>
                            </div>
                            
                            <details className="pt-4 border-t">
                                <summary className="font-semibold cursor-pointer">{t('storytellerStudio.script')}</summary>
                                <div className="mt-2 space-y-2 text-sm bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
                                    {storyResponse.scenes.map(scene => (
                                        <div key={scene.scene_index}>
                                            <p><strong>Scene {scene.scene_index}:</strong></p>
                                            <p className="italic pl-4">"{scene.narration_text}"</p>
                                        </div>
                                    ))}
                                    <div className="mt-2">
                                        <p><strong>Downloads:</strong></p>
                                        <ul className="list-disc pl-6">
                                            {storyResponse.sceneVideoUrls.map((url, i) => url && (
                                                <li key={i}><a href={url} download={`scene_${i+1}.mp4`} className="text-green-600 hover:underline">Download Scene {i+1}</a></li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </details>
                        </div>
                    )}
                </main>
                 <style>{`
                    .btn-primary { display: flex; align-items: center; justify-content: center; background-color: #16a34a; color: white; font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: background-color 150ms; }
                    .btn-primary:hover { background-color: #15803d; }
                    .btn-primary:disabled { background-color: #a7f3d0; }
                    .btn-secondary { display: flex; align-items: center; justify-content: center; background-color: #f3f4f6; color: #374151; font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: background-color 150ms; }
                    .btn-secondary:hover { background-color: #e5e7eb; }
                `}</style>
            </div>
        </div>
    );
};

export default StorytellerStudio;