import React from 'react';
import { useTranslation } from 'react-i18next';
import { AwardIcon, CoinIcon } from '../constants';
import { communityService } from '../services/communityService';

const Rewards: React.FC = () => {
    const { t } = useTranslation();

    const waysToEarn = [
        { action: 'Create a new post', points: communityService.POINTS_FOR_POST },
        { action: 'Comment on a post', points: communityService.POINTS_FOR_COMMENT },
        { action: 'Like a post', points: communityService.POINTS_FOR_LIKE },
        { action: 'Participate in special events', points: 'Varies' },
    ];

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center">
                    <AwardIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">{t('community.rewardsTitle')}</h2>
                    <p className="text-gray-600 mt-2 max-w-md mx-auto">Earn Ratel Coins by being an active and helpful member of the community. Your coins can be redeemed for cool rewards!</p>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">How to Earn Coins</h3>
                    <div className="max-w-sm mx-auto space-y-3">
                        {waysToEarn.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                                <span className="font-medium text-gray-700">{item.action}</span>
                                <span className="font-bold text-green-600 flex items-center gap-1">
                                    {item.points} <CoinIcon className="w-4 h-4 text-yellow-500" />
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Rewards;
