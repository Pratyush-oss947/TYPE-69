/**
 * Glowing 60 FPS Canvas-based Audio Spectrogram Visualizer
 * Reads from AnalyserNode of the Web Audio engine.
 */

import { useEffect, useRef } from 'react';
import { audioInstance } from '../engine/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  colorHex?: string; // Dominant art color
  type?: 'bars' | 'wave' | 'retro-radial';
}

export default function AudioVisualizer({ isPlaying, colorHex = '#E11D48', type = 'bars' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize boundaries
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = canvas.parentElement?.clientHeight || 120;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Fetch hardware byte arrays from audio engine
      const frequencies = audioInstance.getByteFrequencyData();
      const length = frequencies.length;

      if (!isPlaying || length === 0) {
        // Draw elegant flat default lines when idle
        ctx.beginPath();
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 3;
        if (type === 'bars') {
          const barWidth = width / 40;
          for (let i = 0; i < 40; i++) {
            const x = i * (barWidth + 2);
            ctx.moveTo(x, height / 2);
            ctx.lineTo(x, height / 2 + 4);
          }
        } else if (type === 'wave') {
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
        } else {
          // Circle static outline
          ctx.arc(width / 2, height / 2, 45, 0, Math.PI * 2);
        }
        ctx.stroke();
        
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      if (type === 'bars') {
        const barWidth = (width / (length / 2)) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < length / 2; i++) {
          const value = frequencies[i] || 0;
          barHeight = (value / 255) * height * 0.9;

          // Glass glowing gradient styling
          const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
          gradient.addColorStop(0, colorHex); // Top neon glow
          gradient.addColorStop(0.5, '#7C3AED'); // Purple node
          gradient.addColorStop(1, 'rgba(124, 58, 237, 0.05)');

          ctx.fillStyle = gradient;
          
          // Draw neat rounded capsules
          const adjustedHeight = Math.max(4, barHeight);
          const y = height - adjustedHeight;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth - 2, adjustedHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Add faint neon indicator drop shadows
          ctx.shadowBlur = 12;
          ctx.shadowColor = colorHex;
          
          x += barWidth;
        }
        ctx.shadowBlur = 0; // reset
      } 
      
      else if (type === 'wave') {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = colorHex;
        ctx.shadowBlur = 15;
        ctx.shadowColor = colorHex;

        const sliceWidth = width / (length / 2);
        let x = 0;

        for (let i = 0; i < length / 2; i++) {
          const v = (frequencies[i] || 0) / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } 
      
      else if (type === 'retro-radial') {
        // Futuristic radial orb visualizer rotating with frequencies
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.28;

        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const points = 60;
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = colorHex;
        ctx.shadowBlur = 18;
        ctx.shadowColor = colorHex;

        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const freqIndex = Math.floor((i / points) * (length / 3));
          const audioVal = frequencies[freqIndex] || 0;
          const offset = (audioVal / 255) * 35;
          const r = baseRadius + offset;

          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, colorHex, type]);

  return (
    <canvas
      id="auraluxe-visualizer-canvas"
      ref={canvasRef}
      className="w-full h-full block rounded-xl outline-none"
    />
  );
}
