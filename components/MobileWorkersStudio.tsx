import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, WrenchIcon, SearchIcon, TagIcon, AwardIcon } from '../constants';
import { playSound } from '../services/audioService';
import { MobileWorker, UserProfile } from '../types';
import { SKILL_CATEGORIES } from '../constants';
import { workerService } from '../services/workerService';
import { findWorkersWithAi } from '../services/geminiService';
import AdBanner from './AdBanner';

interface MobileWorkersStudioProps {
  onClose: () => void;
  userProfile: UserProfile;
}

type WorkerTab = 'find' | 'list';

const MobileWorkersStudio: React.FC<MobileWorkersStudioProps> = ({ onClose, userProfile }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<WorkerTab>('find');

    const handleClose = () => {
        playSound('click');
        onClose();
    };

    const TabButton: React.FC<{ tab: WorkerTab, label: string, Icon: React.FC<any> }> = ({ tab, label, Icon }) => (
        <button
            onClick={() => { playSound('click'); setActiveTab(tab); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tab ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col transform transition-all">
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <WrenchIcon className="w-5 h-5 text-green-600" />
                        {t('mobileWorkersStudio.title')}
                    </h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>

                <nav className="flex-shrink-0 p-3 border-b border-gray-200 flex gap-2">
                    <TabButton tab="find" label={t('mobileWorkersStudio.tabs.find')} Icon={SearchIcon} />
                    <TabButton tab="list" label={t('mobileWorkersStudio.tabs.list')} Icon={TagIcon} />
                </nav>

                <main className="flex-grow overflow-y-auto">
                    {activeTab === 'find' && <FindWorkerTab />}
                    {activeTab === 'list' && <ListSkillTab userProfile={userProfile} onListingCreated={() => setActiveTab('find')} />}
                </main>
            </div>
        </div>
    );
};

// --- FIND WORKER TAB ---
const FindWorkerTab: React.FC = () => {
    const { t } = useTranslation();
    const [workers, setWorkers] = useState<MobileWorker[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [skillFilter, setSkillFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    const fetchWorkers = async (filters: { skill?: string, location?: string }) => {
        setIsLoading(true);
        setError('');
        try {
            const results = await workerService.getWorkers(filters);
            setWorkers(results);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch workers.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Fetch on manual filter change
    useEffect(() => {
        // Debounce to prevent fetching on every keystroke
        const handler = setTimeout(() => {
            fetchWorkers({ skill: skillFilter, location: locationFilter });
        }, 500);
        return () => clearTimeout(handler);
    }, [skillFilter, locationFilter]);


    const handleAiSearch = async () => {
        if (!searchTerm.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const resultArgs = await findWorkersWithAi(searchTerm);
            
            if (resultArgs) {
                setSkillFilter(resultArgs.skill || '');
                setLocationFilter(resultArgs.location || '');
                // The useEffect will trigger the fetch
            } else {
                 setWorkers([]);
                 setError("I couldn't understand that. Please try rephrasing, like 'Find a plumber in Lagos'.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred with the AI search.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-4">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder={t('mobileWorkersStudio.find.searchPlaceholder')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
                <button onClick={handleAiSearch} disabled={isLoading} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300">
                    <SearchIcon className="w-5 h-5"/>
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)} className="w-full p-2 border bg-white border-gray-300 rounded-lg text-sm text-gray-900">
                    <option value="">{t('mobileWorkersStudio.find.skillFilter')}</option>
                    {SKILL_CATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                    type="text"
                    placeholder={t('mobileWorkersStudio.find.locationFilter')}
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                />
            </div>

            {isLoading && <p className="text-center text-gray-500">Searching...</p>}
            {error && <p className="text-center text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            
            {!isLoading && !error && workers.length === 0 && (
                <p className="text-center text-gray-500 py-6">{t('mobileWorkersStudio.find.noResults')}</p>
            )}

            <div className="flex flex-row gap-3 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar">
                {workers.map(worker => <WorkerCard key={worker.id} worker={worker} />)}
            </div>
            <AdBanner/>
        </div>
    );
};

// --- WORKER CARD ---
const WorkerCard: React.FC<{ worker: MobileWorker }> = ({ worker }) => {
    const { t } = useTranslation();
    return (
        <div className="flex-shrink-0 snap-start w-80 flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <img src={worker.profile_photo_url} alt={worker.full_name} className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"/>
            <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 text-lg">{worker.full_name}</h4>
                    {worker.verified && <div className="flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full"><AwardIcon className="w-3 h-3"/> {t('mobileWorkersStudio.find.verified')}</div>}
                </div>
                <p className="text-sm font-semibold text-green-700">{worker.skill_category}</p>
                <p className="text-sm text-gray-600">{worker.location}</p>
                <div className="mt-3 flex gap-2">
                    <a href={`tel:${worker.phone_number}`} className="text-sm bg-blue-100 text-blue-800 font-semibold py-1.5 px-4 rounded-full hover:bg-blue-200">Call</a>
                    {worker.whatsapp_link && <a href={worker.whatsapp_link} target="_blank" rel="noopener noreferrer" className="text-sm bg-green-100 text-green-800 font-semibold py-1.5 px-4 rounded-full hover:bg-green-200">WhatsApp</a>}
                </div>
            </div>
        </div>
    );
};


// --- LIST SKILL TAB ---
const ListSkillTab: React.FC<{ userProfile: UserProfile; onListingCreated: () => void; }> = ({ userProfile, onListingCreated }) => {
    const { t } = useTranslation();
    const [formState, setFormState] = useState({
        full_name: userProfile.name, phone_number: '', skill_category: '',
        location: '', bio: '', whatsapp_link: ''
    });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!photoFile || !formState.full_name || !formState.phone_number || !formState.skill_category || !formState.location || !formState.bio) {
            setError(t('mobileWorkersStudio.list.error.allFields'));
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            await workerService.addWorker({ ...formState, user_id: userProfile.email }, photoFile);
            alert(t('mobileWorkersStudio.list.success'));
            onListingCreated();
        } catch (err: any) {
            setError(err.message || t('mobileWorkersStudio.list.error.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <h3 className="text-lg font-bold text-center">{t('mobileWorkersStudio.list.formTitle')}</h3>
            <p className="text-sm text-center text-gray-600 -mt-2">{t('mobileWorkersStudio.list.formDescription')}</p>
            
            <InputField label={t('mobileWorkersStudio.list.photoLabel')} type="file" onChange={handleFileChange} required accept="image/*" />
            {photoPreview && <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover mx-auto" />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField name="full_name" label={t('mobileWorkersStudio.list.fullNameLabel')} value={formState.full_name} onChange={handleInputChange} required />
                <InputField name="phone_number" label={t('mobileWorkersStudio.list.phoneLabel')} value={formState.phone_number} onChange={handleInputChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField as="select" name="skill_category" label={t('mobileWorkersStudio.list.skillLabel')} value={formState.skill_category} onChange={handleInputChange} required>
                    <option value="">{t('mobileWorkersStudio.list.selectSkill')}</option>
                    {SKILL_CATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                </InputField>
                <InputField name="location" label={t('mobileWorkersStudio.list.locationLabel')} value={formState.location} onChange={handleInputChange} placeholder={t('mobileWorkersStudio.list.locationPlaceholder')} required />
            </div>
            <InputField as="textarea" name="bio" label={t('mobileWorkersStudio.list.bioLabel')} value={formState.bio} onChange={handleInputChange} placeholder={t('mobileWorkersStudio.list.bioPlaceholder')} required rows={3} />
            <InputField name="whatsapp_link" label={t('mobileWorkersStudio.list.whatsappLabel')} value={formState.whatsapp_link} onChange={handleInputChange} placeholder={t('mobileWorkersStudio.list.whatsappPlaceholder')} />

            {error && <p className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">{error}</p>}
            
            <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300">
                {isSubmitting ? t('mobileWorkersStudio.list.submitting') : t('mobileWorkersStudio.list.submitButton')}
            </button>
        </form>
    );
};

const InputField: React.FC<any> = ({ label, name, as = 'input', children, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        {as === 'textarea' ? (
            <textarea id={name} name={name} {...props} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"/>
        ) : as === 'select' ? (
            <select id={name} name={name} {...props} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white text-gray-900">
                {children}
            </select>
        ) : (
            <input id={name} name={name} {...props} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"/>
        )}
    </div>
);


export default MobileWorkersStudio;
