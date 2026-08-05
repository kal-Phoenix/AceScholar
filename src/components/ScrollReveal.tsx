import { ReactNode } from 'react';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  className?: string;
  threshold?: number;
}

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  className = '',
  threshold = 0.15,
}: ScrollRevealProps) {
  const baseClass = {
    up: 'reveal',
    down: 'reveal',
    left: 'reveal-left',
    right: 'reveal-right',
    scale: 'reveal-scale',
    blur: 'reveal-blur',
  }[direction];

  const delayClass = delay > 0 ? `reveal-delay-${delay}` : '';

  return (
    <div
      className={`${baseClass} ${delayClass} ${className}`}
      ref={(el) => {
        if (!el) return;
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              el.classList.add('reveal-visible');
              observer.unobserve(el);
            }
          },
          { threshold }
        );
        observer.observe(el);
      }}
    >
      {children}
    </div>
  );
}
