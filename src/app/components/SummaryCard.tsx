import { Card, CardContent } from '@/app/components/ui/Card';
import { Sparkles } from 'lucide-react';

interface SummaryCardProps {
  stars: number;
  rateUZS: number;
  fee?: number;
}

export function SummaryCard({ stars, rateUZS, fee = 0 }: SummaryCardProps) {
  const subtotal = stars * rateUZS;
  const total = subtotal + fee;

  const formatUZS = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount);
  };

  return (
    <Card className="bg-accent/30 border-accent">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rate per Star</span>
            <span className="font-medium">{formatUZS(rateUZS)} UZS</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Stars</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-telegram-gold" />
              <span className="font-medium">{formatUZS(stars)}</span>
            </div>
          </div>

          {fee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fee</span>
              <span className="font-medium">{formatUZS(fee)} UZS</span>
            </div>
          )}

          <div className="h-px bg-border my-2" />

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total</span>
            <div className="text-right">
              <p className="text-2xl font-medium">{formatUZS(total)}</p>
              <p className="text-xs text-muted-foreground">UZS</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
