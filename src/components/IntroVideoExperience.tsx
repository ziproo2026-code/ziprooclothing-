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
  // User requested: Always ON the ZIPROO intro sound
  const [isMuted, setIsMuted] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsFadingOut(false);
      setNeedsUserInteraction(false);
      return;
    }

    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = 0;
      // Start with sound enabled
      vid.muted = false;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsMuted(false);
            setNeedsUserInteraction(false);
          })
          .catch(() => {
            // Browser autoplay policy might block unmuted audio without prior user gesture
            // Fall back to muted playback and show quick "Tap for Sound" overlay
            vid.muted = true;
            setIsMuted(true);
            setNeedsUserInteraction(true);
            vid.play().catch(() => {});
          });
      }
    }

    // Global listener to unmute on any click/touch
    const handleGlobalInteraction = () => {
      const v = videoRef.current;
      if (v && v.muted) {
        v.muted = false;
        setIsMuted(false);
        setNeedsUserInteraction(false);
      }
    };

    window.addEventListener('click', handleGlobalInteraction, { once: true });
    window.addEventListener('touchstart', handleGlobalInteraction, { once: true });

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
      window.removeEventListener('click', handleGlobalInteraction);
      window.removeEventListener('touchstart', handleGlobalInteraction);
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
    if (!nextMuted) {
      setNeedsUserInteraction(false);
    }
  };

  const enableAudio = () => {
    const vid = videoRef.current;
    if (vid) {
      vid.muted = false;
      setIsMuted(false);
      setNeedsUserInteraction(false);
    }
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
      onClick={() => {
        if (isMuted) enableAudio();
      }}
    >
      {/* 1. Responsive Video Container preserving exact original aspect ratio */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted={false}
          playsInline
          preload="auto"
          onEnded={handleFinish}
          className="w-full h-full object-contain max-w-full max-h-full transition-transform duration-500"
          style={{ aspectRatio: '16/9' }}
        />
      </div>

      {/* Floating Prompt if browser blocked initial unmuted autoplay */}
      {needsUserInteraction && isMuted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              enableAudio();
            }}
            className="pointer-events-auto px-5 py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 animate-bounce cursor-pointer border border-white/20"
          >
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Tap Anywhere For Sound</span>
          </button>
        </div>
      )}

      {/* 2. Top-Right Minimal Skip / Sound Controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2">
        {/* Sound Status Indicator & Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className={`p-2 sm:px-3 sm:py-1.5 rounded-full border backdrop-blur-md transition-all text-xs font-mono flex items-center gap-1.5 shadow-md active:scale-95 ${
            !isMuted
              ? 'bg-[#7c3aed]/90 hover:bg-[#7c3aed] text-white border-purple-400/50'
              : 'bg-black/60 hover:bg-black/90 text-zinc-300 border-white/10'
          }`}
          title={isMuted ? 'Turn Sound On (M)' : 'Mute Sound (M)'}
          aria-label={isMuted ? 'Turn Sound On' : 'Sound Active'}
        >
          {!isMuted ? (
            <Volume2 className="w-3.5 h-3.5 text-white" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span className="hidden sm:inline text-[11px] font-bold tracking-wider uppercase">
            {!isMuted ? 'Sound Active' : 'Sound Off'}
          </span>
        </button>

        {/* Minimal Skip Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
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
