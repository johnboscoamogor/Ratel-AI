import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, UploadIcon, VideoIcon } from '../constants';
import { playSound } from '../services/audioService';

interface VideoStudioProps {
  onClose: () => void;
  onGenerate: (prompt: string, image?: { data: string; mimeType: string }, dialogue?: string, ambiance?: string) => void;
  isLoading: boolean;
  initialPrompt?: string;
  initialDialogue?: string;
  initialAmbiance?: string;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
};

const VideoStudio: React.FC<VideoStudioProps> = ({ onClose, onGenerate, isLoading, initialPrompt, initialDialogue, initialAmbiance }) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [dialogue, setDialogue] = useState(initialDialogue || '');
    const [ambiance, setAmbiance] = useState(initialAmbiance || '');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleGenerate = async () => {
        playSound('click');
        if (!prompt.trim()) return;

        let imagePayload: { data: string; mimeType: string } | undefined = undefined;
        if (imageFile) {
            const base64Data = await blobToBase64(imageFile);
            imagePayload = { data: base64Data, mimeType: imageFile.type };
        }

        onGenerate(prompt, imagePayload, dialogue.trim() || undefined, ambiance.trim() || undefined);
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
                        Video Studio
                    </h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div>
                        <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-700">Video Prompt (Required)</label>
                        <textarea
                            id="video-prompt"
                            rows={4}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                            placeholder="e.g., A honeybee flying over a field of flowers, cinematic."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="video-image-upload" className="block text-sm font-medium text-gray-700 mb-2">Starting Image (Optional)</label>
                        {imagePreview ? (
                            <div className="text-center">
                                <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-md border border-gray-200" />
                                <button onClick={() => { playSound('click'); setImageFile(null); setImagePreview(null); }} className="mt-2 text-sm text-red-600 hover:underline">Remove Image</button>
                            </div>
                        ) : (
                            <label htmlFor="video-image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadIcon className="w-8 h-8 mb-3 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                </div>
                                <input id="video-image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                            </label>
                        )}
                    </div>

                    <div>
                        <label htmlFor="video-dialogue" className="block text-sm font-medium text-gray-700">Dialogue Audio (Optional)</label>
                        <textarea
                            id="video-dialogue"
                            rows={2}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                            placeholder="e.g., Hello, welcome to our world."
                            value={dialogue}
                            onChange={(e) => setDialogue(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="video-ambiance" className="block text-sm font-medium text-gray-700">Ambiance / Sound Effect (Optional)</label>
                        <input
                            id="video-ambiance"
                            type="text"
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                            placeholder="e.g., gentle wind, birds chirping"
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
                        {isLoading ? 'Generating...' : 'Generate Video'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoStudio;
