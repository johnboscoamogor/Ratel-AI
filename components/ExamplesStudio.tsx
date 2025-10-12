import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
// FIX: Replaced non-existent `LightbulbIcon` with `SparklesIcon` to represent ideas and examples.
import { CloseIcon, SparklesIcon, BriefcaseIcon, BookOpenIcon, ImageIcon, ClapperboardIcon } from '../constants';
import { playSound } from '../services/audioService';

interface ExamplesStudioProps {
  onClose: () => void;
  onSelectExample: (prompt: string) => void;
}

type ExampleTab = 'hustle' | 'learn' | 'image' | 'story';

const ExamplesStudio: React.FC<ExamplesStudioProps> = ({ onClose, onSelectExample }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ExampleTab>('hustle');

    const examples: Record<ExampleTab, { icon: React.FC<any>; prompts: string[] }> = {
        hustle: {
            icon: BriefcaseIcon,
            prompts: t('examplesStudio.hustlePrompts', { returnObjects: true }) as string[]
        },
        learn: {
            icon: BookOpenIcon,
            prompts: t('examplesStudio.learnPrompts', { returnObjects: true }) as string[]
        },
        image: {
            icon: ImageIcon,
            prompts: t('examplesStudio.imagePrompts', { returnObjects: true }) as string[]
        },
        story: {
            icon: ClapperboardIcon,
            prompts: t('examplesStudio.storyPrompts', { returnObjects: true }) as string[]
        }
    };
    
    const handleTryIt = (prompt: string) => {
        playSound('click');
        onSelectExample(prompt);
    };

    const TabButton: React.FC<{ tab: ExampleTab; label: string; Icon: React.FC<any> }> = ({ tab, label, Icon }) => (
        <button
            onClick={() => { playSound('click'); setActiveTab(tab); }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === tab ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            <Icon className="w-5 h-5 mb-1" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all h-[90vh] flex flex-col">
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-green-600" />
                        {t('examplesStudio.title')}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="flex-shrink-0 p-3 text-center border-b">
                     <p className="text-sm text-gray-600">{t('examplesStudio.description')}</p>
                </div>

                <nav className="flex-shrink-0 p-3 border-b border-gray-200 flex gap-2">
                    <TabButton tab="hustle" label={t('examplesStudio.tabs.hustle')} Icon={BriefcaseIcon} />
                    <TabButton tab="learn" label={t('examplesStudio.tabs.learn')} Icon={BookOpenIcon} />
                    <TabButton tab="image" label={t('examplesStudio.tabs.image')} Icon={ImageIcon} />
                    <TabButton tab="story" label={t('examplesStudio.tabs.story')} Icon={ClapperboardIcon} />
                </nav>

                <main className="flex-grow overflow-y-auto p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {examples[activeTab].prompts.map((prompt, index) => (
                            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col justify-between">
                                <p className="text-sm text-gray-700 mb-2">"{prompt}"</p>
                                <button
                                    onClick={() => handleTryIt(prompt)}
                                    className="self-end bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-green-700 transition-colors"
                                >
                                    Try it
                                </button>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ExamplesStudio;