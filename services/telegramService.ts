import { CommunityAdminSettings, LeaderboardEntry } from '../types';

const RATEL_COMMUNITY_GROUP_ID = '-1001234567890'; // Simulated group ID
const ADMIN_SETTINGS_KEY = 'ratel_admin_settings';


// Simulate Google Sheet logging
const logToGoogleSheet = (log: { timestamp: string, username: string, action: string, details: string }) => {
    console.log(`[GOOGLE SHEET LOG]`, log);
};

// Simulate checking if notifications are enabled
const areNotificationsEnabled = (): boolean => {
    try {
        const settingsJson = localStorage.getItem(ADMIN_SETTINGS_KEY);
        if (settingsJson) {
            const settings: CommunityAdminSettings = JSON.parse(settingsJson);
            return settings.enableTelegramNotifications;
        }
    } catch(e) {
        console.error("Failed to parse admin settings", e);
    }
    return true; // Default to enabled
};

export const telegramService = {
    sendRewardEarned: (username: string | undefined, points: number) => {
        if (!areNotificationsEnabled() || !username) return;
        const message = `🎉 Congrats @${username}! You earned ${points} points for your recent activity. Keep going!`;
        console.log(`[TELEGRAM MSG to @${username}]`, message);
        logToGoogleSheet({
            timestamp: new Date().toISOString(),
            username,
            action: 'REWARD_EARNED',
            details: `Earned ${points} points`
        });
    },

    sendRedeemRequestSubmitted: (username: string | undefined, amount: number) => {
        if (!areNotificationsEnabled() || !username) return;
        const message = `💰 Hi @${username}! We received your withdrawal request of ₦${amount}. Please wait for admin approval.`;
        console.log(`[TELEGRAM MSG to @${username}]`, message);
        logToGoogleSheet({
            timestamp: new Date().toISOString(),
            username,
            action: 'REDEEM_REQUEST_SUBMITTED',
            details: `Requested ₦${amount}`
        });
    },

    sendPayoutApproved: (username: string | undefined, amount: number) => {
        if (!areNotificationsEnabled() || !username) return;
        const message = `✅ Hello @${username}! Your withdrawal of ₦${amount} has been approved and sent to your account. Thank you for being part of Ratel AI Community.`;
        console.log(`[TELEGRAM MSG to @${username}]`, message);
        logToGoogleSheet({
            timestamp: new Date().toISOString(),
            username,
            action: 'PAYOUT_APPROVED',
            details: `Approved ₦${amount}`
        });
    },

    sendRequestRejected: (username: string | undefined) => {
        if (!areNotificationsEnabled() || !username) return;
        const message = `⚠️ Hello @${username}, your redeem request was declined. Please check your wallet balance or contact support.`;
        console.log(`[TELEGRAM MSG to @${username}]`, message);
         logToGoogleSheet({
            timestamp: new Date().toISOString(),
            username,
            action: 'REQUEST_REJECTED',
            details: `Redemption request was rejected.`
        });
    },
    
    sendWeeklyTopUsers: (leaderboard: LeaderboardEntry[]) => {
        if (!areNotificationsEnabled()) return;
        const top3 = leaderboard.slice(0, 3);
        if (top3.length === 0) {
            console.log("[TELEGRAM] No users in leaderboard to post.");
            return;
        }
        
        let message = `🏆 Ratel AI Weekly Champions!\n`;
        top3.forEach((user, index) => {
            message += `${['1️⃣', '2️⃣', '3️⃣'][index]} ${user.name} - ${user.points} points\n`;
        });
        message += `Keep earning and growing with Ratel Family 💪🔥`;
        
        console.log(`[TELEGRAM MSG to Group ${RATEL_COMMUNITY_GROUP_ID}]`, message);
         logToGoogleSheet({
            timestamp: new Date().toISOString(),
            username: 'SYSTEM',
            action: 'WEEKLY_RANKING_POSTED',
            details: `Posted top 3 users to the group.`
        });
    }
};