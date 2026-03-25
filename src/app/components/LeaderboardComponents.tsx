import { Trophy, Medal } from 'lucide-react';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { LeaderboardEntry } from '@/app/context/AppContext';

interface PodiumCardProps {
  entries: LeaderboardEntry[];
}

export function PodiumCard({ entries }: PodiumCardProps) {
  const top3 = entries.slice(0, 3);
  
  const podiumOrder = [
    top3[1] ? { entry: top3[1], podiumIndex: 0 } : null,
    top3[0] ? { entry: top3[0], podiumIndex: 1 } : null,
    top3[2] ? { entry: top3[2], podiumIndex: 2 } : null,
  ].filter(Boolean);
  
  const heights = ['h-24', 'h-32', 'h-20'];
  const icons = [Medal, Trophy, Medal];
  const colors = ['text-muted-foreground', 'text-telegram-gold', 'text-muted-foreground'];
  const bgColors = ['bg-muted', 'bg-telegram-gold/10', 'bg-muted'];

  const formatUZS = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', { notation: 'compact' }).format(amount);
  };

  if (top3.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-2 px-4 py-6">
      {podiumOrder.map(({ entry, podiumIndex }) => {
        if (!entry) return null;
        
        const Icon = icons[podiumIndex];
        const actualRank = entry.rank;
        
        return (
          <div key={`podium-${podiumIndex}`} className="flex-1 flex flex-col items-center gap-2">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xl relative ${
              actualRank === 1 ? 'ring-4 ring-telegram-gold/30' : ''
            }`}>
              {entry.displayName.charAt(0).toUpperCase()}
              <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${bgColors[podiumIndex]} flex items-center justify-center border-2 border-background`}>
                <Icon className={`w-3.5 h-3.5 ${colors[podiumIndex]}`} />
              </div>
            </div>
            
            <div className="text-center min-w-0 w-full">
              <p className="text-sm font-medium truncate">{entry.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
              <div className="mt-1">
                <Badge variant={actualRank === 1 ? 'gold' : 'default'} className="text-[10px]">
                  {formatUZS(entry.totalStars)} ⭐
                </Badge>
              </div>
            </div>
            
            <div className={`${heights[podiumIndex]} w-full bg-gradient-to-t ${
              actualRank === 1 ? 'from-telegram-gold/20 to-telegram-gold/5' : 'from-muted to-muted/50'
            } rounded-t-xl flex items-end justify-center pb-3`}>
              <span className="text-2xl font-bold">{actualRank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

export function LeaderboardRow({ entry, isCurrentUser = false }: LeaderboardRowProps) {
  const formatUZS = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', { notation: 'compact' }).format(amount);
  };

  return (
    <Card className={isCurrentUser ? 'border-primary bg-accent/20' : ''}>
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 text-center">
          <span className="text-lg font-bold text-muted-foreground">#{entry.rank}</span>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white flex-shrink-0">
          {entry.displayName.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{entry.displayName}</p>
            {isCurrentUser && <Badge variant="default" className="text-[10px]">You</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">@{entry.username}</p>
        </div>
        
        <div className="text-right flex-shrink-0">
          <p className="font-medium">{formatUZS(entry.totalStars)} ⭐</p>
          <p className="text-xs text-muted-foreground">{formatUZS(entry.totalUZS)} UZS</p>
        </div>
      </div>
    </Card>
  );
}