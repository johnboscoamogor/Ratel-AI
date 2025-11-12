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
  connectionError?: string | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartChatting, settings, setSettings, connectionError }) => {
  const { t } = useTranslation();

  const handleClick = () => {
    playSound('click');
    onStartChatting();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4" style={{ backgroundColor: '#0d1117' }}>
      {connectionError && (() => {
          const parts = connectionError.split('---COMPARE---');
          if (parts.length === 3) {
              return (
                  <div className="absolute top-0 left-0 right-0 bg-red-800/90 border-b border-red-600 p-3 text-center text-white text-sm shadow-lg z-10">
                      <p className="font-bold text-base">Connection Error</p>
                      <div className="max-w-2xl mx-auto text-left px-2 py-2">
                          <p className="whitespace-pre-wrap">{parts[0]}</p>
                          <div className="my-2 p-3 bg-red-900/50 rounded-md border border-red-500">
                              <p className="text-xs text-red-200 font-semibold">URL YOUR APP IS USING (FROM VERCEL):</p>
                              <p className="font-mono text-base break-all mt-1">{parts[1].trim()}</p>
                          </div>
                          <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: parts[2].replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-300">$1</strong>') }} />
                      </div>
                  </div>
              );
          }
          // Fallback for other errors that don't use the special format
          return (
              <div className="absolute top-0 left-0 right-0 bg-red-800/90 border-b border-red-600 p-3 text-center text-white text-sm shadow-lg z-10">
                  <p className="font-bold">Connection Error</p>
                  <p className="max-w-xl mx-auto whitespace-pre-wrap text-left px-2">{connectionError}</p>
              </div>
          );
      })()}
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
