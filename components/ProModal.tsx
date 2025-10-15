import React from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, StarIcon } from '../constants';
import { playSound } from '../services/audioService';

interface ProModalProps {
  onClose: () => void;
  message?: string;
}

const ProModal: React.FC<ProModalProps> = ({ onClose, message }) => {
    const { t } = useTranslation();

    const handleClose = () => {
        playSound('click');
        onClose();
    };

    const title = message ? "Limit Reached" : t('proModal.comingSoonTitle');
    const description = message || t('proModal.comingSoonDescription');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="pro-modal-title">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all relative border border-gray-700">
                <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500">
                    <CloseIcon className="w-5 h-5" />
                </button>
                <div className="p-8 text-center">
                    <div className="inline-block bg-green-500/10 p-3 rounded-full mb-4">
                        <StarIcon className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 id="pro-modal-title" className="text-2xl font-bold text-white">{title}</h2>
                    <p className="mt-2 text-gray-400 max-w-sm mx-auto">{description}</p>
                    
                    <button
                        onClick={handleClose}
                        className="mt-8 w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
                    >
                        {t('proModal.gotIt')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProModal;