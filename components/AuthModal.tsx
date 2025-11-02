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
                <div className="bg-gray-800 rounded-xl p-8 text-center text-white border border-red-500 max-w-lg">
                    <h2 className="text-xl font-bold mb-4">⚙️ Configuration Needed</h2>
                    <p>Authentication is not configured. To fix this:</p>
                    <div className="bg-gray-900/50 p-4 rounded-md my-4 border border-gray-700">
                        <ol className="text-left inline-block list-decimal list-inside text-sm">
                            <li className="mb-2">Open the file: <code className="bg-gray-600 px-1 py-0.5 rounded">services/supabase.ts</code></li>
                            <li className="mb-2">Replace <code className="bg-gray-600 px-1 py-0.5 rounded">'YOUR_SUPABASE_URL_HERE'</code> with your URL.</li>
                            <li>Replace <code className="bg-gray-600 px-1 py-0.5 rounded">'YOUR_SUPABASE_ANON_KEY_HERE'</code> with your anon key.</li>
                        </ol>
                    </div>
                     <button onClick={onClose} className="mt-4 btn-primary">Close</button>
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
        
        setStep('details');
        setLoading(false);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!nickname.trim()) {
            setError(t('authModal.error.nicknameRequired'));
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError(t('authModal.error.passwordRequired'));
            setLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError(t('authModal.error.passwordsDoNotMatch'));
            setLoading(false);
            return;
        }
        
        const { data, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: nickname, // This will be used by the trigger
                },
                emailRedirectTo: window.location.origin,
            }
        });

        setLoading(false);

        if (signUpError) {
            setError(signUpError.message);
            return;
        }
        
        // If Supabase is configured to NOT require email confirmation,
        // the 'data' object will contain a full session, logging the user in immediately.
        if (data.session && data.user) {
            // The user is now logged in. The main App component's auth listener
            // will detect this change, fetch the user's profile, and navigate to the chat view.
            onLoginSuccess();
        } else if (data.user) {
            // This block handles the case where email confirmation is still enabled.
            // It provides a fallback message to guide the user.
            alert("Account created! Please check your email for a verification link to log in.");
            onClose();
        } else {
            // Handle an unexpected response from Supabase.
            setError("An unexpected error occurred during signup. Please try again.");
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