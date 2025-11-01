import React, { useState } from 'react';
import { GenerateVideoParams, Resolution, AspectRatio, GenerationMode } from '../veoTypes';

interface VeoPromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  initialValues?: GenerateVideoParams | null;
}

// FIX: Provided an implementation for the missing VeoPromptForm component.
const VeoPromptForm: React.FC<VeoPromptFormProps> = ({ onGenerate, initialValues }) => {
  const [prompt, setPrompt] = useState(initialValues?.prompt || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: GenerateVideoParams = {
      // Use initial values or defaults
      ...initialValues,
      prompt,
      mode: initialValues?.mode || GenerationMode.TEXT_TO_VIDEO,
      model: 'veo-3.1-fast-generate-preview',
      resolution: initialValues?.resolution || Resolution.P720,
      aspectRatio: initialValues?.aspectRatio || AspectRatio.LANDSCAPE,
    } as GenerateVideoParams;
    onGenerate(params);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="A neon hologram of a cat driving at top speed..."
        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-white"
        rows={3}
      />
      <button
        type="submit"
        disabled={!prompt.trim()}
        className="w-full py-3 px-6 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors"
      >
        Generate Video
      </button>
    </form>
  );
};

export default VeoPromptForm;
