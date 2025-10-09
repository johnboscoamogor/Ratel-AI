import { CommunityPost, UserProfile, LeaderboardEntry, Comment } from '../types';

const POSTS_KEY = 'ratel_community_posts';
const POINTS_KEY = 'ratel_all_users_community_points'; // Storing all users' points for leaderboard

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
        
        return leaderboard.sort((a, b) => b.points - a.points).slice(0, 10);
    },

    // --- Telegram Simulation ---
    linkTelegramAccount: (user: UserProfile, telegramUsername: string): UserProfile => {
        const updatedProfile = { ...user, telegramUsername };
        // In a real app, this would also save to the backend. Here we just update the object.
        // The App.tsx will handle saving the userProfile object to localStorage.
        return updatedProfile;
    },

    unlinkTelegramAccount: (user: UserProfile): UserProfile => {
        const { telegramUsername, ...rest } = user;
        return rest;
    },

    shareTopPostToTelegram: (post: CommunityPost): void => {
        // SIMULATION: In a real app, this would call your backend to trigger a Telegram Bot message.
        console.log("--- SIMULATING TELEGRAM SHARE ---");
        console.log(`Sharing post by ${post.authorName} to 'Ratel Community' Telegram group.`);
        console.log(`Content: ${post.content}`);
        if(post.imageUrl) console.log(`Image: ${post.imageUrl}`);
        console.log("---------------------------------");
    }
};
