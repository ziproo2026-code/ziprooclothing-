import React from 'react';

interface ZMonogramLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export const ZMonogramLogo: React.FC<ZMonogramLogoProps> = ({
  className = '',
  size = 'md',
  onClick,
}) => {
  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
    xl: 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32',
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      aria-label="ZIPROO Monogram Logo"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] select-none transition-transform duration-300 hover:scale-105"
      >
        {/* Grey Circular Background matching uploaded logo */}
        <circle cx="50" cy="50" r="47.5" fill="#6f6f6f" />
        
        {/* Subtle accent border */}
        <circle cx="50" cy="50" r="47.5" stroke="#27272a" strokeWidth="1" />

        {/* Precision White Capital Letter 'Z' from uploaded image */}
        <path
          d="M25.5 16 H79.5 V29 L47 67.5 H77.5 V80.5 H21 V67.5 L53 29 H25.5 V16 Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
};
