import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useTelegram } from '@/app/context/TelegramContext';
import { TopBar } from '@/app/components/ui/TopBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Badge } from '@/app/components/ui/Badge';
import {
  ArrowLeft,
  Gift,
  Plus,
  Minus,
  ExternalLink,
  Loader2,
  Trash2,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

/** Ro‘yxat (ochiq API) */
const GIFT_LIST_API = 'https://tezpremium.uz/uzbstar/giftlar.php';

/** Qo‘shish: POST JSON { initData, url, price } */
const NFT_GIFT_ADD_API = 'https://tezpremium.uz/MilliyDokon/nft/add.php';

/** Narxni yangilash: POST JSON { initData, gift_id, price } — backendni alohida yozishingiz kerak */
const NFT_GIFT_PRICE_API = 'https://tezpremium.uz/MilliyDokon/control/nft_gift_price.php';

/** O'chirish: POST JSON { initData, gift_id } — backendni alohida yozishingiz kerak */
const NFT_GIFT_DELETE_API = 'https://tezpremium.uz/MilliyDokon/control/nft_gift_delete.php';

type NftGiftRow = {
  id: number;
  price: number;
  nft_id: string;
  model?: string;
  backdrop?: string;
  link?: string;
  photo?: string;
  created_at?: string;
};

function formatNftName(nftId: string) {
  if (!nftId) return 'NFT';
  return nftId.split('-')[0]?.replace(/([A-Z])/g, ' $1').trim() || nftId;
}

async function postWithInitData(
  url: string,
  initData: string,
  body: Record<string, unknown>
) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      initData,
      init_data: initData,
      ...body,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return {
    ok: !!data.ok,
    message: typeof data.message === 'string' ? data.message : undefined,
    status: res.status,
  };
}

