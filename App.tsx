import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LandingPage from './components/LandingPage';
import ChatView from './components/ChatView';
import SettingsPage from './components/SettingsPage';
import ContactPage from './components/ContactPage';
import CommunityView from './components/CommunityView';
import AuthModal from './components/AuthModal';
import { AppSettings, UserProfile, RatelTone } from './types';
import i18n from 'i18next';

const defaultSettings: AppSettings = {
  customInstructions: {
    aboutYou: '',
    nickname: 'Explorer',
    expectations: '',
  },
  memory: {
    referenceSavedMemories: true,
    referenceChatHistory: true,
  },
  notifications: {
    pushEnabled: false,
  },
  security: {
    mfaEnabled: false,
  },
  voice: {
    selectedVoice: 'gemini_Zephyr',
  },
  appearance: {
    backgroundImage: '',
  },
  language: (localStorage.getItem('ratel_language') as 'en' | 'fr' | 'am' | 'ng' | 'sw') || 'en',
  chatTone: 'normal',
};

const updateMetaTags = (title: string, description: string) => {
  document.title = title;
  const metaDescription = document.getElementById('meta-description');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
};

const App: React.FC = () => {
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
        const savedProfile = localStorage.getItem('ratel_user_profile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            return {
                ...profile,
                xp: profile.xp || 0,
                level: profile.level || 1,
                interests: profile.interests || {},
                communityPoints: profile.communityPoints || 0,
                telegramUsername: profile.telegramUsername || undefined,
            };
        }
        return null;
    } catch (e) {
        console.error("Failed to load user profile", e);
        return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [page, setPage] = useState<'chat' | 'settings' | 'contact' | 'community'>('chat');
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('ratel_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return { ...defaultSettings, ...parsed };
      }
      return defaultSettings;
    } catch (e) {
      console.error("Failed to load settings", e);
      return defaultSettings;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ratel_settings', JSON.stringify(settings));
      if (i18n.language !== settings.language) {
          i18n.changeLanguage(settings.language);
          localStorage.setItem('ratel_language', settings.language);
      }
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  }, [settings]);

   useEffect(() => {
    if(userProfile) {
        try {
            localStorage.setItem('ratel_user_profile', JSON.stringify(userProfile));
        } catch (e) {
            console.error("Failed to save user profile", e);
        }
    }
  }, [userProfile]);


  useEffect(() => {
    if (!userProfile) {
        updateMetaTags(t('meta.defaultTitle'), t('meta.defaultDescription'));
        return;
    }

    switch (page) {
        case 'settings':
            updateMetaTags(t('meta.settingsTitle'), t('meta.settingsDescription'));
            break;
        case 'contact':
            updateMetaTags(t('meta.contactTitle'), t('meta.contactDescription'));
            break;
        case 'community':
            // You can create specific meta tags for community later
            updateMetaTags("Community - Ratel AI", "Engage with the Ratel AI community.");
            break;
        case 'chat':
            updateMetaTags(t('meta.chatTitle'), t('meta.defaultDescription'));
            break;
        default:
            updateMetaTags(t('meta.defaultTitle'), t('meta.defaultDescription'));
    }
  }, [page, userProfile, t]);


  const handleLoginSuccess = (profile: Omit<UserProfile, 'xp' | 'level' | 'interests' | 'communityPoints'>) => {
    const fullProfile: UserProfile = {
        ...profile,
        xp: 0,
        level: 1,
        interests: {},
        communityPoints: 0,
    };
    localStorage.setItem('ratel_user_profile', JSON.stringify(fullProfile));
    setUserProfile(fullProfile);
    setSettings(prev => ({
        ...prev,
        customInstructions: {
            ...prev.customInstructions,
            nickname: profile.name,
        }
    }));
    setIsAuthModalOpen(false);
    setPage('chat');
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out? This will clear all your chat history and settings on this device.")) {
      localStorage.removeItem('oracle_chat_history');
      localStorage.removeItem('ratel_chat_history');
      localStorage.removeItem('ratel_settings');
      localStorage.removeItem('ratel_language');
      localStorage.removeItem('ratel_user_profile');
      localStorage.removeItem('ratel_community_posts');
      localStorage.removeItem('ratel_all_users_community_points');
      
      window.location.reload();
    }
  };
  
  const handleLevelUp = (newLevel: number, newXp: number): Promise<void> => {
     return new Promise(resolve => {
         console.log(`Level up to ${newLevel} with ${newXp} XP!`);
         resolve();
     });
  };

  const addXp = (points: number) => {
    if (!userProfile) return;
    
    setUserProfile(prevProfile => {
        if (!prevProfile) return null;
        
        const newXp = prevProfile.xp + points;
        let newLevel = prevProfile.level;
        let didLevelUp = false;

        const xpForNextLevel = newLevel * 100;

        if (newXp >= xpForNextLevel) {
            newLevel++;
            didLevelUp = true;
        }

        if (didLevelUp) {
            handleLevelUp(newLevel, newXp);
        }

        return { ...prevProfile, xp: newXp, level: newLevel };
    });
  };

  const trackInterest = (mode: string) => {
     if (!userProfile) return;
     setUserProfile(prevProfile => {
         if (!prevProfile) return null;
         const newInterests = { ...prevProfile.interests };
         newInterests[mode] = (newInterests[mode] || 0) + 1;
         return { ...prevProfile, interests: newInterests };
     });
  };


  const renderPage = () => {
    if (!userProfile) {
      return (
        <>
          <LandingPage onStartChatting={() => setIsAuthModalOpen(true)} />
          {isAuthModalOpen && (
            <AuthModal
              onClose={() => setIsAuthModalOpen(false)}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
        </>
      );
    }

    switch (page) {
      case 'settings':
        return <SettingsPage settings={settings} setSettings={setSettings} onBack={() => setPage('chat')} onLogout={handleLogout} />;
      case 'contact':
        return <ContactPage onBack={() => setPage('chat')} />;
      case 'community':
        return <CommunityView userProfile={userProfile} setUserProfile={setUserProfile} onBack={() => setPage('chat')} />;
      case 'chat':
      default:
        return (
            <ChatView 
                userProfile={userProfile}
                setUserProfile={setUserProfile} 
                settings={settings} 
                setSettings={setSettings} 
                setPage={setPage} 
                onLogout={handleLogout}
                addXp={addXp}
                trackInterest={trackInterest}
                onLevelUp={handleLevelUp}
            />
        );
    }
  };

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen font-sans">
      {renderPage()}
    </div>
  );
};

export default App;