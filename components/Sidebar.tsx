import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatSession, UserProfile } from '../types';
import { RatelLogo, TrashIcon, ImageIcon, AudioIcon, VideoIcon, SettingsIcon, LogoutIcon, InfoIcon, MoreVerticalIcon, EditIcon, StarIcon, UserIcon, BriefcaseIcon, BookOpenIcon, UsersIcon, AwardIcon, StorefrontIcon } from '../constants';
import { playSound } from '../services/audioService';
import AdBanner from './AdBanner';

interface SidebarProps {
  onNewChat: () => void;
  history: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onClearChat: () => void;
  isCurrentChatEmpty: boolean;
  userProfile: UserProfile;
  setPage: (page: 'settings' | 'contact' | 'community') => void;
  onLogout: () => void;
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  onOpenProModal: () => void;
  onOpenImageStudio: () => void;
  onOpenAudioStudio: () => void;
  onOpenVideoStudio: () => void;
  onOpenHustleStudio: () => void;
  onOpenLearnStudio: () => void;
  onOpenMarketStudio: () => void;
  onOpenProfileStudio: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    onNewChat, 
    history, 
    currentChatId, 
    onSelectChat, 
    onClearChat, 
    isCurrentChatEmpty,
    userProfile,
    setPage,
    onLogout,
    isOpenOnMobile,
    onCloseMobile,
    onRenameChat,
    onDeleteChat,
    onOpenProModal,
    onOpenImageStudio,
    onOpenAudioStudio,
    onOpenVideoStudio,
    onOpenHustleStudio,
    onOpenLearnStudio,
    onOpenMarketStudio,
    onOpenProfileStudio,
}) => {
  const { t } = useTranslation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  const handleButtonClick = (action: () => void) => {
    playSound('click');
    action();
  }
  
  const toggleUserMenu = () => {
    playSound('click');
    setIsUserMenuOpen(prev => !prev);
  }
  
  const handleRename = (chat: ChatSession) => {
    setActiveChatMenu(null);
    setRenameValue(chat.title);
    setRenamingChatId(chat.id);
  }
  
  const submitRename = () => {
    if (renamingChatId && renameValue.trim()) {
      onRenameChat(renamingChatId, renameValue.trim());
    }
    setRenamingChatId(null);
  }

  useEffect(() => {
    if (renamingChatId && renameInputRef.current) {
        renameInputRef.current.focus();
    }
  }, [renamingChatId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target as Node)) {
        setActiveChatMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredHistory = history.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const xpForNextLevel = userProfile.level * 100;
  const xpProgress = (userProfile.xp / xpForNextLevel) * 100;

  return (
    <>
    {isOpenOnMobile && <div onClick={onCloseMobile} className="fixed inset-0 bg-black/40 z-20 md:hidden"></div>}

    <aside className={`flex flex-col w-72 bg-white p-4 border-r border-gray-200 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 mb-6">
        <RatelLogo className="w-8 h-8 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-800">{t('common.ratelAI')}</h1>
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <button
          onClick={() => handleButtonClick(onNewChat)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {t('sidebar.newChat')}
        </button>
         <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleButtonClick(onOpenHustleStudio)} className="sidebar-studio-button" aria-label={t('sidebar.hustleStudio')}><BriefcaseIcon className="w-4 h-4" /><span>{t('sidebar.hustleStudio')}</span></button>
            <button onClick={() => handleButtonClick(onOpenLearnStudio)} className="sidebar-studio-button" aria-label={t('sidebar.learnStudio')}><BookOpenIcon className="w-4 h-4" /><span>{t('sidebar.learnStudio')}</span></button>
            <button onClick={() => handleButtonClick(() => setPage('community'))} className="sidebar-studio-button" aria-label={t('sidebar.communityStudio')}><UsersIcon className="w-4 h-4" /><span>{t('sidebar.communityStudio')}</span></button>
            <button onClick={() => handleButtonClick(onOpenMarketStudio)} className="sidebar-studio-button" aria-label={t('sidebar.marketFinder')}><StorefrontIcon className="w-4 h-4" /><span>{t('sidebar.marketFinder')}</span></button>
        </div>
         <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleButtonClick(onOpenImageStudio)} className="sidebar-studio-button" aria-label={t('sidebar.imageStudio')}><ImageIcon className="w-4 h-4" /><span>{t('sidebar.imageStudio')}</span></button>
            <button onClick={() => handleButtonClick(onOpenAudioStudio)} className="sidebar-studio-button" aria-label={t('sidebar.audioStudio')}><AudioIcon className="w-4 h-4" /><span>{t('sidebar.audioStudio')}</span></button>
            <button onClick={() => handleButtonClick(onOpenVideoStudio)} className="sidebar-studio-button" aria-label={t('sidebar.videoStudio')}><VideoIcon className="w-4 h-4" /><span>{t('sidebar.videoStudio')}</span></button>
        </div>
        <style>{`.sidebar-studio-button { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; background-color: #f3f4f6; font-weight: 600; padding: 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s; font-size: 0.75rem; color: #374151; } .sidebar-studio-button:hover { background-color: #e5e7eb; }`}</style>
      </div>
      
       <div className="mt-4 flex-1 flex flex-col min-h-0">
         <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">{t('sidebar.history')}</h2>
         <div className="mb-2">
            <input type="text" placeholder={t('sidebar.search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-100 border-gray-200 rounded-md py-1.5 px-3 text-sm focus:ring-green-500 focus:border-green-500" />
         </div>
        <div className="flex-1 overflow-y-auto -mr-2 pr-2">
            {filteredHistory.length > 0 ? (
                <nav className="space-y-1">
                    {filteredHistory.map(chat => (
                    <div key={chat.id} className="group relative">
                        {renamingChatId === chat.id ? (
                            <input
                                ref={renameInputRef}
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={submitRename}
                                onKeyDown={(e) => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenamingChatId(null); }}
                                className="w-full text-left px-2 py-2 text-sm rounded-md truncate bg-white border border-green-500 focus:outline-none"
                            />
                        ) : (
                            <button
                                onClick={() => handleButtonClick(() => onSelectChat(chat.id))}
                                className={`w-full text-left px-2 py-2 text-sm rounded-md truncate transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                currentChatId === chat.id ? 'bg-green-100 text-green-800 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                {chat.title}
                            </button>
                        )}
                        {renamingChatId !== chat.id && (
                             <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                <button onClick={() => setActiveChatMenu(chat.id)} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVerticalIcon className="w-4 h-4" />
                                </button>
                                {activeChatMenu === chat.id && (
                                    <div ref={chatMenuRef} className="absolute right-0 top-full mt-1 w-32 bg-white border rounded-md shadow-lg z-10">
                                        <button onClick={() => handleRename(chat)} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"><EditIcon className="w-4 h-4" /> {t('sidebar.rename')}</button>
                                        <button onClick={() => { onDeleteChat(chat.id); setActiveChatMenu(null); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"><TrashIcon className="w-4 h-4" /> {t('sidebar.delete')}</button>
                                    </div>
                                )}
                             </div>
                        )}
                    </div>
                    ))}
                </nav>
            ) : (
                <p className="text-sm text-gray-500 px-2">{t('sidebar.noHistory')}</p>
            )}
        </div>
      </div>
      
      <div className="mt-4">
        <AdBanner />
      </div>

      <div className="relative" ref={userMenuRef}>
        {isUserMenuOpen && (
            <div className="absolute bottom-full mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <ul className="py-1">
                    <li><button onClick={() => handleButtonClick(onOpenProModal)} className="w-full text-left px-4 py-2 text-sm font-semibold text-green-700 hover:bg-gray-100 flex items-center gap-2"><StarIcon className="w-4 h-4" /> {t('sidebar.upgradeToPro')}</button></li>
                    <li><button onClick={() => handleButtonClick(() => setPage('settings'))} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><SettingsIcon className="w-4 h-4" /> {t('sidebar.settings')}</button></li>
                    <li><button onClick={() => handleButtonClick(() => setPage('contact'))} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><InfoIcon className="w-4 h-4" /> {t('sidebar.contactUs')}</button></li>
                    <li><button onClick={() => handleButtonClick(onClearChat)} disabled={isCurrentChatEmpty} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"><TrashIcon className="w-4 h-4" /> {t('sidebar.clearChat')}</button></li>
                    <li><button onClick={() => handleButtonClick(onLogout)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogoutIcon className="w-4 h-4" /> {t('sidebar.logout')}</button></li>
                </ul>
            </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
             <div className="px-2 mb-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-green-700 flex items-center gap-1"><AwardIcon className="w-4 h-4" /> {t('sidebar.level', { level: userProfile.level })}</span>
                    <span className="text-xs font-semibold text-gray-600">{userProfile.xp} / {xpForNextLevel} {t('sidebar.xp')}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${xpProgress}%` }}></div>
                </div>
            </div>
            <button onClick={() => { handleButtonClick(onOpenProfileStudio); setIsUserMenuOpen(false); }} className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                </div>
                <span className="font-semibold text-gray-800 flex-1 text-left truncate">{userProfile.name}</span>
                <button onClick={(e) => { e.stopPropagation(); toggleUserMenu();}} className="p-1 rounded-full hover:bg-gray-200">
                    <SettingsIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                </button>
            </button>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
