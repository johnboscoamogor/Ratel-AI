import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { ChevronLeftIcon, UsersIcon } from '../constants';
import { playSound } from '../services/audioService';
import CommunityFeed from './CommunityFeed';
import Leaderboard from './Leaderboard';
import Rewards from './Rewards';
import TelegramConnect from './TelegramConnect';
import MyWallet from './MyWallet';
import RedeemTab from './RedeemTab';
import AdminPanel from './AdminPanel';
import AdBanner from './AdBanner';

interface CommunityViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onBack: () => void;
}

export type CommunityTab = 'feed' | 'leaderboard' | 'rewards' | 'connect' | 'wallet' | 'redeem' | 'admin';

const CommunityView: React.FC<CommunityViewProps> = ({ userProfile, setUserProfile, onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');

  const handleBackClick = () => {
    playSound('click');
    onBack();
  };
  
  const handleSwitchTab = (tab: CommunityTab) => {
      setActiveTab(tab);
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'leaderboard':
        return <Leaderboard currentUser={userProfile} />;
      case 'rewards':
        return <Rewards />;
      case 'connect':
        return <TelegramConnect userProfile={userProfile} setUserProfile={setUserProfile} />;
      case 'wallet':
        return <MyWallet userProfile={userProfile} setUserProfile={setUserProfile} onSwitchTab={handleSwitchTab} />;
      case 'redeem':
        return <RedeemTab userProfile={userProfile} setUserProfile={setUserProfile} onSwitchTab={handleSwitchTab} />;
      case 'admin':
        return userProfile.isAdmin ? <AdminPanel /> : <CommunityFeed userProfile={userProfile} setUserProfile={setUserProfile} />;
      case 'feed':
      default:
        return <CommunityFeed userProfile={userProfile} setUserProfile={setUserProfile} />;
    }
  };

  const TabButton: React.FC<{ tab: CommunityTab, label: string }> = ({ tab, label }) => (
      <button
        onClick={() => { playSound('click'); setActiveTab(tab); }}
        className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors flex-shrink-0 ${
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
          <nav className="flex items-center space-x-2 overflow-x-auto pb-2">
              <TabButton tab="feed" label={t('community.feedTitle')} />
              <TabButton tab="leaderboard" label={t('community.leaderboardTitle')} />
              <TabButton tab="rewards" label={t('community.rewardsTitle')} />
              <TabButton tab="connect" label={t('community.telegramTitle')} />
              <TabButton tab="wallet" label={t('community.myWalletTitle')} />
              <TabButton tab="redeem" label={t('community.redeemTitle')} />
              {userProfile.isAdmin && (
                <TabButton tab="admin" label={t('community.adminTitle')} />
              )}
          </nav>
      </div>

      <main className="flex-grow overflow-y-auto bg-gray-100">
        <AdBanner />
        {renderTabContent()}
      </main>
    </div>
  );
};

export default CommunityView;