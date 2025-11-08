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
import { isGeminiConfigured } from './services/geminiService';
import { RatelLogo } from './constants';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [page, setPage] = useState<'landing' | 'chat' | 'settings' | 'contact' | 'community' | 'admin' | 'examples'>('landing');
  const [loadingSession, setLoadingSession] = useState(true);

  // All hooks must be called at the top level, before any conditional returns.
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

    let isMounted = true;

    const updateUserSession = async (session: Session | null) => {
        if (!isMounted) return;

        if (session?.user) {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (profile && !error) {
                const completeProfile: UserProfile = {
                    ...profile,
                    email: session.user.email!,
                    communityPoints: profile.communityPoints || 0,
                    totalRedeemed: profile.totalRedeemed || 0,
                };
                setUserProfile(completeProfile);
                setPage('chat');
            } else {
                setUserProfile(null);
                setPage('landing');
                if (error) console.error('Error fetching profile:', error.message);
            }
        } else {
            setUserProfile(null);
            setPage('landing');
        }
    };
    
    // First, check the current session to unblock the UI quickly.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        await updateUserSession(session);
        if (isMounted) {
            setLoadingSession(false);
        }
    }).catch(err => {
        console.error("Error getting initial session:", err);
        if (isMounted) {
            setLoadingSession(false);
        }
    });


    // Then, listen for subsequent authentication state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        await updateUserSession(session);
    });

    // Clean up the subscription when the component unmounts.
    return () => {
        isMounted = false;
        subscription.unsubscribe();
    };
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

  // Now that hooks are defined, we can handle the configuration error.
  if (!isSupabaseConfigured || !isGeminiConfigured) {
    // --- Vercel / Vite Values ---
    const urlVite = (import.meta as any).env?.VITE_SUPABASE_URL;
    const keyVite = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    const geminiVite = (import.meta as any).env?.VITE_API_KEY;

    // --- AI Studio / Node Values ---
    const urlNode = typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined;
    const keyNode = typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined;
    const geminiNode = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
    
    // --- Common Mistake Check ---
    const geminiVertex = (import.meta as any).env?.Vertex_API_KEY || (typeof process !== 'undefined' ? process.env.Vertex_API_KEY : undefined);
    
    const Status: React.FC<{found: boolean}> = ({ found }) => (
      found 
        ? <span style={{color: '#22c55e', fontWeight: 'bold'}}>✅ Found</span> 
        : <span style={{color: '#f87171', fontWeight: 'bold'}}>❌ Not Found</span>
    );

    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'white', backgroundColor: '#111827', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#f87171' }}>⚙️ Configuration Error</h1>
        <p style={{ color: '#d1d5db' }}>The application is missing one or more required credentials.</p>
        
         <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1.5rem', border: '1px solid #374151', textAlign: 'left', maxWidth: '600px', width: '90%' }}>
             <p className="font-semibold text-white">To fix this, please set the following environment variables in your deployment platform (e.g., Vercel, AI Studio):</p>
             <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '1rem', color: '#d1d5db' }}>
                 <li style={{ marginBottom: '0.75rem' }}><code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>VITE_SUPABASE_URL</code></li>
                 <li style={{ marginBottom: '0.75rem' }}><code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>VITE_SUPABASE_ANON_KEY</code></li>
                 <li><code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>VITE_API_KEY</code> (for Gemini)</li>
             </ul>
              <p className="text-xs text-gray-400 mt-4">Note: In some environments (like AI Studio), you might need to use non-prefixed names like <code style={{ backgroundColor: '#4b5563', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>SUPABASE_URL</code> and <code style={{ backgroundColor: '#4b5563', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>API_KEY</code>.</p>
         </div>

         {geminiVertex && (
            <div style={{ backgroundColor: '#1f2937', padding: '1rem 1.5rem', borderRadius: '0.5rem', marginTop: '1rem', border: '1px solid #facc15', textAlign: 'left', maxWidth: '600px', width: '90%' }}>
                <p style={{ color: '#fde047', fontWeight: 'bold' }}>⚠️ We noticed you have a variable named <code style={{ backgroundColor: '#4b5563', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>Vertex_API_KEY</code>.</p>
                <p style={{ color: '#d1d5db', marginTop: '0.5rem' }}>Please rename it to <code style={{ backgroundColor: '#4b5563', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>VITE_API_KEY</code> for the app to work correctly.</p>
            </div>
         )}


        <div style={{ backgroundColor: '#1f2937', padding: '1rem 1.5rem', borderRadius: '0.5rem', marginTop: '1rem', border: '1px solid #f87171', textAlign: 'center', maxWidth: '600px', width: '90%' }}>
            <p style={{ color: 'white', fontWeight: 'bold' }}>Important: After setting variables in Vercel, you MUST re-deploy your project for changes to take effect.</p>
        </div>

        {/* ENHANCED DEBUG BOX */}
        <div style={{ backgroundColor: '#374151', padding: '1rem', borderRadius: '0.5rem', marginTop: '1.5rem', border: '1px solid #4b5563', textAlign: 'left', maxWidth: '600px', width: '90%', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            <p style={{ color: '#d1d5db', marginBottom: '1rem', fontWeight: 'bold' }}>Debugging Info (Values seen by the app):</p>
            <div style={{ marginBottom: '1rem', borderBottom: '1px solid #4b5563', paddingBottom: '1rem' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.7rem', textDecoration: 'underline' }}>Vercel / Browser Method:</p>
                <p style={{ color: 'white' }}>VITE_SUPABASE_URL: <Status found={!!urlVite} /></p>
                <p style={{ color: 'white' }}>VITE_SUPABASE_ANON_KEY: <Status found={!!keyVite} /></p>
                <p style={{ color: 'white' }}>VITE_API_KEY: <Status found={!!geminiVite} /></p>
            </div>
             <div>
                <p style={{ color: '#9ca3af', fontSize: '0.7rem', textDecoration: 'underline' }}>AI Studio / Server Method:</p>
                <p style={{ color: 'white' }}>SUPABASE_URL: <Status found={!!urlNode} /></p>
                <p style={{ color: 'white' }}>SUPABASE_ANON_KEY: <Status found={!!keyNode} /></p>
                <p style={{ color: 'white' }}>API_KEY: <Status found={!!geminiNode} /></p>
            </div>
            <div style={{ marginTop: '1rem', borderTop: '1px solid #4b5563', paddingTop: '1rem' }}>
                 <p style={{ color: '#9ca3af', fontSize: '0.7rem', textDecoration: 'underline' }}>Common Mistake Check:</p>
                 <p style={{ color: 'white' }}>Vertex_API_KEY: <Status found={!!geminiVertex} /></p>
            </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '1.5rem' }}>You can find your Supabase keys in your project dashboard under 'Settings' &gt; 'API'.</p>
      </div>
    );
  }


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