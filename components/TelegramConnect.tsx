import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { communityService } from '../services/communityService';
import { playSound } from '../services/audioService';

interface TelegramConnectProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const TelegramConnect: React.FC<TelegramConnectProps> = ({ userProfile, setUserProfile }) => {
    const { t } = useTranslation();
    const [username, setUsername] = useState(userProfile.telegramUsername || '');
    
    const handleConnect = () => {
        if (!username.trim()) return;
        playSound('click');
        const updatedProfile = communityService.linkTelegramAccount(userProfile, username.trim());
        setUserProfile(updatedProfile);
        alert(`Telegram account connected as @${username.trim()}! (This is a simulation)`);
    };
    
    const handleDisconnect = () => {
        playSound('click');
        const updatedProfile = communityService.unlinkTelegramAccount(userProfile);
        setUserProfile(updatedProfile);
        setUsername('');
    };

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-2">{t('community.telegramTitle')}</h2>
                <p className="text-sm text-gray-500 text-center mb-6 max-w-sm mx-auto">{t('community.telegramDescription')}</p>

                {userProfile.telegramUsername ? (
                    <div className="text-center">
                        <div className="bg-green-50 text-green-800 font-semibold p-3 rounded-lg border border-green-200 mb-4">
                            {t('community.connectedStatus', { username: userProfile.telegramUsername })}
                        </div>
                        <button
                            onClick={handleDisconnect}
                            className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-red-200"
                        >
                            {t('community.disconnectButton')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="telegram-username" className="block text-sm font-medium text-gray-700 mb-1">{t('community.telegramUsernameLabel')}</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">@</span>
                                <input
                                    id="telegram-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={t('community.telegramUsernamePlaceholder')}
                                    className="w-full pl-7 p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleConnect}
                            disabled={!username.trim()}
                            className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300"
                        >
                            {t('community.connectButton')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TelegramConnect;