import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { TopBar } from '@/app/components/ui/TopBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Badge } from '@/app/components/ui/Badge';
import {
  ArrowLeft,
  TrendingUp,
  Shield,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function AdminPanelPage() {
  const navigate = useNavigate();

  /* ===================== RATE STATE (LOCAL) ===================== */
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [lastRateUpdate, setLastRateUpdate] = useState<Date | null>(null);
  const [newRate, setNewRate] = useState("");

  /* ===================== STATS STATE ===================== */
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /* ===================== FETCH STATS ===================== */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          'https://tezpremium.uz/MilliyDokon/control/statistics.php'
        );
        const data = await res.json();

        if (data.ok) {
          setStats(data);
        } else {
          toast.error('Statistika yuklanmadi');
        }
      } catch {
        toast.error('Statistika serverida xatolik');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  /* ===================== FETCH CURRENT RATE ===================== */
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch(
          'https://tezpremium.uz/MilliyDokon/control/settings.php'
        );
        const data = await res.json();

        if (data.ok && data.settings?.price) {
          const rate = Number(data.settings.price);
          if (!isNaN(rate) && rate > 0) {
            setCurrentRate(rate);
            setNewRate(String(rate));
            setLastRateUpdate(new Date());
          }
        }
      } catch {
        toast.error('Kursni yuklashda xatolik');
      }
    };

    fetchRate();
  }, []);

  /* ===================== RATE UPDATE ===================== */
  const handleUpdateRate = async () => {
    const rate = parseInt(newRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error('Noto‘g‘ri qiymat', {
        description: 'Iltimos, musbat son kiriting'
      });
      return;
    }

    try {
      const res = await fetch(
        `https://tezpremium.uz/MilliyDokon/control/setdata.php?type=star&value=${rate}`
      );
      const data = await res.json();

      if (data.ok) {
        setCurrentRate(rate);
        setLastRateUpdate(new Date());

        toast.success('Kurs yangilandi', {
          description: `1 ⭐ = ${new Intl.NumberFormat('uz-UZ').format(rate)} UZS`
        });
      } else {
        toast.error('API kursni qabul qilmadi');
      }
    } catch {
      toast.error('Serverga ulanishda xatolik');
    }
  };

  return (
    <div className="min-h-screen">
      {/* ===================== TOP BAR ===================== */}
      <TopBar
        title="Admin Panel"
        subtitle="Kurs va statistika"
        backButton={
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
        action={
          <Badge variant="gold" className="gap-1">
            <Shield className="w-3 h-3" />
            Admin
          </Badge>
        }
      />

      <div className="p-4 space-y-6">
        {/* ===================== RATE MANAGEMENT ===================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>Kurs boshqaruvi</CardTitle>
            </div>
            <CardDescription>
              Stars → UZS kursini o‘rnatish
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-3 bg-accent/30 rounded-lg">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Joriy kurs</span>
                <Badge className="text-xs">
                  {lastRateUpdate ? format(lastRateUpdate, 'HH:mm') : '—'}
                </Badge>
              </div>
              <p className="text-xl font-bold">
                1 ⭐ = {currentRate
                  ? new Intl.NumberFormat('uz-UZ').format(currentRate)
                  : '—'} UZS
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="Masalan: 1500"
              />
              <Button onClick={handleUpdateRate} className="gap-2">
                <Save className="w-4 h-4" />
                Saqlash
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ===================== STATS ===================== */}

                    <Card>
  <CardHeader>
    <CardTitle>Boshqa narxlar</CardTitle>
    <CardDescription>
      Premium, TON va referal sozlamalari
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-4">
    {[
      { label: '3 oylik Premium', key: '3oylik', type: '3oy', suffix: 'UZS' },
      { label: '6 oylik Premium', key: '6oylik', type: '6oy', suffix: 'UZS' },
      { label: '12 oylik Premium', key: '12oylik', type: '12oy', suffix: 'UZS' },
      { label: 'TON kursi', key: 'tonkurs', type: 'ton', suffix: 'UZS' },
      { label: 'Referal narxi', key: 'referal_price', type: 'sender', suffix: 'UZS' },
    ].map((item) => (
      <PriceBox
        key={item.type}
        label={item.label}
        settingKey={item.key}
        type={item.type}
        suffix={item.suffix}
      />
    ))}
  </CardContent>
</Card>



        <Card>
          <CardHeader>
            <CardTitle>Tezkor statistika</CardTitle>
            <CardDescription>
              Oxirgi yangilanish: {stats?.date ?? '—'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {statsLoading ? (
              <p className="text-sm text-muted-foreground">
                Statistika yuklanmoqda...
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Jami foydalanuvchilar</p>
                  <p className="text-2xl font-bold">{stats.users.total}</p>
                </div>

                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Bugungi foydalanuvchilar</p>
                  <p className="text-2xl font-bold">{stats.users.today}</p>
                </div>

                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Sotilgan Starslar</p>
                  <p className="text-2xl font-bold">{stats.stars.sold}</p>
                </div>

                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Starslar summasi</p>
                  <p className="text-2xl font-bold">
                    {stats.stars.summa.toLocaleString('uz-UZ')}
                  </p>
                </div>

                <div className="p-3 bg-primary/10 rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground">Bugungi savdo</p>
                  <p className="text-3xl font-bold text-primary">
                    {stats.turnover.today.toLocaleString('uz-UZ')} UZS
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===================== OTHER PRICES ===================== */}


      </div>
    </div>
  );
}


function PriceBox({
  label,
  settingKey,
  type,
  suffix,
}: {
  label: string;
  settingKey: string;
  type: string;
  suffix: string;
}) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadValue = async () => {
      try {
        const res = await fetch(
          'https://tezpremium.uz/MilliyDokon/control/settings.php'
        );
        const data = await res.json();

        if (data.ok && data.settings?.[settingKey]) {
          setValue(String(data.settings[settingKey]));
        }
      } catch {
        toast.error(`${label} yuklanmadi`);
      }
    };

    loadValue();
  }, []);

  const saveValue = async () => {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      toast.error('Noto‘g‘ri qiymat');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `https://tezpremium.uz/MilliyDokon/control/setdata.php?type=${type}&value=${num}`
      );
      const data = await res.json();

      if (data.ok) {
        toast.success(`${label} yangilandi`, {
          description: `${num.toLocaleString('uz-UZ')} ${suffix}`,
        });
      } else {
        toast.error(`${label} saqlanmadi`);
      }
    } catch {
      toast.error('Server xatoligi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-end gap-3 p-3 rounded-lg bg-accent/20">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Qiymat"
        />
      </div>

      <Button onClick={saveValue} disabled={loading}>
        <Save className="w-4 h-4" />
      </Button>
    </div>
  );
}
