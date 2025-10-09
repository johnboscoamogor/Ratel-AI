import React from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, StarIcon } from '../constants';
import { playSound } from '../services/audioService';

interface ProModalProps {
  onClose: () => void;
}

const ProModal: React.FC<ProModalProps> = ({ onClose }) => {
    const { t } = useTranslation();

    const handleClose = () => {
        playSound('click');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="pro-modal-title">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all relative">
                <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <CloseIcon className="w-5 h-5" />
                </button>
                <div className="p-8 text-center">
                    <div className="inline-block bg-green-100 p-3 rounded-full mb-4">
                        <StarIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 id="pro-modal-title" className="text-2xl font-bold text-gray-800">{t('proModal.comingSoonTitle')}</h2>
                    <p className="mt-2 text-gray-600 max-w-sm mx-auto">{t('proModal.comingSoonDescription')}</p>
                    
                    <button
                        onClick={handleClose}
                        className="mt-8 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    >
                        {t('proModal.gotIt')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProModal;