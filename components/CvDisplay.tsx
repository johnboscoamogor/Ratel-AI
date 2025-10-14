import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DownloadIcon } from '../constants';
import { playSound } from '../services/audioService';

interface CvDisplayProps {
  cvData: {
    profilePicUrl?: string;
    name: string;
    contactInfo: string;
    content: string;
  };
  isLoading: boolean;
}

const CvDisplay: React.FC<CvDisplayProps> = ({ cvData, isLoading }) => {
  const { profilePicUrl, name, contactInfo, content } = cvData;

  const handleDownloadPdf = () => {
    playSound('click');
    window.print();
  };
  
  const isGenerating = isLoading && !content.includes('About Me');

  return (
    <div className="flex-1 min-w-0">
      <div id="cv-display-container" className="bg-white text-gray-800 border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* CV Header */}
        <header className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50 border-b border-gray-200">
          {profilePicUrl && (
            <div className="flex-shrink-0">
              <img
                src={profilePicUrl}
                alt={name}
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
              />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
            <p className="text-sm text-gray-600 mt-1">{contactInfo}</p>
          </div>
        </header>

        {/* CV Body */}
        <main className="p-6">
          {isGenerating ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
              <span>Generating your CV...</span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:border-b prose-headings:pb-1 prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0 prose-hr:my-4 prose-ul:pl-5 prose-li:my-1">
              <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </div>
          )}
        </main>
      </div>
       {/* Action Buttons */}
       {!isLoading && (
            <div className="mt-3 flex justify-end">
                <button
                    onClick={handleDownloadPdf}
                    className="no-print flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span>Download as PDF</span>
                </button>
            </div>
       )}
    </div>
  );
};

export default CvDisplay;
