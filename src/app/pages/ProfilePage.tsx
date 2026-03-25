import { useNavigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { useTelegram } from '@/app/context/TelegramContext';
import { useTheme } from '@/app/context/ThemeContext';
import { TopBar } from '@/app/components/ui/TopBar';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import {
  Shield,
  Moon,
  Sun,
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  Mail,
  RefreshCw,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user: appUser } = useApp();
  const { user: tgUser, apiUser, orders, refreshUser } = useTelegram();
  const { theme, toggleTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const getAvatarLetter = () => {
    if (tgUser?.first_name) return tgUser.first_name[0].toUpperCase();
    if (tgUser?.username) return tgUser.username.replace('@', '')[0].toUpperCase();
    return 'U';
  };

  useEffect(() => {
    console.log('👤 Profile Page Data:');
    console.log('   - tgUser:', tgUser);
    console.log('   - apiUser:', apiUser);
    console.log('   - orders:', orders);
  }, [tgUser, apiUser, orders]);

  const userBalance = Number(apiUser?.balance || 0);
  const totalStarsSpent =
    orders?.reduce((sum, order) => sum + (Number(order.amount) || 0), 0) || 0;

  const isAdmin = !!apiUser?.is_admin;

  const menuItems = [
    {
      icon: Settings,
      label: 'Sozlamalar',
      onClick: () => setSettingsOpen((v) => !v),
      badge: null,
    },
    { icon: HelpCircle, label: 'Yordam', onClick: () => {}, badge: null },
    { icon: Mail, label: 'Biz bilan ulanish', onClick: () => {}, badge: null },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        title="Profil"
        subtitle="Hisobingizni boshqarish"
        action={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-9 h-9 rounded-full bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors disabled:opacity-50"
            aria-label="Ma'lumotlarni yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="p-4 space-y-6 pb-20">
        {/* User Card */}
        <Card className="overflow-hidden border-none shadow-lg">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative w-20 h-20 rounded-full ring-4 ring-background/80 overflow-hidden bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-4xl font-bold shadow-md">
                {tgUser?.photo_url ? (
                  <img
                    src={tgUser.photo_url}
                    alt={`${tgUser.first_name || 'Foydalanuvchi'} avatar`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('❌ Avatar yuklanmadi:', tgUser.photo_url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                {!tgUser?.photo_url && (
                  <span className="select-none">{getAvatarLetter()}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold truncate">
                    {tgUser?.first_name || 'Foydalanuvchi'} {tgUser?.last_name || ''}
                  </h2>
                  {isAdmin && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-xs gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tgUser?.username || "Username yo'q"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Hisobingiz</p>
                <p className="text-lg font-semibold">
                  {userBalance.toLocaleString('uz-UZ')} UZS
                </p>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Ishlatilgan Stars</p>
                <p className="text-lg font-semibold">
                  {totalStarsSpent.toLocaleString('uz-UZ')} ⭐
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Info */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h3 className="font-semibold text-lg mb-2">Ma'lumotlar</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono font-medium">{tgUser?.id || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium">{tgUser?.username || "Yo'q"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Buyurtmalar soni</span>
                <span className="font-medium">{orders?.length || 0} ta</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Hisob turi</span>
                <Badge variant={tgUser?.isTelegram ? 'default' : 'secondary'}>
                  {tgUser?.isTelegram ? 'Telegram' : 'Veb'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const isSozlamalar = item.label === 'Sozlamalar';
            return (
              <div key={i}>
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                  onClick={item.onClick}
                >
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <p className="font-medium">{item.label}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
                        {isSozlamalar ? (
                          <ChevronDown
                            style={{
                              transform: settingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                            }}
                            className="w-5 h-5 text-muted-foreground"
                          />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dropdown — Sozlamalar ostida chiqadi */}
                {isSozlamalar && settingsOpen && (
                  <div className="mt-2 rounded-xl border border-border bg-card shadow-md p-3 space-y-2">

                    {/* Dark Mode */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/40">
                      <div className="flex items-center gap-3">
                        {theme === 'dark' ? (
                          <Moon className="w-5 h-5 text-primary" />
                        ) : (
                          <Sun className="w-5 h-5 text-amber-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">Mavzu</p>
                          <p className="text-xs text-muted-foreground capitalize">{theme} rejimi</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                        style={{ flexShrink: 0 }}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                          theme === 'dark' ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          style={{
                            transform: theme === 'dark' ? 'translateX(24px)' : 'translateX(0px)',
                            transition: 'transform 0.3s',
                          }}
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full shadow-md block"
                        />
                      </button>
                    </div>

                    {/* Admin Panel */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAdmin) { setSettingsOpen(false); navigate('/admin'); }
                      }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isAdmin
                          ? 'cursor-pointer border-primary/20 bg-primary/5 hover:bg-primary/10'
                          : 'opacity-50 cursor-not-allowed border-border/40 bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Admin panel</p>
                          <p className="text-xs text-muted-foreground">Narxlar va reytinglarni boshqarish</p>
                        </div>
                      </div>
                      {isAdmin ? (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground/50" />
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Logout */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-5">
            <button className="w-full flex items-center justify-center gap-3 text-destructive font-medium py-2">
              <LogOut className="w-5 h-5" />
              <span>Chiqish</span>
            </button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4 pb-8">
          <p>Stars Market • v1.0.0</p>
          <p className="text-xs mt-1">Made with ❤️ by @qiyossiz</p>
        </div>
      </div>

    </div>
  );
}