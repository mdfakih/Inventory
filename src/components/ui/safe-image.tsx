'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackText?: string;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
}

export function SafeImage({
  src,
  alt,
  fallbackText = 'Image not available',
  fallbackIcon: FallbackIcon = ImageOff,
  className = '',
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-500 ${className}`}
        style={{
          width: props.width,
          height: props.height,
          minWidth: props.width,
          minHeight: props.height,
        }}
      >
        <FallbackIcon className="h-6 w-6 mb-1" />
        <span className="text-xs text-center px-1">{fallbackText}</span>
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
