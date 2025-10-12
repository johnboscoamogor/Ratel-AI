import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, CoffeeIcon, FlutterwaveIcon, TelebirrIcon, ChevronLeftIcon } from '../constants';
import { playSound } from '../services/audioService';

interface SupportModalProps {
  onClose: () => void;
}

const FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK-7a298ea26aa8e1b9d39f5a72b2425b97-X';

const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState('500'); // Default amount in NGN
    const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'telebirr' | null>(null);
    const [error, setError] = useState('');

    const handleClose = () => {
        playSound('click');
        onClose();
    };

    const handleFlutterwavePayment = () => {
        playSound('click');
        setError(''); // Clear previous errors
        
        if (!FLUTTERWAVE_PUBLIC_KEY) {
            setError(t('supportModal.configureKeyError'));
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        (window as any).FlutterwaveCheckout({
            public_key: FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: `ratel-support-${Date.now()}`,
            amount: parsedAmount,
            currency: "NGN",
            payment_options: "card, mobilemoneyghana, ussd",
            redirect_url: "", // You can add a success page URL here
            customer: {
                // In a real app, you'd get this from the logged-in user profile
                email: "supporter@example.com",
                phone_number: "08012345678",
                name: "Ratel AI Supporter",
            },
            customizations: {
                title: "Support Ratel AI",
                description: "Your contribution helps us grow.",
                logo: "https://your-app-url.com/favicon.svg", // Replace with your actual logo URL
            },
            callback: function (data: any) {
                console.log("Flutterwave payment successful:", data);
                // Here you would typically verify the transaction on your backend
                handleClose();
            },
            onclose: function() {
                // This is called when the user closes the payment modal
            }
        });
    };
    
    const renderInitialScreen = () => (
        <>
            <div className="inline-block bg-yellow-100 p-3 rounded-full mb-4">
                <CoffeeIcon className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 id="support-modal-title" className="text-2xl font-bold text-gray-800">{t('supportModal.title')}</h2>
            <p className="mt-2 text-gray-600 max-w-sm mx-auto">{t('supportModal.description')}</p>
            
            <div className="mt-6 space-y-3">
                <button onClick={() => setPaymentMethod('flutterwave')} className="flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">
                    <FlutterwaveIcon className="w-6 h-6 mr-2"/>
                    <span>{t('supportModal.flutterwave')}</span>
                </button>
                 <button onClick={() => setPaymentMethod('telebirr')} className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">
                    <TelebirrIcon className="w-6 h-6 mr-2"/>
                    <span>{t('supportModal.telebirr')}</span>
                </button>
            </div>

            <button
                onClick={handleClose}
                className="mt-8 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
                {t('supportModal.maybeLater')}
            </button>
        </>
    );
    
    const renderFlutterwaveScreen = () => (
        <>
            <button onClick={() => setPaymentMethod(null)} className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-800 mb-4">
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                {t('supportModal.backButton')}
            </button>
            <h2 className="text-xl font-bold text-gray-800">{t('supportModal.flutterwave')}</h2>
            <div className="mt-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">{t('supportModal.enterAmount')}</label>
                <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                    placeholder="e.g., 500"
                />
            </div>
            {error && <p className="text-red-600 text-sm text-center mt-2 bg-red-50 p-2 rounded-md">{error}</p>}
            <button onClick={handleFlutterwavePayment} className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">
                {t('supportModal.payButton')}
            </button>
        </>
    );
    
    const renderTelebirrScreen = () => (
        <>
            <button onClick={() => setPaymentMethod(null)} className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-800 mb-4">
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                {t('supportModal.backButton')}
            </button>
            <h2 className="text-xl font-bold text-gray-800">{t('supportModal.telebirrInstructionsTitle')}</h2>
            <div className="mt-4 text-center bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-gray-700">{t('supportModal.telebirrInstructions')}</p>
                <p className="font-bold text-2xl text-green-800 my-2 tracking-widest">+251974557303</p>
            </div>
             <button onClick={handleClose} className="mt-4 w-full bg-gray-100 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors">
                {t('common.close')}
            </button>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all relative">
                <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 z-10">
                    <CloseIcon className="w-5 h-5" />
                </button>
                <div className="p-8 text-center">
                   {!paymentMethod && renderInitialScreen()}
                   {paymentMethod === 'flutterwave' && renderFlutterwaveScreen()}
                   {paymentMethod === 'telebirr' && renderTelebirrScreen()}
                </div>
            </div>
        </div>
    );
};

export default SupportModal;