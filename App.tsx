import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ImageGenerator from './components/ImageGenerator';
import WelcomeScreen from './components/WelcomeScreen';
import { Language, translations, TranslationKey } from '../translations';


export enum View {
  Chat = 'chat',
  Image = 'image',
}

export type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Chat);
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('en');
  const [showWelcome, setShowWelcome] = useState<boolean>(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }

    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'kn')) {
      setLanguage(savedLanguage);
    }

  }, []);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleDismissWelcome = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcome(false);
  };
  
  const t = (key: TranslationKey) => translations[language][key] || translations['en'][key];

  if (showWelcome) {
    return <WelcomeScreen onDismiss={handleDismissWelcome} setLanguage={setLanguage} currentLanguage={language} t={t} />;
  }

  const imageUrl = "https://housing.com/news/wp-content/uploads/2023/10/Industries-in-Jaipur-f-compressed.jpg";

  return (
    <div className="relative h-screen font-sans">
      <div
        className="fixed inset-0 bg-cover bg-center z-[-1]"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="fixed inset-0 bg-slate-100/30 dark:bg-black/70 z-[-1]" />

      <div className="flex flex-col h-screen bg-transparent text-slate-800 dark:text-slate-100 transition-colors duration-300">
        <Header 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          theme={theme}
          toggleTheme={toggleTheme}
          t={t}
        />
        <main className="flex-grow overflow-hidden">
          {currentView === View.Chat ? <ChatWindow t={t} language={language} /> : <ImageGenerator t={t} />}
        </main>
      </div>
    </div>
  );
};

export default App;
