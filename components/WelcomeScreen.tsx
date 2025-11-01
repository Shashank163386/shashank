import React from 'react';
import { BotIcon, KnowledgeIcon, IdeaIcon, BusinessIcon } from './Icons';
import { Language, TranslationKey } from '../translations';

interface WelcomeScreenProps {
  onDismiss: () => void;
  setLanguage: (lang: Language) => void;
  currentLanguage: Language;
  t: (key: TranslationKey) => string;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onDismiss, setLanguage, currentLanguage, t }) => {
  const imageUrl = "https://housing.com/news/wp-content/uploads/2023/10/Industries-in-Jaipur-f-compressed.jpg";

  const featureCards = [
    {
      icon: <KnowledgeIcon className="w-10 h-10 text-karnataka-yellow opacity-0 animate-fade-in-up" style={{ animationDelay: '800ms' }} />,
      title: t('knowledgeSupportTitle'),
      description: t('knowledgeSupportDesc'),
      cardDelay: "600ms",
      titleDelay: "900ms",
      descDelay: "1000ms",
    },
    {
      icon: <IdeaIcon className="w-10 h-10 text-karnataka-yellow opacity-0 animate-fade-in-up" style={{ animationDelay: '1000ms' }} />,
      title: t('ideaCreationTitle'),
      description: t('ideaCreationDesc'),
      cardDelay: "800ms",
      titleDelay: "1100ms",
      descDelay: "1200ms",
    },
    {
      icon: <BusinessIcon className="w-10 h-10 text-karnataka-yellow opacity-0 animate-fade-in-up" style={{ animationDelay: '1200ms' }} />,
      title: t('businessAssistanceTitle'),
      description: t('businessAssistanceDesc'),
      cardDelay: "1000ms",
      titleDelay: "1300ms",
      descDelay: "1400ms",
    }
  ];

  const LanguageButton: React.FC<{lang: Language, name: string}> = ({ lang, name }) => (
    <button
      onClick={() => setLanguage(lang)}
      className={`px-4 py-2 text-sm font-semibold border-2 rounded-full transition-colors duration-200 ${
        currentLanguage === lang
          ? 'bg-cyan-500 border-cyan-500 text-white'
          : 'bg-transparent border-white/50 text-white/70 hover:bg-white/10 hover:text-white hover:border-white'
      }`}
    >
      {name}
    </button>
  );

  return (
    <div className="relative h-screen font-sans overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center z-[-1] animate-slow-zoom"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="fixed inset-0 bg-black/70 z-[-1]" />
      
      <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <LanguageButton lang="en" name="English" />
        <LanguageButton lang="kn" name="ಕನ್ನಡ" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex flex-col md:flex-row items-center justify-between h-full gap-8 md:gap-16 text-white">
          
          {/* Left Column: Information */}
          <div className="md:w-3/5 text-center md:text-left">
            <div 
                className="opacity-0 animate-fade-in-up mb-8" 
                style={{ animationDelay: '300ms' }}
            >
                <h1 
                    className="text-5xl md:text-6xl font-extrabold mb-2 bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 text-transparent bg-clip-text animate-background-pan"
                    style={{ backgroundSize: '200% auto' }}
                >
                    NIRMANA
                </h1>
                <p className="text-lg md:text-xl text-slate-200">
                    {t('welcomeSubtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {featureCards.map((card, index) => (
                <div 
                  key={index} 
                  className="bg-black/30 backdrop-blur-md border border-white/10 p-6 flex flex-col items-center text-center md:items-start md:text-left opacity-0 animate-fade-in-up transition-all duration-300 hover:bg-black/40 hover:border-karnataka-yellow/80 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-karnataka-yellow/10"
                  style={{ animationDelay: card.cardDelay }}
                >
                  {card.icon}
                  <h3 
                    className="font-bold text-lg text-slate-100 mt-4 mb-2 opacity-0 animate-fade-in-up"
                    style={{ animationDelay: card.titleDelay }}
                  >
                    {card.title}
                  </h3>
                  <p 
                    className="text-sm text-slate-300 opacity-0 animate-fade-in-up"
                    style={{ animationDelay: card.descDelay }}
                  >
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Bot Icon */}
          <div className="md:w-2/5 flex items-center justify-center opacity-0 animate-fade-in-right" style={{ animationDelay: '400ms' }}>
            <button 
                onClick={onDismiss}
                className="group relative transition-transform duration-300 hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50 rounded-full animate-subtle-bob"
                style={{ animationDelay: '600ms' }}
                aria-label="Enter Chat"
            >
                <BotIcon className="w-56 h-56 md:w-64 md:h-64 animate-bot-icon-glow" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300">
                    <p className="text-xl font-bold">{t('clickToChat')}</p>
                </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;