import * as React from 'react';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export default function Link({ href, className, children, ...props }: LinkProps) {
  return (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
}
