import { useEffect, useRef } from 'react';

export function Waveform({ isListening }: { isListening: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ff00'; // Green retro color
      ctx.beginPath();

      const width = canvas.width;
      const height = canvas.height;
      const amplitude = isListening ? 30 : 5; // Higher amplitude when listening/signal strong
      const frequency = 0.05;

      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin((x + offset) * frequency) * amplitude * Math.sin(x * 0.01);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      offset += 5;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [isListening]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full h-24 bg-black/80 border border-green-900/50 rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.1)]"
    />
  );
}
