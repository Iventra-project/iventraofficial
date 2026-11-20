import * as React from 'react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  width?: number | string;
  height?: number | string;
  fill?: boolean;
}

export default function Image({ src, alt = '', className, width, height, fill, ...props }: ImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      {...props}
    />
  );
}
