import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { CoinIcon } from '../constants';
import { communityService } from '../services/communityService';
import { CommunityTab } from './CommunityView';

interface MyWalletProps {
    userProfile: UserProfile;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    onSwitchTab: (tab: CommunityTab) => void;
}

const MyWallet: React.FC<MyWalletProps> = ({ userProfile, setUserProfile, onSwitchTab }) => {
    const { t } = useTranslation();
    const [conversionRate, setConversionRate] = useState(1);

    useEffect(() => {
        setConversionRate(communityService.getConversionRate());
        
        const interval = setInterval(() => {
            // Simulate live refresh by re-reading from our "database" (localStorage)
            const latestPoints = communityService.getUserPoints(userProfile);
            if (latestPoints !== userProfile.communityPoints) {
                setUserProfile(prev => prev ? { ...prev, communityPoints: latestPoints } : null);
            }
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [userProfile, setUserProfile]);

    const cashValue = (userProfile.communityPoints * conversionRate).toFixed(2);
    const totalEarned = (userProfile.communityPoints || 0) + (userProfile.totalRedeemed || 0);

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-4">{t('community.walletTitle')}</h2>

                <div className="text-center bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-dashed border-yellow-200 p-6 rounded-lg mb-6">
                    <p className="text-sm font-medium text-yellow-800 mb-2">{t('community.yourRatelCoins')}</p>
                    <div className="flex items-center justify-center gap-2">
                        <CoinIcon className="w-10 h-10 text-yellow-400" />
                        <p className="text-5xl font-bold text-yellow-600">{userProfile.communityPoints.toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">{t('community.cashValue')}: <span className="font-semibold">₦{cashValue}</span></p>
                </div>

                <button
                    onClick={() => onSwitchTab('redeem')}
                    className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                    {t('community.redeemNow')}
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('community.activitySummary')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">{t('community.earnedToday')}</p>
                        <p className="text-2xl font-bold text-blue-900">0</p>
                        <p className="text-xs text-blue-600">(Live activity coming soon)</p>
                    </div>
                     <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">{t('community.totalEarned')}</p>
                        <p className="text-2xl font-bold text-green-900">{totalEarned.toLocaleString()}</p>
                    </div>
                     <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">{t('community.totalRedeemed')}</p>
                        <p className="text-2xl font-bold text-red-900">{(userProfile.totalRedeemed || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyWallet;
