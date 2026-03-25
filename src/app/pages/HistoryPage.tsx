import { useState } from 'react';
import { useTelegram } from '@/app/context/TelegramContext';
import { TopBar } from '@/app/components/ui/TopBar';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { ChipGroup, Chip } from '@/app/components/ui/Chip';
import { History, Sparkles, Clock, CheckCircle2, XCircle, Loader2, Star, Crown, Gift } from 'lucide-react';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';

// Backend → Frontend status mapping
const statusMap: Record<string, { label: string; variant: string; icon: JSX.Element | null }> = {
  Successful: {
    label: 'Tasdiqlangan',
    variant: 'success',
    icon: <CheckCircle2 className="w-4 h-4 text-success" />,
  },
  Pending: {
    label: 'Jarayonda',
    variant: 'warning',
    icon: <Loader2 className="w-4 h-4 text-warning animate-spin" />,
  },
  Failed: {
    label: 'Bekor qilingan',
    variant: 'destructive',
    icon: <XCircle className="w-4 h-4 text-destructive" />,
  },
};

// Type icon & color config
const typeConfig: Record<string, { icon: JSX.Element; color: string; bg: string }> = {
  Stars: {
    icon: <Star className="w-5 h-5" />,
    color: '#f59e0b',
    bg: 'linear-gradient(135deg, #92400e, #d97706)',
  },
  Premium: {
    icon: <Crown className="w-5 h-5" />,
    color: '#a855f7',
    bg: 'linear-gradient(135deg, #581c87, #9333ea)',
  },
  Gift: {
    icon: <Gift className="w-5 h-5" />,
    color: '#ec4899',
    bg: 'linear-gradient(135deg, #831843, #db2777)',
  },
};

type FilterType = 'all' | 'Successful' | 'Pending' | 'Failed';

interface Order {
  order_id: number | string;
  amount: number | string;
  summa: number;
  to: string | null | undefined;      // API returns "to" field
  sent?: string | null | undefined;   // fallback
  status: string;
  type: string;
  date: string;
}

