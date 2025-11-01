import { Video } from '@google/genai';

// FIX: Added type definitions for video generation parameters.
export enum Resolution {
  P1080 = '1080p',
  P720 = '720p',
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum GenerationMode {
  TEXT_TO_VIDEO = 'text-to-video',
  IMAGE_ANIMATION = 'image-animation',
  FRAMES_TO_VIDEO = 'frames-to-video',
  REFERENCES_TO_VIDEO = 'references-to-video',
  EXTEND_VIDEO = 'extend-video',
}

// Representing a file selected by the user
export interface Frame {
  file: File;
  base64: string;
}

export interface GenerateVideoParams {
  mode: GenerationMode;
  model: string;
  prompt: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  startFrame?: Frame;
  endFrame?: Frame;
  isLooping?: boolean;
  referenceImages?: Frame[];
  styleImage?: Frame;
  inputVideoObject?: Video;
}
