import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, BriefcaseIcon } from '../constants';
import { playSound } from '../services/audioService';

interface HustleStudioProps {
  onClose: () => void;
  onAction: (type: 'ideas', data: { input: string }) => void;
  isLoading: boolean;
}

const HustleStudio: React.FC<HustleStudioProps> = ({ onClose, onAction, isLoading }) => {
    const { t } = useTranslation();
    const [ideasInput, setIdeasInput] = useState('');

    const handleAction = () => {
        playSound('click');
        if (ideasInput.trim()) {
            onAction('ideas', { input: ideasInput });
        }
    };
    
    const handleClose = () => {
        playSound('click');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BriefcaseIcon className="w-5 h-5 text-green-600" />
                        {t('hustleStudio.title')}
                    </h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <main className="p-6 space-y-4">
                     <p className="text-sm text-gray-600">{t('hustleStudio.description')}</p>
                    <div>
                        <label htmlFor="hustle-input" className="sr-only">{t('hustleStudio.placeholder')}</label>
                        <input
                            id="hustle-input"
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            placeholder={t('hustleStudio.placeholder')}
                            value={ideasInput}
                            onChange={(e) => setIdeasInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAction(); }}
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        onClick={handleAction}
                        disabled={isLoading || !ideasInput.trim()}
                        className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                    >
                        {isLoading ? t('common.generating') : t('hustleStudio.button')}
                    </button>
                </main>
            </div>
        </div>
    );
};

export default HustleStudio;