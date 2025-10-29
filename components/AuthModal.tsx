import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RatelLogo, CloseIcon, EyeIcon, EyeOffIcon, ChevronLeftIcon } from '../constants';
import { playSound } from '../services/audioService';
import { UserProfile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (profile: UserProfile, isNewUser: boolean) => void;
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
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleEmailCheck = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!validateEmail(email)) {
            setError(t('authModal.error.emailRequired'));
            return;
        }

        playSound('click');
        const storedUserJSON = localStorage.getItem(`ratel_user_${email.toLowerCase()}`);
        if (storedUserJSON) {
            const storedUser = JSON.parse(storedUserJSON);
            setIsExistingUser(true);
            setExistingUserName(storedUser.name);
        } else {
            setIsExistingUser(false);
            setExistingUserName('');
        }
        setStep('details');
    };

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!nickname.trim()) {
            setError(t('authModal.error.nicknameRequired'));
            return;
        }
        if (password.length < 6) {
            setError(t('authModal.error.passwordRequired'));
            return;
        }
        if (password !== confirmPassword) {
            setError(t('authModal.error.passwordsDoNotMatch'));
            return;
        }
        
        const newUserProfile: UserProfile = {
            name: nickname,
            email: email.toLowerCase(),
            level: 1,
            xp: 0,
            communityPoints: 0,
            interests: {},
            joinedDate: new Date().toISOString(),
        };

        localStorage.setItem(`ratel_user_${email.toLowerCase()}`, JSON.stringify({ ...newUserProfile, password }));
        
        playSound('send');
        onLoginSuccess(newUserProfile, true);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password) {
            setError("Password is required.");
            return;
        }
        
        const storedUserJSON = localStorage.getItem(`ratel_user_${email.toLowerCase()}`);
        if (!storedUserJSON) {
            setError("Something went wrong. Please go back and re-enter your email.");
            return;
        }

        const storedUser = JSON.parse(storedUserJSON);
        if (storedUser.password !== password) {
            setError(t('authModal.error.invalidCredentials'));
            return;
        }

        const { password: _, ...userProfile } = storedUser;

        playSound('send');
        onLoginSuccess(userProfile, false);
    };

    const handleBack = () => {
        playSound('click');
        setStep('email');
        setError('');
        setPassword('');
        setConfirmPassword('');
        setNickname('');
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
                <button type="submit" className="w-full btn-primary">Continue</button>
            </form>
        </>
    );

    const renderDetailsStep = () => {
        if (isExistingUser) {
            return ( // Login form
                <>
                    <div className="text-center">
                        <h2 id="auth-modal-title" className="text-2xl font-bold text-white">{`Welcome back, ${existingUserName}!`}</h2>
                        <p className="mt-2 text-gray-400">Enter your password to continue.</p>
                    </div>
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
                        <button type="submit" className="w-full btn-primary">{t('authModal.loginButton')}</button>
                    </form>
                </>
            );
        } else {
            return ( // Signup form
                <>
                    <div className="text-center">
                        <h2 id="auth-modal-title" className="text-2xl font-bold text-white">{t('authModal.signupTitle')}</h2>
                        <p className="mt-2 text-gray-400">{t('authModal.signupDescription')}</p>
                    </div>
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
                        <button type="submit" className="w-full btn-primary">{t('authModal.signupButton')}</button>
                    </form>
                </>
            );
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <style>{`
                .input-field { width: 100%; background-color: #374151; border: 1px solid #4b5563; color: white; font-size: 0.875rem; border-radius: 0.5rem; padding: 0.625rem; }
                .input-field:focus { outline: none; --tw-ring-color: #16a34a; --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); border-color: #16a34a; }
                .btn-primary { width: 100%; background-color: #16a34a; color: white; font-weight: 700; padding-top: 0.625rem; padding-bottom: 0.625rem; border-radius: 0.5rem; transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
                .btn-primary:hover { background-color: #15803d; }
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
