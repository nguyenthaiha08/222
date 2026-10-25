export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '4:1' | '1:4';
export type ImageSize = '1K' | '2K' | '4K';
export type GenerationStatus = 'idle' | 'queued' | 'generating' | 'completed' | 'error';

export interface PromptFile {
  id: string;
  name: string;
  content: string;
  lastModified: number;
  splitByLine?: boolean;
}

export interface PromptTask {
  id: string;
  fileId: string;
  fileName: string;
  prompt: string;
  indexInFile: number;
  status: GenerationStatus;
  imageUrl?: string;
  modelUsed?: string;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  generatedAt?: number;
  errorMessage?: string;
  keyUsed?: {
    index: number;
    totalKeys: number;
    masked: string;
    rotated?: boolean;
  };
}

export interface GenerationConfig {
  model: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  stylePreset: string;
  negativePrompt: string;
  useImageSearch: boolean;
  concurrency: number;
}
