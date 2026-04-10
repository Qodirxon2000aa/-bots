import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';

/* ===================== TYPES ===================== */

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isAdmin: boolean;
  balanceUZS: number;
  starsSpent: number;
}

export interface Transaction {
  id: string;
  recipientUsername: string;
  recipientDisplayName: string;
  stars: number;
  rateUZS: number;
  totalUZS: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

export interface LeaderboardEntry {
  rank: number;
  totalStars: number;
  totalUZS: number;
  displayName: string; // ✅ faqat toza ism
  avatar?: string;
  userId?: number | string;
  username?: string;
}

export interface Contest {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  prizes: { place: number; reward: string }[];
  currentUserRank?: number;
  currentUserPoints?: number;
  isActive: boolean;
  isParticipating: boolean;
}

interface AppContextType {
  user: User;
  leaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  leaderboardWeek: string | null;
  leaderboardLoading: boolean;
  contest: Contest | null;
  resetWeeklyLeaderboard: () => void;
  resetAllTimeLeaderboard: () => void;
  resetContest: () => void;
  refreshLeaderboard: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ===================== USER ===================== */

const mockUser: User = {
  id: '1',
  username: 'johndoe',
  displayName: 'John Doe', // ❌ @ yo‘q
  isAdmin: true,
  balanceUZS: 5_000_000,
  starsSpent: 1250,
};

/* ===================== PROVIDER ===================== */

export function AppProvider({ children }: { children: ReactNode }) {
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardWeek, setLeaderboardWeek] = useState<string | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [contest, setContest] = useState<Contest | null>(null);

  const WEEK_API = 'https://tezpremium.uz/MilliyDokon/main/week.php';

  /* ===================== API FETCH ===================== */

  const fetchLeaderboardFromApi = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch(WEEK_API, { cache: 'no-cache' });
      const data = await res.json();

      if (!data?.ok || !Array.isArray(data.top10)) {
        setLeaderboardWeek(typeof data?.week === 'string' ? data.week : null);
        setWeeklyLeaderboard([]);
        setLeaderboard([]);
        return;
      }

      setLeaderboardWeek(typeof data.week === 'string' ? data.week : null);

      const mapped: LeaderboardEntry[] = data.top10.map((item: any) => {
        // 🔥 @ ni MAJBURIY olib tashlash
        const cleanName =
          typeof item.name === 'string'
            ? item.name.replace(/@/g, '').trim()
            : 'Unknown';

        return {
          rank: Number(item.rank) || 0,
          displayName: cleanName,   // ✅ endi @ yo‘q
          totalStars: Number(item.harid) || 0,
          totalUZS: Number(item.summa) || 0,
          avatar: item.photo || undefined,
          userId: item.user_id != null ? item.user_id : undefined,
          username:
            typeof item.username === 'string'
              ? item.username.replace(/^@/, '').trim()
              : undefined,
        };
      });

      // 🔥 harid (stars) bo‘yicha sort
      const sorted = [...mapped].sort(
        (a, b) => b.totalStars - a.totalStars
      );

      // 🔥 qayta rank berish
      const ranked = sorted.map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

      setWeeklyLeaderboard(ranked);
      setLeaderboard(ranked);

    } catch (e) {
      console.error('Leaderboard API error:', e);
      setWeeklyLeaderboard([]);
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  /* ===================== FIRST LOAD ===================== */

  useEffect(() => {
    fetchLeaderboardFromApi();
  }, []);

  /* ===================== RESET ===================== */

  const resetWeeklyLeaderboard = () => {
    setWeeklyLeaderboard([]);
  };

  const resetAllTimeLeaderboard = () => {
    setLeaderboard([]);
  };

  const resetContest = () => {
    setContest(null);
  };

  return (
    <AppContext.Provider
      value={{
        user: mockUser,
        leaderboard,
        weeklyLeaderboard,
        leaderboardWeek,
        leaderboardLoading,
        contest,
        resetWeeklyLeaderboard,
        resetAllTimeLeaderboard,
        resetContest,
        refreshLeaderboard: fetchLeaderboardFromApi,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/* ===================== HOOK ===================== */

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
