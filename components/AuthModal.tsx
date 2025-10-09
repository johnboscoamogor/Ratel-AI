import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RatelLogo, CloseIcon, EyeIcon, EyeOffIcon } from '../constants';
import { playSound } from '../services/audioService';
import { UserProfile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (profile: UserProfile) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
    const { t } = useTranslation();
    const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgotPassword'>('signup');
    
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    useEffect(() => {
        try {
          const rememberedUser = localStorage.getItem('ratel_remembered_user');
          if (rememberedUser) {
            const { email: savedEmail, password: savedPassword } = JSON.parse(rememberedUser);
            setEmail(savedEmail);
            setPassword(savedPassword);
            setRememberMe(true);
            setAuthMode('login'); // Switch to login if we have remembered credentials
          }
        } catch (e) {
          console.error("Failed to load remembered user", e);
        }
    }, []);

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!nickname.trim()) {
            setError(t('authModal.error.nicknameRequired'));
            return;
        }
        if (!validateEmail(email)) {
            setError(t('authModal.error.emailRequired'));
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

        // Simulate backend check
        const existingUser = localStorage.getItem(`ratel_user_${email}`);
        if (existingUser) {
            setError(t('authModal.error.userExists'));
            return;
        }

        // Simulate user creation
        const newUser = { name: nickname, email, password }; // NEVER store plaintext passwords in a real app
        localStorage.setItem(`ratel_user_${email}`, JSON.stringify(newUser));
        
        playSound('send');
        onLoginSuccess({ name: nickname, email });
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(email) || !password) {
            setError(t('authModal.error.invalidCredentials'));
            return;
        }
        
        // Simulate backend check
        const storedUserJSON = localStorage.getItem(`ratel_user_${email}`);
        if (!storedUserJSON) {
            setError(t('authModal.error.invalidCredentials'));
            return;
        }

        const storedUser = JSON.parse(storedUserJSON);
        if (storedUser.password !== password) { // In a real app, compare hashed passwords
            setError(t('authModal.error.invalidCredentials'));
            return;
        }
        
        if (rememberMe) {
          localStorage.setItem('ratel_remembered_user', JSON.stringify({ email, password }));
        } else {
          localStorage.removeItem('ratel_remembered_user');
        }

        playSound('send');
        onLoginSuccess({ name: storedUser.name, email });
    };
    
    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!validateEmail(email)) {
            setError(t('authModal.error.emailRequired'));
            return;
        }
        // Simulate sending a reset link
        setSuccessMessage(t('authModal.resetLinkSent'));
        playSound('send');
    };

    const switchMode = (mode: 'login' | 'signup' | 'forgotPassword') => {
        playSound('click');
        setError('');
        setSuccessMessage('');
        // Keep email and password when switching between login and remember me
        if (mode !== 'login') {
            setEmail('');
            setPassword('');
        }
        setConfirmPassword('');
        setNickname('');
        setAuthMode(mode);
        setIsPasswordVisible(false);
        setIsConfirmPasswordVisible(false);
    };

    const renderSignupForm = () => (
        <>
            <div className="text-center">
                <h2 id="auth-modal-title" className="text-2xl font-bold text-gray-800">{t('authModal.signupTitle')}</h2>
                <p className="mt-2 text-gray-600">{t('authModal.signupDescription')}</p>
            </div>
            <form onSubmit={handleSignup} noValidate className="mt-6 text-left space-y-4">
                <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">{t('authModal.nicknameLabel')}</label>
                    <input id="nickname" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={t('authModal.nicknamePlaceholder')} required className="mt-1 input-field" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('authModal.emailLabel')}</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('authModal.emailPlaceholder')} required className="mt-1 input-field" />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('authModal.passwordLabel')}</label>
                    <div className="relative mt-1">
                        <input id="password" type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required className="input-field pr-10" />
                        <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700" aria-label={isPasswordVisible ? "Hide password" : "Show password"}>
                            {isPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                 <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">{t('authModal.confirmPasswordLabel')}</label>
                     <div className="relative mt-1">
                        <input id="confirmPassword" type={isConfirmPasswordVisible ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••" required className="input-field pr-10" />
                        <button type="button" onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700" aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}>
                            {isConfirmPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                <button type="submit" className="w-full btn-primary">{t('authModal.signupButton')}</button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
                {t('authModal.switchToLogin')} <button onClick={() => switchMode('login')} className="font-semibold text-green-600 hover:underline">{t('authModal.switchToLoginLink')}</button>
            </p>
        </>
    );

    const renderLoginForm = () => (
         <>
            <div className="text-center">
                <h2 id="auth-modal-title" className="text-2xl font-bold text-gray-800">{t('authModal.loginTitle')}</h2>
                <p className="mt-2 text-gray-600">{t('authModal.loginDescription')}</p>
            </div>
            <form onSubmit={handleLogin} noValidate className="mt-6 text-left space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('authModal.emailLabel')}</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('authModal.emailPlaceholder')} required className="mt-1 input-field" />
                </div>
                <div>
                     <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('authModal.passwordLabel')}</label>
                    <div className="relative mt-1">
                        <input id="password" type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required className="input-field pr-10" />
                        <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700" aria-label={isPasswordVisible ? "Hide password" : "Show password"}>
                            {isPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                            {t('authModal.rememberMe')}
                        </label>
                    </div>
                    <div className="text-sm">
                        <button type="button" onClick={() => switchMode('forgotPassword')} className="font-semibold text-green-600 hover:underline">{t('authModal.forgotPasswordLink')}</button>
                    </div>
                </div>
                {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                <button type="submit" className="w-full btn-primary">{t('authModal.loginButton')}</button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
                {t('authModal.switchToSignup')} <button onClick={() => switchMode('signup')} className="font-semibold text-green-600 hover:underline">{t('authModal.switchToSignupLink')}</button>
            </p>
        </>
    );
    
    const renderForgotPasswordForm = () => (
         <>
            <div className="text-center">
                <h2 id="auth-modal-title" className="text-2xl font-bold text-gray-800">{t('authModal.forgotPasswordTitle')}</h2>
                <p className="mt-2 text-gray-600">{t('authModal.forgotPasswordDescription')}</p>
            </div>
            <form onSubmit={handleForgotPassword} noValidate className="mt-6 text-left space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('authModal.emailLabel')}</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('authModal.emailPlaceholder')} required className="mt-1 input-field" />
                </div>
                {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                {successMessage && <p className="text-green-600 text-sm text-center">{successMessage}</p>}
                <button type="submit" className="w-full btn-primary">{t('authModal.forgotPasswordButton')}</button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
                <button onClick={() => switchMode('login')} className="font-semibold text-green-600 hover:underline">{t('authModal.backToLogin')}</button>
            </p>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <style>{`
                .input-field {
                    width: 100%;
                    background-color: #f9fafb;
                    border: 1px solid #d1d5db;
                    color: #111827;
                    font-size: 0.875rem;
                    border-radius: 0.5rem;
                    padding: 0.625rem;
                }
                .input-field:focus {
                    outline: none;
                    --tw-ring-color: #16a34a;
                    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
                    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
                    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
                    border-color: #16a34a;
                }
                .btn-primary {
                    width: 100%;
                    background-color: #16a34a;
                    color: white;
                    font-weight: 700;
                    padding-top: 0.625rem;
                    padding-bottom: 0.625rem;
                    border-radius: 0.5rem;
                    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
                    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                    transition-duration: 150ms;
                }
                .btn-primary:hover {
                    background-color: #15803d;
                }
            `}</style>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all relative">
                <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <CloseIcon className="w-5 h-5" />
                </button>
                <div className="p-8">
                    <div className="flex justify-center mb-4">
                        <RatelLogo className="w-16 h-16 text-green-600" />
                    </div>
                    {authMode === 'signup' && renderSignupForm()}
                    {authMode === 'login' && renderLoginForm()}
                    {authMode === 'forgotPassword' && renderForgotPasswordForm()}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;