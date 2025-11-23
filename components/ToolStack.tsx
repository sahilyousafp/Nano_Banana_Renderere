import React from 'react';
import { NodeType } from '../types';
import { ImageIcon, Wand2, Download } from './ui/Icons';

interface ToolStackProps {
  onAddNode: (type: NodeType) => void;
}

export const ToolStack: React.FC<ToolStackProps> = ({ onAddNode }) => {
  return (
    <div className="absolute top-20 left-4 z-40 flex flex-col gap-2">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 p-2 rounded-lg shadow-xl flex flex-col gap-2 w-14 items-center transition-colors">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase text-center w-full border-b border-slate-200 dark:border-slate-700 pb-1">Add</div>
        
        <button 
          onClick={() => onAddNode(NodeType.INPUT)}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-green-500 transition-colors relative group"
        >
          <ImageIcon size={20} />
           <div className="absolute left-full top-1 ml-2 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none border border-slate-700 shadow-xl">
            Input Image
          </div>
        </button>

        <button 
          onClick={() => onAddNode(NodeType.PROCESSOR)}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-500 transition-colors relative group"
        >
          <Wand2 size={20} />
          <div className="absolute left-full top-1 ml-2 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none border border-slate-700 shadow-xl">
            Gemini Processor
          </div>
        </button>

        <button 
          onClick={() => onAddNode(NodeType.OUTPUT)}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-purple-500 transition-colors relative group"
        >
          <Download size={20} />
          <div className="absolute left-full top-1 ml-2 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none border border-slate-700 shadow-xl">
            Output Result
          </div>
        </button>
      </div>
    </div>
  );
};