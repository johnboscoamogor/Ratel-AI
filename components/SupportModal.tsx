import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, CoffeeIcon, TelebirrIcon, ChevronLeftIcon, PaystackIcon, InfoIcon } from '../constants';
import { playSound } from '../services/audioService';

declare var PaystackPop: any;

interface SupportModalProps {
  onClose: () => void;
}

const paymentMethods = [
    { id: 'paystack', name: 'Paystack', Icon: PaystackIcon },
    { id: 'telebirr', name: 'Telebirr', Icon: TelebirrIcon },
];

const DONATION_AMOUNT_USD = 5;

const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<'selection' | 'telebirr_pending'>('selection');

    const handleClose = () => {
        playSound('click');
        onClose();
    };
    
    const handleBack = () => {
        playSound('click');
        setStep('selection');
    };

    const handlePaystack = () => {
        playSound('click');

        var handler = PaystackPop.setup({
            key: 'pk_test_5152e6fe4a5695dfa00b7ad30de1ada502bd7798', // User's provided public test key
            email: 'johnboscopaul46@gmail.com', // User's provided email
            amount: DONATION_AMOUNT_USD * 100, // Amount in cents
            currency: 'USD',
            ref: 'ratel-ai-' + Math.floor((Math.random() * 1000000000) + 1),
            callback: function(response: any) {
                alert(t('supportModal.paystackSuccess', { reference: response.reference }));
                handleClose();
            },
            onClose: function() {
                // User closed the popup
            }
        });
        handler.openIframe();
    };

    const handleTelebirr = () => {
        playSound('click');
        setStep('telebirr_pending');
    };
    
    const handlers: { [key: string]: () => void } = {
        paystack: handlePaystack,
        telebirr: handleTelebirr,
    };


    const renderSelectionScreen = () => (
        <>
            <div className="text-center mb-6">
                <CoffeeIcon className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                <h2 id="support-modal-title" className="text-2xl font-bold text-gray-800">{t('supportModal.title')}</h2>
                <p className="mt-2 text-gray-600">{t('supportModal.description')}</p>
            </div>
            
            <div className="space-y-3 pt-2">
                 {paymentMethods.map(({ id, name, Icon }) => (
                    <button
                        key={id}
                        onClick={handlers[id]}
                        className="w-full flex items-center justify-center gap-3 p-3 border rounded-lg font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <Icon className="w-6 h-6" />
                        <span>{t('supportModal.payWithAmount', { method: name })}</span>
                    </button>
                ))}
            </div>
        </>
    );
    
    const renderTelebirrScreen = () => {
        const exampleCode = `// In a real application, this function would be called:
async function processPayment() {
  try {
    // 1. Send request to your own backend server
    const response = await fetch('/api/pay/telebirr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 5, currency: 'USD' })
    });

    // 2. Get the secure payment URL from your server
    const { paymentUrl } = await response.json();
    
    // 3. Redirect the user to Telebirr to complete payment
    window.location.href = paymentUrl;
  } catch (error) {
    console.error('Payment failed:', error);
    // Show an error message to the user
  }
}`;
        return (
             <>
                <div className="flex items-center mb-6">
                    <button onClick={handleBack} className="p-2 rounded-full hover:bg-gray-200 mr-3">
                        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">{t('supportModal.payWithAmount', { method: 'Telebirr' })}</h2>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                    <div className="flex items-start gap-3">
                        <InfoIcon className="w-8 h-8 md:w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                        <div>
                            <p className="font-semibold text-blue-800">{t('supportModal.telebirrPendingTitle')}</p>
                            <p className="mt-1 text-sm text-blue-700">{t('supportModal.telebirrPendingBody')}</p>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-blue-200/50">
                        <p className="text-sm text-gray-600 mb-2">{t('supportModal.telebirrCodeExplanation')}</p>
                        <pre className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto">
                            <code>{exampleCode.trim()}</code>
                        </pre>
                        <p className="text-xs text-gray-500 mt-2">{t('supportModal.telebirrBackendExplanation')}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all relative">
                <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <CloseIcon className="w-5 h-5" />
                </button>
                <div className="p-6">
                    {step === 'selection' ? renderSelectionScreen() : renderTelebirrScreen()}
                </div>
            </div>
        </div>
    );
};

export default SupportModal;