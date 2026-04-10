import { Wrench, RefreshCw } from 'lucide-react';

type Props = {
  onRetry?: () => void | Promise<void>;
  retrying?: boolean;
};

export function WebAppMaintenanceScreen({ onRetry, retrying }: Props) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-40 scale-150" />
        <div className="relative w-28 h-28 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shadow-lg shadow-primary/10">
          <Wrench className="w-14 h-14 text-primary motion-safe:animate-bounce" />
        </div>
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2 max-w-sm">
        Web ilova tamirlanmoqda
      </h1>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-8">
        Iltimos, vaqtincha bot orqali foydalaning. Tez orada qaytamiz.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={() => void onRetry()}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          Qayta tekshirish
        </button>
      )}
    </div>
  );
}
