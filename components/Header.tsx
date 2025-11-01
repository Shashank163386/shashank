import React from 'react';
import { View, Theme } from '../App';
import { BotIcon, ImageIcon, SunIcon, MoonIcon } from './Icons';
import { TranslationKey } from '../translations';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: TranslationKey) => string;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, theme, toggleTheme, t }) => {
  const getTabClass = (view: View) => {
    return `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
      currentView === view
        ? 'bg-white/20 dark:bg-slate-800/50 text-cyan-300 dark:text-cyan-400 border-b-2 border-cyan-400 dark:border-cyan-400'
        : 'text-slate-100 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-700/50 hover:text-white dark:hover:text-slate-100'
    }`;
  };

  return (
    <header className="bg-black/20 backdrop-blur-md border-b border-white/10 dark:border-slate-700/50 shadow-lg shrink-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <BotIcon className="w-8 h-8" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              {t('headerTitle')}
            </h1>
            <span className="hidden sm:inline-block text-xs font-mono bg-cyan-100/20 text-cyan-200 px-2 py-1 rounded-md">
              {t('headerSubtitle')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex items-end h-full">
              <button onClick={() => setCurrentView(View.Chat)} className={getTabClass(View.Chat)}>
                <BotIcon className="w-5 h-5" />
                {t('chatTab')}
              </button>
              <button onClick={() => setCurrentView(View.Image)} className={getTabClass(View.Image)}>
                <ImageIcon className="w-4 h-4" />
                {t('imageTab')}
              </button>
            </nav>
            <button
                onClick={toggleTheme}
                className="ml-2 p-2 rounded-full text-slate-300 hover:bg-white/10 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle theme"
            >
                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
