import React from 'react';
import { useTranslation } from 'react-i18next';
import { RatelLogo } from '../constants';
import { playSound } from '../services/audioService';
import LanguageSwitcher from './LanguageSwitcher';
import { AppSettings } from '../types';

interface LandingPageProps {
  onStartChatting: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartChatting, settings, setSettings }) => {
  const { t } = useTranslation();

  const handleClick = () => {
    playSound('click');
    onStartChatting();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4" style={{ backgroundColor: '#0d1117' }}>
      <div className="absolute top-6 right-6">
        <LanguageSwitcher
          currentLang={settings.language}
          onChangeLang={(lang) => setSettings(prev => ({ ...prev, language: lang }))}
        />
      </div>
      <div className="text-center">
        <RatelLogo className="w-32 h-auto mx-auto mb-4 text-green-600" />

        <h1 className="text-6xl md:text-7xl font-bold mb-4">{t('landing.title')}</h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          {t('landing.subtitle')}
        </p>
        <button
          onClick={handleClick}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105"
        >
          {t('landing.startChatting')}
        </button>
      </div>
      <footer className="absolute bottom-6 text-gray-400 text-sm">
        {t('landing.footer')}
      </footer>
    </div>
  );
};

export default LandingPage;