import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, StorefrontIcon, SearchIcon, TagIcon, TrashIcon, ImageIcon, InfoIcon } from '../constants';
import { playSound } from '../services/audioService';
import { MarketItem, UserProfile } from '../types';
import { marketService } from '../services/marketService';

interface MarketSquareProps {
  onClose: () => void;
  onAiSearch: (item: string, location: string) => void;
  isLoading: boolean;
  userProfile: UserProfile;
}

type MarketTab = 'find' | 'sell' | 'browse';

const MarketSquare: React.FC<MarketSquareProps> = ({ onClose, onAiSearch, isLoading, userProfile }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<MarketTab>('browse');

    const handleClose = () => {
        playSound('click');
        onClose();
    }
    
    const TabButton: React.FC<{ tab: MarketTab, label: string, Icon: React.FC<any>}> = ({ tab, label, Icon }) => (
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
                        <StorefrontIcon className="w-5 h-5 text-green-600" />
                        {t('marketSquare.title')}
                    </h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <nav className="flex-shrink-0 p-3 border-b border-gray-200 flex gap-2">
                    <TabButton tab="browse" label={t('marketSquare.tabs.browse')} Icon={StorefrontIcon} />
                    <TabButton tab="sell" label={t('marketSquare.tabs.sell')} Icon={TagIcon} />
                    <TabButton tab="find" label={t('marketSquare.tabs.find')} Icon={SearchIcon} />
                </nav>
                
                <main className="flex-grow overflow-y-auto">
                    {activeTab === 'browse' && <BrowseMarketTab currentUser={userProfile} />}
                    {activeTab === 'sell' && <SellItemTab currentUser={userProfile} onListingCreated={() => setActiveTab('browse')} />}
                    {activeTab === 'find' && <FindWithAiTab onAiSearch={onAiSearch} isLoading={isLoading} />}
                </main>
            </div>
        </div>
    );
};

