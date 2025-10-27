import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, UserIcon, AwardIcon, StarIcon } from '../constants';
import { playSound } from '../services/audioService';
import { UserProfile } from '../types';

interface ProfileStudioProps {
  onClose: () => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const ProfileStudio: React.FC<ProfileStudioProps> = ({ onClose, userProfile, setUserProfile }) => {
    const { t } = useTranslation();
    const [telegramUsername, setTelegramUsername] = useState(userProfile.telegramUsername || '');
    const [name, setName] = useState(userProfile.name);
    
    const handleClose = () => {
        playSound('click');
        onClose();
    }

    const handleSave = () => {
        playSound('click');
        setUserProfile(prev => prev ? { ...prev, name: name.trim(), telegramUsername: telegramUsername.trim() } : null);
        alert('Profile updated!');
        onClose();
    };
    
    const getTopInterest = () => {
        const interests = userProfile.interests;
        if (!interests || Object.keys(interests).length === 0) {
            return t('profileStudio.noInterests');
        }
        return Object.entries(interests).reduce((a, b) => (a[1] || 0) > (b[1] || 0) ? a : b)[0];
    };
    
    const topInterest = getTopInterest();
    const xpForNextLevel = userProfile.level * 100;
    const xpProgress = xpForNextLevel > 0 ? (userProfile.xp / xpForNextLevel) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-green-600" />
                        {t('profileStudio.title')}
                    </h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                            <UserIcon className="w-10 h-10 text-gray-600" />
                        </div>
                         <input
                            id="profile-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-1 border-0 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900 text-center text-xl font-bold bg-gray-100"
                            aria-label="User's name"
                        />
                        <p className="text-sm text-gray-500 mt-1">{userProfile.email}</p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <label htmlFor="telegram-username" className="block text-sm font-medium text-gray-700 mb-1">
                           {t('community.telegramUsernameLabel')}
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">@</span>
                            <input
                                id="telegram-username"
                                type="text"
                                value={telegramUsername}
                                onChange={(e) => setTelegramUsername(e.target.value)}
                                placeholder={t('community.telegramUsernamePlaceholder')}
                                className="w-full pl-7 p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                            />
                        </div>
                    </div>
                     <button
                        onClick={handleSave}
                        className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700"
                    >
                        Save Profile
                    </button>

                    <div className="pt-4 space-y-4 border-t border-gray-200">
                         <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                               <AwardIcon className="w-5 h-5 text-yellow-500"/>
                               <span>{t('sidebar.level', { level: userProfile.level })}</span>
                            </div>
                            <span className="text-sm font-mono text-gray-600">{userProfile.xp} XP</span>
                        </div>
                        
                        <div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${xpProgress}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-500 text-right mt-1">XP to next level: {xpForNextLevel}</p>
                        </div>

                         <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                               <StarIcon className="w-5 h-5 text-blue-500"/>
                               <span>{t('profileStudio.topInterest')}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-600 capitalize">{topInterest}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileStudio;