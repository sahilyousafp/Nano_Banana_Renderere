import React, { memo } from 'react';
import { Download, Maximize2 } from './ui/Icons';

interface OutputNodeContentProps {
  image: string | null;
  onPreview: (image: string) => void;
}

export const OutputNodeContent: React.FC<OutputNodeContentProps> = memo(({ image, onPreview }) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (image) {
      const link = document.createElement('a');
      link.href = image;
      link.download = `lumion-gen-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div 
        className="relative flex-1 bg-slate-100 dark:bg-slate-950 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center group cursor-pointer transition-colors"
        onClick={() => image && onPreview(image)}
      >
        {image ? (
          <>
            <img src={image} alt="Result" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
               <button 
                 onClick={handleDownload}
                 className="p-2 bg-slate-800 rounded-full text-white hover:bg-blue-600 transition-colors"
                 title="Download"
               >
                 <Download size={18} />
               </button>
               <button 
                 onClick={(e) => {
                    e.stopPropagation();
                    onPreview(image);
                 }}
                 className="p-2 bg-slate-800 rounded-full text-white hover:bg-blue-600 transition-colors"
                 title="View Full"
               >
                 <Maximize2 size={18} />
               </button>
            </div>
          </>
        ) : (
          <div className="text-slate-400 dark:text-slate-600 text-xs">Waiting for render...</div>
        )}
      </div>
      
      {image && (
        <div className="flex justify-between items-center px-1 shrink-0">
             <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Output Ready</span>
        </div>
      )}
    </div>
  );
});