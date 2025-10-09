import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatSession, UserProfile } from '../types';
import { 
    RatelLogo, EditIcon, TrashIcon, MenuIcon, ChevronLeftIcon, 
    ImageIcon, AudioIcon, VideoIcon, BookOpenIcon, BriefcaseIcon, 
    StorefrontIcon, UsersIcon, SettingsIcon, InfoIcon, UserIcon, LogoutIcon, AdminIcon
} from '../constants';
import { playSound } from '../services/audioService';
import AdBanner from './AdBanner';

interface SidebarProps {
  history: ChatSession[];
  currentChatId: string | null;
  userProfile: UserProfile;
  isCurrentChatEmpty: boolean;
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onClearChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onOpenImageStudio: () => void;
  onOpenAudioStudio: () => void;
  onOpenVideoStudio: () => void;
  onOpenHustleStudio: () => void;
  onOpenLearnStudio: () => void;
  onOpenMarketStudio: () => void;
  onOpenProfileStudio: () => void;
  onOpenProModal: () => void;
  setPage: (page: 'chat' | 'settings' | 'contact' | 'community' | 'admin') => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  history, currentChatId, userProfile, isCurrentChatEmpty, isOpenOnMobile, onCloseMobile,
  onNewChat, onSelectChat, onClearChat, onDeleteChat, onRenameChat,
  onOpenImageStudio, onOpenAudioStudio, onOpenVideoStudio, onOpenHustleStudio, onOpenLearnStudio, onOpenMarketStudio, onOpenProfileStudio, onOpenProModal,
  setPage, onLogout
}) => {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setRenameValue(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameChat(id, renameValue.trim());
    }
    setEditingId(null);
  };

  const handlePageChange = (page: 'settings' | 'contact' | 'community' | 'admin') => {
      playSound('click');
      setPage(page);
      onCloseMobile();
  }

  const filteredHistory = history.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const xpForNextLevel = userProfile.level * 100;
  const xpProgress = (userProfile.xp / xpForNextLevel) * 100;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-100 text-gray-800">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-2">
            <RatelLogo className="w-8 h-8 text-green-600" />
            <span className="font-bold text-xl">{t('common.ratelAI')}</span>
        </div>
        <button onClick={onCloseMobile} className="p-1 rounded-full hover:bg-gray-200 md:hidden">
            <ChevronLeftIcon className="w-6 h-6"/>
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button onClick={onNewChat} className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
          {t('sidebar.newChat')}
        </button>
      </div>
      
      {/* Studios */}
       <div className="px-4 py-2">
        <div className="grid grid-cols-3 gap-2">
            <StudioButton Icon={BriefcaseIcon} label={t('sidebar.hustleStudio')} onClick={onOpenHustleStudio} />
            <StudioButton Icon={BookOpenIcon} label={t('sidebar.learnStudio')} onClick={onOpenLearnStudio} />
            <StudioButton Icon={StorefrontIcon} label={t('sidebar.marketFinder')} onClick={onOpenMarketStudio} />
            <StudioButton Icon={ImageIcon} label={t('sidebar.imageStudio')} onClick={onOpenImageStudio} />
            <StudioButton Icon={AudioIcon} label={t('sidebar.audioStudio')} onClick={onOpenAudioStudio} />
            <StudioButton Icon={VideoIcon} label={t('sidebar.videoStudio')} onClick={onOpenVideoStudio} />
        </div>
      </div>


      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-4">
        <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 mt-4">{t('sidebar.history')}</h3>
         <input
            type="text"
            placeholder={t('sidebar.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-gray-200 border-transparent focus:ring-green-500 focus:border-green-500 rounded-md mb-2 px-3 py-1.5"
        />
        {filteredHistory.length > 0 ? (
          <ul className="space-y-1">
            {filteredHistory.map(chat => (
              <li key={chat.id} className="group">
                {editingId === chat.id ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleSaveRename(chat.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(chat.id)}
                    className="w-full p-2 text-sm rounded-md bg-white border border-green-500"
                    autoFocus
                  />
                ) : (
                  <div className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${currentChatId === chat.id ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}>
                    <span onClick={() => onSelectChat(chat.id)} className="truncate flex-1 text-sm">{chat.title}</span>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRename(chat.id, chat.title)} className="p-1 hover:text-green-700"><EditIcon className="w-4 h-4" /></button>
                      <button onClick={() => onDeleteChat(chat.id)} className="p-1 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 px-2">{t('sidebar.noHistory')}</p>
        )}
      </div>

      <div className="p-2">
        <AdBanner />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-semibold text-gray-700">{t('sidebar.level', {level: userProfile.level})}</span>
                <span className="font-mono text-gray-500">{userProfile.xp} / {xpForNextLevel} XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-green-600 h-1.5 rounded-full" style={{width: `${xpProgress}%`}}></div>
            </div>
        </div>
        <div className="flex items-center gap-3">
             <button onClick={onOpenProfileStudio} className="flex-1 flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-600"/>
                </div>
                <span className="font-semibold text-sm truncate">{userProfile.name}</span>
            </button>
            <div className="flex-shrink-0">
                <MenuButton 
                  userProfile={userProfile}
                  onPageChange={handlePageChange} 
                  onLogout={onLogout} 
                />
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 transition-transform transform ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
        <div className="w-72 h-full">
            {sidebarContent}
        </div>
      </div>
      {isOpenOnMobile && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={onCloseMobile}></div>}
    </>
  );
};

const StudioButton: React.FC<{Icon: React.FC<any>, label: string, onClick: () => void}> = ({ Icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
        <Icon className="w-5 h-5 text-gray-600"/>
        <span className="text-xs font-semibold text-gray-700">{label}</span>
    </button>
);


const MenuButton: React.FC<{ userProfile: UserProfile, onPageChange: (page: 'settings' | 'contact' | 'community' | 'admin') => void; onLogout: () => void; }> = ({ userProfile, onPageChange, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const ref = React.useRef<HTMLDivElement>(null);
  
   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);
  
  return (
      <div className="relative" ref={ref}>
        <button onClick={() => setIsOpen(p => !p)} className="p-2 rounded-full hover:bg-gray-200">
           <MenuIcon className="w-5 h-5"/>
        </button>
        {isOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-md shadow-lg border border-gray-200">
                {userProfile.isAdmin && (
                  <MenuItem Icon={AdminIcon} label="Admin Dashboard" onClick={() => onPageChange('admin')} />
                )}
                <MenuItem Icon={UsersIcon} label={t('sidebar.communityStudio')} onClick={() => onPageChange('community')} />
                <MenuItem Icon={SettingsIcon} label={t('sidebar.settings')} onClick={() => onPageChange('settings')} />
                <MenuItem Icon={InfoIcon} label={t('sidebar.contactUs')} onClick={() => onPageChange('contact')} />
                <div className="border-t border-gray-100 my-1"></div>
                <MenuItem Icon={LogoutIcon} label={t('sidebar.logout')} onClick={onLogout} isDestructive />
            </div>
        )}
      </div>
  )
}

const MenuItem: React.FC<{ Icon: React.FC<any>, label: string, onClick: () => void, isDestructive?: boolean }> = ({ Icon, label, onClick, isDestructive }) => (
    <button onClick={onClick} className={`w-full text-left flex items-center px-4 py-2 text-sm ${isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}>
        <Icon className={`w-4 h-4 mr-3 ${isDestructive ? 'text-red-500' : 'text-gray-500'}`} />
        <span>{label}</span>
    </button>
)

export default Sidebar;