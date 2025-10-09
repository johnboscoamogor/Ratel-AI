import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LeaderboardEntry, UserProfile } from '../types';
import { communityService } from '../services/communityService';
import { AwardIcon, UserIcon } from '../constants';

interface LeaderboardProps {
    currentUser: UserProfile;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser }) => {
    const { t } = useTranslation();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        setLeaderboard(communityService.getLeaderboard());
    }, []);
    
    const getTrophyColor = (rank: number) => {
        if (rank === 0) return 'text-yellow-400';
        if (rank === 1) return 'text-gray-400';
        if (rank === 2) return 'text-yellow-600';
        return 'text-gray-300';
    }

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-1">🏆 {t('community.leaderboardTitle')} 🏆</h2>
                <p className="text-sm text-gray-500 text-center mb-6">{t('community.weeklyRanking')}</p>
                
                <div className="space-y-3">
                    {leaderboard.map((user, index) => (
                        <div key={user.email} className={`flex items-center p-3 rounded-lg ${user.email === currentUser.email ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50 border'}`}>
                            <div className="flex items-center w-12">
                               <span className="font-bold text-lg text-gray-600 w-6 text-center">{index + 1}</span>
                               <AwardIcon className={`w-6 h-6 ml-2 ${getTrophyColor(index)}`} />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mx-4">
                               <UserIcon className="w-6 h-6 text-gray-500" />
                           </div>
                            <p className="font-semibold text-gray-800 flex-grow">{user.name}</p>
                            <p className="font-bold text-green-600">{user.points} <span className="font-medium text-sm text-gray-500">{t('community.points')}</span></p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;