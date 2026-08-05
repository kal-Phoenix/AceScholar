import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} text-amber-500 animate-spin`} />
        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md animate-pulse"></div>
      </div>
      {text && (
        <p className="text-xs text-slate-400 font-semibold tracking-wide">{text}</p>
      )}
    </div>
  );
}
