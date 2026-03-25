import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTelegram } from '@/app/context/TelegramContext';
import { TopBar } from '@/app/components/ui/TopBar';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { ChipGroup, Chip } from '@/app/components/ui/Chip';
import { MessageBox } from '@/app/components/ui/EmptyState';
import { Sparkles, Bookmark, AlertCircle, ArrowLeft } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { SummaryCard } from '@/app/components/SummaryCard2';

export default function Premium() {
  const navigate = useNavigate();
  const { apiUser, user, createOrder, refreshUser, checkUsername } = useTelegram();

  const [username, setUsername] = useState('');
  const [stars, setStars] = useState(300); // 3 oylik uchun 300 stars
  const [selectedPreset, setSelectedPreset] = useState('3m'); // Default 3 oylik
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [usernameError, setUsernameError] = useState('');

  const [currentRate, setCurrentRate] = useState(210);
  const [premiumPrices, setPremiumPrices] = useState({
    '3m': { stars: 0, uzs: 0 },
    '6m': { stars: 0, uzs: 0 },
    '12m': { stars: 0, uzs: 0 },
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const response = await fetch('https://tezpremium.uz/MilliyDokon/control/settings.php');
        const data = await response.json();

        if (data.ok && data.settings) {
          const s = data.settings;
          setCurrentRate(Number(s.price) || 210);

          setPremiumPrices({
            '3m': { stars: 300, uzs: Number(s['3oylik']) || 165000 },
            '6m': { stars: 600, uzs: Number(s['6oylik']) || 225000 },
            '12m': { stars: 1200, uzs: Number(s['12oylik']) || 295000 },
          });
        }
      } catch (error) {
        console.error('Settings yuklash xatosi:', error);
        toast.error("Sozlamalarni yuklab bo'lmadi", {
          description: 'Default qiymatlar ishlatilmoqda',
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 60000);
    return () => clearInterval(interval);
  }, []);

  const handlePresetClick = (value) => {
    setSelectedPreset(value);
    const pkg = premiumPrices[value];
    if (pkg) setStars(pkg.stars);
  };

  const handleUsernameCheck = async (value) => {
    setUsername(value);
    setUserProfile(null);
    setUsernameError('');
    if (!value || value.length < 3) return;

    setIsCheckingUsername(true);
    try {
      const result = await checkUsername(value);
      if (result.ok) {
        setUserProfile(result.data);
        setUsernameError('');
      } else {
        setUserProfile(null);
        setUsernameError(result.message || 'Foydalanuvchi topilmadi');
      }
    } catch {
      setUsernameError('Tekshirishda xatolik');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const canProceed = username.length > 0 && stars > 0 && userProfile !== null;

  const userBalance = Number(apiUser?.balance || 0);
  const totalCost = selectedPreset
    ? (premiumPrices[selectedPreset]?.uzs || 0)
    : (stars * currentRate);

  const hasEnoughBalance = userBalance >= totalCost;

  const handleConfirmPayment = async () => {
    if (!username || !stars) return;
    if (!hasEnoughBalance) {
      toast.error("Mablag' yetarli emas", {
        description: `Kerak: ${new Intl.NumberFormat('uz-UZ').format(totalCost)} UZS, sizda: ${new Intl.NumberFormat('uz-UZ').format(userBalance)} UZS`,
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createOrder({
        amount: stars,
        sent: username,
        type: 'stars',
        overall: totalCost,
        // package: selectedPreset,   // agar backendda kerak bo'lsa qo'shish mumkin
      });

      if (result.ok) {
        toast.success("To'lov muvaffaqiyatli!", {
          description: `${stars} stars @${username} ga yuborildi`,
        });
        await refreshUser();
        setShowConfirmDialog(false);

        setUsername('');
        setUserProfile(null);
        setUsernameError('');
        setStars(300);
        setSelectedPreset('3m');

        setTimeout(() => navigate('/history'), 1200);
      } else {
        toast.error(result.message || "To'lov amalga oshmadi");
      }
    } catch {
      toast.error("To'lov jarayonida xatolik");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelfUsername = () => {
    let myUsername = user?.username;
    if (!myUsername) {
      toast.error("Telegram username topilmadi");
      return;
    }
    if (myUsername.startsWith('@')) myUsername = myUsername.slice(1);
    handleUsernameCheck(myUsername);
  };

  const isPremiumSelected = !!selectedPreset;

  return (
    <div className="min-h-screen">
      <TopBar
        title="Premium Sotib olish"
        subtitle="Tez va ishonchli"
        backButton={
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 space-y-6">
        {!hasEnoughBalance && stars > 0 && !isLoadingSettings && (
          <MessageBox type="error">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>
                Mablag&apos; yetarli emas. Kerak: <strong>{new Intl.NumberFormat('uz-UZ').format(totalCost)} UZS</strong>,
                sizda: <strong>{new Intl.NumberFormat('uz-UZ').format(userBalance)} UZS</strong>
              </span>
            </div>
          </MessageBox>
        )}

        <MessageBox type="info">
          <div className="space-y-1">
            {!isPremiumSelected && (
              <div>
                Joriy kurs:{' '}
                {isLoadingSettings ? (
                  <span className="inline-block w-16 h-4 bg-accent animate-pulse rounded" />
                ) : (
                  <strong>1 ⭐ = {new Intl.NumberFormat('uz-UZ').format(currentRate)} UZS</strong>
                )}
              </div>
            )}
            <div className="text-xs">
              Balans: <strong>{new Intl.NumberFormat('uz-UZ').format(userBalance)} UZS</strong>
            </div>
          </div>
        </MessageBox>

        {/* Qabul qiluvchi */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Qabul qiluvchi</label>
            <button
              onClick={handleSelfUsername}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Bookmark className="w-3.5 h-3.5" />
              O&apos;zimga
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameCheck(e.target.value)}
              placeholder="@username"
              className={`w-full px-4 py-3 bg-accent rounded-xl border ${
                usernameError ? 'border-red-500' : userProfile ? 'border-green-500' : 'border-border'
              } focus:outline-none focus:border-primary transition-colors`}
            />
            {isCheckingUsername && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {userProfile && (
            <Card className="bg-accent/30 border-green-500/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  {userProfile.photo ? (
                    <img src={userProfile.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-medium">
                      {userProfile.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{userProfile.name}</p>
                    <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
                  </div>
                  {userProfile.has_premium && (
                    <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">Premium</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {usernameError && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span>{usernameError}</span>
            </div>
          )}
        </div>

        {/* Premium paketlar */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-telegram-gold" />
            Premium paketlar
          </label>

          {isLoadingSettings ? (
            <div className="grid grid-cols-3 gap-2">
              {['3 oy', '6 oy', '12 oy'].map((t) => (
                <div key={t} className="h-10 bg-accent animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <ChipGroup>
              {Object.entries(premiumPrices).map(([key, pkg]) => (
                <Chip
                  key={key}
                  selected={selectedPreset === key}
                  onClick={() => handlePresetClick(key)}
                >
                  {key.replace('m', ' oy')} – {new Intl.NumberFormat('uz-UZ').format(pkg.uzs)} so&apos;m
                </Chip>
              ))}
            </ChipGroup>
          )}
        </div>

        {/* Chek - faqat premium tanlanganda ko'rinadi */}
        {isPremiumSelected && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Chek</label>
            <SummaryCard
              stars={stars}
              rateUZS={isPremiumSelected ? null : currentRate}
              totalUZS={totalCost}
              selectedPreset={selectedPreset}
              fee={0}
            />
          </div>
        )}

        {/* Pastki tugmalar */}
        <div className="space-y-2 sticky bottom-20 bg-background/80 backdrop-blur-lg p-4 -mx-4 border-t border-border">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canProceed || !hasEnoughBalance || isLoadingSettings}
            onClick={() => setShowConfirmDialog(true)}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {isLoadingSettings
              ? 'Yuklanmoqda...'
              : !hasEnoughBalance && canProceed
              ? "Mablag' yetarli emas"
              : 'Sotib olish'}
          </Button>

          <Button variant="secondary" size="md" fullWidth disabled={!username}>
            <Bookmark className="w-4 h-4 mr-2" />
            Saqlash
          </Button>
        </div>
      </div>

      {/* Tasdiqlash dialogi */}
      <Dialog.Root open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md z-50">
            <Card className="shadow-2xl">
              <div className="p-6 space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <Dialog.Title className="text-xl font-medium">To&apos;lovni tasdiqlash</Dialog.Title>
                </div>

                {userProfile && (
                  <Card className="bg-accent/20">
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center gap-3">
                        {userProfile.photo ? (
                          <img src={userProfile.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 text-white flex items-center justify-center font-medium">
                            {userProfile.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{userProfile.name}</p>
                          <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stars</span>
                          <span className="font-medium">{stars} ⭐</span>
                        </div>

                        {isPremiumSelected && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Paket</span>
                            <span className="font-medium">{selectedPreset.replace('m', ' oylik')}</span>
                          </div>
                        )}

                        {!isPremiumSelected && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Kurs</span>
                            <span className="font-medium">{new Intl.NumberFormat('uz-UZ').format(currentRate)} UZS / 1⭐</span>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Jami</span>
                          <span className="font-bold text-lg">{new Intl.NumberFormat('uz-UZ').format(totalCost)} UZS</span>
                        </div>

                        <div className="flex justify-between text-success text-sm">
                          <span>Qolgan balans</span>
                          <span>{new Intl.NumberFormat('uz-UZ').format(userBalance - totalCost)} UZS</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={isProcessing}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleConfirmPayment}
                    loading={isProcessing}
                  >
                    Tasdiqlash va to&apos;lash
                  </Button>
                </div>
              </div>
            </Card>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}