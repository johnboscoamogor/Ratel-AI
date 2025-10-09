import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, UploadIcon, InfoIcon } from '../constants';
import { playSound } from '../services/audioService';

interface VideoStudioProps {
  onClose: () => void;
  onGenerate: (prompt: string, config: {
      aspectRatio: string;
      videoQuality: 'standard' | 'high';
      image?: { data: string; mimeType: string; }
  }) => void;
  isLoading: boolean;
  initialPrompt?: string;
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

const VideoStudio: React.FC<VideoStudioProps> = ({ onClose, onGenerate, isLoading, initialPrompt }) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [videoQuality, setVideoQuality] = useState<'standard' | 'high'>('high');

    useEffect(() => {
        if (initialPrompt) {
            setPrompt(initialPrompt);
        }
    }, [initialPrompt]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleRemoveImage = () => {
        playSound('click');
        setImageFile(null);
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
    };

    const handleGenerate = async () => {
        playSound('click');
        if (prompt.trim()) {
            let imagePayload;
            if (imageFile) {
                const base64Data = await blobToBase64(imageFile);
                imagePayload = { data: base64Data, mimeType: imageFile.type };
            }
            onGenerate(prompt, {
                aspectRatio,
                videoQuality,
                image: imagePayload
            });
        }
    };
    
    const handleClose = () => {
        playSound('click');
        onClose();
    }
    
    const AspectRatioButton: React.FC<{ value: string, label: string }> = ({ value, label }) => (
        <button
            onClick={() => { playSound('click'); setAspectRatio(value); }}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors w-full ${
                aspectRatio === value ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={isLoading}
        >
            {label}
        </button>
    );
    
    const QualityButton: React.FC<{ value: 'standard' | 'high', label: string }> = ({ value, label }) => (
        <button
            onClick={() => { playSound('click'); setVideoQuality(value); }}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors w-full ${
                videoQuality === value ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={isLoading}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">{t('videoStudio.title')}</h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="generate-prompt" className="block text-sm font-medium text-gray-700">{t('videoStudio.promptLabel')}</label>
                        <textarea
                            id="generate-prompt"
                            rows={4}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            placeholder={t('videoStudio.promptPlaceholder')}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('videoStudio.uploadLabel')}</label>
                        {imagePreview ? (
                            <div className="text-center">
                                <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded-md border border-gray-200 ring-0 outline-none" />
                                <button onClick={handleRemoveImage} className="mt-2 text-sm text-red-600 hover:underline">{t('videoStudio.removeImage')}</button>
                            </div>
                        ) : (
                            <label htmlFor="video-image-upload" className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadIcon className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-500">{t('imageStudio.uploadPlaceholderClick')}</p>
                                </div>
                                <input id="video-image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                            </label>
                        )}
                    </div>
                    
                    {imagePreview && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                            <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>{t('videoStudio.imageToVideoDisclaimer')}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('videoStudio.aspectRatioLabel')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                <AspectRatioButton value="1:1" label={t('videoStudio.square')} />
                                <AspectRatioButton value="16:9" label={t('videoStudio.landscape')} />
                                <AspectRatioButton value="9:16" label={t('videoStudio.portrait')} />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('videoStudio.qualityLabel')}</label>
                            <div className="grid grid-cols-2 gap-2">
                                <QualityButton value="standard" label={t('videoStudio.qualityStandard')} />
                                <QualityButton value="high" label={t('videoStudio.qualityHigh')} />
                            </div>
                        </div>
                    </div>

                     <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        {t('videoStudio.info')}
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>{t('common.generating')}</span>
                            </>
                        ) : (
                            <span>{t('videoStudio.generateButton')}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoStudio;