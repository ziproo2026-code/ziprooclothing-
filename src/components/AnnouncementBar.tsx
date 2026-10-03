import React from 'react';

interface AnnouncementBarProps {
  messages?: string[];
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  messages = [
    'ZIPROO — CREATE YOUR IDENTITY',
    "DON'T FOLLOW THE RULES. CREATE IT.",
    'NEW ERA, NEW IDENTITY · EST. 2026',
    'SHOP THE LATEST DROP',
    'WORLDWIDE EXPRESS SHIPPING',
    'OVERSIZED STREETWEAR ARCHITECTURE',
  ],
}) => {
  // Duplicate messages to create seamless continuous marquee loop
  const displayItems = [...messages, ...messages, ...messages];

  return (
    <div
      className="bg-zinc-100 text-zinc-900 border-y border-zinc-200/80 py-2.5 overflow-hidden select-none relative z-30"
      aria-label="Brand announcements"
    >
      <div className="flex w-max animate-marquee">
        {displayItems.map((msg, index) => (
          <div
            key={index}
            className="flex items-center space-x-6 px-6 text-xs md:text-sm font-semibold tracking-wider uppercase text-zinc-700"
          >
            <span className="hover:text-black transition-colors">{msg}</span>
            <span className="text-[#7c3aed] text-base" aria-hidden="true">
              ✦
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
