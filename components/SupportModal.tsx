// FIX: Replaced placeholder content with a functional SupportModal component to resolve module import errors.
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, CoffeeIcon, FlutterwaveIcon, TelebirrIcon } from '../constants';
import { playSound } from '../services/audioService';

interface SupportModalProps {
  onClose: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
    const { t } = useTranslation();

    const handleClose = () => {
        playSound('click');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all relative">
                <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <CloseIcon className="w-5 h-5" />
                </button>
                <div className="p-8 text-center">
                    <div className="inline-block bg-yellow-100 p-3 rounded-full mb-4">
                        <CoffeeIcon className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h2 id="support-modal-title" className="text-2xl font-bold text-gray-800">{t('supportModal.title')}</h2>
                    <p className="mt-2 text-gray-600 max-w-sm mx-auto">{t('supportModal.description')}</p>
                    
                    <div className="mt-6 space-y-3">
                        <a href="#" className="flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">
                            <FlutterwaveIcon className="w-6 h-6 mr-2"/>
                            <span>{t('supportModal.flutterwave')}</span>
                        </a>
                         <a href="#" className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">
                            <TelebirrIcon className="w-6 h-6 mr-2"/>
                            <span>{t('supportModal.telebirr')}</span>
                        </a>
                    </div>

                    <button
                        onClick={handleClose}
                        className="mt-8 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors"
                    >
                        {t('supportModal.maybeLater')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupportModal;
