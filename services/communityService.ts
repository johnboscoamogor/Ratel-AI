import { CommunityPost, UserProfile, LeaderboardEntry, Comment, RedemptionRequest, CommunityAdminSettings } from '../types';
import { telegramService } from './telegramService';

const POSTS_KEY = 'ratel_community_posts';
const POINTS_KEY = 'ratel_all_users_community_points'; // Storing all users' points for leaderboard
const REDEMPTION_REQUESTS_KEY = 'ratel_redemption_requests';
const CONVERSION_RATE_KEY = 'ratel_conversion_rate';
const ADMIN_SETTINGS_KEY = 'ratel_admin_settings';


// --- Points Configuration ---
const POINTS_FOR_POST = 10;
const POINTS_FOR_COMMENT = 5;
const POINTS_FOR_LIKE = 2;

// --- Helper Functions ---
const getPosts = (): CommunityPost[] => {
    try {
        const postsJson = localStorage.getItem(POSTS_KEY);
        return postsJson ? JSON.parse(postsJson) : [];
    } catch (e) {
        console.error("Failed to parse community posts:", e);
        return [];
    }
};

const savePosts = (posts: CommunityPost[]) => {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
};

const getPointsData = (): Record<string, { name: string; points: number }> => {
    try {
        const pointsJson = localStorage.getItem(POINTS_KEY);
        return pointsJson ? JSON.parse(pointsJson) : {};
    } catch (e) {
        console.error("Failed to parse points data:", e);
        return {};
    }
};

const savePointsData = (pointsData: Record<string, { name: string; points: number }>) => {
    localStorage.setItem(POINTS_KEY, JSON.stringify(pointsData));
};

const getRequests = (): RedemptionRequest[] => {
    try {
        const requestsJson = localStorage.getItem(REDEMPTION_REQUESTS_KEY);
        return requestsJson ? JSON.parse(requestsJson) : [];
    } catch (e) {
        console.error("Failed to parse redemption requests:", e);
        return [];
    }
};

const saveRequests = (requests: RedemptionRequest[]) => {
    localStorage.setItem(REDEMPTION_REQUESTS_KEY, JSON.stringify(requests));
};


// --- Simulated Telegram Data ---
const getSimulatedTelegramPosts = (): CommunityPost[] => {
    return [
        {
            id: 'telegram-1',
            authorName: 'RatelAdmin (Telegram)',
            authorId: 'telegram_bot',
            content: 'Welcome to the Ratel Community on Telegram! Top posts from the app will be shared here automatically. Feel free to chat and connect!',
            imageUrl: '',
            likes: [],
            comments: [],
            timestamp: Date.now() - 86400000, // 1 day ago
            source: 'telegram',
        },
        {
            id: 'telegram-2',
            authorName: 'TeleUser123',
            authorId: 'telegram_user_123',
            content: 'This AI is amazing! Just generated a business plan for my new shoe store. So helpful!',
            imageUrl: '',
            likes: [],
            comments: [],
            timestamp: Date.now() - 3600000, // 1 hour ago
            source: 'telegram',
        }
    ];
};


// --- Service API ---

