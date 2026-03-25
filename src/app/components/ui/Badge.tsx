import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'gold';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    gold: 'bg-telegram-gold/10 text-telegram-gold border-telegram-gold/20'
  };
  
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
