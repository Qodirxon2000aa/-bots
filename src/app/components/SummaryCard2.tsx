import { Card, CardContent } from '@/app/components/ui/Card';

interface SummaryCardProps {
  rateUZS: number | null;     // endi ishlatilmaydi, lekin prop sifatida qoldirdik
  totalUZS: number;
  selectedPreset?: string | null;  // "3m", "6m", "12m" yoki null
  fee?: number;
}

export function SummaryCard({
  totalUZS,
  selectedPreset = null,
  fee = 0,
}: SummaryCardProps) {
  const formatUZS = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

  const isPremium = !!selectedPreset;

  const packageLabel = selectedPreset
    ? `${selectedPreset.replace('m', ' oylik')} Premium`
    : null;

  return (
    <Card className="bg-accent/30 border-accent">
      <CardContent className="pt-4">
        <div className="space-y-3">

          {isPremium && packageLabel && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Paket</span>
              <span className="font-medium text-telegram-gold">{packageLabel}</span>
            </div>
          )}

          {isPremium && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tur</span>
              <span className="font-medium">Premium </span>
            </div>
          )}

          {fee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Xizmat haqi</span>
              <span className="font-medium">{formatUZS(fee)} UZS</span>
            </div>
          )}

          <div className="h-px bg-border my-2" />

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Jami to'lov</span>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatUZS(totalUZS)}</p>
              <p className="text-xs text-muted-foreground">UZS</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}