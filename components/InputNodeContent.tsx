import React, { useRef, memo } from 'react';
import { Upload } from './ui/Icons';

interface InputNodeContentProps {
  image: string | null;
  onImageUpload: (base64: string) => void;
  onPreview: (image: string) => void;
}

export const InputNodeContent: React.FC<InputNodeContentProps> = memo(({ image, onImageUpload, onPreview }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onImageUpload(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div 
        className="relative flex-1 bg-slate-100 dark:bg-slate-900 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center group cursor-pointer transition-colors"
        onClick={(e) => {
            if (image) {
                onPreview(image);
            } else {
                fileInputRef.current?.click();
            }
        }}
      >
        {image ? (
          <img src={image} alt="Input" className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
            <Upload size={24} />
            <span className="text-xs">Click to upload</span>
          </div>
        )}
        
        {image && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
            <span className="text-xs font-medium">Click to Preview</span>
            <button 
                className="px-3 py-1 bg-blue-600 rounded-full text-[10px] hover:bg-blue-500"
                onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                }}
            >
                Change Image
            </button>
          </div>
        )}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
});