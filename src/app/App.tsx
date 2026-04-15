import { RouterProvider } from 'react-router';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { AppProvider } from '@/app/context/AppContext';
import { TelegramProvider, useTelegram } from '@/app/context/TelegramContext';
import { router } from '@/app/routes';
import { Toaster } from 'sonner';
import { useState, useEffect } from "react";
import SplashScreen from "@/app/components/SplashScreen";
import { WebAppMaintenanceScreen } from '@/app/components/WebAppMaintenanceScreen';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

function ChannelSubscriptionModal({ onRetry, retrying }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center p-3">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative w-full max-w-md rounded-3xl border border-border/60 bg-card shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <AlertCircle className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-center text-lg font-bold">Obuna talab qilinadi</h2>
        <p className="text-center text-sm text-muted-foreground mt-2 leading-relaxed">
          Xizmatdan foydalanish uchun avval kanalga obuna bo&apos;ling.
        </p>

        <a
          href="https://t.me/milliydokonbot"
          target="_blank"
          rel="noreferrer"
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold h-11 hover:bg-primary/90 transition-colors"
        >
          <span>@milliydokonbot da obuna bo&apos;lish</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border h-11 font-semibold hover:bg-accent disabled:opacity-60 transition-colors"
        >
          <CheckCircle2 className={`w-4 h-4 ${retrying ? "animate-pulse" : ""}`} />
          {retrying ? "Tekshirilmoqda..." : "Obunani tekshirish"}
        </button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const {
    loading,
    isFeatureEnabled,
    fetchServiceStatus,
    channelSubChecked,
    channelSubAllowed,
    channelSubLoading,
    checkChannelSubscription,
  } = useTelegram();
  const [maintRetrying, setMaintRetrying] = useState(false);

  /** statusLoading ni bu yerga qo‘shmaslik kerak: retryda u true bo‘lsa ekran yopilib home ochilgandek bo‘lardi */
  const webappBlocked = !loading && !isFeatureEnabled('webapp');

  const handleMaintenanceRetry = async () => {
    setMaintRetrying(true);
    try {
      await fetchServiceStatus({ silent: true });
    } finally {
      setMaintRetrying(false);
    }
  };

  const handleSubRetry = async () => {
    await checkChannelSubscription();
  };

  if (webappBlocked) {
    return (
      <WebAppMaintenanceScreen
        onRetry={handleMaintenanceRetry}
        retrying={maintRetrying}
      />
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      {!loading && channelSubChecked && !channelSubAllowed && (
        <ChannelSubscriptionModal
          onRetry={handleSubRetry}
          retrying={channelSubLoading}
        />
      )}
      <Toaster position="top-center" richColors />
    </>
  );
}

export default function App() {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); // animatsiya davomiyligi

    return () => clearTimeout(timer);
  }, []);

  return (
    <TelegramProvider>
      <ThemeProvider>
        {loading ? (
          <SplashScreen />
        ) : (
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        )}
      </ThemeProvider>
    </TelegramProvider>
  );
}