export function AdminGiftsPage() {
  const navigate = useNavigate();
  const { apiUser, getInitData, loading: tgLoading } = useTelegram();

  const [listLoading, setListLoading] = useState(true);
  const [gifts, setGifts] = useState<NftGiftRow[]>([]);
  const [draftPrices, setDraftPrices] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [newUrl, setNewUrl] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [adding, setAdding] = useState(false);

  const isAdmin = !!apiUser?.is_admin;

  const loadGifts = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch(GIFT_LIST_API, { cache: 'no-cache' });
      const data = await res.json();
      if (data.ok && Array.isArray(data.gifts)) {
        const rows: NftGiftRow[] = data.gifts;
        setGifts(rows);
        const next: Record<number, number> = {};
        rows.forEach((g) => {
          next[g.id] = g.price;
        });
        setDraftPrices(next);
      } else {
        setGifts([]);
      }
    } catch {
      toast.error('Giftlar ro‘yxatini yuklab bo‘lmadi');
      setGifts([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tgLoading) return;
    if (!isAdmin) {
      toast.error('Kirish rad etildi', { description: 'Faqat adminlar uchun.' });
      navigate('/profile', { replace: true });
      return;
    }
    void loadGifts();
  }, [tgLoading, isAdmin, navigate, loadGifts]);

  const requireInitData = () => {
    const raw = (getInitData?.() || '').trim();
    if (!raw) {
      toast.error('initData topilmadi', { description: 'Bot ichidagi Web Appdan oching.' });
      return null;
    }
    return raw;
  };

  const handleAdd = async () => {
    const url = newUrl.trim();
    const priceNum = Number(newPrice);
    if (!url) {
      toast.error('URL kiriting');
      return;
    }
    if (!url.toLowerCase().startsWith('https://t.me/nft/')) {
      toast.error('Noto‘g‘ri URL', { description: 'https://t.me/nft/ ... bilan boshlanishi kerak' });
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error('Narx noto‘g‘ri');
      return;
    }
    const initData = requireInitData();
    if (!initData) return;

    setAdding(true);
    try {
      const { ok, message } = await postWithInitData(NFT_GIFT_ADD_API, initData, {
        url,
        price: priceNum,
      });
      if (ok) {
        toast.success('Gift qo‘shildi');
        setNewUrl('');
        setNewPrice('');
        await loadGifts();
      } else {
        toast.error(message || 'Qo‘shib bo‘lmadi');
      }
    } catch {
      toast.error('Server xatosi');
    } finally {
      setAdding(false);
    }
  };

  const bumpPrice = (id: number, delta: number) => {
    setDraftPrices((prev) => {
      const cur = prev[id] ?? 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [id]: next };
    });
  };

  const savePrice = async (id: number) => {
    const initData = requireInitData();
    if (!initData) return;
    const price = draftPrices[id];
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Narx noto‘g‘ri');
      return;
    }
    setSavingId(id);
    try {
      const { ok, message } = await postWithInitData(NFT_GIFT_PRICE_API, initData, {
        gift_id: id,
        price,
      });
      if (ok) {
        toast.success('Narx saqlandi');
        await loadGifts();
      } else {
        toast.error(message || 'Narx saqlanmadi', {
          description:
            message?.includes('404') || !message
              ? 'Backendda nft_gift_price.php (yoki mos endpoint) bo‘lishi kerak.'
              : undefined,
        });
      }
    } catch {
      toast.error('Server xatosi');
    } finally {
      setSavingId(null);
    }
  };

  const deleteGift = async (id: number) => {
    const initData = requireInitData();
    if (!initData) return;
    setDeletingId(id);
    try {
      const { ok, message } = await postWithInitData(NFT_GIFT_DELETE_API, initData, {
        gift_id: id,
      });
      if (ok) {
        toast.success('Gift o‘chirildi');
        await loadGifts();
      } else {
        toast.error(message || 'O‘chirib bo‘lmadi', {
          description: !message ? 'Backendda nft_gift_delete.php bo‘lishi kerak.' : undefined,
        });
      }
    } catch {
      toast.error('Server xatosi');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin && !tgLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar
        title="NFT giftlar"
        subtitle="Admin boshqaruvi"
        backButton={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
        action={
          <Badge variant="gold" className="gap-1">
            <Gift className="h-3 w-3" />
            Admin
          </Badge>
        }
      />

      <div className="space-y-5 p-4">
        <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-primary" />
              Yangi gift
            </CardTitle>
            <CardDescription>
              Telegram NFT havolasi va narxi — backend <code className="text-xs">initData</code>,{' '}
              <code className="text-xs">url</code>, <code className="text-xs">price</code> qabul qiladi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="url"
              inputMode="url"
              placeholder="https://t.me/nft/..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="font-mono text-xs sm:text-sm"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="number"
                min={0}
                placeholder="Narx (UZS)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="sm:max-w-[200px]"
              />
              <Button
                type="button"
                className="gap-2 sm:ml-auto"
                onClick={() => void handleAdd()}
                disabled={adding}
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Qo‘shish
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-0.5">
            <div>
              <h2 className="text-base font-semibold">Barcha NFT giftlar</h2>
              <p className="text-xs text-muted-foreground">{gifts.length} ta</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 rounded-lg text-xs"
              onClick={() => void loadGifts()}
              disabled={listLoading}
            >
              <Loader2 className={`h-3 w-3 ${listLoading ? 'animate-spin' : 'hidden'}`} />
              Yangilash
            </Button>
          </div>

          {listLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Yuklanmoqda...</p>
            </div>
          ) : gifts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <ShieldAlert className="h-10 w-10 opacity-40" />
              <p className="text-sm">Hozircha NFT gift yo‘q</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {gifts.map((g) => (
                <div
                  key={g.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-border/50 transition-all hover:border-border"
                >
                  <div className="relative aspect-square w-full bg-accent/20">
                    {g.photo ? (
                      <img
                        src={g.photo}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Gift className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute left-1.5 top-1.5 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                      #{g.id}
                    </div>
                  </div>

                  <div className="h-px bg-border/30" />

                  <div className="flex flex-1 flex-col space-y-1.5 p-2.5">
                    <p
                      className="truncate text-xs font-semibold leading-tight"
                      title={formatNftName(g.nft_id)}
                    >
                      {formatNftName(g.nft_id)}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground/70" title={g.nft_id}>
                      {g.model != null && g.backdrop != null
                        ? `${g.model} · ${g.backdrop}`
                        : g.nft_id}
                    </p>

                    {g.link ? (
                      <a
                        href={g.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        Link
                      </a>
                    ) : null}

                    <div className="flex items-center gap-1 pt-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 shrink-0 rounded-lg p-0"
                        onClick={() => bumpPrice(g.id, -1000)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 min-w-0 flex-1 rounded-lg px-1 text-center text-xs font-bold tabular-nums"
                        value={draftPrices[g.id] ?? g.price}
                        onChange={(e) =>
                          setDraftPrices((p) => ({
                            ...p,
                            [g.id]: Number(e.target.value) || 0,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 shrink-0 rounded-lg p-0"
                        onClick={() => bumpPrice(g.id, 1000)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold"
                      disabled={savingId === g.id}
                      onClick={() => void savePrice(g.id)}
                    >
                      {savingId === g.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5 shrink-0" />
                      )}
                      Saqlash
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold"
                      disabled={deletingId === g.id}
                      onClick={() => void deleteGift(g.id)}
                    >
                      {deletingId === g.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                      )}
                      O‘chirish
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
