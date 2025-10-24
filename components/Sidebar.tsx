import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatSession, UserProfile } from '../types';
import { 
    RatelLogo, EditIcon, TrashIcon, MenuIcon, ChevronLeftIcon, 
    ImageIcon, AudioIcon, BookOpenIcon, BriefcaseIcon, 
    StorefrontIcon, UsersIcon, SettingsIcon, InfoIcon, UserIcon, LogoutIcon, AdminIcon,
    SparklesIcon, WrenchIcon
} from '../constants';
import { playSound } from '../services/audioService';
import ConfirmationDialog from './ConfirmationDialog';

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
  onOpenHustleStudio: () => void;
  onOpenLearnStudio: () => void;
  onOpenMarketSquare: () => void;
  onOpenMobileWorkersStudio: () => void;
  onOpenProfileStudio: () => void;
  onOpenProModal: () => void;
  onOpenExamplesStudio: () => void;
  setPage: (page: 'chat' | 'settings' | 'contact' | 'community' | 'admin' | 'examples') => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  history, currentChatId, userProfile, isCurrentChatEmpty, isOpenOnMobile, onCloseMobile,
  onNewChat, onSelectChat, onClearChat, onDeleteChat, onRenameChat,
  onOpenImageStudio, onOpenAudioStudio, onOpenHustleStudio, onOpenLearnStudio, onOpenMarketSquare, onOpenMobileWorkersStudio, onOpenProfileStudio, onOpenProModal, onOpenExamplesStudio,
  setPage, onLogout
}) => {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

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

  const handleDeleteRequest = (id: string) => {
    setChatToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (chatToDelete) {
      onDeleteChat(chatToDelete);
    }
    setChatToDelete(null);
  };

  const handleCloseDialog = () => {
    setChatToDelete(null);
  };

  const handlePageChange = (page: 'settings' | 'contact' | 'community' | 'admin') => {
      playSound('click');
      setPage(page);
      onCloseMobile();
  }

  const filteredHistory = history.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-800 text-gray-200">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center gap-2">
              <RatelLogo className="w-8 h-8 text-green-500" />
              <span className="font-bold text-xl">{t('common.ratelAI')}</span>
          </div>
          <button onClick={onCloseMobile} className="p-1 rounded-full hover:bg-gray-700 md:hidden">
              <ChevronLeftIcon className="w-6 h-6"/>
          </button>
      </div>


      {/* --- SCROLLABLE SECTION --- */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {/* Studios */}
        <div>
          <button onClick={onOpenExamplesStudio} className="w-full flex items-center justify-center gap-2 mb-2 p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors font-semibold text-sm">
            <SparklesIcon className="w-4 h-4" />
            <span>Prompt Examples</span>
          </button>
          <div className="grid grid-cols-4 gap-2">
              <StudioButton Icon={BriefcaseIcon} label={t('sidebar.hustleStudio')} onClick={onOpenHustleStudio} />
              <StudioButton Icon={BookOpenIcon} label={t('sidebar.learnStudio')} onClick={onOpenLearnStudio} />
              <StudioButton Icon={StorefrontIcon} label={t('sidebar.marketSquare')} onClick={onOpenMarketSquare} />
              <StudioButton Icon={WrenchIcon} label={t('sidebar.mobileWorkers')} onClick={onOpenMobileWorkersStudio} />
              <StudioButton Icon={UsersIcon} label={t('sidebar.communityStudio')} onClick={() => handlePageChange('community')} />
              <StudioButton Icon={ImageIcon} label={t('sidebar.imageStudio')} onClick={onOpenImageStudio} />
              <StudioButton Icon={AudioIcon} label={t('sidebar.audioStudio')} onClick={onOpenAudioStudio} />
          </div>
        </div>

        {/* Chat History */}
        <div>
           {/* New Chat Button */}
          <div className="mb-4">
            <button onClick={onNewChat} className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
              {t('sidebar.newChat')}
            </button>
          </div>
          <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">{t('sidebar.history')}</h3>
          <input
              type="text"
              placeholder={t('sidebar.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm bg-gray-700 border-transparent focus:ring-green-500 focus:border-green-500 rounded-md mb-2 px-3 py-1.5 text-white"
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
                      className="w-full p-2 text-sm rounded-md bg-gray-900 border border-green-500 text-white"
                      autoFocus
                    />
                  ) : (
                    <div className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${currentChatId === chat.id ? 'bg-green-600/20 text-white' : 'hover:bg-gray-700'}`}>
                      <span onClick={() => onSelectChat(chat.id)} className="truncate flex-1 text-sm">{chat.title}</span>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleRename(chat.id, chat.title)} className="p-1 hover:text-green-400"><EditIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteRequest(chat.id)} className="p-1 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 px-2">{t('sidebar.noHistory')}</p>
          )}
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

      <ConfirmationDialog
        isOpen={!!chatToDelete}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        title={t('sidebar.deleteChatTitle')}
        message={t('sidebar.deleteChatMessage')}
        confirmText={t('sidebar.deleteButton')}
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
      />
    </>
  );
};

const StudioButton: React.FC<{Icon: React.FC<any>, label: string, onClick: () => void}> = ({ Icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <Icon className="w-5 h-5 text-gray-300"/>
        <span className="text-xs font-semibold text-gray-200 text-center leading-tight">{label}</span>
    </button>
);

export default Sidebar;
