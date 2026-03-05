import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface RadioDialProps {
  frequency: number;
  setFrequency: (freq: number) => void;
  min: number;
  max: number;
}

export function RadioDial({ frequency, setFrequency, min, max }: RadioDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(0);

  // Convert frequency to angle (0 to 360)
  // Map min freq to -135 deg, max freq to 135 deg
  const freqToAngle = (freq: number) => {
    const range = max - min;
    const percent = (freq - min) / range;
    return percent * 270 - 135;
  };

  const angleToFreq = (angle: number) => {
    // angle is -135 to 135
    const percent = (angle + 135) / 270;
    return min + percent * (max - min);
  };

  useEffect(() => {
    setCurrentAngle(freqToAngle(frequency));
  }, [frequency]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Calculate initial angle relative to center
    if (dialRef.current) {
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
      setStartAngle(angle - currentAngle);
    }
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !dialRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    
    // Calculate new rotation
    let newAngle = angle - startAngle;
    
    // Normalize angle logic could be complex here due to atan2 wrapping
    // Simplified: just use delta movement for smoother control or direct mapping
    // Let's try a simpler approach: use delta X for rotation
  };
  
  // Alternative simpler interaction: Drag X/Y to rotate
  const handleSimpleDrag = (e: React.MouseEvent | React.TouchEvent) => {
     // We'll implement a simpler "knob" logic where dragging up/down or left/right rotates it
     // Or just use a range input styled as a dial for accessibility and simplicity first, 
     // then visual overlay.
  };

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Dial Background - Use dial.png image */}
      <img
        src="/src/assets/dial.png"
        alt="Radio Dial"
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Knob */}
      <motion.div
        ref={dialRef}
        className="w-48 h-48 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-gray-600 shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ rotate: currentAngle }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDrag={(event, info) => {
            // Use drag delta to change frequency
            const sensitivity = 0.2;
            let newFreq = frequency + (info.delta.x * sensitivity);
            newFreq = Math.max(min, Math.min(max, newFreq));
            setFrequency(newFreq);
        }}
      >
        <div className="w-4 h-4 rounded-full bg-red-500 absolute top-4 shadow-[0_0_10px_rgba(255,0,0,0.8)]" />
        <div className="text-gray-400 font-mono text-xl select-none pointer-events-none">
          {frequency.toFixed(1)} MHz
        </div>
      </motion.div>
    </div>
  );
}
