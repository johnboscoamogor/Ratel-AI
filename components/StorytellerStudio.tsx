import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, ClapperboardIcon, DownloadIcon, InfoIcon, PlayIcon, StopIcon } from '../constants';
import { playSound, generateAudioBlob } from '../services/audioService';
import { ai } from '../services/geminiService';
import { Type } from '@google/genai';
import { AppSettings, Story } from '../types';
import { communityService } from '../services/communityService';


interface StorytellerStudioProps {
  onClose: () => void;
  onStoryGenerated: (story: Story) => void;
  settings: AppSettings;
  onOpenProModal: (message: string) => void;
}

type GenerationStatus = 'idle' | 'script' | 'audio' | 'video' | 'final' | 'done' | 'error';
const DAILY_STORY_LIMIT = 3;

const StorytellerStudio: React.FC<StorytellerStudioProps> = ({ onClose, onStoryGenerated, settings, onOpenProModal }) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [story, setStory] = useState<Story | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isShared, setIsShared] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio();
        const audio = audioRef.current;
        const handlePlaybackEnd = () => {
            setIsPlaying(false);
            if(videoRef.current) videoRef.current.currentTime = 0;
        };
        audio.addEventListener('ended', handlePlaybackEnd);
        return () => audio.removeEventListener('ended', handlePlaybackEnd);
    }, []);

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

        setStatus('script');
        setErrorMessage('');
        setStory(null);
        setIsShared(false);

        try {
            // --- Step 1: Generate Story Script ---
            const scriptResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Create a short story based on this prompt: "${prompt}". The story should be suitable for a short video. Structure the output as a JSON object with the following schema: title (string), scenes (array of objects, each with sceneNumber, description for video visuals, and narration text), and lesson (string). Focus on African or biblical themes if relevant.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            scenes: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        sceneNumber: { type: Type.INTEGER },
                                        description: { type: Type.STRING },
                                        narration: { type: Type.STRING },
                                    }
                                }
                            },
                            lesson: { type: Type.STRING }
                        }
                    }
                }
            });
            
            let script;
            try {
                 script = JSON.parse(scriptResponse.text);
            } catch (e) {
                console.error("Failed to parse AI response as JSON:", scriptResponse.text);
                throw new Error("The AI returned an invalid response. Please try again.");
            }
            
            // FIX: Add validation for the script structure to prevent crashes.
            if (!script || !Array.isArray(script.scenes) || script.scenes.length === 0) {
                console.error("Invalid script structure received from AI:", script);
                throw new Error("The AI failed to generate a valid story script. Please try a different prompt.");
            }

            // --- Step 2 & 3: Generate Audio and Video Concurrently ---
            setStatus('audio');
            const fullNarration = script.scenes.map((s: any) => s.narration).join(' ');
            const audioPromise = generateAudioBlob(fullNarration, settings.voice.selectedVoice.split('_')[1]);

            setStatus('video');
            const videoPrompt = `${script.title}. A beautifully animated story. ${script.scenes.map((s: any) => `Scene ${s.sceneNumber}: ${s.description}`).join('. ')}`;
            let videoOperation = await ai.models.generateVideos({
                model: 'veo-2.0-generate-001',
                prompt: videoPrompt,
            });
            
            setStatus('final');
            while (!videoOperation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                videoOperation = await ai.operations.getVideosOperation({ operation: videoOperation });
            }
            const videoUri = videoOperation.response?.generatedVideos?.[0]?.video?.uri;
            if (!videoUri) throw new Error("Video generation did not return a valid URL.");

            const [audioBlob] = await Promise.all([audioPromise]);
            const audioUrl = URL.createObjectURL(audioBlob);
            const finalVideoUrl = `${videoUri}&key=${process.env.API_KEY}`;
            
            const newStory: Story = {
                id: crypto.randomUUID(),
                prompt,
                title: script.title,
                script,
                videoUrl: finalVideoUrl,
                audioUrl,
                timestamp: Date.now(),
            };
            
            setStory(newStory);
            onStoryGenerated(newStory);
            setStatus('done');

        } catch (error: any) {
            console.error("Story generation failed:", error);
            
            let userFriendlyMessage = "An unexpected error occurred. Please try again.";

            // Check for the specific Gemini API error structure which is a JSON object
            if (error && error.error && typeof error.error.message === 'string') {
                 if (String(error.error.message).includes("xhr error")) {
                     userFriendlyMessage = "A network error occurred while communicating with the AI. Please check your connection and try again.";
                 } else if (error.error.code === 500) {
                     userFriendlyMessage = "The AI service is currently experiencing issues. Please try again in a few moments.";
                 } else {
                     userFriendlyMessage = error.error.message;
                 }
            } 
            // Check for a standard Error object
            else if (error instanceof Error) {
                userFriendlyMessage = error.message;
            } 
            // Handle plain string errors
            else if (typeof error === 'string') {
                userFriendlyMessage = error;
            }
            
            setErrorMessage(userFriendlyMessage);
            setStatus('error');
        }
    };

    const handlePlayPause = () => {
        const audio = audioRef.current;
        const video = videoRef.current;
        if (!audio || !video) return;

        if (isPlaying) {
            audio.pause();
            video.pause();
            setIsPlaying(false);
        } else {
            video.muted = true; // Ensure video is muted to only hear our narration
            audio.src = story?.audioUrl || '';
            Promise.all([video.play(), audio.play()]).then(() => {
                setIsPlaying(true);
            }).catch(e => console.error("Playback failed", e));
        }
    };

    const handleShare = () => {
        if (!story) return;
        communityService.addPost(
            `Check out this story I created with Ratel AI: "${story.title}"`,
            undefined,
            { name: "You" } as any, // This part needs a proper user object in a real app
            story.videoUrl
        );
        setIsShared(true);
        setTimeout(() => setIsShared(false), 3000);
    };
    
    const handleTryExample = (examplePrompt: string) => {
        playSound('click');
        setPrompt(examplePrompt);
    };
    
    const storyExamples = t('storytellerStudio.examples', { returnObjects: true }) as string[];

    const statusMessages: Record<GenerationStatus, string> = {
        idle: '',
        script: t('storytellerStudio.loading.script'),
        audio: t('storytellerStudio.loading.audio'),
        video: t('storytellerStudio.loading.video'),
        final: t('storytellerStudio.loading.final'),
        done: '',
        error: '',
    };
    
    const isLoading = status !== 'idle' && status !== 'done' && status !== 'error';

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
                                 className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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

                    {isLoading && (
                        <div className="text-center h-full flex flex-col items-center justify-center">
                            <svg className="animate-spin h-10 w-10 text-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-lg font-semibold text-gray-700">{statusMessages[status]}</p>
                        </div>
                    )}
                    
                    {status === 'error' && (
                        <div className="text-center h-full flex flex-col items-center justify-center">
                             <p className="text-red-600 bg-red-50 p-4 rounded-lg">{t('storytellerStudio.error', { error: errorMessage })}</p>
                             <button onClick={() => setStatus('idle')} className="mt-4 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg">Try Again</button>
                        </div>
                    )}
                    
                    {status === 'done' && story && (
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-center">{story.title}</h3>
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                <video ref={videoRef} src={story.videoUrl} className="w-full h-full object-contain" loop playsInline />
                                <button onClick={handlePlayPause} className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                                    {isPlaying ? <StopIcon className="w-16 h-16 text-white/80" /> : <PlayIcon className="w-16 h-16 text-white/80" />}
                                </button>
                            </div>
                             <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                                <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span>{t('storytellerStudio.disclaimer')}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <a href={story.videoUrl} download={`${story.title.replace(/\s/g, '_')}_video.mp4`} className="flex-1 btn-secondary"><DownloadIcon className="w-4 h-4 mr-2"/>{t('storytellerStudio.downloadVideo')}</a>
                                <a href={story.audioUrl} download={`${story.title.replace(/\s/g, '_')}_narration.wav`} className="flex-1 btn-secondary"><DownloadIcon className="w-4 h-4 mr-2"/>{t('storytellerStudio.downloadAudio')}</a>
                                <button onClick={handleShare} className="flex-1 btn-primary" disabled={isShared}>{isShared ? t('storytellerStudio.shared') : t('storytellerStudio.share')}</button>
                            </div>
                            
                            <details className="pt-4 border-t">
                                <summary className="font-semibold cursor-pointer">{t('storytellerStudio.script')}</summary>
                                <div className="mt-2 space-y-2 text-sm bg-gray-50 p-3 rounded-md">
                                    {story.script.scenes.map(scene => (
                                        <div key={scene.sceneNumber}>
                                            <p><strong>Scene {scene.sceneNumber}:</strong> {scene.description}</p>
                                            <p className="italic pl-4">"{scene.narration}"</p>
                                        </div>
                                    ))}
                                    <div className="pt-2 border-t mt-2">
                                        <p><strong>{t('storytellerStudio.lesson')}:</strong> {story.script.lesson}</p>
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