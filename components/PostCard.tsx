import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CommunityPost, UserProfile } from '../types';
import { UserIcon } from '../constants';
import { playSound } from '../services/audioService';

interface PostCardProps {
  post: CommunityPost;
  currentUser: UserProfile;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, comment: string) => boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onToggleLike, onAddComment }) => {
    const { t } = useTranslation();
    const [isCommentsVisible, setIsCommentsVisible] = useState(false);
    const [newComment, setNewComment] = useState('');
    
    const hasLiked = post.likes.includes(currentUser.email);
    
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            const success = onAddComment(post.id, newComment.trim());
            if(success) {
                setNewComment('');
                setIsCommentsVisible(true);
            }
        }
    };
    
    const timeAgo = (timestamp: number): string => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m";
        return Math.floor(seconds) + "s";
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4">
                <div className="flex items-center mb-3">
                     <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <UserIcon className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-800">{post.authorName} {post.source === 'telegram' && <span className="text-xs font-normal text-gray-500">({t('community.fromTelegram')})</span>}</p>
                        <p className="text-xs text-gray-500">{timeAgo(post.timestamp)}</p>
                    </div>
                </div>
                
                <p className="text-gray-700 whitespace-pre-wrap mb-3">{post.content}</p>

                {post.imageUrl && <img src={post.imageUrl} alt="Post content" className="mt-3 rounded-lg max-h-96 w-full object-cover border" />}
            </div>

            <div className="px-4 pb-2">
                 <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{post.likes.length > 0 && `${post.likes.length} Likes`}</span>
                    <span>{post.comments.length > 0 && `${post.comments.length} Comments`}</span>
                </div>
            </div>

            <div className="flex justify-around border-t border-gray-200">
                <button
                    onClick={() => { playSound('click'); onToggleLike(post.id); }}
                    className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                        hasLiked ? 'text-green-600' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.563 8H12V4a2 2 0 00-2-2l-3.5 4.5V10.333z" />
                    </svg>
                    {hasLiked ? t('community.likedByYou') : t('community.like')}
                </button>
                 <button
                    onClick={() => { playSound('click'); setIsCommentsVisible(!isCommentsVisible); }}
                    className="flex-1 py-2 text-sm font-semibold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                    </svg>
                    {t('community.comment')}
                </button>
            </div>
            
            {isCommentsVisible && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {post.comments.sort((a,b) => a.timestamp - b.timestamp).map(comment => (
                             <div key={comment.id} className="flex items-start">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0">
                                    <UserIcon className="w-5 h-5 text-gray-500" />
                                </div>
                                <div className="bg-gray-200 p-2 rounded-lg">
                                    <p className="font-semibold text-sm text-gray-800">{comment.authorName}</p>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleCommentSubmit} className="mt-4 flex items-center gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t('community.commentPlaceholder')}
                            className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-green-500 focus:border-green-500 block py-1.5 px-3"
                        />
                        <button type="submit" className="text-sm font-semibold text-green-600 hover:underline">Post</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PostCard;
