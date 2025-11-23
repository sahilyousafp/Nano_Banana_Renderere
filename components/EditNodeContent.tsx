import React, { useState, useRef, useEffect, memo } from 'react';
import { RenderPreset } from '../types';
import { Wand2, Layers, Brush, Eraser, Trash2, Sliders } from './ui/Icons';

interface EditNodeContentProps {
  inputImage: string | null;
  onGenerate: (prompt: string, maskData: string | null, settings: any) => void;
  isGenerating: boolean;
  onPreview: (image: string) => void;
}

export const EditNodeContent: React.FC<EditNodeContentProps> = memo(({ inputImage, onGenerate, isGenerating, onPreview }) => {
  const [prompt, setPrompt] = useState('');
  const [preset, setPreset] = useState<RenderPreset>(RenderPreset.DEFAULT);
  const [fixGeometry, setFixGeometry] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState(20);
  const [hasMask, setHasMask] = useState(false);
  const [creativity, setCreativity] = useState(0.5);
  
  // Dimensions for the image/canvas wrapper
  const [dims, setDims] = useState({ width: 0, height: 0, top: 0, left: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Resize Observer to keep canvas aligned with image
  useEffect(() => {
    if (!containerRef.current || !inputImage) return;

    const updateDimensions = () => {
        const container = containerRef.current;
        if (!container) return;
        
        const img = imageRef.current;
        if (!img) return;

        // Calculate aspect ratios
        const containerAspect = container.clientWidth / container.clientHeight;
        const imgAspect = img.naturalWidth / img.naturalHeight;

        let w, h, t, l;

        if (containerAspect > imgAspect) {
            // Container is wider than image: Image constrained by height
            h = container.clientHeight;
            w = h * imgAspect;
            t = 0;
            l = (container.clientWidth - w) / 2;
        } else {
            // Container is taller than image: Image constrained by width
            w = container.clientWidth;
            h = w / imgAspect;
            l = 0;
            t = (container.clientHeight - h) / 2;
        }

        setDims({ width: w, height: h, top: t, left: l });

        // Resize canvas resolution to match display size for 1:1 drawing
        if (canvasRef.current) {
            // We only resize if resolution significantly differs to avoid clear flicker during drag
            if (canvasRef.current.width !== Math.floor(w) || canvasRef.current.height !== Math.floor(h)) {
                 canvasRef.current.width = w;
                 canvasRef.current.height = h;
                 // Note: Resizing clears canvas.
                 setHasMask(false); 
            }
        }
    };

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    
    // Also trigger on image load
    if (imageRef.current) {
        imageRef.current.onload = updateDimensions;
    }

    return () => observer.disconnect();
  }, [inputImage]);

  const startDrawing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Explicitly stop propagation to prevent dragging the node
    if (!inputImage) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Coordinates relative to canvas
    // getBoundingClientRect returns size including scale transforms from parent
    const rect = canvas.getBoundingClientRect();
    
    // Scale factor between internal resolution and displayed (screen) size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    
    if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    setHasMask(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      e.preventDefault();
      stopDrawing(e);
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.beginPath();
      }
  }

  const clearMask = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          setHasMask(false);
      }
  };

  const handleGenerate = () => {
    let finalPrompt = prompt;
    if (preset !== RenderPreset.DEFAULT) {
        finalPrompt += `. Style: ${preset}`;
    }
    if (fixGeometry) {
        finalPrompt += ". Maintain the main geometry of the scene strictly, only update the environment, lighting, and materials.";
    }
    if (hasMask) {
        finalPrompt += ". Apply changes specifically to the highlighted red region.";
    }

    let maskData = null;
    if (hasMask && canvasRef.current) {
        maskData = canvasRef.current.toDataURL('image/png');
    }

    onGenerate(finalPrompt, maskData, { fixGeometry, preset, creativity });
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Image Preview & Canvas */}
      <div 
        ref={containerRef}
        className="relative flex-1 bg-slate-950 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 select-none group min-h-[160px]"
        onClick={() => inputImage && !hasMask && onPreview(inputImage)}
      >
        {inputImage ? (
          <>
            {/* Hidden source for aspect calculation */}
            <img ref={imageRef} src={inputImage} className="hidden" alt="Calc" />
            
            <div 
                style={{
                    position: 'absolute',
                    top: dims.top,
                    left: dims.left,
                    width: dims.width,
                    height: dims.height
                }}
            >
                <img src={inputImage} alt="Target" className="w-full h-full" />
                <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 cursor-crosshair"
                    style={{ touchAction: 'none' }} 
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
            </div>

             <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-1 z-10">
                <button 
                    onClick={(e) => { e.stopPropagation(); setTool('brush'); }}
                    className={`p-1 rounded ${tool === 'brush' ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                    title="Brush"
                >
                    <Brush size={14} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setTool('eraser'); }}
                    className={`p-1 rounded ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                    title="Eraser"
                >
                    <Eraser size={14} />
                </button>
                <button 
                    onClick={clearMask}
                    className="p-1 rounded text-slate-300 hover:bg-red-500/50 hover:text-white"
                    title="Clear Mask"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            {!hasMask && (
                 <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
                     Click empty area to Preview
                 </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            Connect Image Input Node
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Style Preset</label>
                <select 
                    value={preset} 
                    onChange={(e) => setPreset(e.target.value as RenderPreset)}
                    className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded p-1.5 focus:outline-none focus:border-blue-500 transition-colors"
                >
                {Object.values(RenderPreset).map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
                </select>
            </div>
            
            <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Creativity</label>
                    <span className="text-[10px] text-blue-500 dark:text-blue-400">{Math.round(creativity * 100)}%</span>
                </div>
                <div className="flex items-center h-[30px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 transition-colors">
                     <Sliders size={12} className="text-slate-400 dark:text-slate-500 mr-2" />
                     <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1"
                        value={creativity}
                        onChange={(e) => setCreativity(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                     />
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 py-1">
            <input 
                type="checkbox" 
                id="geo-fix"
                checked={fixGeometry}
                onChange={(e) => setFixGeometry(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-blue-500 focus:ring-0 w-3 h-3"
            />
            <label htmlFor="geo-fix" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                Fix Geometry (Env. Only)
            </label>
        </div>

        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe changes (e.g., 'Add warm sunset lighting')..."
            className="w-full h-16 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-xs text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-600 transition-colors"
        />

        <button
            onClick={handleGenerate}
            disabled={isGenerating || !inputImage || !prompt}
            className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-all
            ${isGenerating || !inputImage || !prompt 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20'}`}
        >
            {isGenerating ? (
            <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
            </>
            ) : (
            <>
                <Wand2 size={16} />
                <span>Generate Render</span>
            </>
            )}
        </button>
      </div>
    </div>
  );
});