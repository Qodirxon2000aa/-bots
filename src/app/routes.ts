import { createBrowserRouter } from 'react-router';
import { RootLayout } from '@/app/layouts/RootLayout';
import { HomePage } from '@/app/pages/HomePage';
import { BuyStarsPage } from '@/app/pages/BuyStarsPage';
import { LeaderboardPage } from '@/app/pages/LeaderboardPage';
import { HistoryPage } from '@/app/pages/HistoryPage';
import { ProfilePage } from '@/app/pages/ProfilePage';
import { AdminPanelPage } from '@/app/pages/AdminPanelPage';
import Payment from '@/app/pages/Payment';
import Ton from '@/app/pages/Ton';
import History from '@/app/pages/History';
import Premuim from './pages/premuim'
import Gifts from './pages/gifts'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'buy', Component: BuyStarsPage },
      { path: 'leaderboard', Component: LeaderboardPage },
      { path: 'history', Component: HistoryPage },
      { path: 'profile', Component: ProfilePage },
      { path: 'admin', Component: AdminPanelPage },
      { path: 'payment', Component: Payment },
      { path: 'ton', Component: Ton },
     { path: 'payhistory', Component: History },
     { path: 'premium', Component: Premuim },
     { path: 'gifts', Component: Gifts },


      

     
    ]
  }
]);
