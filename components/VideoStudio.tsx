import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { playSound } from '../services/audioService';
import { RatelLogo, UserIcon } from '../constants';

const publicAvatars = [
  { id: 'prof1', category: 'Profession', src: 'https://images.pexels.com/photos/1844033/pexels-photo-1844033.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 'ugc1', category: 'UGC', src: 'https://images.pexels.com/photos/3875223/pexels-photo-3875223.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 'ugc2', category: 'UGC', src: 'https://images.pexels.com/photos/3779760/pexels-photo-3779760.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 'prof2', category: 'Profession', src: 'https://images.pexels.com/photos/5668791/pexels-photo-5668791.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 'art1', category: 'Art', src: 'https://images.pexels.com/photos/3054972/pexels-photo-3054972.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 'photo1', category: 'Photography', src: 'https://images.pexels.com/photos/4239118/pexels-photo-4239118.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 'ugc3', category: 'UGC', src: 'https://images.pexels.com/photos/5207262/pexels-photo-5207262.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 'photo2', category: 'Photography', src: 'https://images.pexels.com/photos/2776675/pexels-photo-2776675.jpeg?auto=compress&cs=tinysrgb&w=400' },
];

const categories = ['All', 'UGC', 'Profession', 'Art', 'Photography'];

interface CreativeDashboardProps {
  onClose: () => void;
  onGenerate: (photo: { data: string; mimeType: string }, options: { script?: string; audio?: { data: string; mimeType: string } }) => void;
  isLoading: boolean;
  userProfile: UserProfile;
}

const CreativeDashboard: React.FC<CreativeDashboardProps> = ({ onClose, onGenerate, isLoading, userProfile }) => {
    const { t } = useTranslation();
    const [selectedAvatar, setSelectedAvatar] = useState<{ type: 'url' | 'base64', src: string, mimeType?: string } | null>(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [script, setScript] = useState('');
    const [activeTab, setActiveTab] = useState<'script' | 'upload-audio'>('script');
    const [audioFile, setAudioFile] = useState<File | null>(null);

    const avatarFileInputRef = useRef<HTMLInputElement>(null);
    const audioFileInputRef = useRef<HTMLInputElement>(null);

    const filteredAvatars = activeCategory === 'All'
        ? publicAvatars
        : publicAvatars.filter(avatar => avatar.category === activeCategory);

    const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setSelectedAvatar({ type: 'base64', src: base64String, mimeType: file.type });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            setAudioFile(file);
        } else {
            setAudioFile(null);
            alert('Please select a valid audio file (e.g., MP3, WAV).');
        }
    };

    const handleGenerate = async () => {
        if (!selectedAvatar) {
            alert('Please select an avatar.');
            return;
        }
        if (isLoading) return;

        playSound('click');

        let photoData: { data: string; mimeType: string };

        if (selectedAvatar.type === 'base64') {
            photoData = { data: selectedAvatar.src, mimeType: selectedAvatar.mimeType || 'image/jpeg' };
        } else { // type is 'url'
            try {
                const response = await fetch(selectedAvatar.src);
                if (!response.ok) throw new Error('Network response was not ok.');
                const blob = await response.blob();
                const base64data = await new Promise<string>((resolve, reject) => {
                     const reader = new FileReader();
                     reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                     reader.onerror = reject;
                     reader.readAsDataURL(blob);
                });
                photoData = { data: base64data, mimeType: blob.type };
            } catch (error) {
                console.error("Error fetching public avatar:", error);
                alert("Error fetching avatar image. Please try again.");
                return;
            }
        }
        
        if (activeTab === 'script') {
            if (!script.trim()) {
                alert('Please enter a script.');
                return;
            }
            onGenerate(photoData, { script });
        } else { // 'upload-audio'
            if (!audioFile) {
                alert('Please import an audio file.');
                return;
            }
            const audioBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(audioFile);
            });
            onGenerate(photoData, { audio: { data: audioBase64, mimeType: audioFile.type } });
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 text-white z-40 flex animate-fade-in font-sans">
            <header className="absolute top-0 left-0 p-4 flex items-center gap-2">
                 <RatelLogo className="w-8 h-8 text-green-500" />
                 <span className="font-bold text-xl">{t('videoStudio.title')}</span>
            </header>
            
            <div className="flex w-full h-full pt-16">
                {/* Left Panel */}
                <aside className="w-[450px] flex-shrink-0 h-full overflow-y-auto p-6 border-r border-gray-700 space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold mb-3">{t('videoStudio.myAvatar')}</h2>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                ref={avatarFileInputRef}
                                className="hidden"
                                onChange={handleAvatarFileChange}
                                accept="image/png, image/jpeg"
                            />
                            <button
                                onClick={() => avatarFileInputRef.current?.click()}
                                className="w-32 h-40 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                <span className="text-sm mt-2">{t('videoStudio.createAvatar')}</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-lg font-semibold">{t('videoStudio.publicAvatars')}</h2>
                             <button className="text-sm flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                {t('videoStudio.favoriteAvatars')}
                             </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-3 py-1 text-sm font-medium rounded-full border transition-colors ${activeCategory === cat ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}
                                >
                                    {t(`videoStudio.${cat.toLowerCase()}` as any)}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {filteredAvatars.map(avatar => (
                                <button key={avatar.id} onClick={() => setSelectedAvatar({ type: 'url', src: avatar.src })} className={`relative aspect-square rounded-lg overflow-hidden focus:outline-none ring-offset-2 ring-offset-gray-900 ring-green-500 ${selectedAvatar?.src === avatar.src ? 'ring-2' : ''}`}>
                                    <img src={avatar.src} alt={avatar.category} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40"></div>
                                </button>
                            ))}
                             {selectedAvatar?.type === 'base64' && (
                                <div className={`relative aspect-square rounded-lg overflow-hidden ring-2 ring-green-500`}>
                                     <img src={`data:${selectedAvatar.mimeType};base64,${selectedAvatar.src}`} alt="Uploaded avatar" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Right Panel */}
                <main className="flex-1 h-full flex flex-col p-6">
                    <header className="flex justify-between items-center mb-6">
                        <div>
                            <span className="text-sm font-semibold text-gray-400">{t('videoStudio.mode')}</span>
                            <p className="font-semibold">{t('videoStudio.modeName')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                             <button onClick={onClose} className="text-gray-300 hover:text-white font-semibold text-sm">
                                &larr; Back to Chat
                            </button>
                            <div className="flex items-center gap-2 p-1.5 rounded-full bg-gray-800">
                                <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-gray-300"/>
                                </div>
                                <span className="font-semibold text-sm text-white pr-2 truncate">{userProfile.name}</span>
                            </div>
                        </div>
                    </header>
                    <div className="flex-grow flex flex-col">
                         <div className="flex gap-2 mb-4">
                            <button
                                key="script"
                                onClick={() => setActiveTab('script')}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'script' ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}
                            >
                                {t('videoStudio.tabScript')}
                            </button>
                             <button
                                key="upload-audio"
                                onClick={() => setActiveTab('upload-audio')}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'upload-audio' ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}
                            >
                                {t('videoStudio.tabUploadAudio')}
                            </button>
                        </div>
                        {activeTab === 'script' && (
                            <textarea
                                value={script}
                                onChange={e => setScript(e.target.value)}
                                placeholder={t('videoStudio.scriptPlaceholder')}
                                className="flex-grow w-full bg-gray-800 border border-gray-700 rounded-lg p-4 resize-none focus:ring-green-500 focus:border-green-500"
                            />
                        )}
                        {activeTab === 'upload-audio' && (
                            <div className="flex-grow w-full bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-center text-gray-500">
                                 <input type="file" ref={audioFileInputRef} onChange={handleAudioFileChange} accept="audio/mp3,audio/wav,audio/ogg" className="hidden" />
                                 {audioFile ? (
                                     <div className="text-center">
                                        <p className="font-semibold text-gray-300">{t('videoStudio.importedFile')}</p>
                                        <p className="text-green-400">{audioFile.name}</p>
                                        <button onClick={() => setAudioFile(null)} className="mt-2 text-sm text-red-500 hover:underline">{t('videoStudio.removeAudio')}</button>
                                     </div>
                                 ) : (
                                    <label htmlFor="audio-upload" className="flex flex-col items-center justify-center w-full h-full border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-700" onClick={() => audioFileInputRef.current?.click()}>
                                        <div className="flex flex-col items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v3" /></svg>
                                            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">{t('videoStudio.importAudioPlaceholder')}</span></p>
                                            <p className="text-xs text-gray-500">{t('videoStudio.importAudioFormats')}</p>
                                        </div>
                                    </label>
                                 )}
                            </div>
                         )}

                        <div className="mt-4 flex flex-col items-center">
                             <button
                                onClick={handleGenerate}
                                disabled={isLoading || !selectedAvatar || (activeTab === 'script' && !script.trim()) || (activeTab === 'upload-audio' && !audioFile)}
                                className="w-full max-w-sm bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                             >
                                {isLoading ? t('common.generating') : t('videoStudio.generateButton')}
                            </button>
                            <p className="text-xs text-gray-500 mt-2">{t('videoStudio.freeTrial')}</p>
                        </div>
                    </div>
                </main>
            </div>
            <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }`}</style>
        </div>
    );
};

export default CreativeDashboard;