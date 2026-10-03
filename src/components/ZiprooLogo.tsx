import React from 'react';

interface ZiprooLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'light' | 'dark' | 'purple';
  showTagline?: boolean;
}

export const ZiprooLogo: React.FC<ZiprooLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'light',
  showTagline = false,
}) => {
  const sizeClasses = {
    sm: 'h-7',
    md: 'h-9 sm:h-10',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20',
    hero: 'h-20 sm:h-28 md:h-36',
  };

  const badgeFill = variant === 'purple' ? '#7c3aed' : '#6f6f6f';
  const badgeZFill = '#ffffff';
  const wordmarkColor = variant === 'dark' ? '#09090b' : '#ffffff';
  const subtitleColor = variant === 'dark' ? '#71717a' : '#a1a1aa';

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <svg
        viewBox="0 0 560 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses[size]} w-auto max-w-full select-none transition-transform duration-200`}
        aria-label="ZIPROO Logo — since 2026"
      >
        {/* Drop shadow filter */}
        <defs>
          <filter id="badgeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* 1. Circular Grey Emblem with White 'Z' (Matching Uploaded Logo) */}
        <g id="badge" filter="url(#badgeGlow)">
          {/* Main Grey Circle from uploaded image */}
          <circle cx="78" cy="90" r="66" fill={badgeFill} stroke="#27272a" strokeWidth="1" />
          
          {/* White Capital Letter 'Z' from uploaded image */}
          <path
            d="M44 42 H118 V60 L73 114 H116 V132 H38 V114 L82 60 H44 V42 Z"
            fill={badgeZFill}
          />
        </g>

        {/* 2. Capital Letter Wordmark: "ZIPROO" */}
        <g id="wordmark">
          <text
            x="172"
            y="108"
            fill={wordmarkColor}
            fontFamily="'Syncopate', 'Syne', 'Outfit', sans-serif"
            fontSize="54"
            fontWeight="800"
            letterSpacing="0.06em"
          >
            ZIPROO
          </text>
        </g>

        {/* 3. Sleek "since 2026" Subtitle */}
        <g id="subtitle">
          <text
            x="485"
            y="142"
            textAnchor="end"
            fill={subtitleColor}
            fontFamily="'Space Grotesk', 'Plus Jakarta Sans', monospace, sans-serif"
            fontSize="16"
            fontWeight="600"
            letterSpacing="0.1em"
          >
            since 2026
          </text>
          {/* Electric Violet Identity Dot */}
          <circle cx="496" cy="136" r="3" fill="#a855f7" />
        </g>
      </svg>

      {showTagline && (
        <span className="text-[10px] tracking-[0.3em] text-[#a855f7] font-semibold uppercase mt-1">
          CREATE YOUR IDENTITY
        </span>
      )}
    </div>
  );
};
