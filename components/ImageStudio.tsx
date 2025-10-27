import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, UploadIcon } from '../constants';
import { playSound } from '../services/audioService';

interface ImageStudioProps {
  onClose: () => void;
  onGenerate: (prompt: string, aspectRatio: string) => void;
  onEdit: (image: { data: string, mimeType: string }, prompt: string) => void;
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

const ImageStudio: React.FC<ImageStudioProps> = ({ onClose, onGenerate, onEdit, isLoading, initialPrompt }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'generate' | 'edit'>('generate');
    const [prompt, setPrompt] = useState('');
    const [editPrompt, setEditPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState('1:1');

    useEffect(() => {
        if (initialPrompt) {
            setPrompt(initialPrompt);
            setActiveTab('generate');
        }
    }, [initialPrompt]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleGenerate = () => {
        playSound('click');
        if (prompt.trim()) {
            onGenerate(prompt, aspectRatio);
        }
    };

    const handleEdit = async () => {
        playSound('click');
        if (editPrompt.trim() && imageFile) {
            const base64Data = await blobToBase64(imageFile);
            onEdit({ data: base64Data, mimeType: imageFile.type }, editPrompt);
        }
    };
    
    const handleClose = () => {
        playSound('click');
        onClose();
    }

    const TabButton: React.FC<{ tabName: 'generate' | 'edit', label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => { playSound('click'); setActiveTab(tabName); }}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tabName ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
        >
            {label}
        </button>
    );

    const AspectRatioButton: React.FC<{ value: string, label: string }> = ({ value, label }) => (
        <button
            onClick={() => { playSound('click'); setAspectRatio(value); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors w-full ${
                aspectRatio === value ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    <h2 className="text-lg font-bold text-gray-800">{t('imageStudio.title')}</h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="flex gap-2 mb-6">
                        <TabButton tabName="generate" label={t('imageStudio.generateTab')} />
                        <TabButton tabName="edit" label={t('imageStudio.editTab')} />
                    </div>

                    {activeTab === 'generate' && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="generate-prompt" className="block text-sm font-medium text-gray-700">{t('imageStudio.promptLabel')}</label>
                                <textarea
                                    id="generate-prompt"
                                    rows={4}
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                                    placeholder={t('imageStudio.promptPlaceholder')}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('imageStudio.aspectRatioLabel')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <AspectRatioButton value="1:1" label={t('imageStudio.square')} />
                                    <AspectRatioButton value="16:9" label={t('imageStudio.landscape')} />
                                    <AspectRatioButton value="9:16" label={t('imageStudio.portrait')} />
                                </div>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !prompt.trim()}
                                className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                            >
                                {isLoading ? t('common.generating') : t('imageStudio.generateButton')}
                            </button>
                        </div>
                    )}
                    
                    {activeTab === 'edit' && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="edit-image-upload" className="block text-sm font-medium text-gray-700 mb-2">{t('imageStudio.uploadLabel')}</label>
                                {imagePreview ? (
                                    <div className="text-center">
                                        <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-md border border-gray-200 ring-0 outline-none" />
                                        <button onClick={() => { playSound('click'); setImageFile(null); setImagePreview(null); }} className="mt-2 text-sm text-red-600 hover:underline">{t('imageStudio.removeImage')}</button>
                                    </div>
                                ) : (
                                    <label htmlFor="edit-image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadIcon className="w-8 h-8 mb-3 text-gray-400" />
                                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">{t('imageStudio.uploadPlaceholderClick')}</span> {t('imageStudio.uploadPlaceholderDrag')}</p>
                                            <p className="text-xs text-gray-500">{t('imageStudio.uploadPlaceholderFormats')}</p>
                                        </div>
                                        <input id="edit-image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                                    </label>
                                )}
                            </div>
                            
                            <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-700">{t('imageStudio.editPromptLabel')}</label>
                            <textarea
                                id="edit-prompt"
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                                placeholder={t('imageStudio.editPromptPlaceholder')}
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleEdit}
                                disabled={isLoading || !editPrompt.trim() || !imageFile}
                                className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                            >
                                {isLoading ? t('common.editing') : t('imageStudio.applyEditsButton')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageStudio;