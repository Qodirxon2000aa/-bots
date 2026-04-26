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
  monthlyLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  leaderboardMonth: string | null;
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
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardMonth, setLeaderboardMonth] = useState<string | null>(null);
  const [leaderboardWeek, setLeaderboardWeek] = useState<string | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [contest, setContest] = useState<Contest | null>(null);

  const ALL_TOP_API = 'https://tezpremium.uz/MilliyDokon/main/all_top.php';
  const MONTH_API = 'https://tezpremium.uz/MilliyDokon/main/month.php';
  const WEEK_API = 'https://tezpremium.uz/MilliyDokon/main/week.php';

  function mapTopUsers(rawList: any[]): LeaderboardEntry[] {
    const mapped: LeaderboardEntry[] = rawList.map((item: any) => {
      const cleanName =
        typeof item.name === 'string'
          ? item.name.replace(/@/g, '').trim()
          : 'Unknown';
      return {
        rank: Number(item.rank) || 0,
        displayName: cleanName,
        totalStars: Number(item.amount) || 0,
        totalUZS: Number(item.overall) || 0,
        userId: item.user_id != null ? String(item.user_id) : undefined,
        username: undefined,
      };
    });
    return [...mapped].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }

  function mapWeekTop10(top10: any[]): LeaderboardEntry[] {
    const mapped: LeaderboardEntry[] = top10.map((item: any) => {
      const cleanName =
        typeof item.name === 'string'
          ? item.name.replace(/@/g, '').trim()
          : 'Unknown';
      return {
        rank: Number(item.rank) || 0,
        displayName: cleanName,
        totalStars: Number(item.harid) || 0,
        totalUZS: Number(item.summa) || 0,
        avatar: item.photo || undefined,
        userId: item.user_id != null ? String(item.user_id) : undefined,
        username:
          typeof item.username === 'string'
            ? item.username.replace(/^@/, '').trim()
            : undefined,
      };
    });
    const sorted = [...mapped].sort((a, b) => b.totalStars - a.totalStars);
    return sorted.map((item, index) => ({ ...item, rank: index + 1 }));
  }

  /* ===================== API FETCH ===================== */

  const fetchLeaderboardFromApi = async () => {
    setLeaderboardLoading(true);
    try {
      const [allRes, monthRes, weekRes] = await Promise.all([
        fetch(ALL_TOP_API, { cache: 'no-store' }),
        fetch(MONTH_API, { cache: 'no-store' }),
        fetch(WEEK_API, { cache: 'no-store' }),
      ]);

      const [allJson, monthJson, weekJson] = await Promise.all([
        allRes.json().catch(() => null),
        monthRes.json().catch(() => null),
        weekRes.json().catch(() => null),
      ]);

      /* ---- all_time ---- */
      const allOk =
        allJson?.success === true || allJson?.ok === true;
      const allUsers = Array.isArray(allJson?.top_users) ? allJson.top_users : [];
      if (allOk && allUsers.length > 0) {
        setLeaderboard(mapTopUsers(allUsers));
      } else {
        setLeaderboard([]);
      }

      /* ---- month ---- */
      const monthOk =
        monthJson?.success === true || monthJson?.ok === true;
      const monthUsers = Array.isArray(monthJson?.top_users) ? monthJson.top_users : [];
      if (monthOk && monthUsers.length > 0) {
        setLeaderboardMonth(
          typeof monthJson?.month === 'string' ? monthJson.month.trim() : null
        );
        setMonthlyLeaderboard(mapTopUsers(monthUsers));
      } else {
        setLeaderboardMonth(null);
        setMonthlyLeaderboard([]);
      }

      /* ---- week (week.php, haftalik) ---- */
      const weekOk = weekJson?.ok === true || weekJson?.success === true;
      const weekTop10 = Array.isArray(weekJson?.top10) ? weekJson.top10 : [];
      const weekTopUsers = Array.isArray(weekJson?.top_users) ? weekJson.top_users : [];
      if (weekOk && weekTopUsers.length > 0) {
        setLeaderboardWeek(
          typeof weekJson?.week === 'string' ? weekJson.week.trim() : null
        );
        setWeeklyLeaderboard(mapTopUsers(weekTopUsers));
      } else if (weekOk && weekTop10.length > 0) {
        setLeaderboardWeek(
          typeof weekJson?.week === 'string' ? weekJson.week.trim() : null
        );
        setWeeklyLeaderboard(mapWeekTop10(weekTop10));
      } else {
        setLeaderboardWeek(null);
        setWeeklyLeaderboard([]);
      }
    } catch (e) {
      console.error('Leaderboard API error:', e);
      setLeaderboard([]);
      setMonthlyLeaderboard([]);
      setWeeklyLeaderboard([]);
      setLeaderboardMonth(null);
      setLeaderboardWeek(null);
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
    setLeaderboardWeek(null);
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
        monthlyLeaderboard,
        weeklyLeaderboard,
        leaderboardMonth,
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
