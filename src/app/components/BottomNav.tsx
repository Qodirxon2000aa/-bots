import { Link, useLocation } from 'react-router';
import { Home, Sparkles, Trophy, History, User } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Bosh sahifa' },
    { path: '/buy', icon: Sparkles, label: 'Stars' },
    { path: '/leaderboard', icon: Trophy, label: 'Reyting' },
    { path: '/history', icon: History, label: 'Tarix' },
    { path: '/profile', icon: User, label: 'Profil' }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
