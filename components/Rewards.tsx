import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { CoinIcon } from '../constants';
import { playSound } from '../services/audioService';

interface RewardsProps {
    currentUser: UserProfile;
    onRedeem: () => void;
}

const CASH_VALUE_RATE = 0.1; // e.g., 1 coin = 0.1 NGN

const Rewards: React.FC<RewardsProps> = ({ currentUser, onRedeem }) => {
    const { t } = useTranslation();
    const cashValue = (currentUser.communityPoints * CASH_VALUE_RATE).toFixed(2);

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-4">{t('community.walletTitle')}</h2>

                <div className="text-center bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-dashed border-yellow-200 p-6 rounded-lg mb-6">
                    <p className="text-sm font-medium text-yellow-800 mb-2">{t('community.yourRatelCoins')}</p>
                    <div className="flex items-center justify-center gap-2">
                        <CoinIcon className="w-10 h-10 text-yellow-400" />
                        <p className="text-5xl font-bold text-yellow-600">{currentUser.communityPoints.toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">{t('community.cashValue')}: <span className="font-semibold">₦{cashValue}</span></p>
                </div>

                <div className="space-y-3">
                   <button
                        onClick={() => { playSound('click'); onRedeem(); }}
                        className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        {t('community.redeemCoins')}
                    </button>
                     {/* The leaderboard button can be added back if desired, but navigation is already handled by tabs */}
                    {/* <button
                        className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {t('community.viewLeaderboard')}
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export default Rewards;