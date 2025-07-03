'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProxiedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function ProxiedImage({ src, alt, fill, width, height, className, priority }: ProxiedImageProps) {
  const [error, setError] = useState(false);
  
  // Use proxy for WG-Gesucht images to handle their anti-hotlinking
  const proxiedSrc = src.includes('img.wg-gesucht.de') && !error
    ? `/api/proxy-image?url=${encodeURIComponent(src)}`
    : src;
  
  const handleError = () => {
    setError(true);
    // Will fall back to original URL or placeholder
  };
  
  if (fill) {
    return (
      <Image
        src={error ? '/placeholder-apartment.svg' : proxiedSrc}
        alt={alt}
        fill
        className={className}
        onError={handleError}
        priority={priority}
      />
    );
  }
  
  return (
    <Image
      src={error ? '/placeholder-apartment.svg' : proxiedSrc}
      alt={alt}
      width={width || 400}
      height={height || 300}
      className={className}
      onError={handleError}
      priority={priority}
    />
  );
}