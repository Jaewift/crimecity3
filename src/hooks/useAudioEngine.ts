import { useState, useEffect, useRef } from 'react';

export function useAudioEngine(targetFrequency: number) {
  const [frequency, setFrequency] = useState(88.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const staticNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  // Initialize Audio Context once
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    // Create static noise buffer
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    bufferRef.current = buffer;

    // Create gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = 0.02; // Set initial volume to prevent loud sound on startup
    gainNodeRef.current = gainNode;

    return () => {
      if (staticNodeRef.current) {
        try {
          staticNodeRef.current.stop();
        } catch (e) { /* ignore */ }
      }
      if (ctx.state !== 'closed') {
        ctx.close();
      }
    };
  }, []);

  // Handle Play/Stop logic
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !gainNodeRef.current || !bufferRef.current) return;

    if (isPlaying) {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Start static noise if not already playing
      if (!staticNodeRef.current) {
        const source = ctx.createBufferSource();
        source.buffer = bufferRef.current;
        source.loop = true;
        source.connect(gainNodeRef.current);
        source.start();
        staticNodeRef.current = source;
      }
    } else {
      if (staticNodeRef.current) {
        try {
          staticNodeRef.current.stop();
        } catch (e) { /* ignore */ }
        staticNodeRef.current = null;
      }
      // Optionally suspend context to save resources, but keeping it open is safer for responsiveness
      // ctx.suspend(); 
    }
  }, [isPlaying]);

  // Handle Frequency/Volume logic
  useEffect(() => {
    if (!gainNodeRef.current || !audioContextRef.current) return;
    
    // Calculate signal strength based on distance to target frequency
    const distance = Math.abs(frequency - targetFrequency);
    const maxDistance = 5.0; // Range where signal starts to fade in
    
    // Static volume: louder when far from target
    // Voice volume: louder when close to target
    
    // Adjusted volumes based on user feedback:
    // Lowered max static volume from 0.1 to 0.02 to make voice clearer
    // Voice volume curve adjusted to be louder
    let staticVolume = 0.02;
    let voiceVolume = 0;

    if (distance < maxDistance) {
      const signalStrength = 1 - (distance / maxDistance);
      staticVolume = 0.02 * (1 - signalStrength);

      // Boost voice volume curve so it gets louder faster
      // Using square root to boost lower values: Math.sqrt(0.5) ~= 0.7
      voiceVolume = Math.sqrt(signalStrength) * 1.2; // Boost voice volume
    }

    // Smooth transition
    const currentTime = audioContextRef.current.currentTime;
    gainNodeRef.current.gain.cancelScheduledValues(currentTime);
    gainNodeRef.current.gain.setTargetAtTime(staticVolume, currentTime, 0.1);
    
    if (voiceAudioRef.current) {
      voiceAudioRef.current.volume = Math.max(0, Math.min(1, voiceVolume));
    }

  }, [frequency, targetFrequency]);

  const startAudio = () => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsPlaying(true);
  };

  const stopAudio = () => {
    setIsPlaying(false);
  };

  return {
    frequency,
    setFrequency,
    startAudio,
    stopAudio,
    voiceAudioRef
  };
}
