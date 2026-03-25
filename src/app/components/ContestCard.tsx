import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { Trophy, Calendar, Gift, TrendingUp } from 'lucide-react';
import { Contest } from '@/app/context/AppContext';
import { format } from 'date-fns';

interface ContestCardProps {
  contest: Contest;
  onBuyStars?: () => void;
}

export function ContestCard({ contest, onBuyStars }: ContestCardProps) {
  const progress = contest.currentUserPoints 
    ? Math.min((contest.currentUserPoints / 2000) * 100, 100) 
    : 0;

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-telegram-gold" />
              <CardTitle>{contest.name}</CardTitle>
            </div>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {format(contest.startDate, 'MMM d')} - {format(contest.endDate, 'MMM d, yyyy')}
            </CardDescription>
          </div>
          {contest.isActive ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="default">Ended</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prizes */}
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Prizes
          </p>
          {contest.prizes.map((prize) => (
            <div
              key={prize.place}
              className="flex items-center justify-between p-2 rounded-lg bg-background/50"
            >
              <span className="text-sm text-muted-foreground">
                {prize.place === 1 ? '🥇' : prize.place === 2 ? '🥈' : '🥉'} {prize.place === 1 ? '1st' : prize.place === 2 ? '2nd' : '3rd'} Place
              </span>
              <span className="text-sm font-medium">{prize.reward}</span>
            </div>
          ))}
        </div>

        {/* User Progress */}
        {contest.isParticipating && contest.currentUserRank && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Your Progress
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">Rank #{contest.currentUserRank}</span>
                <Badge variant="gold">{contest.currentUserPoints} ⭐</Badge>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-telegram-gold transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        {contest.isActive && (
          <Button 
            variant="primary" 
            fullWidth 
            onClick={onBuyStars}
            className="mt-2"
          >
            {contest.isParticipating ? 'Buy More Stars' : 'Join Contest'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
