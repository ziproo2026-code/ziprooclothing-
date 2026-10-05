import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';

interface IntroVideoExperienceProps {
  isOpen: boolean;
  onComplete: () => void;
  videoUrl?: string;
}

export const IntroVideoExperience: React.FC<IntroVideoExperienceProps> = ({
  isOpen,
  onComplete,
  videoUrl = '/intro_video.mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsFadingOut(false);
      setHasStarted(false);
      return;
    }

    // Auto-play the video when opened
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = 0;
      vid.muted = true; // Guaranteed autoplay
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setHasStarted(true))
          .catch(() => {
            // Autoplay fallback
            setHasStarted(true);
          });
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleFinish = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    // Smooth fade transition into the homepage
    setTimeout(() => {
      onComplete();
      setIsFadingOut(false);
    }, 600);
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const nextMuted = !isMuted;
    vid.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#060608] flex items-center justify-center overflow-hidden select-none transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}
      aria-modal="true"
      role="dialog"
      aria-label="ZIPROO Intro Video"
    >
      {/* 1. Responsive Video Container preserving exact original aspect ratio */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted={isMuted}
          playsInline
          preload="auto"
          onEnded={handleFinish}
          className="w-full h-full object-contain max-w-full max-h-full transition-transform duration-500"
          style={{ aspectRatio: '16/9' }}
        />
      </div>

      {/* 2. Top-Right Minimal Skip / Enter Action */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2">
        {/* Subtle Sound Toggle */}
        <button
          onClick={toggleMute}
          className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/10 backdrop-blur-md transition-all text-xs font-mono flex items-center gap-1.5 shadow-md active:scale-95"
          title={isMuted ? 'Unmute Sound (M)' : 'Mute Sound (M)'}
          aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span className="hidden sm:inline text-[11px] font-medium tracking-wider uppercase">
            {isMuted ? 'Muted' : 'Sound On'}
          </span>
        </button>

        {/* Minimal Skip Button */}
        <button
          onClick={handleFinish}
          className="px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-white/90 hover:bg-white text-black font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          title="Enter Homepage (Esc)"
          aria-label="Skip Intro"
        >
          <span>Skip</span>
          <X className="w-3 h-3 text-zinc-700" />
        </button>
      </div>

      {/* 3. Subtle bottom watermark/brand indicator */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center">
        <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-white/40">
          ZIPROO · CREATE YOUR IDENTITY
        </span>
      </div>
    </div>
  );
};
