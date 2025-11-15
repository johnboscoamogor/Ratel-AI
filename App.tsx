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
  const [connectionError, setConnectionError] = useState<string | null>(null);

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

  // This logic must be defined outside or above the useEffect that uses it.
  const updateUserSession = async (session: Session | null, isMounted: boolean) => {
        if (!isMounted) return;

        if (session?.user) {
            if (!supabase) return; // Guard against null supabase client
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


  // Manage user session with Supabase
  useEffect(() => {
    if (!supabase) {
        setLoadingSession(false);
        setPage('landing');
        return;
    }

    let isMounted = true;
    let sessionTimeout: number;
    
    // This function runs all checks and initializes the user session.
    const runChecksAndInit = async () => {
        // Step 1: Check if the server can connect to Supabase.
        try {
            const response = await fetch('/api/heartbeat');
            if (!response.ok) {
                const errorData = await response.json();
                // This is a definitive server-side error.
                throw new Error(`---SERVER CONNECTION FAILED---
Your app's backend cannot connect to Supabase. This is almost always due to incorrect **server-side** environment variables in Vercel.

**Please re-verify \`SUPABASE_URL\` and \`SUPABASE_ANON_KEY\` (without the 'VITE_' prefix) and re-deploy your project.**

*Server error: ${errorData.message || 'Unknown'}*`);
            }
        } catch (e: any) {
            // This catch handles both fetch failures and the thrown error from the check above.
            const errorMessage = e.message.startsWith('---SERVER') ? e.message : `---API ROUTE FAILED---
Could not reach the app's own backend health check (/api/heartbeat). This could be a deployment issue. **Please try re-deploying your project in Vercel.**`;
            if (isMounted) {
                setConnectionError(errorMessage);
                setLoadingSession(false);
            }
            return; // Stop initialization if server check fails.
        }

        // Step 2: Server is OK. Now, try connecting from the client.
        sessionTimeout = window.setTimeout(() => {
            if (isMounted && loadingSession) {
                // FIX: Access process.env safely to avoid ReferenceError in browser and type errors during build.
                const urlVite = (import.meta as any).env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' && process.env['SUPABASE_URL']);
                const clientErrorMsg = `---CLIENT CONNECTION FAILED---
Your browser is taking too long to connect to Supabase, even though the server can. This is often caused by an ad-blocker, network issue, or incorrect **client-side** variables.

**1. Disable any ad-blockers and try again.**
**2. Re-verify \`VITE_SUPABASE_URL\` and \`VITE_SUPABASE_ANON_KEY\` (with the 'VITE_' prefix) and re-deploy.**

*URL in use: \`${urlVite || 'URL not found'}\`*`;
                if (isMounted) {
                    setConnectionError(clientErrorMsg);
                    setLoadingSession(false);
                }
            }
        }, 15000);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            clearTimeout(sessionTimeout);
            if (isMounted) {
                await updateUserSession(session, isMounted);
                setLoadingSession(false);
            }
        } catch (err: any) {
             clearTimeout(sessionTimeout);
             // FIX: Access process.env safely to avoid ReferenceError in browser and type errors during build.
             const urlVite = (import.meta as any).env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' && process.env['SUPABASE_URL']);
             const clientErrorMsg = `---CLIENT CONNECTION FAILED---
Your browser cannot connect to Supabase. This is often caused by an ad-blocker, network issue, or incorrect **client-side** VITE_ variables.

**1. Disable any ad-blockers and try again.**
**2. Re-verify \`VITE_SUPABASE_URL\` and \`VITE_SUPABASE_ANON_KEY\` (with the 'VITE_' prefix) and re-deploy.**

*URL in use: \`${urlVite || 'URL not found'}\`*
*Error: ${err.message}*`;
            if (isMounted) {
                setConnectionError(clientErrorMsg);
                setLoadingSession(false);
            }
        }
    };

    runChecksAndInit();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if(isMounted) {
          await updateUserSession(session, isMounted);
        }
    });

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
    // Read the variables from both Vite and process.env to ensure compatibility.
    // FIX: Access process.env safely to avoid ReferenceError in browser and type errors during build.
    const urlVite = (import.meta as any).env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' && process.env['SUPABASE_URL']);
    // FIX: Access process.env safely to avoid ReferenceError in browser and type errors during build.
    const keyVite = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' && process.env['SUPABASE_ANON_KEY']);
    // FIX: Access process.env safely to avoid ReferenceError in browser and type errors during build.
    const geminiVite = (import.meta as any).env?.VITE_API_KEY || (typeof process !== 'undefined' && process.env['API_KEY']);
    
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


        {/* SIMPLIFIED DEBUG BOX */}
        <div style={{ backgroundColor: '#374151', padding: '1rem', borderRadius: '0.5rem', marginTop: '1.5rem', border: '1px solid #4b5563', textAlign: 'left', maxWidth: '600px', width: '90%', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            <p style={{ color: '#d1d5db', marginBottom: '0.25rem', fontWeight: 'bold' }}>Debugging Info (What your app's frontend currently sees)</p>
            <p style={{ color: '#9ca3af', fontSize: '0.7rem', marginBottom: '1rem' }}>If '❌ Not Found' is shown, the variable was missing for the environment Vercel used during the last build.</p>

            <div>
                <p style={{ color: 'white' }}>VITE_SUPABASE_URL: <Status found={!!urlVite} /></p>
                <p style={{ color: 'white' }}>VITE_SUPABASE_ANON_KEY: <Status found={!!keyVite} /></p>
                <p style={{ color: 'white' }}>VITE_API_KEY: <Status found={!!geminiVite} /></p>
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
        return <LandingPage onStartChatting={handleStartChatting} settings={settings} setSettings={setSettings} connectionError={connectionError} />;
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
        return <LandingPage onStartChatting={handleStartChatting} settings={settings} setSettings={setSettings} connectionError={connectionError} />;
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