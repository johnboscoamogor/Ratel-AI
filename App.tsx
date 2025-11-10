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
    
    // Add a timeout to prevent the app from hanging on a failed connection
    const sessionTimeout = setTimeout(() => {
        if (isMounted && loadingSession) {
            console.error(
                "Supabase getSession timed out after 10 seconds. " +
                "This is likely due to an incorrect VITE_SUPABASE_URL environment variable or a network issue. " +
                "Please verify your Supabase project URL in your Vercel settings and re-deploy."
            );
            setLoadingSession(false); // Force the loader to stop
        }
    }, 10000); // 10-second timeout

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
        clearTimeout(sessionTimeout); // Success, clear the timeout
        await updateUserSession(session);
        if (isMounted) {
            setLoadingSession(false);
        }
    }).catch(err => {
        clearTimeout(sessionTimeout); // Failure, clear the timeout
        console.error("Error getting initial session:", err);
        if (isMounted) {
            setLoadingSession(false);
        }
    });


    // Then, listen for subsequent authentication state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        await updateUserSession(session);
    });

    // Clean up the subscription and timeout when the component unmounts.
    return () => {
        isMounted = false;
        subscription.unsubscribe();
        clearTimeout(sessionTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#34d399' }}>🚀 Almost There! Just a Quick Setup</h1>
        <p style={{ color: '#d1d5db', maxWidth: '600px', marginBottom: '1.5rem' }}>Your app needs a few secret keys to connect to its backend services. Follow these steps to get running.</p>
        
        {/* Step 1: Add Variables */}
         <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151', textAlign: 'left', maxWidth: '600px', width: '90%' }}>
            <h2 className="font-bold text-lg text-white mb-3">Step 1: Add Environment Variables</h2>
            <p className="text-sm text-gray-400 mb-4">In your Vercel project settings, go to "Environment Variables" and add the following keys. You need **both sets** for the app to work correctly.</p>
            
            <div className="mb-4">
                <h3 className="font-bold text-green-400">For the Frontend (Client-Side)</h3>
                <p className="text-xs text-gray-400 mb-2">These MUST start with <code className="bg-gray-700 p-1 rounded-sm">VITE_</code>.</p>
                <ul className="list-disc pl-5 text-sm space-y-2">
                    <li><code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>VITE_SUPABASE_URL</code></li>
                    <li><code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>VITE_SUPABASE_ANON_KEY</code></li>
                    <li><code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>VITE_API_KEY</code> (for Gemini)</li>
                </ul>
            </div>

            <div className="pt-4 border-t border-gray-600">
                <h3 className="font-bold text-green-400">For the Backend (Server-Side)</h3>
                <p className="text-xs text-gray-400 mb-2">These are the same keys but WITHOUT the prefix.</p>
                 <ul className="list-disc pl-5 text-sm space-y-2">
                    <li><code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>SUPABASE_URL</code></li>
                    <li><code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>SUPABASE_ANON_KEY</code></li>
                    <li><code style={{ backgroundColor: '#4b5563', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>API_KEY</code> (for Gemini)</li>
                </ul>
            </div>
         </div>

        {/* Step 2: Check Environments */}
        <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem', border: '1px solid #374151', textAlign: 'left', maxWidth: '600px', width: '90%' }}>
            <h2 className="font-bold text-lg text-white mb-3">Step 2: Check Vercel Environments</h2>
            <p className="text-sm text-gray-400">When you add a variable in Vercel, make sure it's available for the environment you're deploying to. For simplicity, apply them to **all environments** (Production, Preview, and Development) unless you have a specific reason not to.</p>
        </div>

        {/* Step 3: Re-deploy */}
        <div style={{ backgroundColor: '#2f2b1d', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem', border: '1px solid #facc15', textAlign: 'left', maxWidth: '600px', width: '90%' }}>
            <h2 className="font-bold text-lg text-amber-300 mb-2">Step 3: Re-deploy! (Crucial Step)</h2>
            <p className="text-sm text-amber-200">After saving your variables, you **MUST** trigger a new deployment in Vercel. Your existing deployments won't have the new keys.</p>
        </div>


        {/* ENHANCED DEBUG BOX */}
        <div style={{ backgroundColor: '#374151', padding: '1rem', borderRadius: '0.5rem', marginTop: '1.5rem', border: '1px solid #4b5563', textAlign: 'left', maxWidth: '600px', width: '90%', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            <p style={{ color: '#d1d5db', marginBottom: '0.25rem', fontWeight: 'bold' }}>Debugging Info (What your app currently sees)</p>
            <p style={{ color: '#9ca3af', fontSize: '0.7rem', marginBottom: '1rem' }}>If '❌ Not Found' is shown, the variable was missing for the environment Vercel used during the last build.</p>

            <div style={{ marginBottom: '1rem', borderBottom: '1px solid #4b5563', paddingBottom: '1rem' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.7rem', textDecoration: 'underline' }}>Frontend Build (Vite):</p>
                <p style={{ color: 'white' }}>VITE_SUPABASE_URL: <Status found={!!urlVite} /></p>
                <p style={{ color: 'white' }}>VITE_SUPABASE_ANON_KEY: <Status found={!!keyVite} /></p>
                <p style={{ color: 'white' }}>VITE_API_KEY: <Status found={!!geminiVite} /></p>
            </div>
             <div>
                <p style={{ color: '#9ca3af', fontSize: '0.7rem', textDecoration: 'underline' }}>Backend Functions (Vercel/Node.js):</p>
                <p style={{ color: 'white' }}>SUPABASE_URL: <Status found={!!urlNode} /></p>
                <p style={{ color: 'white' }}>SUPABASE_ANON_KEY: <Status found={!!keyNode} /></p>
                <p style={{ color: 'white' }}>API_KEY: <Status found={!!geminiNode} /></p>
            </div>
            {geminiVertex && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #4b5563', paddingTop: '1rem' }}>
                    <p style={{ color: '#fde047', fontSize: '0.7rem', textDecoration: 'underline' }}>Common Mistake Check:</p>
                    <p style={{ color: 'white' }}>Vertex_API_KEY: <Status found={!!geminiVertex} /> (Should be API_KEY)</p>
                </div>
            )}
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