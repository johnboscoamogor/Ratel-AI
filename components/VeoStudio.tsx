import React, { useState } from 'react';
// FIX: Import GeneratedVideo type, which contains necessary metadata like resolution.
import { GeneratedVideo, Video } from '@google/genai';
import VeoPromptForm from './VeoPromptForm';
import VeoVideoResult from './VeoVideoResult';
import { XMarkIcon, SparklesIcon } from './VeoIcons';
import { generateVideo } from '../services/veoService';
import { GenerateVideoParams, Resolution, GenerationMode } from '../veoTypes';
import { playSound } from '../services/audioService';

interface VeoStudioProps {
  onClose: () => void;
  onApiKeyInvalid: () => void;
}

const VeoStudio: React.FC<VeoStudioProps> = ({ onClose, onApiKeyInvalid }) => {
  const [view, setView] = useState<'form' | 'loading' | 'result'>('form');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoObject, setVideoObject] = useState<Video | null>(null);
  // FIX: Add state to store the full GeneratedVideo object.
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [lastParams, setLastParams] = useState<GenerateVideoParams | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (params: GenerateVideoParams) => {
    setView('loading');
    setError(null);
    setLastParams(params);

    try {
      const result = await generateVideo(params);
      setVideoUrl(result.objectUrl);
      // FIX: Store the full GeneratedVideo object and extract the video object from it.
      setGeneratedVideo(result.generatedVideo);
      setVideoObject(result.generatedVideo.video ?? null);
      setView('result');
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('Requested entity was not found')) {
        onApiKeyInvalid();
      } else {
        const errorMessage = e.message || 'An unknown error occurred during video generation.';
        setError(errorMessage);
        setView('form');
      }
    }
  };
  
  const handleNewVideo = () => {
    setView('form');
    setVideoUrl('');
    setVideoObject(null);
    // FIX: Reset the generatedVideo state.
    setGeneratedVideo(null);
    setLastParams(null);
    setError(null);
  };
  
  const handleRetry = () => {
    if (lastParams) {
      handleGenerate(lastParams);
    }
  };

  const handleExtend = () => {
    if (lastParams && videoObject) {
      const extendParams: GenerateVideoParams = {
        ...lastParams,
        mode: GenerationMode.EXTEND_VIDEO,
        resolution: Resolution.P720, // Extend only supports 720p
        inputVideoObject: videoObject,
        prompt: '', // Clear prompt for extension
      };
      setLastParams(extendParams);
      setView('form');
    }
  };

  // FIX: Use the resolution from the last generation parameters to determine if the video can be extended,
  // as the 'resolution' property is not available on the 'GeneratedVideo' response object.
  const canExtend = lastParams?.resolution === Resolution.P720;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center text-white" onClick={e => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 z-20">
          <XMarkIcon className="w-6 h-6" />
        </button>

        {view === 'loading' && (
          <div className="text-center">
            <SparklesIcon className="w-16 h-16 text-indigo-400 mx-auto animate-pulse" />
            <h2 className="text-2xl font-bold mt-4">Creating your video...</h2>
            <p className="text-gray-400 mt-2">This may take a few minutes. Please don't close this window.</p>
          </div>
        )}

        {view === 'form' && (
          <div className="w-full max-w-3xl flex flex-col items-center gap-8">
             <div className="text-center">
              <h1 className="text-4xl font-bold">Veo Studio</h1>
              <p className="text-gray-400 mt-2">Create high-quality videos from text, images, or even other videos.</p>
            </div>
            {error && <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 w-full">{error}</div>}
            <VeoPromptForm onGenerate={handleGenerate} initialValues={lastParams} />
          </div>
        )}

        {view === 'result' && videoUrl && (
          <VeoVideoResult
            videoUrl={videoUrl}
            onRetry={handleRetry}
            onNewVideo={handleNewVideo}
            onExtend={handleExtend}
            canExtend={canExtend}
          />
        )}
      </div>
    </div>
  );
};

export default VeoStudio;
