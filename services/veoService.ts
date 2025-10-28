import {
  GeneratedVideo,
} from '@google/genai';
import { GenerateVideoParams } from '../veoTypes';

export const generateVideo = async (
  params: GenerateVideoParams,
): Promise<{objectUrl: string; blob: Blob; uri: string; generatedVideo: GeneratedVideo}> => {
  console.log('Sending video generation request to backend with params:', params);

  const response = await fetch('/api/veo/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || 'Video generation failed on the backend.');
  }

  const result = await response.json();

  // The backend now returns a data URL. We need to convert it back to a blob for the VideoResult component.
  const blobResponse = await fetch(result.objectUrl);
  const blob = await blobResponse.blob();

  return {
      objectUrl: result.objectUrl,
      blob: blob,
      uri: '', // The original URI is now hidden by the backend.
      generatedVideo: result.generatedVideo
  };
};
