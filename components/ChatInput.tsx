import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MicrophoneIcon, SendIcon, PaperclipIcon, CloseIcon } from '../constants';
import { playSound } from '../services/audioService';

// Add type definitions for the Web Speech API to resolve TypeScript errors.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
  // FIX: The 'abort' method was missing from the SpeechRecognition interface definition, causing a TypeScript error.
  abort: () => void;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

interface ChatInputProps {
  onSendMessage: (message: string, image?: { data: string; mimeType: string }) => void;
  isLoading: boolean;
  onNewChat: () => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
};

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [placeholder, setPlaceholder] = useState(t('chatInput.placeholder'));
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPlaceholder(isRecording ? t('chatInput.listening') : t('chatInput.placeholder'));
  }, [isRecording, t]);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [imagePreview]);

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if ((!trimmedInput && !imageFile) || isLoading) return;

    playSound('click');

    if (imageFile) {
      try {
        const base64Data = await blobToBase64(imageFile);
        onSendMessage(trimmedInput, { data: base64Data, mimeType: imageFile.type });
      } catch (error) {
        console.error("Error reading image file:", error);
        // Optionally show an error message to the user here
        return;
      }
    } else {
      onSendMessage(trimmedInput);
    }

    setInput('');
    handleRemoveImage();
  }, [input, imageFile, isLoading, onSendMessage, handleRemoveImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleRemoveImage(); // Clear previous selection
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = i18n.language; // Use current language for speech recognition

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      const defaultPlaceholder = t('chatInput.placeholder');
      if (event.error === 'no-speech') {
        setPlaceholder(t('chatInput.noSpeechError'));
        setTimeout(() => setPlaceholder(defaultPlaceholder), 3000);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setInput(prev => prev + finalTranscript);
      if (interimTranscript) {
          setInput(finalTranscript + interimTranscript);
      }

      if (finalTranscript) {
          setTimeout(() => {
              const messageToSend = finalTranscript.trim();
              onSendMessage(messageToSend);
              setInput('');
          }, 500);
      }
    };

    recognitionRef.current = recognition;
    
    // Update lang if app language changes
    return () => {
        recognition.abort();
    }

  }, [onSendMessage, i18n.language, t]);

  const toggleRecording = () => {
    playSound('click');
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-7xl mx-auto">
        {imagePreview && (
          <div className="mb-2 relative w-fit">
            <img src={imagePreview} alt="Selected preview" className="max-h-40 rounded-lg shadow-md" />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1.5 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-lg"
              aria-label={t('chatInput.removeImage')}
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 bg-gray-100 border border-gray-300 rounded-xl p-2 transition-all focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <button
                onClick={handleAttachClick}
                className={'p-2 rounded-full transition-colors hover:bg-gray-200 text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}
                aria-label={t('chatInput.attachImage')}
                disabled={isLoading}
            >
                <PaperclipIcon className="w-6 h-6" />
            </button>
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 bg-transparent resize-none focus:outline-none p-2 max-h-48"
                rows={1}
                disabled={isLoading}
                aria-label="Chat input"
            />
            <button
                onClick={toggleRecording}
                className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    isRecording ? 'bg-red-500 text-white' : 'hover:bg-gray-200 text-gray-600'
                }`}
                aria-label={isRecording ? t('chatInput.stopRecording') : t('chatInput.startRecording')}
                disabled={isLoading}
            >
                <MicrophoneIcon className="w-6 h-6" />
            </button>
            <button
                onClick={handleSendMessage}
                disabled={(!input.trim() && !imageFile) || isLoading}
                className="p-2 bg-green-600 text-white rounded-full disabled:bg-green-300 disabled:cursor-not-allowed hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                aria-label={t('chatInput.sendMessage')}
            >
                <SendIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
