import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppSettings } from '../types';
import { ChevronLeftIcon, RatelLogo, LogoutIcon, UploadIcon, TrashIcon } from '../constants';
import ToggleSwitch from './ToggleSwitch';
import { getAvailableVoices, VoiceOption, playSound } from '../services/audioService';

interface SettingsPageProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onBack: () => void;
  onLogout: () => void;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const predefinedBackgrounds = [
    { id: 'abstract', url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=800&auto=format&fit=crop' },
    { id: 'mountain', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop' },
    { id: 'floral', url: 'https://images.unsplash.com/photo-1488330890490-c291ecf62571?q=80&w=800&auto=format&fit=crop' },
    { id: 'beach', url: 'https://images.unsplash.com/photo-1507525428034-b723a996f6ea?q=80&w=800&auto=format&fit=crop' },
];


const SettingsPage: React.FC<SettingsPageProps> = ({ settings, setSettings, onBack, onLogout }) => {
  const { t } = useTranslation();
  
  const availableVoices = React.useMemo(() => {
    const voices = getAvailableVoices();
    return voices.reduce((acc, voice) => {
      // FIX: Changed comparison from 'gemini' to 'gcp' to match the VoiceOption type.
      const group = voice.type === 'gcp' ? t('voiceGroups.premium') : t('voiceGroups.standard');
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(voice);
      return acc;
    }, {} as {[key: string]: VoiceOption[]});
  }, [t]);

  const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleCustomInstructionChange = (field: keyof AppSettings['customInstructions'], value: string) => {
    handleSettingChange('customInstructions', { ...settings.customInstructions, [field]: value });
  };
  
  const handleAppearanceChange = (field: keyof AppSettings['appearance'], value: string) => {
    handleSettingChange('appearance', { ...settings.appearance, [field]: value });
  };

  const handleMemoryChange = (field: keyof AppSettings['memory'], value: boolean) => {
    handleSettingChange('memory', { ...settings.memory, [field]: value });
  };
  
  const handleSecurityChange = (field: keyof AppSettings['security'], value: boolean) => {
    handleSettingChange('security', { ...settings.security, [field]: value });
  };

  const handleNotificationsChange = (field: keyof AppSettings['notifications'], value: boolean) => {
    handleSettingChange('notifications', { ...settings.notifications, [field]: value });
  };
  
  const handleBackClick = () => {
    playSound('click');
    onBack();
  }

  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            handleAppearanceChange('backgroundImage', reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="flex items-center mb-8">
        <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-gray-200 mr-4">
          <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
        </button>
        <RatelLogo className="w-8 h-8 text-green-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
      </header>

      <main>
        <SettingsSection title={t('settings.appearance.title')}>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.galleryLabel')}</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {predefinedBackgrounds.map(bg => (
                        <button key={bg.id} onClick={() => handleAppearanceChange('backgroundImage', bg.url)} className={`relative rounded-lg overflow-hidden h-24 focus:outline-none ring-offset-2 ring-green-500 focus:ring-2 ${settings.appearance?.backgroundImage === bg.url ? 'ring-2' : ''}`}>
                            <img src={bg.url} alt={bg.id} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 hover:bg-black/40 transition-colors"></div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <input type="file" id="bg-upload" className="hidden" accept="image/*" onChange={handleBackgroundImageUpload} />
                <label htmlFor="bg-upload" className="flex-1 cursor-pointer text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <UploadIcon className="w-5 h-5"/>
                    <span>{t('settings.appearance.uploadButton')}</span>
                </label>
                <button onClick={() => handleAppearanceChange('backgroundImage', '')} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2" disabled={!settings.appearance?.backgroundImage}>
                    <TrashIcon className="w-5 h-5"/>
                    <span>{t('settings.appearance.removeButton')}</span>
                </button>
            </div>
        </SettingsSection>
        <SettingsSection title={t('settings.language.title')}>
          <div>
            <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.language.label')}
            </label>
            <select
              id="language-select"
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value as 'en' | 'fr' | 'am' | 'ng' | 'sw')}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
            >
              <option value="en">{t('settings.language.en')}</option>
              <option value="ng">{t('settings.language.ng')}</option>
              <option value="sw">{t('settings.language.sw')}</option>
              <option value="fr">{t('settings.language.fr')}</option>
              <option value="am">{t('settings.language.am')}</option>
            </select>
          </div>
        </SettingsSection>

        <SettingsSection title={t('settings.customInstructions.title')}>
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">{t('settings.customInstructions.nicknameLabel')}</label>
            <input
              type="text"
              id="nickname"
              value={settings.customInstructions.nickname}
              onChange={e => handleCustomInstructionChange('nickname', e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
              placeholder={t('settings.customInstructions.nicknamePlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="aboutYou" className="block text-sm font-medium text-gray-700 mb-1">{t('settings.customInstructions.aboutYouLabel')}</label>
            <textarea
              id="aboutYou"
              rows={4}
              value={settings.customInstructions.aboutYou}
              onChange={e => handleCustomInstructionChange('aboutYou', e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
              placeholder={t('settings.customInstructions.aboutYouPlaceholder')}
            />
          </div>
           <div>
            <label htmlFor="expectations" className="block text-sm font-medium text-gray-700 mb-1">{t('settings.customInstructions.expectationsLabel')}</label>
            <textarea
              id="expectations"
              rows={4}
              value={settings.customInstructions.expectations}
              onChange={e => handleCustomInstructionChange('expectations', e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
              placeholder={t('settings.customInstructions.expectationsPlaceholder')}
            />
          </div>
        </SettingsSection>
        
        <SettingsSection title={t('settings.memory.title')}>
            <ToggleSwitch
                id="ref-memories"
                label={t('settings.memory.savedMemories')}
                checked={settings.memory.referenceSavedMemories}
                onChange={checked => handleMemoryChange('referenceSavedMemories', checked)}
            />
            <ToggleSwitch
                id="ref-history"
                label={t('settings.memory.chatHistory')}
                checked={settings.memory.referenceChatHistory}
                onChange={checked => handleMemoryChange('referenceChatHistory', checked)}
            />
        </SettingsSection>

        <SettingsSection title={t('settings.responses.title')}>
          <div>
            <label htmlFor="voice-preference" className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.responses.voicePreference')}
            </label>
            <select
              id="voice-preference"
              value={settings.voice.selectedVoice}
              onChange={(e) => handleSettingChange('voice', { selectedVoice: e.target.value })}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
            >
              {Object.entries(availableVoices).map(([group, voices]: [string, VoiceOption[]]) => (
                <optgroup label={group} key={group}>
                  {voices.map(voice => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </SettingsSection>
        
        <SettingsSection title={t('settings.notifications.title')}>
           <ToggleSwitch
                id="push-notifications"
                label={t('settings.notifications.pushLabel')}
                description={t('settings.notifications.pushDescription')}
                checked={settings.notifications.pushEnabled}
                onChange={checked => handleNotificationsChange('pushEnabled', checked)}
            />
            <ToggleSwitch
                id="mfa"
                label={t('settings.notifications.mfaLabel')}
                description={t('settings.notifications.mfaDescription')}
                checked={settings.security.mfaEnabled}
                onChange={checked => handleSecurityChange('mfaEnabled', checked)}
            />
        </SettingsSection>

        <div className="mt-8 text-center">
            <button onClick={onLogout} className="flex items-center justify-center gap-2 mx-auto text-red-600 font-semibold py-2 px-4 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                <LogoutIcon className="w-5 h-5" />
                <span>{t('settings.logout')}</span>
            </button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
