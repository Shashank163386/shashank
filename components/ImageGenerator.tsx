import React, { useState, useRef } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { ImageIcon, DownloadIcon, CameraIcon, ClearIcon } from './Icons';
import { TranslationKey } from '../translations';

interface ImageGeneratorProps {
    t: (key: TranslationKey) => string;
}

const LoadingSpinner: React.FC<{ t: (key: TranslationKey) => string }> = ({ t }) => (
    <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-400 dark:border-slate-600 border-t-cyan-500 dark:border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="text-slate-300 dark:text-slate-400">{t('generatingMessage')}</p>
    </div>
);

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ t }) => {
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // State for camera and image editing
    const [sourceImage, setSourceImage] = useState<{data: string, mimeType: string} | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraOpen(true);
                setSourceImage(null);
                setImageUrl(null);
                setError(null);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(t('cameraError'));
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        if (video) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const mimeType = 'image/jpeg';
            const dataUrl = canvas.toDataURL(mimeType, 0.9);
            const base64Data = dataUrl.split(',')[1];
            
            setSourceImage({ data: base64Data, mimeType });
            stopCamera();
        }
    };
    
    const clearSourceImage = () => {
        setSourceImage(null);
        setImageUrl(null);
        setError(null);
        setPrompt('');
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setImageUrl(null);
        setError(null);
        
        let result: string | null;
        if (sourceImage) {
            result = await editImage(sourceImage.data, sourceImage.mimeType, prompt);
        } else {
            result = await generateImage(prompt);
        }

        if(result) {
            setImageUrl(result);
        } else {
            setError(sourceImage ? t('editError') : t('imageGenError'));
        }

        setIsLoading(false);
    };
    
    const isEditing = sourceImage !== null;

    return (
        <div className="h-full bg-transparent flex flex-col items-center justify-center p-4 md:p-6 transition-colors duration-300">
            <div className="w-full max-w-2xl bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-8">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-white">{t('imageGenTitle')}</h2>
                    <p className="text-slate-300 dark:text-slate-400 mt-2">{t('imageGenSubtitle')}</p>
                </div>
                
                <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-2 mb-8">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={isEditing ? t('imageEditPlaceholder') : t('imageGenPlaceholder')}
                        className="flex-grow bg-slate-800/50 dark:bg-slate-900/50 border border-slate-500/30 dark:border-slate-600/50 rounded-lg py-3 px-4 text-slate-100 placeholder-slate-300 dark:placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={startCamera}
                        disabled={isLoading}
                        className="flex-shrink-0 flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-indigo-500 disabled:bg-slate-500/50 dark:disabled:bg-slate-600/50 disabled:cursor-not-allowed transition-colors"
                        title={t('takePhoto')}
                    >
                       <CameraIcon className="w-5 h-5"/>
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="flex items-center justify-center gap-2 bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-cyan-500 disabled:bg-slate-500/50 dark:disabled:bg-slate-600/50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ImageIcon className="w-5 h-5"/>
                        {isEditing ? t('editButton') : t('generateButton')}
                    </button>
                </form>

                <div className="w-full aspect-square bg-slate-900/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-500/30 dark:border-slate-700/50 overflow-hidden">
                    {isCameraOpen ? (
                        <div className="relative w-full h-full bg-black">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                                <button onClick={capturePhoto} className="px-6 py-2 bg-cyan-500 text-white font-bold rounded-full hover:bg-cyan-400">{t('capture')}</button>
                                <button onClick={stopCamera} className="px-6 py-2 bg-slate-700 text-white font-bold rounded-full hover:bg-slate-600">{t('cancel')}</button>
                            </div>
                        </div>
                    ) : isLoading ? (
                        <LoadingSpinner t={t} />
                    ) : error ? (
                        <p className="text-red-500 dark:text-red-400 p-4 text-center">{error}</p>
                    ) : imageUrl ? (
                        <div className="relative group w-full h-full">
                            <img src={imageUrl} alt={prompt} className="object-contain w-full h-full rounded-lg" />
                            <a 
                                href={imageUrl} 
                                download={`nirmana-art-${Date.now()}.jpeg`}
                                className="absolute bottom-4 right-4 bg-slate-900/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-cyan-600"
                                title="Download Image"
                            >
                                <DownloadIcon className="w-6 h-6"/>
                            </a>
                        </div>
                    ) : sourceImage ? (
                        <div className="relative group w-full h-full">
                           <img src={`data:${sourceImage.mimeType};base64,${sourceImage.data}`} alt="Captured source" className="object-contain w-full h-full rounded-lg" />
                           <button 
                                onClick={clearSourceImage}
                                className="absolute top-4 right-4 bg-slate-900/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600"
                                title={t('clearPhoto')}
                            >
                               <ClearIcon className="w-5 h-5"/>
                           </button>
                        </div>
                    ) : (
                        <div className="text-slate-400 dark:text-slate-500 text-center p-4">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4"/>
                            <p>{t('imageGenDefaultText')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageGenerator;