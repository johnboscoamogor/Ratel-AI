// A placeholder video URL for simulation.
// This is a free-to-use video from Pexels.
const PLACEHOLDER_VIDEO_URL = 'https://videos.pexels.com/video-files/3209828/3209828-hd_1280_720_25fps.mp4';

/**
 * Simulates a call to an external video generation API to ensure reliability.
 * In a real application, you would replace this with a fetch call to your chosen API endpoint.
 * @param prompt The text prompt to generate the video from.
 * @returns A promise that resolves to the URL of the generated video.
 */
export const generateVideoFromExternalApi = (prompt: string): Promise<string> => {
    console.log(`Simulating external video generation for prompt: "${prompt}"`);

    return new Promise((resolve) => {
        // Simulate network delay and generation time (e.g., 5 seconds).
        // This makes the loading experience feel more realistic.
        setTimeout(() => {
            console.log('Video generation simulation complete.');
            resolve(PLACEHOLDER_VIDEO_URL);
        }, 5000);
    });
};