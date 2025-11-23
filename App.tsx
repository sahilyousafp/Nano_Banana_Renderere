import React, { useState } from 'react';
import { NodeCanvas } from './components/NodeCanvas';
import { Settings } from './components/ui/Icons';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsModal } from './components/SettingsModal';

function AppContent() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex w-screen h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 overflow-hidden transition-colors duration-200">
      {/* Sidebar - Tools / Library */}
      <div className="w-16 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 gap-6 z-50 transition-colors duration-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-bold text-white text-lg">L</span>
        </div>
        
        <div className="flex flex-col gap-4 w-full px-2">
            <div className="group relative flex justify-center">
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                    <Settings size={20} />
                </button>
                <div className="absolute left-14 top-2 bg-slate-800 dark:bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-700 z-[60]">
                    Settings
                </div>
            </div>
            {/* Add more sidebar tools here */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        <NodeCanvas />
      </div>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}