// --- BROWSE MARKET TAB ---
const BrowseMarketTab: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
    const { t } = useTranslation();
    const [items, setItems] = useState<MarketItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [updatingSoldStatusId, setUpdatingSoldStatusId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            setError('');
            try {
                const fetchedItems = await marketService.getItems();
                setItems(fetchedItems);
            } catch (err: any) {
                console.error("Failed to fetch market items", err);
                // FIX: Standardized error handling to display the clearer message from the service layer.
                const errorMessage = err?.message || t('marketSquare.browse.fetchError');
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [refreshTrigger, t]);

    const handleDelete = async (itemId: string) => {
        if (deletingId) return;
        if (window.confirm(t('marketSquare.browse.deleteConfirm'))) {
            setDeletingId(itemId);
            try {
                const success = await marketService.deleteItem(itemId, currentUser.email);
                if (success) {
                    setItems(prev => prev.filter(item => item.id !== itemId));
                } else {
                    alert(t('marketSquare.browse.deleteError'));
                }
            } catch (error) {
                console.error("Error deleting item:", error);
                alert('An error occurred while deleting the item.');
            } finally {
                setDeletingId(null);
            }
        }
    };

    const handleToggleSold = async (itemId: string) => {
        if (updatingSoldStatusId) return;
        setUpdatingSoldStatusId(itemId);
        try {
            const updatedItem = await marketService.toggleSoldStatus(itemId, currentUser.email);
            if (updatedItem) {
                setItems(prevItems => prevItems.map(item => item.id === itemId ? updatedItem : item));
            } else {
                alert('Could not update status. Please try again.');
            }
        } catch (error) {
            console.error("Error toggling sold status:", error);
            alert('An error occurred.');
        } finally {
            setUpdatingSoldStatusId(null);
        }
    };

    const filteredItems = items.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.location.area && item.location.area.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{t('marketSquare.browse.welcome')}</h2>
            <input
                type="text"
                placeholder={t('marketSquare.browse.searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            />
            {loading && <p className="text-center text-gray-500">Loading items...</p>}
            {error && (
                 <div className="text-center p-4 my-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}
            {!loading && !error && filteredItems.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>{t('marketSquare.browse.noItems')}</p>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className={`bg-white border rounded-lg shadow-sm overflow-hidden transition-opacity ${deletingId === item.id ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="relative">
                            <img src={item.imageUrl} alt={item.itemName} className="h-48 w-full object-cover"/>
                             {item.isSold && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                    <span className="text-white text-2xl font-bold tracking-widest transform -rotate-12 border-2 border-white px-4 py-1">SOLD OUT</span>
                                </div>
                            )}
                            {item.sellerId === currentUser.email && (
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  disabled={!!deletingId}
                                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full transition-opacity hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center w-7 h-7"
                                >
                                    {deletingId === item.id ? (
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <TrashIcon className="w-4 h-4"/>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="p-3">
                            <h3 className="font-bold truncate">{item.itemName}</h3>
                            <p className="text-sm text-gray-500 truncate">{item.location.area}, {item.location.city}</p>
                            <p className="text-lg font-bold text-green-600 mt-1">₦{item.price.toLocaleString()}</p>
                             <div className="mt-2 text-xs text-gray-600">
                                <p><strong>{t('marketSquare.sell.sellerNameLabel')}:</strong> {item.sellerName}</p>
                                <p><strong>{t('marketSquare.sell.phoneLabel')}:</strong> {item.contactPhone}</p>
                                <p><strong>{t('marketSquare.sell.emailLabel')}:</strong> {item.contactEmail}</p>
                            </div>
                            <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2">
                                {item.websiteUrl && (
                                    <a href={item.websiteUrl.startsWith('http') ? item.websiteUrl : `//${item.websiteUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm bg-gray-100 text-gray-700 font-semibold py-1.5 px-3 rounded-md hover:bg-gray-200 transition-colors truncate">
                                        Visit Website
                                    </a>
                                )}
                                
                                {item.sellerId === currentUser.email && (
                                    <button
                                        onClick={() => handleToggleSold(item.id)}
                                        disabled={updatingSoldStatusId === item.id}
                                        className="text-sm bg-blue-100 text-blue-700 font-semibold py-1.5 px-3 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        {updatingSoldStatusId === item.id ? 'Updating...' : (item.isSold ? 'Mark Available' : 'Mark as Sold')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- SELL ITEM TAB ---
const SellItemTab: React.FC<{ currentUser: UserProfile, onListingCreated: () => void }> = ({ currentUser, onListingCreated }) => {
    const { t } = useTranslation();
    const [formState, setFormState] = useState({
        itemName: '', description: '', price: '', currency: 'NGN' as 'NGN' | 'GHS' | 'KES' | 'USD',
        sellerName: currentUser.name, contactPhone: '', contactEmail: currentUser.email,
        country: 'Nigeria', state: '', city: '', area: '', websiteUrl: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userItemCount, setUserItemCount] = useState<number | null>(null);
    const [isCheckingPosts, setIsCheckingPosts] = useState(true);

    const FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK-7a298ea26aa8e1b9d39f5a72b2425b97-X';
    const priceMap: Record<string, number> = { NGN: 1500, GHS: 15, KES: 130, USD: 1 };

    useEffect(() => {
        const checkPosts = async () => {
            setIsCheckingPosts(true);
            try {
                const count = await marketService.countUserItems(currentUser.email);
                setUserItemCount(count);
            } catch (e: any) {
                console.error("Could not check user post count", e);
                // FIX: Standardized error handling to display the clearer message from the service layer.
                const errorMessage = e?.message || 'Could not verify your post count.';
                setError(errorMessage);
                setUserItemCount(null); 
            } finally {
                setIsCheckingPosts(false);
            }
        };
        checkPosts();
    }, [currentUser.email]);

    const paymentRequired = userItemCount !== null && userItemCount >= 1;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: value as any}));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!imageFile || !formState.itemName || !formState.price || !formState.city || !formState.state || !formState.contactPhone || !formState.area) {
            setError(t('marketSquare.sell.error.allFields'));
            return;
        }
        
        const itemData: Omit<MarketItem, 'id' | 'timestamp' | 'imageUrl' | 'isSold'> = {
             sellerId: currentUser.email,
             sellerName: formState.sellerName,
             itemName: formState.itemName,
             description: formState.description,
             price: parseFloat(formState.price),
             currency: formState.currency,
             contactPhone: formState.contactPhone,
             contactEmail: formState.contactEmail,
             location: {
                 country: formState.country,
                 state: formState.state,
                 city: formState.city,
                 area: formState.area,
             },
             websiteUrl: formState.websiteUrl
        };

        if (paymentRequired) {
            setIsSubmitting(true);
            const amount = priceMap[formState.currency] || 1;
            
            (window as any).FlutterwaveCheckout({
                public_key: FLUTTERWAVE_PUBLIC_KEY,
                tx_ref: `ratel-market-${currentUser.email}-${Date.now()}`,
                amount,
                currency: formState.currency,
                customer: {
                    email: currentUser.email,
                    name: formState.sellerName,
                    phone_number: formState.contactPhone,
                },
                customizations: {
                    title: "Ratel AI Market Listing",
                    description: `Payment for listing "${formState.itemName}"`,
                },
                callback: async (data: any) => {
                    // This is called on successful payment
                    if (data.status === 'successful') {
                        try {
                            await marketService.logPayment({
                                sellerId: currentUser.email,
                                transaction_ref: data.tx_ref,
                                amount: data.amount,
                                currency: data.currency,
                                status: 'successful'
                            });
                            await marketService.addItem(itemData, imageFile);
                            alert(t('marketSquare.sell.success'));
                            onListingCreated();
                        } catch (err) {
                            setError('Payment successful, but failed to create listing. Please contact support.');
                        } finally {
                            setIsSubmitting(false);
                        }
                    } else {
                        setError('Payment was not successful. Please try again.');
                        setIsSubmitting(false);
                    }
                },
                onclose: () => setIsSubmitting(false) // User closed the modal
            });
        } else {
            // Free post logic
            setIsSubmitting(true);
            try {
                await marketService.addItem(itemData, imageFile);
                alert(t('marketSquare.sell.success'));
                onListingCreated();
            } catch (err: any) {
                setError(err.message || t('marketSquare.sell.error.generic'));
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    
    const renderSubmitButton = () => {
        let buttonText = t('marketSquare.sell.submitButton');
        let buttonAction = handleSubmit;
        let disabled = isSubmitting || isCheckingPosts;

        if (isCheckingPosts) {
            buttonText = 'Verifying post status...';
        } else if (paymentRequired) {
            const amount = priceMap[formState.currency] || 1;
            const currencySymbol = { NGN: '₦', GHS: '₵', KES: 'KSh', USD: '$' }[formState.currency];
            buttonText = `Pay ${currencySymbol}${amount} to List Item`;
        }

        if (isSubmitting) {
            buttonText = paymentRequired ? 'Processing Payment...' : 'Submitting...';
        }

        return (
            <button type="submit" disabled={disabled} className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300">
                {buttonText}
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {userItemCount !== null && (
                 <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                    <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>
                        {paymentRequired 
                            ? `Your first free listing has been used. A small one-time fee is required to post this item.` 
                            : `Your first item listing is free! Fill out the details below to get started.`
                        }
                    </span>
                </div>
            )}
             <div>
                <label className="block text-sm font-medium text-gray-700">{t('marketSquare.sell.photoLabel')}</label>
                <div className="mt-1 flex items-center">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-md"/>
                    ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-10 h-10"/>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="ml-4" required/>
                </div>
            </div>

            <InputField label={t('marketSquare.sell.itemNameLabel')} name="itemName" value={formState.itemName} onChange={handleInputChange} required />
            <div className="grid grid-cols-2 gap-4">
                <InputField label={t('marketSquare.sell.priceLabel')} name="price" type="number" value={formState.price} onChange={handleInputChange} placeholder="e.g., 15000" required />
                <InputField label={t('marketSquare.sell.currencyLabel')} name="currency" value={formState.currency} as="select" onChange={handleInputChange}>
                    <option value="NGN">NGN (₦)</option>
                    <option value="GHS">GHS (₵)</option>
                    <option value="KES">KES (KSh)</option>
                    <option value="USD">USD ($)</option>
                </InputField>
            </div>
            <InputField label={t('marketSquare.sell.descriptionLabel')} name="description" as="textarea" value={formState.description} onChange={handleInputChange} rows={3} />
            <h3 className="text-md font-semibold pt-2 border-t">{t('marketSquare.sell.locationHeader')}</h3>
            <div className="grid grid-cols-2 gap-4">
                <InputField label={t('marketSquare.sell.countryLabel')} name="country" value={formState.country} onChange={handleInputChange} placeholder="e.g., Nigeria" required/>
                <InputField label={t('marketSquare.sell.stateLabel')} name="state" value={formState.state} onChange={handleInputChange} placeholder="e.g., Lagos" required/>
                <InputField label={t('marketSquare.sell.cityLabel')} name="city" value={formState.city} onChange={handleInputChange} placeholder="e.g., Ikeja" required/>
                <InputField label={t('marketSquare.sell.areaLabel')} name="area" value={formState.area} onChange={handleInputChange} placeholder={t('marketSquare.sell.areaPlaceholder')} required/>
            </div>
             <h3 className="text-md font-semibold pt-2 border-t">{t('marketSquare.sell.contactHeader')}</h3>
            <div className="grid grid-cols-2 gap-4">
                <InputField label={t('marketSquare.sell.sellerNameLabel')} name="sellerName" value={formState.sellerName} onChange={handleInputChange} required />
                <InputField label={t('marketSquare.sell.phoneLabel')} name="contactPhone" value={formState.contactPhone} onChange={handleInputChange} required />
            </div>
            <InputField label="Website Link (Optional)" name="websiteUrl" value={formState.websiteUrl} onChange={handleInputChange} placeholder="https://yourshop.com" />
            
            {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}
            
            {renderSubmitButton()}
        </form>
    );
};

const InputField: React.FC<any> = ({ label, name, as = 'input', ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        {as === 'textarea' ? (
            <textarea id={name} name={name} {...props} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"/>
        ) : as === 'select' ? (
             <select id={name} name={name} {...props} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white"/>
        ) : (
            <input id={name} name={name} {...props} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"/>
        )}
    </div>
);


// --- FIND WITH AI TAB ---
const FindWithAiTab: React.FC<{onAiSearch: (item: string, location: string) => void, isLoading: boolean}> = ({ onAiSearch, isLoading }) => {
    const { t } = useTranslation();
    const [item, setItem] = useState('');
    const [location, setLocation] = useState('');
    
    const handleAction = () => {
        playSound('click');
        if (item.trim() && location.trim()) {
            onAiSearch(item, location);
        }
    };

    return (
        <div className="p-4 space-y-4">
            <p className="text-sm text-gray-600">
                {t('marketSquare.description')}
            </p>
            <InputField 
                label={t('marketSquare.itemLabel')}
                name="market-item"
                placeholder={t('marketSquare.itemPlaceholder')}
                value={item}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItem(e.target.value)}
                disabled={isLoading}
            />
             <InputField 
                label={t('marketSquare.locationLabel')}
                name="market-location"
                placeholder={t('marketSquare.locationPlaceholder')}
                value={location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAction(); }}
                disabled={isLoading}
            />
            <button
                onClick={handleAction}
                disabled={isLoading || !item.trim() || !location.trim()}
                className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
            >
                {isLoading ? t('common.generating') : t('marketSquare.button')}
            </button>
        </div>
    );
};


export default MarketSquare;