import React, { useState } from 'react';
import heroMushafImg from '../assets/images/hero_mushaf_sanctuary_1793521437471.jpg';
import makkahHaramImg from '../assets/images/makkah_kaaba_haram_1793521439382.jpg';
import madinahMosqueImg from '../assets/images/madinah_prophets_mosque_1793521439996.jpg';
import islamicLibraryImg from '../assets/images/islamic_library_manuscripts_1793521441082.jpg';

export const SANCTUARY_ASSETS = {
  heroMushaf: heroMushafImg,
  makkahHaram: makkahHaramImg,
  madinahMosque: madinahMosqueImg,
  islamicLibrary: islamicLibraryImg,
} as const;

interface SanctuaryImageProps {
  src: string;
  alt: string;
  fallbackTitle?: string;
  className?: string;
}

export const SanctuaryImage: React.FC<SanctuaryImageProps> = ({
  src,
  alt,
  fallbackTitle,
  className = 'w-full h-full object-cover',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0E4A3A] to-[#072920] text-[#FBF9F5] p-6 text-center islamic-pattern-subtle ${className}`}
      >
        <svg className="w-10 h-10 text-amber-400/90 mb-2" viewBox="0 0 64 64" fill="none">
          <rect x="16" y="16" width="32" height="32" stroke="currentColor" strokeWidth="2.5" />
          <rect
            x="16"
            y="16"
            width="32"
            height="32"
            transform="rotate(45 32 32)"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <circle cx="32" cy="32" r="5" fill="currentColor" />
        </svg>
        {fallbackTitle && <span className="font-display text-sm font-bold">{fallbackTitle}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
