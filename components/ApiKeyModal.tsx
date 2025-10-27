import React from 'react';
import { CloseIcon, SparklesIcon } from '../constants';
import { playSound } from '../services/audioService';

interface ApiKeyModalProps {
  onClose: () => void;
  onSelectKey: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSelectKey }) => {

    const handleClose = () => {
        playSound('click');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="api-key-modal-title">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all relative border border-gray-700">
                <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500">
                    <CloseIcon className="w-5 h-5" />
                </button>
                <div className="p-8 text-center">
                    <div className="inline-block bg-green-500/10 p-3 rounded-full mb-4">
                        <SparklesIcon className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 id="api-key-modal-title" className="text-2xl font-bold text-white">API Key Required</h2>
                    <p className="mt-2 text-gray-400 max-w-sm mx-auto">
                        To generate videos with Veo, you need to select one of your Google AI Studio API keys.
                    </p>
                     <p className="mt-4 text-xs text-gray-500">
                        Please note that video generation is a billable service. For details, see the{' '}
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                            billing documentation
                        </a>.
                    </p>
                    
                    <button
                        onClick={onSelectKey}
                        className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                    >
                        Select API Key
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;