import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface EvidenceTransmitterProps {
  onComplete: () => void;
}

export function EvidenceTransmitter({ onComplete }: EvidenceTransmitterProps) {
  const [progress, setProgress] = useState(0);
  const target = 100;

  const handleClick = () => {
    setProgress(prev => Math.min(target, prev + 5));
  };

  useEffect(() => {
    if (progress >= target) {
      onComplete();
    }
  }, [progress, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - 1)); // Decay progress
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-red-900/30 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black border-2 border-red-500 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(255,0,0,0.5)]"
      >
        <h2 className="text-3xl font-bold text-red-500 mb-2 uppercase tracking-widest animate-pulse">경고!</h2>
        <p className="text-white mb-8">신분 노출 위험! 즉시 증거를 전송하십시오!</p>
        
        <div className="w-full bg-gray-800 h-6 rounded-full overflow-hidden mb-8 border border-gray-600">
          <motion.div 
            className="h-full bg-red-600"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          onClick={handleClick}
          className="w-full bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white font-black text-xl py-6 rounded-xl uppercase tracking-wider shadow-lg border-b-4 border-red-800"
        >
          빠르게 연타하여 전송
        </button>
      </motion.div>
    </div>
  );
}
