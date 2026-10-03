import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, FastForward, Play, Sparkles } from 'lucide-react';
import heroStreetwearImage from '../assets/images/ziproo_hero_streetwear_1790610627145.jpg';

interface IntroVideoExperienceProps {
  onComplete: () => void;
  isOpen: boolean;
}

export const IntroVideoExperience: React.FC<IntroVideoExperienceProps> = ({
  onComplete,
  isOpen,
}) => {
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [timecode, setTimecode] = useState('00:00:00:00');
  const [glitchActive, setGlitchActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthetic cinematic bass rumble if unmuted
  const playCinematicSound = (freq = 60, duration = 1.2) => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(24, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext unavailable or restricted
    }
  };

  // Film grain animation on HTML5 Canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    const resizeCanvas = () => {
      canvas.width = window.innerWidth / 2;
      canvas.height = window.innerHeight / 2;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const renderNoise = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;
      const imgData = ctx.createImageData(w, h);
      const buffer = new Uint32Array(imgData.data.buffer);
      const len = buffer.length;
      for (let i = 0; i < len; i++) {
        if (Math.random() < 0.12) {
          buffer[i] = 0x18ffffff; // subtle white film noise
        }
      }
      ctx.putImageData(imgData, 0, 0);
      animFrame = requestAnimationFrame(renderNoise);
    };

    renderNoise();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isOpen]);

  // Main video intro playback timeline (total ~4.6 seconds)
  useEffect(() => {
    if (!isOpen) return;

    const startTime = performance.now();
    const duration = 4600; // 4.6 seconds

    // Periodic shutter sound/glitch
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 80);
    }, 900);

    const timer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      // Timecode generator (e.g. 00:00:02:18)
      const sec = Math.floor(elapsed / 1000);
      const frame = Math.floor((elapsed % 1000) / 41);
      setTimecode(`00:00:${sec.toString().padStart(2, '0')}:${frame.toString().padStart(2, '0')}`);

      if (pct === 30 || pct === 65) {
        playCinematicSound(85, 1.0);
      }

      if (elapsed >= duration) {
        clearInterval(timer);
        clearInterval(glitchInterval);
        onComplete();
      }
    }, 33); // ~30 fps

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      clearInterval(glitchInterval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, muted, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#060608] text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300">
      {/* 1. Cinematic Background with dynamic zoom & film grain */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroStreetwearImage}
          alt="ZIPROO Atelier Cinematic Scene"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-1000 ${
            progress < 30 ? 'scale-110 filter blur-[2px] opacity-40' : progress < 70 ? 'scale-105 filter blur-[0.5px] opacity-60' : 'scale-100 opacity-50'
          }`}
        />
        {/* Film Noir Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/70 to-[#060608]/90" />
        {/* Anamorphic Purple Light Streak */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#a855f7]/60 to-transparent blur-sm" />
      </div>

      {/* 2. Real-time Film Noise Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 w-full h-full pointer-events-none opacity-30 mix-blend-screen"
      />

      {/* 3. Top HUD: Brand Protocol, Timecode, Audio & Skip Controls */}
      <div className="relative z-20 flex items-center justify-between p-6 sm:p-10 font-mono text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="tracking-[0.25em] text-zinc-300 font-bold">REC · 24FPS</span>
          </div>
          <span className="hidden sm:inline text-zinc-400">|</span>
          <span className="hidden sm:inline text-zinc-300 font-mono tracking-wider">{timecode}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nextMuted = !muted;
              setMuted(nextMuted);
              if (nextMuted === false) {
                playCinematicSound(70, 0.8);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/80 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all text-[11px]"
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
            <span className="hidden sm:inline">{muted ? 'SOUND OFF' : 'AUDIO ACTIVE'}</span>
          </button>

          <button
            onClick={onComplete}
            className="group flex items-center gap-2 px-4 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black font-sans font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 text-[11px]"
          >
            <span>ENTER ATELIER</span>
            <FastForward className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 4. Central Cinematic Sequence (Phases based on progress) */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
        {/* Phase 1: 0% - 30% — Collection 2026 Declaration */}
        {progress < 30 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/40 bg-purple-950/30 text-purple-300 text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase">
              <Sparkles className="w-3 h-3 text-[#a855f7]" />
              <span>COLLECTION 01 · EST. 2026</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-white uppercase">
              HEAVYWEIGHT STREETWEAR ATELIER
            </h2>
            <p className="text-xs sm:text-sm font-mono tracking-widest text-zinc-400">
              PORTUGUESE TERRY · ARCHITECTURAL BOX CUTS · 280-480 GSM
            </p>
          </div>
        )}

        {/* Phase 2: 30% - 65% — The Streetwear Rebellion */}
        {progress >= 30 && progress < 65 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <span className="text-xs font-mono uppercase tracking-[0.4em] text-[#a855f7] block font-bold">
              THE MANIFESTO
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-white uppercase leading-tight">
              "DON'T FOLLOW THE RULES.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white to-purple-400">
                CREATE IT."
              </span>
            </h2>
          </div>
        )}

        {/* Phase 3: 65% - 100% — Monumental ZIPROO Reveal */}
        {progress >= 65 && (
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative inline-block">
              <h1
                className={`text-6xl sm:text-8xl md:text-9xl font-black tracking-[0.18em] uppercase font-['Syncopate',sans-serif] text-white leading-none select-none drop-shadow-[0_10px_35px_rgba(168,85,247,0.5)] ${
                  glitchActive ? 'translate-x-1 skew-x-2 text-purple-300' : ''
                }`}
              >
                ZIPROO
              </h1>
            </div>

            <p className="text-lg sm:text-2xl md:text-3xl font-bold tracking-[0.3em] uppercase font-display text-[#a855f7]">
              CREATE YOUR IDENTITY
            </p>

            <div className="pt-4 flex items-center justify-center gap-3 text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
              <span>NEW ERA</span>
              <span className="text-[#a855f7]">/</span>
              <span>DROP 01 LIVE</span>
              <span className="text-[#a855f7]">/</span>
              <span>ALL-INDIA DELIVERY</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Bottom Cinematic HUD & Progress Bar */}
      <div className="relative z-20 p-6 sm:p-10 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
            <span className="uppercase tracking-widest text-[10px]">
              {progress < 30 ? 'SEQUENCE 01: ATELIER ARCHITECTURE' : progress < 65 ? 'SEQUENCE 02: THE MANIFESTO' : 'SEQUENCE 03: IDENTITY INITIALIZED'}
            </span>
          </div>
          <span className="text-[11px] text-zinc-300 font-bold">{progress}%</span>
        </div>

        {/* High-precision sleek progress track */}
        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-[#a855f7] transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
