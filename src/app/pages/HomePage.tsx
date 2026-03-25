import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTelegram } from '@/app/context/TelegramContext';
import { useApp } from '@/app/context/AppContext';
import { TopBar } from '@/app/components/ui/TopBar';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { 
  Wallet, 
  History, 
  Gift, 
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const { user, apiUser, orders, loading } = useTelegram();
  const { categories } = useApp();

  // Safe date formatter - API dan "03.02.2026 | 18:19" formatda keladi
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Noma'lum sana";
    
    try {
      // API dan kelgan format: "03.02.2026 | 18:19"
      // Bu format allaqachon o'zbek tilda, shuning uchun shunchaki qaytaramiz
      return dateString;
    } catch (e) {
      console.error("Date error:", dateString);
      return "Noma'lum sana";
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'successful':
      case 'delivered':
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Bajarildi
          </Badge>
        );
      case 'pending':
      case 'processing':
        return (
          <Badge variant="default" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Jarayonda
          </Badge>
        );
      case 'failed':
      case 'cancelled':
        return (
          <Badge variant="default" className="bg-red-500/10 text-red-600 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Bekor qilindi
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status || 'Noma\'lum'}
          </Badge>
        );
    }
  };

  const userBalance = Number(apiUser?.balance || 0);
  const totalOrders = orders?.length || 0;
  const recentOrders = orders?.slice(0, 5) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar 
        title={`Salom, ${user?.first_name || 'Foydalanuvchi'}!`}
        subtitle="Sizning Stars bozoringiz"
      />

      <div className="p-4 space-y-6 pb-20">
        {/* Balance Card */}
        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/80 text-sm mb-1">Sizning balansingiz</p>
                <h2 className="text-4xl font-bold">
                  {userBalance.toLocaleString('uz-UZ')} <span className="text-2xl">UZS</span>
                </h2>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="w-8 h-8" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/payment')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 transition-all text-left"
              >
                <TrendingUp className="w-5 h-5 mb-2" />
                <p className="text-sm font-medium">To'ldirish</p>
              </button>
              <button
                onClick={() => navigate('/payhistory')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 transition-all text-left"
              >
                <History className="w-5 h-5 mb-2" />
                <p className="text-sm font-medium">To'lovlar</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Card 
            className="cursor-pointer hover:shadow-md transition-all active:scale-95"
            onClick={() => navigate('/buy')}
          >
            <CardContent className="pt-5 text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-sm font-medium">Stars</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-all active:scale-95"
            onClick={() => navigate('/premium')}
          >
            <CardContent className="pt-5 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium">Premium</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-all active:scale-95"
            onClick={() => navigate('/gifts')}
          >
            <CardContent className="pt-5 text-center">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6 text-pink-600" />
              </div>
              <p className="text-sm font-medium">Gifts</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">So'nggi buyurtmalar</h3>
              {totalOrders > 5 && (
                <button
                  onClick={() => navigate('/history')}
                  className="text-sm text-primary hover:underline"
                >
                  Barchasini ko'rish
                </button>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Hali buyurtmalar yo'q</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order: any, index: number) => (
                  <div
                    key={order.order_id || index}
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-lg hover:bg-accent/70 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">
                          {order.type || 'Buyurtma'} - {order.amount || 0}
                        </p>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(order.date)}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">
                        {Number(order.summa || 0).toLocaleString('uz-UZ')} UZS
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jami buyurtmalar</p>
                  <p className="text-2xl font-bold">{totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Xizmatlar</p>
                  <p className="text-2xl font-bold">{categories?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}