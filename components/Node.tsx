import React, { useRef, useState, useEffect, memo } from 'react';
import { NodeData } from '../types';
import { X } from './ui/Icons';

interface NodeProps {
  data: NodeData;
  isSelected: boolean;
  scale?: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
  onConnectStart: (nodeId: string, handleType: 'source' | 'target', e: React.MouseEvent) => void;
  onConnectEnd: (nodeId: string, handleType: 'source' | 'target') => void;
  children: React.ReactNode;
}

export const Node: React.FC<NodeProps> = memo(({ 
  data, 
  isSelected, 
  scale = 1,
  onSelect, 
  onMove,
  onResize,
  onDelete, 
  onConnectStart,
  onConnectEnd,
  children 
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const initialResize = useRef({ w: 0, h: 0, x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  // Default dimensions if not set
  const width = data.width || 320;
  const height = data.height || 'auto';

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    // onSelect(data.id); // Handled by container
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      // Calculate offset based on current transform
      // We need to know where the mouse is relative to the node's top-left corner visually
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setIsDragging(true);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(data.id);
    if (nodeRef.current) {
      setIsResizing(true);
      initialResize.current = {
        w: nodeRef.current.offsetWidth,
        h: nodeRef.current.offsetHeight,
        x: e.clientX,
        y: e.clientY
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        if (rafId.current) return; // Skip if a frame is already pending

        rafId.current = requestAnimationFrame(() => {
            // We calculate the delta in screen pixels
            // The parent (NodeCanvas) expects screen coordinates relative to the node's origin
            // But wait, our onMove implementation in NodeCanvas expects 'screenX' and calculates WorldX.
            // Our dragOffset captured (e.clientX - rect.left).
            // So e.clientX - dragOffset is the new SCREEN position of the left edge.
            const newScreenX = e.clientX - dragOffset.current.x;
            const newScreenY = e.clientY - dragOffset.current.y;
            onMove(data.id, newScreenX, newScreenY);
            rafId.current = null;
        });
      } else if (isResizing) {
         if (rafId.current) return;

         rafId.current = requestAnimationFrame(() => {
            const deltaX = (e.clientX - initialResize.current.x) / scale;
            const deltaY = (e.clientY - initialResize.current.y) / scale;
            
            const newWidth = Math.max(280, initialResize.current.w + deltaX);
            const newHeight = Math.max(200, initialResize.current.h + deltaY);
            onResize(data.id, newWidth, newHeight);
            rafId.current = null;
         });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isDragging, isResizing, data.id, onMove, onResize, scale]);

  return (
    <div
      ref={nodeRef}
      className={`absolute flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-xl border-2 transition-shadow duration-200 
        ${isSelected ? 'border-blue-500 shadow-blue-500/20 z-50' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 z-10'}`}
      style={{ 
        // Use translate3d for GPU acceleration (smoother dragging)
        transform: `translate3d(${data.x}px, ${data.y}px, 0)`,
        width: width,
        height: height,
        cursor: isDragging ? 'grabbing' : 'default',
        minHeight: 200,
        // Remove top/left as we use transform
        top: 0,
        left: 0,
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={(e) => {
        e.stopPropagation(); 
        onSelect(data.id);
      }}
    >
      {/* Node Header */}
      <div 
        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-t-lg border-b border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing select-none shrink-0 transition-colors"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className={`w-3 h-3 rounded-full ${
            data.type === 'INPUT' ? 'bg-green-500' :
            data.type === 'OUTPUT' ? 'bg-purple-500' : 'bg-blue-500'
          }`} />
          <span className="font-medium text-slate-700 dark:text-slate-200 text-sm truncate max-w-[180px]">{data.title}</span>
        </div>
        
        <button 
             onMouseDown={(e) => { e.stopPropagation(); }}
             onClick={(e) => { 
                e.stopPropagation(); 
                onDelete(data.id); 
             }}
             className="relative pointer-events-auto p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
             title="Close"
           >
             <X size={14} />
           </button>
      </div>

      {/* Node Content */}
      <div className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden cursor-auto">
        {children}
      </div>

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20 flex items-end justify-end p-1"
        onMouseDown={handleResizeStart}
      >
        <svg viewBox="0 0 10 10" className="w-3 h-3 text-slate-400 dark:text-slate-500 fill-current pointer-events-none">
            <path d="M 6 10 L 10 10 L 10 6 z" />
            <path d="M 2 10 L 4 10 L 10 4 L 10 2 z" />
        </svg>
      </div>

      {/* Output Handle (Right) */}
      {data.type !== 'OUTPUT' && (
        <div 
            className="node-handle cursor-crosshair hover:bg-blue-400 z-30" 
            style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }} 
            onMouseDown={(e) => { e.stopPropagation(); onConnectStart(data.id, 'source', e); }}
            onMouseUp={(e) => { e.stopPropagation(); onConnectEnd(data.id, 'source'); }}
            title="Output: Drag to connect"
        />
      )}
      
      {/* Input Handle (Left) */}
      {data.type !== 'INPUT' && (
        <div 
            className="node-handle cursor-crosshair hover:bg-green-400 z-30" 
            style={{ left: -6, top: '50%', transform: 'translateY(-50%)' }}
            onMouseDown={(e) => { e.stopPropagation(); onConnectStart(data.id, 'target', e); }}
            onMouseUp={(e) => { e.stopPropagation(); onConnectEnd(data.id, 'target'); }}
            title="Input: Drop connection here"
        />
      )}
    </div>
  );
});