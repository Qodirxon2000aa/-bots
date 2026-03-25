import { ReactNode } from 'react';

interface ChipProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, selected = false, onClick, className = '' }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-full text-sm transition-all active:scale-95 ${
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      } ${className}`}
    >
      {children}
    </button>
  );
}

interface ChipGroupProps {
  children: ReactNode;
  className?: string;
}

export function ChipGroup({ children, className = '' }: ChipGroupProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {children}
    </div>
  );
}