export const communityService = {
    // Pass config values
    POINTS_FOR_POST,
    POINTS_FOR_COMMENT,
    POINTS_FOR_LIKE,

    // --- Post Management ---
    fetchPosts: (): CommunityPost[] => {
        const localPosts = getPosts();
        const telegramPosts = getSimulatedTelegramPosts();
        // In a real app, you'd fetch from your backend and merge
        return [...localPosts, ...telegramPosts].sort((a, b) => b.timestamp - a.timestamp);
    },

    addPost: (content: string, imageUrl: string | undefined, author: UserProfile): CommunityPost => {
        const posts = getPosts();
        const newPost: CommunityPost = {
            id: crypto.randomUUID(),
            authorName: author.name,
            authorId: author.email,
            content,
            imageUrl,
            likes: [],
            comments: [],
            timestamp: Date.now(),
            source: 'ratel',
        };
        savePosts([newPost, ...posts]);
        communityService.updatePoints(author, POINTS_FOR_POST);
        telegramService.sendRewardEarned(author.telegramUsername, POINTS_FOR_POST);
        return newPost;
    },

    toggleLike: (postId: string, user: UserProfile): CommunityPost | null => {
        const posts = getPosts();
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return null;

        const post = posts[postIndex];
        const likeIndex = post.likes.indexOf(user.email);

        if (likeIndex > -1) {
            post.likes.splice(likeIndex, 1); // Unlike
        } else {
            post.likes.push(user.email); // Like
            communityService.updatePoints(user, POINTS_FOR_LIKE);
            telegramService.sendRewardEarned(user.telegramUsername, POINTS_FOR_LIKE);
        }

        posts[postIndex] = post;
        savePosts(posts);
        return post;
    },

    addComment: (postId: string, content: string, author: UserProfile): CommunityPost | null => {
        const posts = getPosts();
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return null;

        const newComment: Comment = {
            id: crypto.randomUUID(),
            authorName: author.name,
            authorId: author.email,
            content,
            timestamp: Date.now(),
        };

        posts[postIndex].comments.push(newComment);
        savePosts(posts);
        communityService.updatePoints(author, POINTS_FOR_COMMENT);
        telegramService.sendRewardEarned(author.telegramUsername, POINTS_FOR_COMMENT);
        return posts[postIndex];
    },

    // --- Points & Leaderboard ---
    updatePoints: (user: UserProfile, pointsToAdd: number): number => {
        const pointsData = getPointsData();
        const userId = user.email;
        if (!pointsData[userId]) {
            pointsData[userId] = { name: user.name, points: 0 };
        }
        pointsData[userId].points += pointsToAdd;
        savePointsData(pointsData);
        return pointsData[userId].points;
    },
    
    adjustUserPoints: (userId: string, newPoints: number): boolean => {
        const pointsData = getPointsData();
        if (pointsData[userId]) {
            pointsData[userId].points = newPoints;
            savePointsData(pointsData);
            return true;
        }
        return false;
    },

    getUserPoints: (user: UserProfile): number => {
        const pointsData = getPointsData();
        return pointsData[user.email]?.points || 0;
    },
    
    getLeaderboard: (): LeaderboardEntry[] => {
        const pointsData = getPointsData();
        const leaderboard = Object.entries(pointsData).map(([email, data]) => ({
            email,
            name: data.name,
            points: data.points,
        }));
        
        return leaderboard.sort((a, b) => b.points - a.points);
    },

    getAllUsersWithPoints: () => {
        return getPointsData();
    },

    // --- Redemption ---
    getConversionRate: (): number => {
        const rate = localStorage.getItem(CONVERSION_RATE_KEY);
        return rate ? parseFloat(rate) : 1; // Default: 1 point = ₦1
    },

    setConversionRate: (rate: number) => {
        localStorage.setItem(CONVERSION_RATE_KEY, rate.toString());
    },

    getRedemptionRequests: (): RedemptionRequest[] => {
        return getRequests().sort((a, b) => b.timestamp - a.timestamp);
    },

    submitRedemptionRequest: (user: UserProfile, amountPoints: number, method: 'airtime' | 'bank', details: string): { success: boolean, profile: UserProfile } => {
        const currentPoints = communityService.getUserPoints(user);
        if (amountPoints <= 0 || amountPoints > currentPoints) {
            return { success: false, profile: user };
        }

        const requests = getRequests();
        const newRequest: RedemptionRequest = {
            id: crypto.randomUUID(),
            userId: user.email,
            userName: user.name,
            telegramUsername: user.telegramUsername,
            amountPoints,
            amountCash: amountPoints * communityService.getConversionRate(),
            method,
            details,
            status: 'pending',
            timestamp: Date.now(),
        };
        requests.push(newRequest);
        saveRequests(requests);

        // Deduct points from user
        const newPointTotal = currentPoints - amountPoints;
        communityService.adjustUserPoints(user.email, newPointTotal);
        
        const updatedProfile = { 
            ...user, 
            communityPoints: newPointTotal, 
            totalRedeemed: (user.totalRedeemed || 0) + amountPoints 
        };
        
        telegramService.sendRedeemRequestSubmitted(user.telegramUsername, newRequest.amountCash);
        console.log("LOGGING TO GOOGLE SHEET (SIMULATED):", newRequest);

        return { success: true, profile: updatedProfile };
    },

    processRedemptionRequest: (requestId: string, newStatus: 'approved' | 'rejected'): boolean => {
        const requests = getRequests();
        const requestIndex = requests.findIndex(r => r.id === requestId);
        if (requestIndex === -1) return false;

        const request = requests[requestIndex];
        if (request.status !== 'pending') return false; // Already processed

        requests[requestIndex].status = newStatus;
        saveRequests(requests);

        if (newStatus === 'rejected') {
            // Refund points
            const pointsData = getPointsData();
            if (pointsData[request.userId]) {
                pointsData[request.userId].points += request.amountPoints;
                savePointsData(pointsData);
            }
            telegramService.sendRequestRejected(request.telegramUsername);
        }
        
        if (newStatus === 'approved') {
            // Here you would trigger the Flutterwave payment and Telegram notification
            telegramService.sendPayoutApproved(request.telegramUsername, request.amountCash);
            console.log(`SIMULATING PAYMENT: Triggering Flutterwave payout of ₦${request.amountCash} to ${request.userName} (${request.details})`);
            console.log(`SIMULATING TELEGRAM BOT: Sending "✅ Your withdrawal of ₦${request.amountCash} has been approved and sent." to user ${request.userName}`);
        }
        
        console.log(`UPDATING GOOGLE SHEET (SIMULATED): Request ${requestId} status changed to ${newStatus}`);

        return true;
    },
    
    // --- Admin Settings & Actions ---
    getAdminSettings: (): CommunityAdminSettings => {
        try {
            const settingsJson = localStorage.getItem(ADMIN_SETTINGS_KEY);
            return settingsJson ? JSON.parse(settingsJson) : { enableTelegramNotifications: true }; // Default
        } catch (e) {
            return { enableTelegramNotifications: true };
        }
    },
    
    saveAdminSettings: (settings: CommunityAdminSettings) => {
        localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
    },

    triggerWeeklyTopUsersPost: () => {
        const leaderboard = communityService.getLeaderboard();
        telegramService.sendWeeklyTopUsers(leaderboard);
        alert('Weekly top users post has been triggered! (Check console log for simulation)');
    },


    // --- Telegram Simulation ---
    linkTelegramAccount: (user: UserProfile, telegramUsername: string): UserProfile => {
        const updatedProfile = { ...user, telegramUsername };
        return updatedProfile;
    },

    unlinkTelegramAccount: (user: UserProfile): UserProfile => {
        const { telegramUsername, ...rest } = user;
        return rest;
    },

    shareTopPostToTelegram: (post: CommunityPost): void => {
        console.log("--- SIMULATING TELEGRAM SHARE ---");
        console.log(`Sharing post by ${post.authorName} to 'Ratel Community' Telegram group.`);
        console.log(`Content: ${post.content}`);
        if(post.imageUrl) console.log(`Image: ${post.imageUrl}`);
        console.log("---------------------------------");
    }
};