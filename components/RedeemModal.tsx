import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, CoinIcon } from '../constants';
import { UserProfile } from '../types';
import { playSound } from '../services/audioService';

interface RedeemModalProps {
  onClose: () => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const CASH_VALUE_RATE = 0.1;

const RedeemModal: React.FC<RedeemModalProps> = ({ onClose, userProfile, setUserProfile }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<'options' | 'success'>('options');
    const cashValue = (userProfile.communityPoints * CASH_VALUE_RATE).toFixed(2);
    
    const handleClose = () => {
        playSound('click');
        onClose();
    };

    const handleRedeem = () => {
        playSound('send');
        // In a real app, this would trigger a backend process.
        // For now, we'll just simulate it.
        setStep('success');
        // Reset points after "redemption"
        setUserProfile(prev => prev ? { ...prev, communityPoints: 0 } : null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="redeem-modal-title">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all relative">
                <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <CloseIcon className="w-5 h-5" />
                </button>
                <div className="p-8">
                    {step === 'options' && (
                        <>
                            <div className="text-center mb-6">
                                <CoinIcon className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
                                <h2 id="redeem-modal-title" className="text-2xl font-bold text-gray-800">{t('community.redeemCoins')}</h2>
                                <p className="mt-2 text-gray-600">{t('community.redeemDescription')}</p>
                            </div>

                            <div className="text-center bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6">
                                <p className="text-sm font-medium text-gray-600">{t('community.yourBalance')}</p>
                                <p className="text-3xl font-bold text-gray-800">{userProfile.communityPoints.toLocaleString()} {t('community.coins')}</p>
                                <p className="text-sm text-gray-500 mt-1">~ ₦{cashValue}</p>
                            </div>
                            
                            <button
                                onClick={handleRedeem}
                                disabled={userProfile.communityPoints < 100} // Example minimum
                                className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                            >
                                {userProfile.communityPoints < 100 ? t('community.notEnoughCoins') : t('community.redeemNow')}
                            </button>
                            <p className="text-xs text-center text-gray-500 mt-2">{t('community.redeemMinimum', { min: 100 })}</p>
                        </>
                    )}
                    {step === 'success' && (
                         <>
                            <div className="text-center mb-6">
                                <h2 id="redeem-modal-title" className="text-2xl font-bold text-gray-800">{t('community.redeemSuccessTitle')}</h2>
                                <p className="mt-2 text-gray-600">{t('community.redeemSuccessDescription', { amount: cashValue })}</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-full bg-gray-100 text-gray-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                {t('common.close')}
                            </button>
                         </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RedeemModal;
