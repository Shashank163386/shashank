import React from 'react';
import { Language, TranslationKey, suggestionsData } from '../translations';
import { BotIcon, IdeaIcon, BusinessIcon } from './Icons';

interface ChatHomeScreenProps {
  onSuggestionClick: (query: string) => void;
  t: (key: TranslationKey) => string;
  language: Language;
}

const ChatHomeScreen: React.FC<ChatHomeScreenProps> = ({ onSuggestionClick, t, language }) => {
  const hubSuggestions = suggestionsData[language];
  
  const otherSuggestions = [
    { name: t('brainstormIdeas'), Icon: IdeaIcon, query: language === 'kn' ? 'ನನಗೊಂದು ಕಲ್ಪನೆ ನೀಡಿ' : 'Brainstorm some ideas for...' },
    { name: t('summarizeText'), Icon: BusinessIcon, query: language === 'kn' ? 'ಈ ಪಠ್ಯವನ್ನು ಸಾರಾಂಶಗೊಳಿಸಿ:' : 'Summarize this text for me:' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in-up">
      <BotIcon className="w-24 h-24 mb-4" />
      <h1 className="text-4xl font-bold text-slate-100">{t('chatHomeTitle')}</h1>
      <p className="text-slate-300 mt-2 mb-8 max-w-md">{t('chatHomeSubtitle')}</p>

      <div className="w-full max-w-4xl">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('exploreHubs')}</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 mb-8">
          {hubSuggestions.map(({ name, Icon, query }) => (
            <button
              key={name}
              onClick={() => onSuggestionClick(query)}
              className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-white/10 hover:bg-slate-700/70 transition-all duration-200 group"
            >
              <Icon className="w-8 h-8 text-cyan-400 mb-1 group-hover:scale-110 transition-transform"/>
              <span className="text-xs text-slate-200 font-medium">{name}</span>
            </button>
          ))}
        </div>
        
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('tryTasks')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
           {otherSuggestions.map(({ name, Icon, query }) => (
            <button
              key={name}
              onClick={() => onSuggestionClick(query)}
              className="flex items-center justify-center text-center p-3 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-white/10 hover:bg-slate-700/70 transition-all duration-200 group gap-3"
            >
              <Icon className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform"/>
              <span className="text-sm text-slate-200 font-medium">{name}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ChatHomeScreen;
