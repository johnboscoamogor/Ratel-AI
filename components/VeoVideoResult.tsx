import React from 'react';

interface VeoVideoResultProps {
  videoUrl: string;
  onRetry: () => void;
  onNewVideo: () => void;
  onExtend: () => void;
  canExtend: boolean;
}

// FIX: Provided an implementation for the missing VeoVideoResult component.
const VeoVideoResult: React.FC<VeoVideoResultProps> = ({
  videoUrl,
  onRetry,
  onNewVideo,
  onExtend,
  canExtend,
}) => {
  return (
    <div className="w-full max-w-3xl space-y-4">
      <video
        src={videoUrl}
        controls
        autoPlay
        loop
        playsInline
        className="w-full rounded-lg aspect-video bg-black"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <button
          onClick={onNewVideo}
          className="py-2 px-4 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          New Video
        </button>
        <button
          onClick={onRetry}
          className="py-2 px-4 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={onExtend}
          disabled={!canExtend}
          title={canExtend ? 'Extend this video (adds 7s)' : 'Extend is only available for 720p videos.'}
          className="col-span-2 md:col-span-1 py-2 px-4 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors"
        >
          Extend
        </button>
      </div>
    </div>
  );
};

export default VeoVideoResult;
