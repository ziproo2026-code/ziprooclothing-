import React from 'react';

interface MovingSloganBarProps {
  className?: string;
}

const DEFAULT_SLOGANS = [
  'CREATE YOUR IDENTITY',
  "DON'T FOLLOW THE RULES. CREATE IT.",
  'WEAR YOUR IDENTITY',
  'DEFINE YOUR OWN STYLE',
];

export const MovingSloganBar: React.FC<MovingSloganBarProps> = ({ className = '' }) => {
  // Multiply the slogans list to ensure continuous looping with zero gaps on any screen size (up to 4K)
  const repeatedSlogans = [
    ...DEFAULT_SLOGANS,
    ...DEFAULT_SLOGANS,
    ...DEFAULT_SLOGANS,
    ...DEFAULT_SLOGANS,
    ...DEFAULT_SLOGANS,
    ...DEFAULT_SLOGANS,
  ];

  return (
    <div
      className={`relative z-30 overflow-hidden bg-black text-white border-y border-purple-900/40 select-none shadow-xs ${className}`}
      aria-label="ZIPROO Brand Slogans"
    >
      <div className="flex w-max animate-slogan-marquee hover:[animation-play-state:paused] py-2 sm:py-2.5">
        {repeatedSlogans.map((slogan, idx) => (
          <div
            key={idx}
            className="flex items-center space-x-6 sm:space-x-8 px-6 sm:px-8 text-[11px] sm:text-xs md:text-sm font-bold tracking-[0.2em] uppercase font-['Syncopate',sans-serif] shrink-0"
          >
            <span className="text-zinc-100 hover:text-purple-300 transition-colors">
              {slogan}
            </span>
            <span
              className="text-[#7c3aed] text-xs sm:text-sm drop-shadow-[0_0_8px_rgba(124,58,237,0.8)]"
              aria-hidden="true"
            >
              ✦
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
