import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CommunityPost, UserProfile } from '../types';
import { communityService } from '../services/communityService';
import PostCard from './PostCard';
import { ImageIcon, CloseIcon } from '../constants';
import { playSound } from '../services/audioService';


interface CommunityFeedProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const CommunityFeed: React.FC<CommunityFeedProps> = ({ userProfile, setUserProfile }) => {
    const { t } = useTranslation();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPosts(communityService.fetchPosts());
    }, []);

    const handleAddPost = async () => {
        if (!newPostContent.trim() && !imageFile) return;
        playSound('send');

        let imageUrl;
        if (imageFile) {
            imageUrl = await blobToDataURL(imageFile);
        }

        const newPost = communityService.addPost(newPostContent, imageUrl, userProfile);
        setPosts(prev => [newPost, ...prev]);
        setNewPostContent('');
        handleRemoveImage();
        
        // Update points in the parent state
        setUserProfile(prev => prev ? { ...prev, communityPoints: communityService.getUserPoints(userProfile)} : null);
    };
    
    const handleToggleLike = (postId: string) => {
        const updatedPost = communityService.toggleLike(postId, userProfile);
        if (updatedPost) {
            setPosts(posts.map(p => p.id === postId ? updatedPost : p));
             // Update points in the parent state
            setUserProfile(prev => prev ? { ...prev, communityPoints: communityService.getUserPoints(userProfile)} : null);
        }
    };

    const handleAddComment = (postId: string, comment: string): boolean => {
        const updatedPost = communityService.addComment(postId, comment, userProfile);
        if (updatedPost) {
            setPosts(posts.map(p => p.id === postId ? updatedPost : p));
            setUserProfile(prev => prev ? { ...prev, communityPoints: communityService.getUserPoints(userProfile)} : null);
            return true;
        }
        return false;
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleRemoveImage = () => {
        setImageFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="p-4 space-y-4">
            {/* Create Post */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <textarea
                    className="w-full border-0 p-2 focus:ring-0 resize-none text-gray-800"
                    rows={3}
                    placeholder={t('community.postPlaceholder', { name: userProfile.name })}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                />
                 {imagePreview && (
                    <div className="mt-2 relative w-fit">
                        <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
                        <button
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1.5 hover:bg-black"
                            aria-label={t('imageStudio.removeImage')}
                        >
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-full" aria-label={t('community.uploadImage')}>
                        <ImageIcon className="w-5 h-5"/>
                    </button>
                    <button
                        onClick={handleAddPost}
                        disabled={!newPostContent.trim() && !imageFile}
                        className="bg-green-600 text-white font-semibold py-2 px-4 rounded-full text-sm hover:bg-green-700 disabled:bg-green-300"
                    >
                        {t('community.postButton')}
                    </button>
                </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
                {posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        currentUser={userProfile}
                        onToggleLike={handleToggleLike}
                        onAddComment={handleAddComment}
                    />
                ))}
            </div>
        </div>
    );
};

export default CommunityFeed;
