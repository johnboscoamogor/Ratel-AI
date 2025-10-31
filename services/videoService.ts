/**
 * Calls our secure backend endpoint to generate a video.
 * This function acts as the bridge between our frontend and the serverless function.
 * @param prompt The text prompt to generate the video from.
 * @returns A promise that resolves to the URL of the generated video.
 */
export const generateVideoFromExternalApi = async (prompt: string): Promise<string> => {
    console.log(`Sending prompt to our backend video generation service...`);

    try {
        const response = await fetch('/api/ratelai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'generate_video_placeholder', prompt }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate video from backend.');
        }

        const data = await response.json();
        
        if (!data.videoUrl) {
            throw new Error('Backend did not return a valid video URL.');
        }

        console.log('Video generation successful. Received URL:', data.videoUrl);
        return data.videoUrl;

    } catch (error) {
        console.error('Error calling video generation service:', error);
        // Re-throw the error so the component can catch it and display a message.
        throw error;
    }
};