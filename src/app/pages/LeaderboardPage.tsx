import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { useTelegram } from '@/app/context/TelegramContext';
import { TopBar } from '@/app/components/ui/TopBar';
import { Button } from '@/app/components/ui/Button';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { ListItemSkeleton } from '@/app/components/ui/Skeleton';
import { PodiumCard, LeaderboardRow } from '@/app/components/LeaderboardComponents';
import { Trophy, AlertTriangle } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { toast } from 'sonner';

/* ===================== 🔥 GLOBAL @ HIDING FUNCTION ===================== */

function hideLonelyAtSymbol() {
  const elements = document.querySelectorAll('span, p, div');

  elements.forEach((el) => {
    const text = el.textContent?.trim();
    if (text === '@') {
      (el as HTMLElement).style.display = 'none';
    }
  });
}

type LeaderboardTab = 'all' | 'month' | 'week';

export function LeaderboardPage() {
  const navigate = useNavigate();
  const {
    leaderboard,
    monthlyLeaderboard,
    weeklyLeaderboard,
    leaderboardMonth,
    leaderboardWeek,
    leaderboardLoading,
    resetAllTimeLeaderboard,
  } = useApp();
  const { user: tgUser } = useTelegram();

  const [tab, setTab] = useState<LeaderboardTab>('all');
  const [showResetDialog, setShowResetDialog] = useState(false);

  const activeEntries = useMemo(() => {
    if (tab === 'all') return leaderboard;
    if (tab === 'month') return monthlyLeaderboard;
    return weeklyLeaderboard;
  }, [tab, leaderboard, monthlyLeaderboard, weeklyLeaderboard]);

  const periodSubtitle = useMemo(() => {
    if (leaderboardLoading) return 'Yuklanmoqda…';
    if (tab === 'all') return 'Butun vaqt';
    if (tab === 'month') return leaderboardMonth ?? 'Joriy oy';
    return leaderboardWeek ? `Hafta: ${leaderboardWeek}` : 'Haftalik reyting';
  }, [leaderboardLoading, tab, leaderboardMonth, leaderboardWeek]);

  /* ===================== 🔥 AUTO HIDE @ ===================== */

  useEffect(() => {
    hideLonelyAtSymbol();

    const observer = new MutationObserver(() => {
      hideLonelyAtSymbol();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [activeEntries]);

  /* ===================== RESET ===================== */

  const confirmReset = () => {
    resetAllTimeLeaderboard();
    toast.success('All-time leaderboard muvaffaqiyatli tiklandi');
    setShowResetDialog(false);
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Reyting" subtitle={periodSubtitle} />

      <div className="px-4 pt-3">
        <div className="flex gap-2 rounded-xl bg-muted/50 p-1">
          {(
            [
              { id: 'all' as const, label: 'Butun vaqt' },
              { id: 'month' as const, label: 'Oy' },
              { id: 'week' as const, label: 'Hafta' },
            ] as const
          ).map(({ id, label }) => (
            <Button
              key={id}
              type="button"
              variant={tab === id ? 'primary' : 'ghost'}
              size="sm"
              fullWidth
              className="rounded-lg text-xs sm:text-sm"
              onClick={() => setTab(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {leaderboardLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        ) : activeEntries.length > 0 ? (
          <>
            <PodiumCard entries={activeEntries} />

            <div className="space-y-2 mt-6">
              {activeEntries.slice(3).map((entry) => (
                <LeaderboardRow
                  key={`${tab}-${entry.rank}-${entry.userId ?? entry.displayName}`}
                  entry={entry}
                  isCurrentUser={
                    tgUser?.id != null &&
                    entry.userId != null &&
                    String(entry.userId) === String(tgUser.id)
                  }
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Trophy className="w-20 h-20 text-muted-foreground/70" />}
            title="Hozircha reyting bo‘sh"
            description="Yulduzlar sotib oling va birinchi o‘rinni egallang! Boshqa davr (Oy / Hafta) tabini ham tekshirib ko‘ring."
            action={
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/buy')}
                className="mt-4"
              >
                Yulduz sotib olish
              </Button>
            }
          />
        )}
      </div>

      {/* ===================== RESET DIALOG ===================== */}

      <AlertDialog.Root open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-card rounded-2xl shadow-2xl p-6 z-50 border border-border">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <AlertDialog.Title className="text-lg font-semibold">
                    Rostan ham tiklamoqchimisiz?
                  </AlertDialog.Title>
                  <AlertDialog.Description className="text-sm text-muted-foreground mt-1.5">
                    Bu amalni ortga qaytarib bo‘lmaydi.
                  </AlertDialog.Description>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                <strong>All-time leaderboard</strong> to‘liq o‘chiriladi va barcha
                ma'lumotlar abadiy yo‘qotiladi.
              </p>

              <div className="flex gap-3 pt-2">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline" fullWidth>
                    Bekor qilish
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button variant="destructive" fullWidth onClick={confirmReset}>
                    Ha, tiklash
                  </Button>
                </AlertDialog.Action>
              </div>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
