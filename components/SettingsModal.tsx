import React from 'react';
import { X, Moon, Sun } from './ui/Icons';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Appearance Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Appearance</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-200">Dark Mode</div>
                  <div className="text-xs text-slate-500">Adjust the interface theme</div>
                </div>
              </div>
              
              <button 
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>

          {/* About Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
             <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">About</h3>
             <p className="text-sm text-slate-600 dark:text-slate-400">
               LumionGen Node Editor v1.0
               <br/>
               Powered by Gemini 2.5 Flash
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};