import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { ChevronLeftIcon, UsersIcon } from '../constants';
import { playSound } from '../services/audioService';
import CommunityFeed from './CommunityFeed';
import Leaderboard from './Leaderboard';
import Rewards from './Rewards';
import TelegramConnect from './TelegramConnect';
import RedeemModal from './RedeemModal';

interface CommunityViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onBack: () => void;
}

type CommunityTab = 'feed' | 'leaderboard' | 'rewards' | 'telegram';

const CommunityView: React.FC<CommunityViewProps> = ({ userProfile, setUserProfile, onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);

  const handleBackClick = () => {
    playSound('click');
    onBack();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'leaderboard':
        return <Leaderboard currentUser={userProfile} />;
      case 'rewards':
        return <Rewards currentUser={userProfile} onRedeem={() => setIsRedeemModalOpen(true)} />;
      case 'telegram':
        return <TelegramConnect userProfile={userProfile} setUserProfile={setUserProfile} />;
      case 'feed':
      default:
        return <CommunityFeed userProfile={userProfile} setUserProfile={setUserProfile} />;
    }
  };

  const TabButton: React.FC<{ tab: CommunityTab, label: string }> = ({ tab, label }) => (
      <button
        onClick={() => { playSound('click'); setActiveTab(tab); }}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeTab === tab ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {label}
      </button>
  );

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-screen">
      <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-gray-200 mr-4">
          <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
        </button>
        <UsersIcon className="w-6 h-6 text-green-600 mr-3" />
        <h1 className="text-xl font-bold text-gray-900">{t('sidebar.communityStudio')}</h1>
      </header>

      <div className="flex-shrink-0 p-2 border-b border-gray-200 bg-white">
          <nav className="flex items-center justify-around">
              <TabButton tab="feed" label={t('community.feedTitle')} />
              <TabButton tab="leaderboard" label={t('community.leaderboardTitle')} />
              {(userProfile.communityPoints > 0 || userProfile.isAdmin) && (
                <TabButton tab="rewards" label={t('community.rewardsTitle')} />
              )}
              <TabButton tab="telegram" label={t('community.telegramTitle')} />
          </nav>
      </div>

      <main className="flex-grow overflow-y-auto bg-gray-100">
        {renderTabContent()}
      </main>
      
      {isRedeemModalOpen && (
        <RedeemModal 
            onClose={() => setIsRedeemModalOpen(false)}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
        />
      )}
    </div>
  );
};

export default CommunityView;