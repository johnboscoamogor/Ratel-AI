// This is the root component of the Ratel AI application.
// It manages user authentication, page routing, and global state like user profile and settings.
import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ChatView from './components/ChatView';
import AuthModal from './components/AuthModal';
import SettingsPage from './components/SettingsPage';
import ContactPage from './components/ContactPage';
import CommunityView from './components/CommunityView';
import AdminDashboard from './components/AdminDashboard';
import { UserProfile, AppSettings, RatelMode, Task } from './types';
import { playSound } from './services/audioService';
import { supabase, isSupabaseConfigured } from './services/supabase';
// FIX: Import the RatelLogo component to resolve the 'Cannot find name' error.
import { RatelLogo } from './constants';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [page, setPage] = useState<'landing' | 'chat' | 'settings' | 'contact' | 'community' | 'admin' | 'examples'>('landing');
  const [loadingSession, setLoadingSession] = useState(true);

  // If Supabase is not configured, display a clear error message and stop.
  if (!isSupabaseConfigured) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'white', backgroundColor: '#111827', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#f87171' }}>⚙️ Configuration Needed</h1>
        <p style={{ color: '#d1d5db' }}>Authentication is not configured. To fix this:</p>
        <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1.5rem', border: '1px solid #374151' }}>
            <ol style={{ textAlign: 'left', margin: '0', paddingLeft: '1.5rem', display: 'inline-block', listStyle: 'decimal' }}>
                <li style={{ marginBottom: '0.75rem' }}>Open the file: <code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>services/supabase.ts</code></li>
                <li style={{ marginBottom: '0.75rem' }}>Replace <code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>'YOUR_SUPABASE_URL_HERE'</code> with your actual Supabase URL.</li>
                <li>Replace <code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>'YOUR_SUPABASE_ANON_KEY_HERE'</code> with your actual Supabase 'anon' key.</li>
            </ol>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '1.5rem' }}>You can find these keys in your Supabase project dashboard under 'Settings' &gt; 'API'.</p>
      </div>
    );
  }

  const defaultSettings: AppSettings = {
    language: 'en',
    chatTone: 'normal',
    customInstructions: { nickname: '', aboutYou: '', expectations: '' },
    appearance: { theme: 'light', backgroundImage: '' },
    memory: { referenceSavedMemories: true, referenceChatHistory: true },
    voice: { selectedVoice: 'en-NG-Standard-A' },
    security: { mfaEnabled: false },
    notifications: { pushEnabled: false },
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('ratel_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return { ...defaultSettings, ...parsed, voice: { ...defaultSettings.voice, ...parsed.voice } };
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
    return defaultSettings;
  });

  // Manage user session with Supabase
  useEffect(() => {
    if (!supabase) {
        setLoadingSession(false);
        setPage('landing');
        return;
    }

    // Set up the authentication state change listener.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        try {
            // If a session exists, it means the user is logged in.
            if (session?.user) {
                // Fetch the user's profile from the 'profiles' table.
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                // If a profile is found and there's no error, update the app state.
                if (profile && !error) {
                    const completeProfile: UserProfile = {
                        ...profile,
                        email: session.user.email!,
                        communityPoints: profile.communityPoints || 0,
                        totalRedeemed: profile.totalRedeemed || 0,
                    };
                    setUserProfile(completeProfile);
                    setPage('chat'); // Navigate to the chat view.
                } else {
                    // If no profile is found or there's an error, treat as logged out.
                    if (error) {
                        console.error('Error fetching profile:', error.message);
                    }
                    setUserProfile(null);
                    setPage('landing');
                }
            } else {
                // If there is no session, the user is logged out.
                setUserProfile(null);
                setPage('landing');
            }
        } catch (e) {
            // Catch any unexpected errors during the process.
            console.error("An unexpected error occurred during auth state change:", e);
            setUserProfile(null);
            setPage('landing');
        } finally {
            // IMPORTANT: Always set loading to false after the initial check is complete.
            // This ensures the app doesn't get stuck on the loading screen.
            setLoadingSession(false);
        }
    });

    // Clean up the subscription when the component unmounts.
    return () => subscription.unsubscribe();
  }, []);


  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem('ratel_settings', JSON.stringify(settings));
    localStorage.setItem('ratel_language', settings.language);
  }, [settings]);
  
  // Task Reminder Checker
  useEffect(() => {
    const checkReminders = () => {
        try {
            const savedTasks = localStorage.getItem('ratel_tasks');
            if (!savedTasks) return;

            const tasks: Task[] = JSON.parse(savedTasks);
            const now = new Date();
            let tasksUpdated = false;

            const updatedTasks = tasks.map(task => {
                if (task.reminder && !task.completed && !task.reminderFired) {
                    const reminderTime = new Date(task.reminder);
                    if (now >= reminderTime) {
                        alert(`Reminder: ${task.description}`);
                        tasksUpdated = true;
                        return { ...task, reminderFired: true };
                    }
                }
                return task;
            });

            if (tasksUpdated) {
                localStorage.setItem('ratel_tasks', JSON.stringify(updatedTasks));
            }
        } catch (e) {
            console.error("Failed to check task reminders:", e);
        }
    };

    const intervalId = setInterval(checkReminders, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  const handleLoginSuccess = () => {
    playSound('receive');
    setShowAuthModal(false);
    // The onAuthStateChange listener will handle setting the profile and page.
  };

  const handleLogout = async () => {
    if (!supabase) return;
    playSound('click');
    await supabase.auth.signOut();
    // onAuthStateChange will handle cleanup
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

  if (loadingSession) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
            <RatelLogo className="w-16 h-16 text-green-500 animate-pulse" />
        </div>
      );
  }


  const renderPage = () => {
    if (!userProfile) {
        return <LandingPage onStartChatting={handleStartChatting} settings={settings} setSettings={setSettings} />;
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
        return <ChatView userProfile={userProfile} setUserProfile={setUserProfile} settings={settings} setSettings={setSettings} setPage={setPage} onLogout={handleLogout} addXp={addXp} trackInterest={trackInterest} onLevelUp={handleLevelUp} />;
      default:
        return <LandingPage onStartChatting={handleStartChatting} settings={settings} setSettings={setSettings} />;
    }
  };

  return (
    <div className="bg-gray-900">
      {renderPage()}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
};

export default App;