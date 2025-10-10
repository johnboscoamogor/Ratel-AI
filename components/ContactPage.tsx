import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon, RatelLogo } from '../constants';
import { playSound } from '../services/audioService';

interface ContactPageProps {
  onBack: () => void;
}

// Declare the emailjs library which is loaded from a script in index.html
declare var emailjs: any;

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const SERVICE_ID = 'service_0od2hgd';
  const TEMPLATE_ID = 'template_eok41ps';
  const PUBLIC_KEY = 'LVQXGJ3F_GjNEfrCh';

  useEffect(() => {
    // This is not strictly necessary if you use the send method with the public key,
    // but it's good practice.
    if (typeof emailjs !== 'undefined') {
        emailjs.init({ publicKey: PUBLIC_KEY });
    }
  }, []);
  
  const handleBackClick = () => {
    playSound('click');
    onBack();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    playSound('send');
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const templateParams = {
        name: formState.name,
        email: formState.email,
        message: formState.message,
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
      .then((response: any) => {
        console.log('SUCCESS!', response.status, response.text);
        setSubmitStatus('success');
        setFormState({ name: '', email: '', message: '' });
      })
      .catch((err: any) => {
        console.error('FAILED...', err);
        setSubmitStatus('error');
      })
      .finally(() => {
          setIsSubmitting(false);
          // Hide the status message after a few seconds
          setTimeout(() => {
            setSubmitStatus('idle');
          }, 5000);
      });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="flex items-center mb-8">
        <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-gray-200 mr-4">
          <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{t('contact.title')}</h1>
      </header>

      <main className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
            <RatelLogo className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('contact.getInTouch')}</h2>
            <p className="text-gray-600 max-w-lg mx-auto mb-6">
                {t('contact.intro')}
            </p>
            <div className="inline-block bg-green-50 border border-green-200 rounded-lg px-6 py-3 mb-8">
                <span className="text-gray-700 font-medium">{t('contact.supportEmail')}</span>
                <a href={`mailto:${t('contact.supportEmailAddress')}`} className="text-green-600 font-semibold ml-2 hover:underline">
                    {t('contact.supportEmailAddress')}
                </a>
            </div>
        </div>

        <div className="border-t border-gray-200 pt-8 mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">{t('contact.formTitle')}</h3>
            
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('contact.nameLabel')}</label>
                <input
                type="text"
                id="name"
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                placeholder={t('contact.namePlaceholder')}
                />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('contact.emailLabel')}</label>
                <input
                type="email"
                id="email"
                name="email"
                value={formState.email}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                placeholder={t('contact.emailPlaceholder')}
                />
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">{t('contact.messageLabel')}</label>
                <textarea
                id="message"
                name="message"
                rows={5}
                value={formState.message}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                placeholder={t('contact.messagePlaceholder')}
                />
            </div>
            <div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
                >
                {isSubmitting ? t('contact.sending') : t('contact.sendMessage')}
                </button>
            </div>
            </form>
             {submitStatus === 'success' && (
                <div className="text-center p-4 mt-4 bg-green-100 text-green-800 rounded-lg">
                    {t('contact.submitSuccess')}
                </div>
            )}
             {submitStatus === 'error' && (
                <div className="text-center p-4 mt-4 bg-red-100 text-red-800 rounded-lg">
                    {t('contact.submitError')}
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default ContactPage;