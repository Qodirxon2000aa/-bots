import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { useTelegram } from '@/app/context/TelegramContext';
import { TopBar } from '@/app/components/ui/TopBar';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { ChipGroup, Chip } from '@/app/components/ui/Chip';
import { MessageBox } from '@/app/components/ui/EmptyState';
import { StarsStepper } from '@/app/components/StarsStepper';
import { SummaryCard } from '@/app/components/SummaryCard';
import { ArrowLeft, Sparkles, Bookmark, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000];

export function BuyStarsPage() {
  const navigate = useNavigate();
  // user ni ham olamiz — Telegram WebApp dan kelgan ma'lumotlar
  const {
    apiUser,
    user,
    createOrder,
    refreshUser,
    checkUsername,
    isFeatureEnabled,
    starsMaxAmount,
    starsCalculateLoading,
  } = useTelegram();
  const starsServiceOn = isFeatureEnabled('stars');
  const starsLimitReady = starsMaxAmount !== null;
  const starsSalesOn = starsServiceOn && starsLimitReady && starsMaxAmount > 0;
  const effectiveMaxStars =
    starsLimitReady && starsMaxAmount > 0
      ? starsMaxAmount
      : starsCalculateLoading
        ? 100000
        : 1;
  const presetAmounts = useMemo(
    () => PRESET_AMOUNTS.filter((a) => a <= effectiveMaxStars),
    [effectiveMaxStars]
  );
  
  const [username, setUsername] = useState('');
  const [stars, setStars] = useState(100);
  const [selectedPreset, setSelectedPreset] = useState(100);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [usernameError, setUsernameError] = useState('');
  
  // API dan kursni olish uchun state
  const [currentRate, setCurrentRate] = useState(220); // Default qiymat
  const [isLoadingRate, setIsLoadingRate] = useState(true);

  // API dan kursni olish
  useEffect(() => {
    const fetchRate = async () => {
      setIsLoadingRate(true);
      try {
        const response = await fetch('https://tezpremium.uz/MilliyDokon/control/settings.php');
        const data = await response.json();
        
        if (data.ok && data.settings && data.settings.price) {
          const rate = Number(data.settings.price);
          setCurrentRate(rate);
        }
      } catch (error) {
        console.error('Error fetching rate:', error);
        toast.error('Kursni yuklashda xatolik', {
          description: 'Default kurs ishlatiladi'
        });
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchRate();
    
    // Har 60 sekundda kursni yangilash
    const interval = setInterval(fetchRate, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!starsLimitReady || starsMaxAmount <= 0) return;
    setStars((s) => (s > starsMaxAmount ? starsMaxAmount : s));
  }, [starsLimitReady, starsMaxAmount]);

  useEffect(() => {
    if (!starsLimitReady || starsMaxAmount <= 0) return;
    setSelectedPreset((p) => (p != null && p > starsMaxAmount ? null : p));
  }, [starsLimitReady, starsMaxAmount]);

  const handleStarsChange = (value) => {
    const cap = starsLimitReady && starsMaxAmount > 0 ? starsMaxAmount : value;
    const v = Math.min(value, cap);
    setStars(v);
    setSelectedPreset(PRESET_AMOUNTS.includes(v) ? v : null);
  };

  const handlePresetClick = (amount) => {
    const cap = starsLimitReady && starsMaxAmount > 0 ? starsMaxAmount : amount;
    const a = Math.min(amount, cap);
    setStars(a);
    setSelectedPreset(a);
  };

  // Username tekshirish funksiyasi
  const handleUsernameCheck = async (value) => {
    setUsername(value);
    setUserProfile(null);
    setUsernameError('');

    if (!value || value.length < 3) {
      return;
    }

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
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameError('Xatolik yuz berdi');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const canProceed = username.length > 0 && stars > 0 && userProfile !== null;
  
  // Balansni tekshirish
  const userBalance = Number(apiUser?.balance || 0);
  const totalCost = stars * currentRate;
  const hasEnoughBalance = userBalance >= totalCost;

  const handleConfirmPayment = async () => {
    if (!username) return;
    if (!starsSalesOn) {
      toast.error("Xizmat vaqtincha o'chirilgan yoki limit mavjud emas");
      return;
    }
    if (stars > starsMaxAmount) {
      toast.error('Buyurtma limiti oshib ketdi', {
        description: `Bir martada maksimal ${starsMaxAmount.toLocaleString('uz-UZ')} ⭐`,
      });
      return;
    }
    if (!hasEnoughBalance) {
      toast.error("Mablag' yetarli emas", {
        description: `Sizda ${new Intl.NumberFormat('uz-UZ').format(userBalance)} UZS bor, lekin ${new Intl.NumberFormat('uz-UZ').format(totalCost)} UZS kerak`
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await createOrder({
        amount: stars,
        sent: username,
        type: 'stars',
        overall: totalCost
      });

      if (result.ok) {
        toast.success("To'lov muvaffaqiyatli!", {
          description: `${stars} stars @${username} ga yuborildi`
        });

        await refreshUser();

        setShowConfirmDialog(false);
        
        // Reset form
        setUsername('');
        setUserProfile(null);
        setUsernameError('');
        setStars(100);
        setSelectedPreset(100);

        setTimeout(() => {
          navigate('/history');
        }, 1000);
      } else {
        toast.error("To'lov amalga oshmadi", {
          description: result.message || 'Qaytadan urinib ko\'ring'
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("To'lov xatosi", {
        description: 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // O'z username'ini kiritish funksiyasi
  const handleSelfUsername = () => {
    let myUsername = user?.username;

    if (!myUsername) {
      toast.error("Username topilmadi", {
        description: "Telegram profilingizda username o'rnatilmagan"
      });
      return;
    }

    // @ belgisini olib tashlaymiz
    if (myUsername.startsWith('@')) {
      myUsername = myUsername.slice(1);
    }

    // Inputga yozamiz va tekshirishni boshlaymiz
    handleUsernameCheck(myUsername);
  };

  return (
    <div className="min-h-screen">
      <TopBar
        title="Stars Sotib olish"
        subtitle="Tez va Oson harid qiling!"
        backButton={
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 space-y-6">
        {starsCalculateLoading && !starsLimitReady && (
          <MessageBox type="info">
            <span>Stars limiti tekshirilmoqda…</span>
          </MessageBox>
        )}
        {starsLimitLoadFailed && (
          <MessageBox type="error">
            <div className="space-y-2">
              <span>
                <strong>Stars limitini yuklab bo&apos;lmadi</strong> (tarmoq yoki brauzer bloklari). API
                javobi olinmagan — bu <strong>server limiti 0</strong> bilan bir xil emas.
              </span>
              <p className="text-xs text-muted-foreground">
                Telegram Mini App boshqa domen bo&apos;lsa, serverda{' '}
                <code className="text-[11px]">calculate.php</code> uchun{' '}
                <strong>CORS</strong> (Access-Control-Allow-Origin) qo&apos;shilishi kerak.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => void fetchStarsLimits({ silent: false })}
              >
                Qayta yuklash
              </Button>
            </div>
          </MessageBox>
        )}
        {!starsSalesOn && starsLimitReady && (
          <MessageBox type="error">
            <span>
              Stars sotib olish hozircha mumkin emas.{' '}
              {starsMaxAmount === 0 ? (
                <>
                  <strong>Server limiti 0</strong> — xizmat vaqtincha o&apos;chirilgan. Keyinroq urinib
                  ko&apos;ring.
                </>
              ) : (
                <>
                  <strong>Xizmat vaqtincha o&apos;chirilgan</strong> — keyinroq urinib ko&apos;ring.
                </>
              )}
            </span>
          </MessageBox>
        )}
        {/* Balance Warning */}
        {!hasEnoughBalance && stars > 0 && !isLoadingRate && (
          <MessageBox type="error">
            <span>
              Mablag&apos; yetarli emas. Sizga <strong>{new Intl.NumberFormat('uz-UZ').format(totalCost)} UZS</strong> kerak,
              lekin sizda <strong>{new Intl.NumberFormat('uz-UZ').format(userBalance)} UZS</strong> bor
            </span>
          </MessageBox>
        )}

        {/* Info Banner */}
        <MessageBox type="info">
          <div className="space-y-1">
            <div>
              Joriy kurs: {isLoadingRate ? (
                <span className="inline-block w-20 h-4 bg-accent animate-pulse rounded" />
              ) : (
                <strong>1 ⭐ = {new Intl.NumberFormat('uz-UZ').format(currentRate)} UZS</strong>
              )}
            </div>
            <div className="text-xs">Sizning balansingiz: <strong>{new Intl.NumberFormat('uz-UZ').format(userBalance)} UZS</strong></div>
            {starsSalesOn && (
              <div className="text-xs pt-1">
                Bir buyurtmada maksimal:{' '}
                <strong>{new Intl.NumberFormat('uz-UZ').format(starsMaxAmount)} ⭐</strong>
              </div>
            )}
          </div>
        </MessageBox>

        {/* Recipient Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Qabul qiluvchi usernami</label>
            <button 
              onClick={handleSelfUsername}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Bookmark className="w-3.5 h-3.5" />
              O'zimga
            </button>
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameCheck(e.target.value)}
              placeholder="@username"
              className={`w-full px-4 py-3 bg-accent rounded-xl border transition-colors ${
                usernameError 
                  ? 'border-red-500 focus:border-red-500' 
                  : userProfile 
                  ? 'border-green-500 focus:border-green-500'
                  : 'border-border focus:border-primary'
              } focus:outline-none`}
            />
            {isCheckingUsername && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* User Profile Card */}
          {userProfile && (
            <Card className="bg-accent/30 border-green-500/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  {userProfile.photo ? (
                    <img 
                      src={userProfile.photo} 
                      alt={userProfile.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-medium">
                      {userProfile.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{userProfile.name}</p>
                    <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
                  </div>
                  {userProfile.has_premium && (
                    <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                      Premium
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {usernameError && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span>{usernameError}</span>
            </div>
          )}
        </div>

        {/* Stars Amount Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-telegram-gold" />
            Stars
          </label>

          <ChipGroup>
            {presetAmounts.map((amount) => (
              <Chip
                key={amount}
                selected={selectedPreset === amount}
                onClick={() => handlePresetClick(amount)}
              >
                {amount}
              </Chip>
            ))}
          </ChipGroup>
          {starsSalesOn && presetAmounts.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Tanlangan limitdan kichik tayyor miqdor yo&apos;q — quyidagi maydondan 1–
              {new Intl.NumberFormat('uz-UZ').format(starsMaxAmount)} ⭐ kiriting.
            </p>
          )}

          <StarsStepper
            value={stars}
            onChange={handleStarsChange}
            min={1}
            max={effectiveMaxStars}
          />
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Chek</label>
          <SummaryCard stars={stars} rateUZS={currentRate} />
        </div>

        {/* Actions */}
        <div className="space-y-2 sticky bottom-20 bg-background/80 backdrop-blur-lg p-4 -mx-4 border-t border-border">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={
              !starsSalesOn ||
              starsCalculateLoading ||
              !canProceed ||
              !hasEnoughBalance ||
              isLoadingRate
            }
            onClick={() => setShowConfirmDialog(true)}
          >
            <Sparkles className="w-5 h-5" />
            {starsCalculateLoading && !starsLimitReady
              ? 'Limit yuklanmoqda…'
              : !starsSalesOn
              ? "Xizmat vaqtincha o'chirilgan"
              : isLoadingRate
                ? 'Yuklanmoqda...'
                : !hasEnoughBalance && canProceed
                  ? "Mablag' yetarli emas"
                  : 'Sotib olish'}
          </Button>
          
          <Button
            variant="secondary"
            size="md"
            fullWidth
            disabled={!username}
          >
            <Bookmark className="w-4 h-4" />
            Saqlash
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog.Root open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md z-50">
            <Card className="shadow-2xl">
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <Dialog.Title className="text-xl font-medium mb-2">
                    To'lovni tasdiqlash
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    Tasdiqlashdan oldin buyurtmangizni ko'rib chiqing
                  </Dialog.Description>
                </div>

                {userProfile && (
                  <Card className="bg-accent/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        {userProfile.photo ? (
                          <img 
                            src={userProfile.photo} 
                            alt={userProfile.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white">
                            {userProfile.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{userProfile.name}</p>
                          <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
                        </div>
                        {userProfile.has_premium && (
                          <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                            Premium
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stars</span>
                          <span className="font-medium">{stars} ⭐</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Kurs</span>
                          <span className="font-medium">{new Intl.NumberFormat('uz-UZ').format(currentRate)} UZS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sizning balansingiz</span>
                          <span className="font-medium">{new Intl.NumberFormat('uz-UZ').format(userBalance)} UZS</span>
                        </div>
                        <div className="h-px bg-border my-2" />
                        <div className="flex justify-between text-base">
                          <span className="font-medium">Jami</span>
                          <span className="font-bold">{new Intl.NumberFormat('uz-UZ').format(totalCost)} UZS</span>
                        </div>
                        <div className="flex justify-between text-sm text-success">
                          <span>Qolgan balans</span>
                          <span className="font-medium">{new Intl.NumberFormat('uz-UZ').format(userBalance - totalCost)} UZS</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
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
                    Tasdiqlash va to'lash
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