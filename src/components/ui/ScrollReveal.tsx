import { motion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
  viewportAmount?: number;
}

export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.65,
  yOffset = 28,
  className = '',
  viewportAmount = 0.12,
  ...props
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: viewportAmount, margin: '0px 0px -40px 0px' }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
