import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-base mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface MessageBoxProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  className?: string;
}

export function MessageBox({ type, title, children, className = '' }: MessageBoxProps) {
  const icons = {
    info: <Info className="w-5 h-5" />,
    success: <CheckCircle2 className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />
  };
  
  const colors = {
    info: 'bg-primary/5 text-primary border-primary/20',
    success: 'bg-success/5 text-success border-success/20',
    warning: 'bg-warning/5 text-warning border-warning/20',
    error: 'bg-destructive/5 text-destructive border-destructive/20'
  };
  
  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${colors[type]} ${className}`}>
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium mb-1">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