export function HistoryPage() {
  const { orders, loading } = useTelegram();

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const getStatusConfig = (backendStatus: string) => {
    const s = (backendStatus || '').trim();
    return statusMap[s] || { label: s || 'Nomaʼlum', variant: 'default', icon: null };
  };

  const getTypeConfig = (type: string) => {
    return typeConfig[type] || {
      icon: <Star className="w-5 h-5" />,
      color: '#6b7280',
      bg: 'linear-gradient(135deg, #374151, #6b7280)',
    };
  };

  const parseDate = (dateStr: string) => {
    try {
      const [datePart, timePart] = dateStr.split(' | ');
      const [dd, mm, yyyy] = datePart.split('.');
      return new Date(`${yyyy}-${mm}-${dd}T${timePart}:00`);
    } catch {
      return new Date(dateStr);
    }
  };

  const formatUZS = (amount: number) =>
    new Intl.NumberFormat('uz-UZ').format(amount);

  // Get recipient username — API uses "to", fallback to "sent"
  const getUsername = (order: Order): string => {
    const raw = order.to ?? order.sent ?? '';
    if (!raw) return '';
    return raw.startsWith('@') ? raw : `@${raw}`;
  };

  // Filter orders
  const filteredOrders = (orders as Order[]).filter((order) => {
    if (filter === 'all') return true;
    return (order.status || '').trim() === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Tranzaksiyalar tarixi" subtitle="Siz bu yerdan barcha o'tkazmalarni ko'ra olasiz!" />

      <div className="p-4 space-y-5">
        {/* Filters */}
        <ChipGroup>
          <Chip selected={filter === 'all'}         onClick={() => setFilter('all')}>Hammasi</Chip>
          <Chip selected={filter === 'Successful'}  onClick={() => setFilter('Successful')}>Tasdiqlangan</Chip>
          <Chip selected={filter === 'Pending'}     onClick={() => setFilter('Pending')}>Jarayonda</Chip>
          <Chip selected={filter === 'Failed'}      onClick={() => setFilter('Failed')}>Bekor qilingan</Chip>
        </ChipGroup>

        {/* Transaction List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-3">
            {filteredOrders.map((tx) => {
              const statusCfg = getStatusConfig(tx.status);
              const typeCfg   = getTypeConfig(tx.type);
              const dateObj   = parseDate(tx.date);
              const username  = getUsername(tx);

              return (
                <Card
                  key={tx.order_id}
                  onClick={() => setSelectedOrder(tx)}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="p-4 space-y-3">
                    {/* Top row: avatar + type/username + status icon */}
                    <div className="flex items-center gap-3">
                      {/* Type avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                        style={{ background: typeCfg.bg }}
                      >
                        {typeCfg.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* TYPE shown as title */}
                        <p className="font-semibold truncate" style={{ color: typeCfg.color }}>
                          {tx.type}
                        </p>
                        {/* Username shown below */}
                        <p className="text-sm text-muted-foreground truncate">
                          {username || '—'}
                        </p>
                      </div>

                      {statusCfg.icon}
                    </div>

                    {/* Middle row: amount + badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        {tx.type === 'Stars' ? (
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            <span className="font-medium">{tx.amount}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Crown className="w-4 h-4 text-purple-400" />
                            <span className="font-medium">{tx.amount}</span>
                          </div>
                        )}
                        <div className="text-muted-foreground font-medium">
                          {formatUZS(tx.summa)} UZS
                        </div>
                      </div>
                      <Badge
                        variant={statusCfg.variant as any}
                        className="text-[10px] uppercase tracking-wide"
                      >
                        {statusCfg.label}
                      </Badge>
                    </div>

                    {/* Date row */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {format(dateObj, 'MMM d, yyyy • HH:mm')}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<History className="w-16 h-16 text-muted-foreground/70" />}
            title="Tranzaksiya yo'q"
            description={
              filter === 'all'
                ? "Hozircha tranzaksiya mavjud emas"
                : `Bu filtr bo'yicha tranzaksiya topilmadi`
            }
          />
        )}
      </div>

      {/* Details Dialog */}
      <Dialog.Root open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md z-50 max-h-[85vh] overflow-y-auto rounded-2xl">
            {selectedOrder && (() => {
              const statusCfg = getStatusConfig(selectedOrder.status);
              const typeCfg   = getTypeConfig(selectedOrder.type);
              const dateObj   = parseDate(selectedOrder.date);
              const username  = getUsername(selectedOrder);

              return (
                <Card className="shadow-2xl border-0">
                  <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="text-center">
                      <div
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white"
                        style={{ background: typeCfg.bg }}
                      >
                        <span style={{ transform: 'scale(1.4)', display: 'flex' }}>{typeCfg.icon}</span>
                      </div>
                      <Dialog.Title className="text-xl font-semibold" style={{ color: typeCfg.color }}>
                        {selectedOrder.type}
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-muted-foreground mt-1">
                        {username || '—'}
                      </Dialog.Description>
                    </div>

                    {/* Status */}
                    <div className="flex justify-center">
                      <Badge
                        variant={statusCfg.variant as any}
                        className="text-base px-5 py-1.5 flex items-center gap-2"
                      >
                        {statusCfg.icon}
                        <span className="capitalize font-medium">{statusCfg.label}</span>
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 bg-accent/30 rounded-xl p-4">
                      <div className="flex justify-between py-2 border-b border-border/60">
                        <span className="text-muted-foreground">Buyurtma ID</span>
                        <span className="font-mono">#{selectedOrder.order_id}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/60">
                        <span className="text-muted-foreground">Miqdor</span>
                        <div className="flex items-center gap-1.5">
                          {selectedOrder.type === 'Stars'
                            ? <Sparkles className="w-4 h-4 text-yellow-400" />
                            : <Crown className="w-4 h-4 text-purple-400" />
                          }
                          <span className="font-semibold">{selectedOrder.amount}</span>
                        </div>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/60">
                        <span className="text-muted-foreground">Summa</span>
                        <span className="font-bold">{formatUZS(selectedOrder.summa)} UZS</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/60">
                        <span className="text-muted-foreground">Kimga</span>
                        <span className="font-mono text-sm">{username || '—'}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Sana</span>
                        <span>{format(dateObj, 'dd MMM yyyy • HH:mm')}</span>
                      </div>
                    </div>

                    <Dialog.Close asChild>
                      <button className="w-full h-11 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 transition-colors">
                        Yopish
                      </button>
                    </Dialog.Close>
                  </div>
                </Card>
              );
            })()}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default HistoryPage;