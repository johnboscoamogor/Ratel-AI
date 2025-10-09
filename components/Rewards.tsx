import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { StarIcon } from '../constants';
import { playSound } from '../services/audioService';

interface RewardsProps {
    currentUser: UserProfile;
}

const rewardsCatalog = [
    { id: 'data_100', points: 1000, description: '100MB Data', type: 'data', amount: '100MB' },
    { id: 'airtime_500', points: 2500, description: '₦500 Airtime', type: 'airtime', amount: 500 },
    { id: 'data_500', points: 4000, description: '500MB Data', type: 'data', amount: '500MB' },
    { id: 'airtime_1000', points: 5000, description: '₦1000 Airtime', type: 'airtime', amount: 1000 },
];

const Rewards: React.FC<RewardsProps> = ({ currentUser }) => {
    const { t } = useTranslation();

    const handleClaim = (points: number) => {
        playSound('click');
        if (currentUser.communityPoints >= points) {
            alert(`Reward claimed! (This is a simulation). Your new point balance would be ${currentUser.communityPoints - points}.`);
            // In a real app, you would deduct points and fulfill the reward via backend.
        } else {
            alert("You don't have enough points to claim this reward yet. Keep engaging!");
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-4">{t('community.rewardsTitle')}</h2>

                <div className="text-center bg-green-50 border-2 border-dashed border-green-200 p-4 rounded-lg mb-6">
                    <p className="text-sm font-medium text-gray-600 mb-1">{t('community.yourPoints')}</p>
                    <p className="text-4xl font-bold text-green-600">{currentUser.communityPoints}</p>
                </div>
                
                <p className="text-sm text-gray-500 text-center mb-6">{t('community.rewardsDescription')}</p>

                <div className="space-y-3">
                    {rewardsCatalog.map(reward => (
                        <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 rounded-full mr-3">
                                    <StarIcon className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{reward.description}</p>
                                    <p className="text-sm text-gray-500">{reward.points.toLocaleString()} {t('community.points')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleClaim(reward.points)}
                                disabled={currentUser.communityPoints < reward.points}
                                className="bg-green-600 text-white font-semibold py-1.5 px-4 rounded-full text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {t('community.claimReward')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Rewards;
