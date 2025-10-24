import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
// FIX: Import NigeriaFlagIcon to support the 'ng' language option.
import { UKFlagIcon, FranceFlagIcon, EthiopiaFlagIcon, TanzaniaFlagIcon, NigeriaFlagIcon } from '../constants';
import { playSound } from '../services/audioService';
import { AppSettings } from '../types';

interface LanguageSwitcherProps {
    currentLang: AppSettings['language'];
    onChangeLang: (lang: AppSettings['language']) => void;
}

const languages = {
    en: { name: 'English', Flag: UKFlagIcon },
    fr: { name: 'Français', Flag: FranceFlagIcon },
    am: { name: 'አማርኛ', Flag: EthiopiaFlagIcon },
    sw: { name: 'Kiswahili', Flag: TanzaniaFlagIcon },
    // FIX: Add Nigerian Pidgin ('ng') to the list of available languages.
    ng: { name: 'Pidgin', Flag: NigeriaFlagIcon },
};

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, onChangeLang }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageSelect = (lang: AppSettings['language']) => {
        playSound('click');
        onChangeLang(lang);
        i18n.changeLanguage(lang);
        setIsOpen(false);
    };

    // FIX: Add a fallback to 'en' if the current language from settings is invalid or doesn't exist in the languages map.
    // This prevents a crash if localStorage contains an outdated or corrupted language code.
    const currentLanguageData = languages[currentLang] || languages['en'];
    const CurrentFlag = currentLanguageData.Flag;


    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => { playSound('click'); setIsOpen(!isOpen); }}
                className="flex items-center justify-center w-10 h-10 bg-gray-700 rounded-full shadow-md hover:bg-gray-600 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-all duration-200"
                aria-label="Change language"
            >
                <CurrentFlag className="w-6 h-6 rounded-full object-cover" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg border border-gray-600 origin-top-right z-30">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {(Object.keys(languages) as Array<keyof typeof languages>).map((code) => {
                           const { name, Flag } = languages[code];
                           return (
                            <button
                                key={code}
                                onClick={() => handleLanguageSelect(code)}
                                className={`w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 ${
                                    currentLang === code ? 'font-bold' : ''
                                }`}
                                role="menuitem"
                            >
                                <Flag className="w-5 h-5 mr-3 rounded-sm object-cover" />
                                <span>{name}</span>
                            </button>
                           )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
