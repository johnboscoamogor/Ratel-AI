import React from 'react';
import { useTranslation } from 'react-i18next';
// FIX: The CodeIcon is now correctly imported from constants.tsx
import { CloseIcon, BookOpenIcon, VideoIcon, CodeIcon, DropletIcon, StarIcon, GraduationCapIcon } from '../constants';
import { playSound } from '../services/audioService';

interface LearnStudioProps {
  onClose: () => void;
  onAction: (subjectId: string, skill: string, isTutorSubject: boolean) => void;
}

const LearnStudio: React.FC<LearnStudioProps> = ({ onClose, onAction }) => {
    const { t } = useTranslation();

    const generalSkills = [
        { id: 'video', label: t('learnStudio.skills.video'), Icon: VideoIcon, isTutor: false },
        { id: 'coding', label: t('learnStudio.skills.coding'), Icon: CodeIcon, isTutor: false },
        { id: 'canva', label: t('learnStudio.skills.canva'), Icon: DropletIcon, isTutor: false },
        { id: 'ai', label: t('learnStudio.skills.ai'), Icon: StarIcon, isTutor: false },
    ];
    
    const tutorSubjects = [
        { id: 'finance', label: t('learnStudio.subjects.finance'), Icon: GraduationCapIcon, isTutor: true },
        { id: 'marketing', label: t('learnStudio.subjects.marketing'), Icon: GraduationCapIcon, isTutor: true },
        { id: 'agribusiness', label: t('learnStudio.subjects.agribusiness'), Icon: GraduationCapIcon, isTutor: true },
    ];

    const handleAction = (subjectId: string, skillLabel: string, isTutor: boolean) => {
        playSound('click');
        onAction(subjectId, skillLabel, isTutor);
    };
    
    const handleClose = () => {
        playSound('click');
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BookOpenIcon className="w-5 h-5 text-green-600" />
                        {t('learnStudio.title')}
                    </h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}</style>
                    <p className="text-sm text-center text-gray-600 mb-6">
                        {t('learnStudio.description')}
                    </p>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{t('learnStudio.tutorTitle')}</h3>
                        <div className="flex flex-row gap-3 mb-6 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
                            {tutorSubjects.map(({ id, label, Icon, isTutor }) => (
                                <button
                                    key={id}
                                    onClick={() => handleAction(id, label, isTutor)}
                                    className="flex-shrink-0 snap-start w-32 flex flex-col items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-green-50 hover:border-green-300 transition-colors"
                                >
                                    <Icon className="w-8 h-8 text-green-600" />
                                    <span className="font-semibold text-gray-700 text-center text-xs leading-tight">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                         <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{t('learnStudio.skillsTitle')}</h3>
                        <div className="flex flex-row gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
                            {generalSkills.map(({ id, label, Icon, isTutor }) => (
                                <button
                                    key={id}
                                    onClick={() => handleAction(id, label, isTutor)}
                                    className="flex-shrink-0 snap-start w-32 flex flex-col items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-green-50 hover:border-green-300 transition-colors"
                                >
                                    <Icon className="w-8 h-8 text-green-600" />
                                    <span className="font-semibold text-gray-700 text-center text-xs leading-tight">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearnStudio;