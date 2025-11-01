import React from 'react';
import { Message as MessageType, Sender } from '../types';
import { BotIcon, UserIcon, WebSourceIcon } from './Icons';

interface MessageProps {
  message: MessageType;
}

const LoadingDots: React.FC = () => (
  <div className="flex items-center space-x-1">
    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
  </div>
);

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;

  if (message.isLoading) {
    return (
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8">
          <BotIcon className="w-8 h-8" />
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 mt-1 shadow-sm">
          <LoadingDots />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8">
          <BotIcon className="w-8 h-8" />
        </div>
      )}
      <div className="flex flex-col gap-2 max-w-xl">
        <div
          className={`rounded-lg p-4 shadow-lg ${
            isUser
              ? 'bg-cyan-600/90 text-white rounded-br-none'
              : 'bg-slate-800/50 backdrop-blur-sm border border-white/10 text-slate-200 rounded-bl-none'
          }`}
        >
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{message.text}</pre>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-1">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">Sources:</h4>
            <div className="flex flex-col gap-2">
              {message.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.web.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-cyan-400 bg-slate-800/50 hover:bg-slate-700/70 p-2 rounded-md transition-colors"
                >
                  <WebSourceIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{source.web.title || source.web.uri}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
       {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-slate-400" />
        </div>
      )}
    </div>
  );
};

export default Message;