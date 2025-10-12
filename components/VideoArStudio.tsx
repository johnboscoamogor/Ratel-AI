import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, SparklesIcon, TrashIcon, PlayIcon, PauseIcon, RefreshIcon, ImageIcon } from '../constants';
import { playSound } from '../services/audioService';
import { ai } from '../services/geminiService';
import { Modality } from '@google/genai';

interface VideoArStudioProps {
  onClose: () => void;
}

const VideoArStudio: React.FC<VideoArStudioProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [overlayImage, setOverlayImage] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                }
            } catch (err) {
                console.error("Camera access denied:", err);
                setError(t('videoArStudio.errorCamera'));
            }
        };

        startCamera();

        return () => {
            // Cleanup: stop camera tracks when the component unmounts
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [t]);

    const captureFrameAsBase64 = (): { data: string, mimeType: string } | null => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];
        
        return { data: base64Data, mimeType: 'image/jpeg' };
    };

    const handleGenerateEffect = async () => {
        if (!prompt.trim() || isLoading) return;
        playSound('send');
        setIsLoading(true);
        setError(null);
        // Do not clear overlay when re-centering
        // setOverlayImage(null);

        const frame = captureFrameAsBase64();
        if (!frame) {
            setError("Could not capture video frame.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { data: frame.data, mimeType: frame.mimeType } },
                        { text: prompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            // Find the image part in the response
            const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
            if (imagePart && imagePart.inlineData) {
                const mimeType = imagePart.inlineData.mimeType || 'image/png';
                setOverlayImage(`data:${mimeType};base64,${imagePart.inlineData.data}`);
            } else {
                throw new Error("AI did not return an image. Try rephrasing your prompt.");
            }
        } catch (err: any) {
            console.error("AR effect generation failed:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleTakeSnapshot = () => {
        playSound('click');
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Draw the video frame first
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // If there's an overlay, draw it on top
        if (overlayImage) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                downloadCanvasImage();
            };
            img.src = overlayImage;
        } else {
            downloadCanvasImage();
        }
    };

    const downloadCanvasImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `ratel-ar-snapshot-${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg');
        link.click();
    };
    
    const handleTogglePause = () => {
        playSound('click');
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play();
            setIsPaused(false);
        } else {
            video.pause();
            setIsPaused(true);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all h-[90vh] flex flex-col">
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-green-600" />
                        {t('videoArStudio.title')}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="flex-grow flex flex-col p-4 space-y-4 overflow-hidden">
                    <div className="flex-grow relative bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        {error && !streamRef.current ? (
                            <p className="text-white text-center p-4">{error}</p>
                        ) : (
                            <>
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                                {overlayImage && (
                                    <img src={overlayImage} alt="AR Overlay" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                                )}
                                 <canvas ref={canvasRef} className="hidden"></canvas>
                            </>
                        )}
                         {isLoading && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Applying effect...
                            </div>
                        )}
                    </div>
                    {error && (
                         <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div className="flex-shrink-0 space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={t('videoArStudio.promptPlaceholder')}
                                className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleGenerateEffect}
                                disabled={isLoading || !prompt.trim()}
                                className="btn-primary flex-shrink-0"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('common.generating')}
                                    </>
                                ) : (
                                    <>{t('videoArStudio.generateButton')}</>
                                )}
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => { setOverlayImage(null); setPrompt(''); playSound('click'); }} className="btn-secondary">
                                <TrashIcon className="w-5 h-5 sm:mr-1" /> <span className="hidden sm:inline">{t('videoArStudio.clearButton')}</span>
                            </button>
                            <button onClick={handleTogglePause} className="btn-secondary">
                                {isPaused ? <PlayIcon className="w-5 h-5 sm:mr-1" /> : <PauseIcon className="w-5 h-5 sm:mr-1" />}
                                <span className="hidden sm:inline">{isPaused ? t('videoArStudio.resumeFeed') : t('videoArStudio.pauseFeed')}</span>
                            </button>
                            <button
                                onClick={handleGenerateEffect}
                                disabled={!overlayImage || isLoading || !prompt.trim()}
                                className="btn-secondary"
                            >
                                <RefreshIcon className="w-5 h-5 sm:mr-1" /> <span className="hidden sm:inline">{t('videoArStudio.recenterEffect')}</span>
                            </button>
                            <button onClick={handleTakeSnapshot} className="btn-primary">
                                <ImageIcon className="w-5 h-5 sm:mr-1" /> <span className="hidden sm:inline">{t('videoArStudio.snapshotButton')}</span>
                            </button>
                        </div>
                         <style>{`
                            .btn-primary { display: flex; align-items: center; justify-content: center; background-color: #16a34a; color: white; font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: background-color 150ms; }
                            .btn-primary:hover { background-color: #15803d; }
                            .btn-primary:disabled { background-color: #6ee7b7; cursor: not-allowed; }
                            .btn-secondary { display: flex; align-items: center; justify-content: center; background-color: #f3f4f6; color: #374151; font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: background-color 150ms; }
                            .btn-secondary:hover { background-color: #e5e7eb; }
                            .btn-secondary:disabled { background-color: #f9fafb; color: #9ca3af; cursor: not-allowed; }
                        `}</style>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default VideoArStudio;