/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { RadioDial } from './components/RadioDial';
import { Waveform } from './components/Waveform';
import { EvidenceTransmitter } from './components/EvidenceTransmitter';
import { SettingsModal } from './components/SettingsModal';
import { useAudioEngine } from './hooks/useAudioEngine';
import { generateSpeech } from './services/fishAudio';
import { Settings, Play, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Game Constants
const TARGET_FREQUENCY = 96.5;
const TOLERANCE = 0.5;
const VILLAIN_DIALOGUE = "이번 물건은 역대급이야. 하이퍼... 그건 그냥 약이 아니야. 놈들은 절대 냄새도 못 맡을 거다. 거래 장소는 3부두 4번 창고. 자정까지 준비해. 실수하면... 알지?";
const THREAT_DIALOGUE = "누구야 너... 지금 듣고 있지? 쥐새끼가 한 마리 들어왔나 보군.";

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<'INTRO' | 'TUNING' | 'LISTENING' | 'THREAT' | 'ACTION' | 'SUCCESS' | 'FAIL'>('INTRO');
  const [showSettings, setShowSettings] = useState(false);
  
  // Initialize from localStorage or env
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('fish_api_key') || import.meta.env.VITE_FISH_AUDIO_API_KEY || '1645800cf83d4aa583929f5e658993a8');
  const [modelId, setModelId] = useState(() => localStorage.getItem('fish_model_id') || import.meta.env.VITE_FISH_AUDIO_MODEL_ID || 'd6a7047b897f48e19a293945fad98942');
  
  // Audio State
  const { frequency, setFrequency, startAudio, stopAudio, voiceAudioRef } = useAudioEngine(TARGET_FREQUENCY);
  const [isSignalClear, setIsSignalClear] = useState(false);
  
  // Refs
  const villainAudioBuffer = useRef<ArrayBuffer | null>(null);
  const threatAudioBuffer = useRef<ArrayBuffer | null>(null);
  const currentAudioType = useRef<'villain' | 'threat' | null>(null);

  // Pre-load audio if keys exist
  useEffect(() => {
    console.log('[Fish Audio] API Key:', apiKey ? 'SET' : 'NOT SET');
    console.log('[Fish Audio] Model ID:', modelId ? 'SET' : 'NOT SET');

    if (apiKey && modelId) {
      // Pre-fetch dialogues
      generateSpeech(VILLAIN_DIALOGUE, apiKey, modelId).then(buffer => {
        if (buffer) {
          villainAudioBuffer.current = buffer;
          console.log('[Fish Audio] Villain audio pre-loaded:', buffer.byteLength, 'bytes');
        } else {
          console.warn('[Fish Audio] Failed to pre-load villain audio');
        }
      });
      generateSpeech(THREAT_DIALOGUE, apiKey, modelId).then(buffer => {
        if (buffer) {
          threatAudioBuffer.current = buffer;
          console.log('[Fish Audio] Threat audio pre-loaded:', buffer.byteLength, 'bytes');
        } else {
          console.warn('[Fish Audio] Failed to pre-load threat audio');
        }
      });
    }
  }, [apiKey, modelId]);

  // Helper to play voice (Buffer or Native TTS)
  const playVoice = (type: 'villain' | 'threat') => {
    const buffer = type === 'villain' ? villainAudioBuffer.current : threatAudioBuffer.current;
    const text = type === 'villain' ? VILLAIN_DIALOGUE : THREAT_DIALOGUE;

    console.log(`[Audio Playback] Playing ${type}`, buffer ? 'Fish Audio' : 'Native TTS');

    if (buffer && voiceAudioRef.current) {
      // Only reload source if type changed or source is missing
      if (currentAudioType.current !== type) {
        const blob = new Blob([buffer], { type: 'audio/mp3' });
        voiceAudioRef.current.src = URL.createObjectURL(blob);
        currentAudioType.current = type;
        console.log(`[Audio Playback] Set audio source for ${type}`);
      }

      voiceAudioRef.current.play().catch(e => {
        console.error("[Audio Playback] Failed:", e);
      });
      return voiceAudioRef.current;
    } else {
      // Fallback to Native TTS
      console.warn(`[Audio Playback] No buffer found, using Native TTS for ${type}`);
      if (!window.speechSynthesis.speaking) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR'; // Set Korean
        utterance.rate = 0.9;
        utterance.pitch = 0.8; // Lower pitch for villain
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      return {
        pause: () => window.speechSynthesis.pause(),
        cancel: () => window.speechSynthesis.cancel(),
        onended: null as any,
      };
    }
  };

  // 1. Frequency Check & State Transition (TUNING <-> LISTENING)
  useEffect(() => {
    const diff = Math.abs(frequency - TARGET_FREQUENCY);
    const isClear = diff < TOLERANCE;
    setIsSignalClear(isClear);

    if (isClear && gameState === 'TUNING') {
      setGameState('LISTENING');
    } else if (!isClear && gameState === 'LISTENING') {
       // Signal lost - Pause Audio
       if (voiceAudioRef.current && !voiceAudioRef.current.paused) {
         voiceAudioRef.current.pause();
       }
       if (window.speechSynthesis.speaking) {
         window.speechSynthesis.pause();
       }
       setGameState('TUNING');
    }
  }, [frequency, gameState]);

  // 2. Game Logic based on State (Timer & Audio Trigger)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (gameState === 'LISTENING') {
      // Start/Resume Villain Audio
      playVoice('villain');

      // Trigger threat after 11 seconds
      timer = setTimeout(() => {
        setGameState('THREAT');
      }, 11000);

    } else if (gameState === 'THREAT') {
      // Stop Villain Audio
      voiceAudioRef.current?.pause();
      window.speechSynthesis.cancel();
      
      // Play Threat Audio
      const audioObj = playVoice('threat');
      
      // Transition to ACTION after threat dialogue finishes
      if (audioObj instanceof HTMLAudioElement) {
         audioObj.onended = () => setGameState('ACTION');
      } else {
         // Fallback timeout for Native TTS
         timer = setTimeout(() => setGameState('ACTION'), 4000);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [gameState]);

  const handleStart = () => {
    startAudio();
    setGameState('TUNING');
  };

  const handleActionComplete = () => {
    setGameState('SUCCESS');
    stopAudio();
  };

  const handleReset = () => {
    setGameState('INTRO');
    setFrequency(88.0);
    currentAudioType.current = null;
    stopAudio();
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-sans text-white select-none">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-500"
        style={{
          backgroundImage: gameState === 'INTRO'
            ? 'url("/src/assets/background.png")'
            : 'url("/src/assets/bg2.png")',
          filter: gameState === 'INTRO' ? 'brightness(1)' : 'brightness(0.5)',
          opacity: gameState === 'INTRO' ? '1' : '0.8'
        }}
      />

      {/* Rain Effect Overlay (CSS) */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/8c/Rain_animation.gif')] bg-cover mix-blend-screen" />

      {/* Main UI Container */}
      <div className="relative z-10 container mx-auto px-4 h-screen flex flex-col items-center justify-center">

        {/* Settings Button (only shown when not in INTRO) */}
        {gameState !== 'INTRO' && (
          <div className="absolute top-8 right-8">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 bg-gray-900/80 rounded-full hover:bg-gray-800 transition-colors border border-gray-700"
            >
              <Settings className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        )}

        {/* Game Content */}
        <AnimatePresence mode="wait">
          {gameState === 'INTRO' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-lg"
            >
              <h2 className="text-4xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                작전명: 하이퍼
              </h2>
              <p className="text-gray-300 mb-8 leading-relaxed break-keep">
                놈들의 거래 현장이 포착되었다. 
                무전 주파수를 맞춰 놈들의 대화를 도청하라.
                <br/><br/>
                <span className="text-yellow-400 text-sm">
                  <AlertTriangle className="inline w-4 h-4 mb-1 mr-1"/>
                  주의: 놈들에게 들키지 않도록 조심할 것.
                </span>
              </p>
              <button 
                onClick={handleStart}
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-full font-bold tracking-wider transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
              >
                <span className="flex items-center gap-2">
                  잠복 수사 시작 <Play className="w-4 h-4 fill-current" />
                </span>
              </button>
            </motion.div>
          )}

          {(gameState === 'TUNING' || gameState === 'LISTENING' || gameState === 'THREAT') && (
            <motion.div 
              key="game-interface"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-12 w-full max-w-md"
            >
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-green-500/70 font-mono uppercase">
                  <span>신호 강도</span>
                  <span>{isSignalClear ? '수신 중...' : '탐색 중...'}</span>
                </div>
                <Waveform isListening={isSignalClear} />
              </div>

              <div className="relative">
                <RadioDial 
                  frequency={frequency} 
                  setFrequency={setFrequency} 
                  min={88.0} 
                  max={108.0} 
                />
                
                {/* Visual Feedback for Target */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
                  <p className="text-gray-500 text-sm font-mono">TUNER</p>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-400">다이얼을 돌려 주파수를 맞추세요</p>
                <p className="text-xs text-gray-600">목표 주파수: 96.0 - 97.0 MHz 부근</p>
              </div>
            </motion.div>
          )}

          {gameState === 'THREAT' && (
             <motion.div
                key="threat-overlay"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
             >
                <div className="bg-red-900/20 backdrop-blur-sm p-6 rounded-xl border border-red-500/50 text-red-500 font-bold text-2xl animate-pulse">
                   ⚠️ 역추적 감지됨 ⚠️
                </div>
             </motion.div>
          )}

          {gameState === 'SUCCESS' && (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center p-8 bg-green-900/20 border border-green-500/50 rounded-2xl backdrop-blur-md"
            >
              <h2 className="text-3xl font-bold text-green-400 mb-4">증거 확보 완료</h2>
              <p className="text-gray-300">파일이 본부로 전송되었습니다.</p>
              <p className="text-gray-400 text-sm mt-4">작전 성공.</p>
              <button 
                onClick={handleReset}
                className="mt-8 px-6 py-2 border border-green-500/50 text-green-400 rounded-full hover:bg-green-500/10 transition-colors"
              >
                다시 하기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'ACTION' && (
            <EvidenceTransmitter onComplete={handleActionComplete} />
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          onSave={(key, id) => {
            setApiKey(key);
            setModelId(id);
            localStorage.setItem('fish_api_key', key);
            localStorage.setItem('fish_model_id', id);
          }}
          initialKey={apiKey}
          initialModelId={modelId}
        />

        {/* Hidden Audio Element for Voice */}
        <audio ref={voiceAudioRef} className="hidden" />
      </div>
    </div>
  );
}
