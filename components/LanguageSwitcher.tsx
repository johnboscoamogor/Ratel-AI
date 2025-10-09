import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeIcon, UKFlagIcon, FranceFlagIcon, EthiopiaFlagIcon } from '../constants';
import { playSound } from '../services/audioService';

interface LanguageSwitcherProps {
    currentLang: 'en' | 'fr' | 'am';
    onChangeLang: (lang: 'en' | 'fr' | 'am') => void;
}

const languages = {
    en: { name: 'English', Flag: UKFlagIcon },
    fr: { name: 'Français', Flag: FranceFlagIcon },
    am: { name: 'አማርኛ', Flag: EthiopiaFlagIcon },
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

    const handleLanguageSelect = (lang: 'en' | 'fr' | 'am') => {
        playSound('click');
        onChangeLang(lang);
        i18n.changeLanguage(lang);
        setIsOpen(false);
    };

    const CurrentFlag = languages[currentLang].Flag;

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => { playSound('click'); setIsOpen(!isOpen); }}
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:bg-gray-100 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                aria-label="Change language"
            >
                <CurrentFlag className="w-6 h-6 rounded-full" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 origin-top-right">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {Object.entries(languages).map(([code, { name, Flag }]) => (
                            <button
                                key={code}
                                onClick={() => handleLanguageSelect(code as 'en' | 'fr' | 'am')}
                                className={`w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                                    currentLang === code ? 'font-bold' : ''
                                }`}
                                role="menuitem"
                            >
                                <Flag className="w-5 h-5 mr-3 rounded-sm" />
                                <span>{name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;