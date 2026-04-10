import { RouterProvider } from 'react-router';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { AppProvider } from '@/app/context/AppContext';
import { TelegramProvider, useTelegram } from '@/app/context/TelegramContext';
import { router } from '@/app/routes';
import { Toaster } from 'sonner';
import { useState, useEffect } from "react";
import SplashScreen from "@/app/components/SplashScreen";
import { WebAppMaintenanceScreen } from '@/app/components/WebAppMaintenanceScreen';

function AppRoutes() {
  const { loading, statusLoading, isFeatureEnabled, fetchServiceStatus } = useTelegram();
  const [maintRetrying, setMaintRetrying] = useState(false);

  const webappBlocked =
    !loading &&
    !statusLoading &&
    !isFeatureEnabled('webapp');

  const handleMaintenanceRetry = async () => {
    setMaintRetrying(true);
    try {
      await fetchServiceStatus({ silent: false });
    } finally {
      setMaintRetrying(false);
    }
  };

  if (webappBlocked) {
    return (
      <WebAppMaintenanceScreen
        onRetry={handleMaintenanceRetry}
        retrying={maintRetrying || statusLoading}
      />
    );
  }

  return (
    <>
      <RouterProvider router={router} />
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