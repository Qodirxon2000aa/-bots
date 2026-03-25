import { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  backButton?: ReactNode;
}

export function TopBar({ title, subtitle, action, backButton }: TopBarProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {backButton}
          <div className="min-w-0">
            <h1 className="text-base truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
