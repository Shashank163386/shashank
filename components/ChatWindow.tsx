import React, { useState, useRef, useEffect } from 'react';
import { Message as MessageType, Sender } from '../types';
import Message from './Message';
import ChatHomeScreen from './ChatHomeScreen';
import {
  SendIcon, RocketIcon, MicrophoneIcon
} from './Icons';
import { sendMessage } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { Language, TranslationKey, suggestionsData } from '../translations';

// --- Audio Helper Functions from Guidelines ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Component ---

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface ChatWindowProps {
  t: (key: TranslationKey) => string;
  language: Language;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ t, language }) => {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: 'init',
      sender: Sender.Bot,
      text: t('initialBotMessage'),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRocket, setShowRocket] = useState(false);

  // Voice Assistant State
  const [isListening, setIsListening] = useState(false);
  const [currentInputTranscription, setCurrentInputTranscription] = useState('');
  const [currentOutputTranscription, setCurrentOutputTranscription] = useState('');
  const sessionPromiseRef = useRef<ReturnType<typeof ai.live.connect> | null>(null);
  const audioRefs = useRef<{
    inputAudioContext: AudioContext | null,
    outputAudioContext: AudioContext | null,
    stream: MediaStream | null,
    scriptProcessor: ScriptProcessorNode | null,
    source: MediaStreamAudioSourceNode | null,
    playbackSources: Set<AudioBufferSourceNode>,
    nextStartTime: number,
  }>({
    inputAudioContext: null,
    outputAudioContext: null,
    stream: null,
    scriptProcessor: null,
    source: null,
    playbackSources: new Set(),
    nextStartTime: 0,
  }).current;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentInputTranscription, currentOutputTranscription]);
  
  const processQuery = async (query: string) => {
    setIsLoading(true);

    const userMessage: MessageType = {
      id: Date.now().toString(),
      sender: Sender.User,
      text: query,
    };

    const loadingMessage: MessageType = {
      id: (Date.now() + 1).toString(),
      sender: Sender.Bot,
      text: '',
      isLoading: true,
    };
    
    // Replace initial message if it exists
    const newMessages = messages.length === 1 && messages[0].id === 'init'
      ? [userMessage, loadingMessage]
      : [...messages, userMessage, loadingMessage];


    setMessages(newMessages);

    const { text, sources } = await sendMessage(query, language);
    
    const botMessage: MessageType = {
      id: (Date.now() + 1).toString(),
      sender: Sender.Bot,
      text: text,
      sources: sources,
    };

    setMessages((prev) => [...prev.slice(0, -1), botMessage]);
    setIsLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isListening) return;
    
    setShowRocket(true);
    const currentInput = input;
    setInput('');
    await processQuery(currentInput);
  };
  
  const handleSuggestionClick = async (query: string) => {
    if (isLoading || isListening) return;
    setInput(query.endsWith('...') || query.endsWith(':') ? query + ' ' : query);
    if (!query.endsWith('...') && !query.endsWith(':')) {
      await processQuery(query);
    }
  };
  
  const stopLiveSession = () => {
    console.log("Stopping live session");
    setIsListening(false);
    sessionPromiseRef.current?.then(session => session.close());
    audioRefs.stream?.getTracks().forEach(track => track.stop());
    audioRefs.scriptProcessor?.disconnect();
    audioRefs.source?.disconnect();
    audioRefs.inputAudioContext?.close();
    audioRefs.outputAudioContext?.close();
    // Clear refs
    sessionPromiseRef.current = null;
    Object.keys(audioRefs).forEach(key => audioRefs[key as keyof typeof audioRefs] = null);
    audioRefs.playbackSources = new Set();
    audioRefs.nextStartTime = 0;
  };

  const startLiveSession = async () => {
    console.log("Starting live session");
    setIsListening(true);
    
    try {
      audioRefs.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRefs.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioRefs.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('Live session opened.');
            audioRefs.source = audioRefs.inputAudioContext!.createMediaStreamSource(audioRefs.stream!);
            audioRefs.scriptProcessor = audioRefs.inputAudioContext!.createScriptProcessor(4096, 1, 1);

            audioRefs.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            audioRefs.source.connect(audioRefs.scriptProcessor);
            audioRefs.scriptProcessor.connect(audioRefs.inputAudioContext!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle transcriptions
            if (message.serverContent?.inputTranscription) {
              setCurrentInputTranscription(prev => prev + message.serverContent!.inputTranscription!.text);
            }
            if (message.serverContent?.outputTranscription) {
              setCurrentOutputTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
            }
            
            if (message.serverContent?.turnComplete) {
              const finalInput = currentInputTranscription + (message.serverContent.inputTranscription?.text || '');
              const finalOutput = currentOutputTranscription + (message.serverContent.outputTranscription?.text || '');
              
              setMessages(prev => [...prev, 
                { id: `user-${Date.now()}`, sender: Sender.User, text: finalInput },
                { id: `bot-${Date.now()}`, sender: Sender.Bot, text: finalOutput }
              ]);
              setCurrentInputTranscription('');
              setCurrentOutputTranscription('');
            }
            
            // Handle audio playback
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (base64Audio) {
              audioRefs.nextStartTime = Math.max(audioRefs.nextStartTime, audioRefs.outputAudioContext!.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), audioRefs.outputAudioContext!, 24000, 1);
              const source = audioRefs.outputAudioContext!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioRefs.outputAudioContext!.destination);
              source.addEventListener('ended', () => { audioRefs.playbackSources.delete(source); });
              source.start(audioRefs.nextStartTime);
              audioRefs.nextStartTime += audioBuffer.duration;
              audioRefs.playbackSources.add(source);
            }

             if (message.serverContent?.interrupted) {
              for (const source of audioRefs.playbackSources.values()) {
                source.stop();
              }
              audioRefs.playbackSources.clear();
              audioRefs.nextStartTime = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error("Live session error:", e);
            setMessages(prev => [...prev, {id: 'error', sender: Sender.Bot, text: "Sorry, a voice connection error occurred."}]);
            stopLiveSession();
          },
          onclose: () => {
            console.log("Live session closed.");
            stopLiveSession();
          }
        }
      });
    } catch (error) {
       console.error("Failed to start voice session:", error);
       setMessages(prev => [...prev, {id: 'error', sender: Sender.Bot, text: "Could not access the microphone. Please check permissions."}]);
       setIsListening(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopLiveSession();
    } else {
      startLiveSession();
    }
  };
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      if (isListening) {
         stopLiveSession();
      }
    };
  }, []);

  return (
    <div className="relative flex flex-col h-full bg-transparent overflow-hidden">
      <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}

          {/* Fix: Replace inline suggestions with the ChatHomeScreen component for a richer initial experience. */}
          {messages.length === 1 && messages[0].id === 'init' && !isLoading && !isListening && (
            <ChatHomeScreen 
                onSuggestionClick={handleSuggestionClick}
                t={t}
                language={language}
            />
          )}

          {isListening && currentInputTranscription && (
            <Message message={{id: 'streaming-user', sender: Sender.User, text: currentInputTranscription}} />
          )}
          {isListening && currentOutputTranscription && (
            <Message message={{id: 'streaming-bot', sender: Sender.Bot, text: currentOutputTranscription}} />
          )}
          {isListening && !currentInputTranscription && !currentOutputTranscription && messages.length > 1 && (
              <div className="flex justify-center"><div className="text-slate-400 text-sm bg-slate-800/50 px-3 py-1 rounded-full">{t('listening')}</div></div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-black/20 backdrop-blur-md border-t border-white/10 dark:border-slate-700/50">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? t('listening') : t('chatPlaceholder')}
            className="flex-grow bg-slate-800/50 dark:bg-slate-900/50 border border-slate-500/30 dark:border-slate-600/50 rounded-lg py-3 px-4 text-slate-100 placeholder-slate-300 dark:placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:outline-none transition"
            disabled={isLoading || isListening}
          />
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}`}
            aria-label={isListening ? t('stopListening') : t('startListening')}
          >
            <MicrophoneIcon className="w-6 h-6" />
          </button>
          <button
            type="submit"
            disabled={isLoading || !input.trim() || isListening}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-cyan-600 text-white rounded-full hover:bg-cyan-500 disabled:bg-slate-500/50 dark:disabled:bg-slate-600/50 disabled:cursor-not-allowed transition-colors"
            aria-label={t('sendMessage')}
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
      {showRocket && (
        <div
          className="absolute animate-rocket-fly z-50 text-cyan-400"
          onAnimationEnd={() => setShowRocket(false)}
        >
          <RocketIcon className="w-20 h-20" />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
