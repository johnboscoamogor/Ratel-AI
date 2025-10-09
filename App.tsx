import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ChatView from './components/ChatView';
import AuthModal from './components/AuthModal';
import SettingsPage from './components/SettingsPage';
import ContactPage from './components/ContactPage';
import CommunityView from './components/CommunityView';
import AdminDashboard from './components/AdminDashboard';
import { UserProfile, AppSettings, RatelMode } from './types';
import { playSound } from './services/audioService';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [page, setPage] = useState<'landing' | 'chat' | 'settings' | 'contact' | 'community' | 'admin'>('landing');

  const defaultSettings: AppSettings = {
    language: 'en',
    chatTone: 'normal',
    customInstructions: { nickname: '', aboutYou: '', expectations: '' },
    appearance: { theme: 'light', backgroundImage: '' },
    memory: { referenceSavedMemories: true, referenceChatHistory: true },
    voice: { selectedVoice: 'gemini_Zephyr' },
    security: { mfaEnabled: false },
    notifications: { pushEnabled: false },
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('ratel_settings');
      if (savedSettings) {
        // Merge saved settings with defaults to ensure new settings are included
        const parsed = JSON.parse(savedSettings);
        return { ...defaultSettings, ...parsed, voice: { ...defaultSettings.voice, ...parsed.voice } };
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
    return defaultSettings;
  });

  // Load user profile and settings on initial mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('ratel_user_profile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
        setPage('chat');
      } else {
        setPage('landing');
      }

      const savedLanguage = localStorage.getItem('ratel_language');
      if(savedLanguage) {
        setSettings(prev => ({...prev, language: savedLanguage as AppSettings['language']}));
      }

    } catch (e) {
      console.error("Failed to load user data", e);
      setPage('landing');
    }
  }, []);

  // Save user profile and settings whenever they change
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('ratel_user_profile', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('ratel_user_profile');
    }
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('ratel_settings', JSON.stringify(settings));
    localStorage.setItem('ratel_language', settings.language);
  }, [settings]);

  const handleLoginSuccess = (profile: { name: string; email: string }) => {
    playSound('receive');
    const newUserProfile: UserProfile = {
      name: profile.name,
      email: profile.email,
      level: 1,
      xp: 0,
      communityPoints: 0,
      interests: {},
      joinedDate: new Date().toISOString(),
    };
    setUserProfile(newUserProfile);
    setShowAuthModal(false);
    setPage('chat');
  };

  const handleLogout = () => {
    playSound('click');
    setUserProfile(null);
    localStorage.removeItem('ratel_chat_history'); // Clear chat history on logout
    localStorage.removeItem('ratel_tasks');
    setPage('landing');
  };

  const handleStartChatting = () => {
    if (userProfile) {
      setPage('chat');
    } else {
      setShowAuthModal(true);
    }
  };
  
  const handleLevelUp = async (newLevel: number, newXp: number) => {
    setUserProfile(prev => {
        if (!prev) return null;
        playSound('receive');
        return { ...prev, level: newLevel, xp: newXp };
    });
    // The message itself is handled inside ChatView upon detecting level change
  };

  const addXp = (points: number) => {
    setUserProfile(prev => {
      if (!prev) return null;
      const newXp = prev.xp + points;
      const xpForNextLevel = prev.level * 100;
      if (newXp >= xpForNextLevel) {
        const nextLevel = prev.level + 1;
        const remainingXp = newXp - xpForNextLevel;
        handleLevelUp(nextLevel, remainingXp);
        return { ...prev, level: nextLevel, xp: remainingXp };
      }
      return { ...prev, xp: newXp };
    });
  };

  const trackInterest = (mode: RatelMode) => {
    setUserProfile(prev => {
      if (!prev) return null;
      const newInterests = { ...prev.interests };
      newInterests[mode] = (newInterests[mode] || 0) + 1;
      return { ...prev, interests: newInterests };
    });
  };


  const renderPage = () => {
    if (!userProfile) {
      return page === 'landing' 
        ? <LandingPage onStartChatting={handleStartChatting} />
        : <LandingPage onStartChatting={handleStartChatting} />; // Fallback to landing
    }

    switch (page) {
      case 'chat':
        return <ChatView userProfile={userProfile} setUserProfile={setUserProfile} settings={settings} setSettings={setSettings} setPage={setPage} onLogout={handleLogout} addXp={addXp} trackInterest={trackInterest} onLevelUp={handleLevelUp} />;
      case 'settings':
        return <SettingsPage settings={settings} setSettings={setSettings} onBack={() => setPage('chat')} onLogout={handleLogout} />;
      case 'contact':
        return <ContactPage onBack={() => setPage('chat')} />;
      case 'community':
        return <CommunityView userProfile={userProfile} setUserProfile={setUserProfile} onBack={() => setPage('chat')} />;
      case 'admin':
        if (userProfile.isAdmin) {
          return <AdminDashboard onBack={() => setPage('chat')} />;
        }
        // If not admin, silently redirect to chat to prevent access
        return <ChatView userProfile={userProfile} setUserProfile={setUserProfile} settings={settings} setSettings={setSettings} setPage={setPage} onLogout={handleLogout} addXp={addXp} trackInterest={trackInterest} onLevelUp={handleLevelUp} />;
      default:
        return <LandingPage onStartChatting={handleStartChatting} />;
    }
  };

  return (
    <>
      {renderPage()}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} />}
    </>
  );
};

export default App;