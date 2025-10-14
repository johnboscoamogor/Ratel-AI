import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RedemptionRequest, CommunityAdminSettings } from '../types';
import { communityService } from '../services/communityService';
import { playSound } from '../services/audioService';
import ToggleSwitch from './ToggleSwitch';

type AdminTab = 'requests' | 'users' | 'settings';

const AdminPanel: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<AdminTab>('requests');
    const [requests, setRequests] = useState<RedemptionRequest[]>([]);
    const [users, setUsers] = useState<Record<string, { name: string; points: number }>>({});
    const [conversionRate, setConversionRate] = useState(1);
    const [adminSettings, setAdminSettings] = useState<CommunityAdminSettings>({ enableTelegramNotifications: true });
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to force re-renders

    useEffect(() => {
        setRequests(communityService.getRedemptionRequests());
        setUsers(communityService.getAllUsersWithPoints());
        setConversionRate(communityService.getConversionRate());
        setAdminSettings(communityService.getAdminSettings());
    }, [refreshTrigger]);
    
    const handleProcessRequest = (requestId: string, status: 'approved' | 'rejected') => {
        playSound('click');
        const success = communityService.processRedemptionRequest(requestId, status);
        if (success) {
            alert(`Request has been ${status}.`);
            setRefreshTrigger(prev => prev + 1); // Trigger a refresh
        } else {
            alert('Failed to process request. It might have been processed already.');
        }
    };
    
    const handleAdjustBalance = (userId: string) => {
        const newPointsStr = prompt(`Enter new point balance for user ${users[userId].name}:`);
        if (newPointsStr) {
            const newPoints = parseInt(newPointsStr, 10);
            if (!isNaN(newPoints)) {
                communityService.adjustUserPoints(userId, newPoints);
                alert('Balance updated.');
                setRefreshTrigger(prev => prev + 1);
            } else {
                alert('Invalid number.');
            }
        }
    };

    const handleSetRate = () => {
        communityService.setConversionRate(conversionRate);
        alert(`Conversion rate set to 1 point = ₦${conversionRate}`);
        setRefreshTrigger(prev => prev + 1);
    };
    
    const handleSettingsChange = (newSettings: CommunityAdminSettings) => {
        setAdminSettings(newSettings);
        communityService.saveAdminSettings(newSettings);
    };

    const handleTriggerWeeklyPost = () => {
        playSound('click');
        communityService.triggerWeeklyTopUsersPost();
    }

    const renderRequests = () => {
        const pendingRequests = requests.filter(r => r.status === 'pending');
        return (
            <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                    <p className="text-gray-500 text-center">{t('community.adminPanel.noPendingRequests')}</p>
                ) : (
                    pendingRequests.map(req => (
                        <div key={req.id} className="bg-gray-50 p-4 rounded-lg border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <p className="font-bold">{req.userName} <span className="text-sm font-normal text-gray-600">({req.userId})</span></p>
                                <p>Requests <span className="font-semibold">{req.amountPoints}pts</span> (₦{req.amountCash})</p>
                                <p className="text-xs text-gray-500">{req.method}: {req.details}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => handleProcessRequest(req.id, 'approved')} className="bg-green-500 text-white font-semibold py-1 px-3 rounded-md text-sm hover:bg-green-600">{t('community.adminPanel.approve')}</button>
                                <button onClick={() => handleProcessRequest(req.id, 'rejected')} className="bg-red-500 text-white font-semibold py-1 px-3 rounded-md text-sm hover:bg-red-600">{t('community.adminPanel.reject')}</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };
    
    const renderUsers = () => (
        <div className="space-y-3">
             {Object.entries(users).map(([id, data]) => {
                const user = data as { name: string; points: number };
                return (
                    <div key={id} className="bg-gray-50 p-3 rounded-lg border flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-gray-600">{id}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="font-bold text-lg text-green-600">{user.points} pts</p>
                            <button onClick={() => handleAdjustBalance(id)} className="bg-blue-100 text-blue-700 font-semibold py-1 px-3 rounded-md text-sm hover:bg-blue-200">{t('community.adminPanel.adjustBalance')}</button>
                        </div>
                    </div>
                );
             })}
        </div>
    );
    
    const renderSettings = () => {
        const totalUsers = Object.keys(users).length;
        // FIX: Operator '+' cannot be applied to types 'unknown' and 'number'.
        // By casting the array from Object.values, we ensure the 'user' parameter in reduce is correctly typed.
        const totalPoints = (Object.values(users) as Array<{ points: number }>).reduce((sum, user) => sum + user.points, 0);

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border text-center">
                        <h4 className="text-sm font-medium text-gray-500">{t('community.adminPanel.totalUsers')}</h4>
                        <p className="text-3xl font-bold">{totalUsers}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border text-center">
                        <h4 className="text-sm font-medium text-gray-500">{t('community.adminPanel.totalPoints')}</h4>
                        <p className="text-3xl font-bold">{totalPoints.toLocaleString()}</p>
                    </div>
                </div>
                <div>
                    <label htmlFor="conversion-rate" className="block text-sm font-medium text-gray-700 mb-1">{t('community.adminPanel.conversionRate')}</label>
                    <div className="flex gap-2">
                        <input
                            id="conversion-rate"
                            type="number"
                            step="0.1"
                            value={conversionRate}
                            onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                            className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                        />
                        <button onClick={handleSetRate} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700">{t('community.adminPanel.update')}</button>
                    </div>
                </div>
                 <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('community.adminPanel.telegramNotifications')}</h3>
                     <ToggleSwitch
                        id="tele-notifications"
                        label={t('community.adminPanel.enableTeleNotifications')}
                        description={t('community.adminPanel.enableTeleNotificationsDesc')}
                        checked={adminSettings.enableTelegramNotifications}
                        onChange={(checked) => handleSettingsChange({ ...adminSettings, enableTelegramNotifications: checked })}
                    />
                    <button
                        onClick={handleTriggerWeeklyPost}
                        className="mt-4 w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        {t('community.adminPanel.triggerWeeklyPost')}
                    </button>
                </div>
            </div>
        );
    };

    const TabButton: React.FC<{ tab: AdminTab, label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 font-semibold border-b-2 ${activeTab === tab ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-6">{t('community.adminPanel.title')}</h2>
                <div className="flex justify-around border-b mb-6">
                    <TabButton tab="requests" label={t('community.adminPanel.redemptionRequests')} />
                    <TabButton tab="users" label={t('community.adminPanel.userManagement')} />
                    <TabButton tab="settings" label={t('community.adminPanel.settings')} />
                </div>
                <div>
                    {activeTab === 'requests' && renderRequests()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'settings' && renderSettings()}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
