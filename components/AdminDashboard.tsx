import React from 'react';
import { ChevronLeftIcon, UsersIcon } from '../constants';
import { playSound } from '../services/audioService';

interface AdminDashboardProps {
    onBack: () => void;
}

const StatCard: React.FC<{ title: string; value: string; description: string }> = ({ title, value, description }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-2">{description}</p>
    </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {

    const handleBackClick = () => {
        playSound('click');
        onBack();
    };

    // Simulated data
    const totalUsers = "1,428";
    const groupGrowth = "+12%";
    const totalEarnings = "₦54,300";

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <header className="flex items-center mb-8">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-gray-200 mr-4">
                  <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </header>

            <main>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total Users" value={totalUsers} description="All signed-up users" />
                    <StatCard title="Group Growth (7d)" value={groupGrowth} description="New members this week" />
                    <StatCard title="Total Earnings (est.)" value={totalEarnings} description="From ads & partnerships" />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Management Actions</h2>
                    <div className="flex flex-col md:flex-row gap-4">
                        <button className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            Approve Reward Claims
                        </button>
                        <button className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                            Manage Users
                        </button>
                        <button className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                            View Engagement Chart
                        </button>
                    </div>
                </div>

                {/* Placeholder for future content like tables and charts */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-700">Recent Activity</h3>
                    <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 text-center text-gray-500">
                        Activity log and charts will be displayed here.
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;