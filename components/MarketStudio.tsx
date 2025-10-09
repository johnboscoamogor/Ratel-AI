import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, StorefrontIcon } from '../constants';
import { playSound } from '../services/audioService';

interface MarketStudioProps {
  onClose: () => void;
  onAction: (item: string, location: string) => void;
  isLoading: boolean;
}

const MarketStudio: React.FC<MarketStudioProps> = ({ onClose, onAction, isLoading }) => {
    const { t } = useTranslation();
    const [item, setItem] = useState('');
    const [location, setLocation] = useState('');

    const handleAction = () => {
        playSound('click');
        if (item.trim() && location.trim()) {
            onAction(item, location);
        }
    };
    
    const handleClose = () => {
        playSound('click');
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <StorefrontIcon className="w-5 h-5 text-green-600" />
                        {t('marketStudio.title')}
                    </h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        {t('marketStudio.description')}
                    </p>
                    <div>
                        <label htmlFor="market-item" className="block text-sm font-medium text-gray-700 mb-1">{t('marketStudio.itemLabel')}</label>
                        <input
                            id="market-item"
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            placeholder={t('marketStudio.itemPlaceholder')}
                            value={item}
                            onChange={(e) => setItem(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                     <div>
                        <label htmlFor="market-location" className="block text-sm font-medium text-gray-700 mb-1">{t('marketStudio.locationLabel')}</label>
                        <input
                            id="market-location"
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            placeholder={t('marketStudio.locationPlaceholder')}
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAction(); }}
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        onClick={handleAction}
                        disabled={isLoading || !item.trim() || !location.trim()}
                        className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                    >
                        {isLoading ? t('common.generating') : t('marketStudio.button')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MarketStudio;