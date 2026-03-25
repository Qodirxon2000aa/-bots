import { Outlet, useLocation, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { BottomNav } from '@/app/components/BottomNav';

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // 🔥 faqat shu pageda footer yo‘q
  const hideBottomNav = location.pathname === "/chek";

  /* ================= TELEGRAM START PARAM ================= */
  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg) return;

    const startParam = tg?.initDataUnsafe?.start_param;

    if (startParam) {
      console.log("🚀 Telegram start_param:", startParam);

      const allowedRoutes = [
        "payment",
        "premium",
        "gifts",
        "history",
        "profile",
        "admin",
        "buy"
      ];

      if (allowedRoutes.includes(startParam)) {
        navigate(`/${startParam}`);
      }
    }
  }, []);
  /* ======================================================== */

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-md mx-auto">

        <Outlet />

        {/* footer yashiriladigan page */}
        {!hideBottomNav && <BottomNav />}

      </div>
    </div>
  );
}