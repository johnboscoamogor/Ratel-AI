import React, { useState } from 'react';
import { CloseIcon, DocumentTextIcon } from '../constants';
import { playSound } from '../services/audioService';

declare var emailjs: any;

interface FeedbackModalProps {
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    playSound('send');
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // FIX: Replaced incorrect credentials with the correct ones from ContactPage.tsx
    const serviceID = 'service_0od2hgd';
    const templateID = 'template_eok41ps';
    const publicKey = 'LVQXGJ3F_GjNEfrCh';

    emailjs.send(serviceID, templateID, formState, publicKey)
      .then(() => {
        setSubmitStatus('success');
        setStatusMessage('✅ Feedback sent successfully!');
        setFormState({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => {
          onClose();
        }, 3000);
      })
      .catch((err: any) => {
        setSubmitStatus('error');
        setStatusMessage('❌ Failed to send feedback. Please try again.');
        console.error('EmailJS Error:', err);
      })
      .finally(() => {
          setIsSubmitting(false);
      });
  };
  
  const handleClose = () => {
    playSound('click');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all relative border border-gray-700">
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-green-500" />
            User Feedback
          </h2>
          <button onClick={handleClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Full Name" name="name" value={formState.name} onChange={handleInputChange} required />
            <InputField label="Email" name="email" type="email" value={formState.email} onChange={handleInputChange} required />
          </div>
          <InputField label="Subject" name="subject" value={formState.subject} onChange={handleInputChange} required />
          <InputField label="Message" name="message" as="textarea" rows={5} value={formState.message} onChange={handleInputChange} required />
          
          {submitStatus !== 'idle' && (
            <div className={`text-center p-2 rounded-lg text-sm font-semibold ${submitStatus === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {statusMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:bg-green-800 disabled:text-gray-400"
          >
            {isSubmitting ? 'Sending...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

const InputField: React.FC<any> = ({ label, name, as = 'input', ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        {as === 'textarea' ? (
            <textarea id={name} name={name} {...props} className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"/>
        ) : (
            <input id={name} name={name} {...props} className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"/>
        )}
    </div>
);

export default FeedbackModal;