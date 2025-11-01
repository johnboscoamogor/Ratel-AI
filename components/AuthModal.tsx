import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RatelLogo, CloseIcon, EyeIcon, EyeOffIcon, ChevronLeftIcon } from '../constants';
import { playSound } from '../services/audioService';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
    const { t } = useTranslation();
    
    const [step, setStep] = useState<'email' | 'details'>('email');
    const [isExistingUser, setIsExistingUser] = useState(false);
    const [existingUserName, setExistingUserName] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    if (!isSupabaseConfigured || !supabase) {
        return (
             <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-xl p-8 text-center text-white border border-red-500">
                    <h2 className="text-xl font-bold mb-4">Configuration Error</h2>
                    <p>Authentication is not configured. Please contact the administrator.</p>
                     <button onClick={onClose} className="mt-6 btn-primary">Close</button>
                </div>
            </div>
        )
    }

    const handleEmailCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError(t('authModal.error.emailRequired'));
            return;
        }

        setLoading(true);
        playSound('click');

        // Check if user exists by trying to fetch their profile
        const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', (await supabase.auth.getUser()).data.user?.id || '') // This won't work before login, so we check for user existence differently.
            // A common way is a serverless function, but for client-side, we'll just check if login fails.
            // For now, let's assume we can't know if a user exists by email alone for security reasons.
            // We'll proceed to the details step and let them either log in or sign up.

        // Simplified flow: always ask for password. If signup fails because user exists, handle that error.
        // Or better: Let's just have two clear paths from the start.
        // For this implementation, we will keep the 'magic link' style flow.
        
        // This is a simplification. A production app might use a server-side check.
        // We'll try to sign in silently. If it fails, they are likely a new user.
        // This is not a great pattern. Instead, we'll just ask them to login or signup.
        
        // Let's refine the flow:
        // 1. Enter email.
        // 2. We can't securely know if they exist.
        // 3. Present both "Login" and "Sign Up" options in the 'details' step.
        // Let's keep the original logic for now, as it's simpler, and just swap the backend.
        // Let's assume we will just TRY to log in. If it fails, we show the sign up form.
        setStep('details');
        setLoading(false);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!nickname.trim()) return setError(t('authModal.error.nicknameRequired'));
        if (password.length < 6) return setError(t('authModal.error.passwordRequired'));
        if (password !== confirmPassword) return setError(t('authModal.error.passwordsDoNotMatch'));
        
        const { data, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: nickname, // This can be used to trigger profile creation
                }
            }
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        if (data.user) {
             // Now, create the corresponding public profile.
            const { error: profileError } = await supabase.from('profiles').insert({
                id: data.user.id,
                name: nickname,
                level: 1,
                xp: 0,
                communityPoints: 0,
                interests: {},
                joinedDate: new Date().toISOString()
            });

            if (profileError) {
                setError(`Account created, but failed to create profile: ${profileError.message}`);
                setLoading(false);
                return;
            }
            alert("Account created! Please check your email to verify your account and log in.");
            onLoginSuccess();
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!password) {
             setLoading(false);
             return setError("Password is required.");
        }
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (signInError) {
            // A common failure is an unverified email after signup.
            if (signInError.message.includes("Email not confirmed")) {
                 setError("Please check your email and click the verification link to log in.");
            } else {
                 setError(signInError.message);
            }
            setLoading(false);
        } else {
            onLoginSuccess(); // Auth listener in App.tsx will handle the rest
        }
    };

    const handleBack = () => {
        playSound('click');
        setStep('email');
        setError('');
        setPassword('');
        setConfirmPassword('');
        setNickname('');
    };
    
    // In this new flow, we can't know the user's name yet, and we don't know if they exist.
    // So we'll have to present both login and signup forms.
    const renderDetailsStep = () => {
         return (
                <>
                    <div className="text-center">
                        <h2 id="auth-modal-title" className="text-2xl font-bold text-white">{isExistingUser ? `Welcome back` : `Create your account`}</h2>
                        <p className="mt-2 text-gray-400">{isExistingUser ? `Enter your password for ${email}` : `Final step to join Ratel AI`}</p>
                    </div>
                    
                    <div className="flex justify-center my-4">
                        <button onClick={() => setIsExistingUser(true)} className={`px-4 py-1 text-sm font-bold rounded-l-md ${isExistingUser ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>Login</button>
                        <button onClick={() => setIsExistingUser(false)} className={`px-4 py-1 text-sm font-bold rounded-r-md ${!isExistingUser ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>Sign Up</button>
                    </div>

                    { isExistingUser ?
                        ( // Login form
                            <form onSubmit={handleLogin} noValidate className="mt-6 text-left space-y-4">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">{t('authModal.passwordLabel')}</label>
                                    <div className="relative mt-1">
                                        <input id="password" type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required className="input-field pr-10" autoFocus />
                                        <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-200">
                                            {isPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                                <button type="submit" className="w-full btn-primary" disabled={loading}>{loading ? 'Logging in...' : t('authModal.loginButton')}</button>
                            </form>
                        ) :
                        ( // Signup form
                             <form onSubmit={handleSignup} noValidate className="mt-6 text-left space-y-4">
                                <div>
                                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-300">{t('authModal.nicknameLabel')}</label>
                                    <input id="nickname" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={t('authModal.nicknamePlaceholder')} required className="mt-1 input-field" autoFocus/>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">{t('authModal.passwordLabel')}</label>
                                    <div className="relative mt-1">
                                        <input id="password" type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required className="input-field pr-10" />
                                        <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-200">
                                            {isPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">{t('authModal.confirmPasswordLabel')}</label>
                                    <div className="relative mt-1">
                                        <input id="confirmPassword" type={isConfirmPasswordVisible ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••" required className="input-field pr-10" />
                                        <button type="button" onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-200">
                                            {isConfirmPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                                <button type="submit" className="w-full btn-primary" disabled={loading}>{loading ? 'Creating Account...' : t('authModal.signupButton')}</button>
                            </form>
                        )
                    }
                </>
            );
    };

    const renderEmailStep = () => (
        <>
            <div className="text-center">
                <h2 id="auth-modal-title" className="text-2xl font-bold text-white">Get Started</h2>
                <p className="mt-2 text-gray-400">Enter your email to log in or create an account.</p>
            </div>
            <form onSubmit={handleEmailCheck} noValidate className="mt-6 text-left space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">{t('authModal.emailLabel')}</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('authModal.emailPlaceholder')} required className="mt-1 input-field" autoFocus />
                </div>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button type="submit" className="w-full btn-primary" disabled={loading}>{loading ? 'Checking...' : 'Continue'}</button>
            </form>
        </>
    );
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <style>{`
                .input-field { width: 100%; background-color: #374151; border: 1px solid #4b5563; color: white; font-size: 0.875rem; border-radius: 0.5rem; padding: 0.625rem; }
                .input-field:focus { outline: none; --tw-ring-color: #16a34a; --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); border-color: #16a34a; }
                .btn-primary { width: 100%; background-color: #16a34a; color: white; font-weight: 700; padding-top: 0.625rem; padding-bottom: 0.625rem; border-radius: 0.5rem; transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
                .btn-primary:hover { background-color: #15803d; }
                .btn-primary:disabled { background-color: #166534; cursor: not-allowed; }
            `}</style>
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all relative border border-gray-700">
                <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 z-10">
                    <CloseIcon className="w-5 h-5" />
                </button>
                {step === 'details' && (
                    <button onClick={handleBack} className="absolute top-3 left-3 p-1.5 rounded-full text-gray-400 hover:bg-gray-700 z-10">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                )}
                <div className="p-8">
                    <div className="flex justify-center mb-4">
                        <RatelLogo className="w-16 h-16 text-green-500" />
                    </div>
                    {step === 'email' ? renderEmailStep() : renderDetailsStep()}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;