import { RouterProvider } from 'react-router';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { AppProvider } from '@/app/context/AppContext';
import { TelegramProvider } from '@/app/context/TelegramContext';
import { router } from '@/app/routes';
import { Toaster } from 'sonner';
import { useState, useEffect } from "react";
import SplashScreen from "@/app/components/SplashScreen";

export default function App() {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); // animatsiya davomiyligi

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider>
      <TelegramProvider>
        <AppProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" richColors />
        </AppProvider>
      </TelegramProvider>
    </ThemeProvider>
  );
}