import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from '../constants';
import { playSound } from '../services/audioService';
import { UserProfile } from '../types';

interface RedeemModalProps {
  onClose: () => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const RedeemModal: React.FC<RedeemModalProps> = ({ onClose, userProfile, setUserProfile }) => {
    const { t } = useTranslation();
    const [redeemType, setRedeemType] = useState<'airtime' | 'data' | 'cash'>('airtime');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    
    const handleClose = () => {
        playSound('click');
        onClose();
    };

    const handleSubmit = () => {
        playSound('click');
        const redeemAmount = parseInt(amount, 10);

        if (isNaN(redeemAmount) || redeemAmount <= 0) {
            setError(t('redeemModal.enterAmount'));
            return;
        }

        if (redeemAmount > userProfile.communityPoints) {
            setError(t('redeemModal.notEnoughCoins'));
            return;
        }

        // Simulate request
        console.log(`--- SIMULATING REDEEM REQUEST ---`);
        console.log(`User: ${userProfile.email}`);
        console.log(`Type: ${redeemType}`);
        console.log(`Amount: ${redeemAmount} coins`);
        console.log(`---------------------------------`);

        const newPoints = userProfile.communityPoints - redeemAmount;
        setUserProfile(prev => prev ? { ...prev, communityPoints: newPoints } : null);

        alert(t('redeemModal.requestSent'));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm transform transition-all">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">{t('redeemModal.title')}</h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="redeem-type" className="block text-sm font-medium text-gray-700 mb-1">{t('redeemModal.redeemTypeLabel')}</label>
                        <select
                            id="redeem-type"
                            value={redeemType}
                            onChange={(e) => setRedeemType(e.target.value as any)}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                        >
                            <option value="airtime">{t('redeemModal.airtime')}</option>
                            <option value="data">{t('redeemModal.data')}</option>
                            <option value="cash">{t('redeemModal.cash')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">{t('redeemModal.amountLabel')}</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); setError(''); }}
                            placeholder="0"
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                        />
                    </div>
                    {error && <p className="text-red-600 text-sm text-center -mt-2">{error}</p>}
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        {t('redeemModal.submitButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RedeemModal;