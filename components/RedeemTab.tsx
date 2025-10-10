import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { communityService } from '../services/communityService';
import { playSound } from '../services/audioService';
import { CommunityTab } from './CommunityView';

interface RedeemTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onSwitchTab: (tab: CommunityTab) => void;
}

const MIN_REDEEM_POINTS = 100;

const RedeemTab: React.FC<RedeemTabProps> = ({ userProfile, setUserProfile, onSwitchTab }) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'airtime' | 'bank'>('airtime');
    const [details, setDetails] = useState('');
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const conversionRate = communityService.getConversionRate();
    const cashValue = amount ? (parseInt(amount) * conversionRate).toFixed(2) : '0.00';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const pointsToRedeem = parseInt(amount);

        if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
            setError('Please enter a valid amount of points.');
            return;
        }
        if (pointsToRedeem < MIN_REDEEM_POINTS) {
            setError(t('community.redeemMinimum', { min: MIN_REDEEM_POINTS }));
            return;
        }
        if (pointsToRedeem > userProfile.communityPoints) {
            setError(t('community.notEnoughCoins'));
            return;
        }
        if (!details.trim()) {
            setError('Please provide your payment details.');
            return;
        }
        
        playSound('send');
        const result = communityService.submitRedemptionRequest(userProfile, pointsToRedeem, method, details);
        
        if (result.success) {
            setUserProfile(result.profile);
            setIsSubmitted(true);
        } else {
            setError('An error occurred. Please try again.');
        }
    };
    
    if (isSubmitted) {
        return (
             <div className="p-4 md:p-6 text-center">
                 <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                     <h2 className="text-2xl font-bold text-green-600 mb-4">{t('community.requestSubmitted')}</h2>
                     <p className="text-gray-600 mb-6">{t('community.requestSubmittedDesc')}</p>
                     <button
                         onClick={() => onSwitchTab('wallet')}
                         className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700"
                     >
                         Back to My Wallet
                     </button>
                 </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-4">{t('community.redeemRewardsTitle')}</h2>
                
                <div className="text-center bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6">
                    <p className="text-sm font-medium text-gray-600">{t('community.yourBalance')}</p>
                    <p className="text-3xl font-bold text-gray-800">{userProfile.communityPoints.toLocaleString()} {t('community.coins')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">{t('community.amountToRedeem')}</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                            placeholder="e.g., 500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Cash Value: ₦{cashValue}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('community.paymentMethod')}</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setMethod('airtime')} className={`p-3 rounded-lg border text-center font-semibold ${method === 'airtime' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-gray-100 hover:bg-gray-200'}`}>{t('community.airtime')}</button>
                            <button type="button" onClick={() => setMethod('bank')} className={`p-3 rounded-lg border text-center font-semibold ${method === 'bank' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-gray-100 hover:bg-gray-200'}`}>{t('community.bankTransfer')}</button>
                        </div>
                    </div>
                    
                     <div>
                        <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">{method === 'airtime' ? t('community.phoneNumber') : t('community.bankDetails')}</label>
                        <input
                            type="text"
                            id="details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                            placeholder={method === 'airtime' ? 'e.g., 08012345678' : 'e.g., 1234567890, GTBank'}
                        />
                    </div>
                    
                    {error && <p className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">{error}</p>}
                    
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                    >
                        {t('community.submitRequest')}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default RedeemTab;
