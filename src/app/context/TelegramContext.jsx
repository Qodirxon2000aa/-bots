import { createContext, useContext, useEffect, useState, useRef } from "react";

const TelegramContext = createContext(null);

export const TelegramProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [apiUser, setApiUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  /* ========================= 👤 USER FETCH ========================= */
  const fetchUserFromApi = async (initData) => {
    try {
      setLoading(true);

      const url = `https://tezpremium.uz/MilliyDokon/main/get_user.php`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ initData }),
        cache: "no-cache",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (!data.ok) {
        const fallback = { balance: "0", is_admin: false };
        setApiUser(fallback);
        return fallback;
      }

      const userData = {
        ...data.data,
        is_admin: !!data.is_admin,
      };

      setApiUser(userData);
      return userData;
    } catch (err) {
      console.error("❌ fetchUserFromApi error:", err);
      const fallback = { balance: "0", is_admin: false };
      setApiUser(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  };

  /* ========================= 📦 ORDERS ========================= */
  const fetchOrders = async (initData) => {
    try {
      const url = `https://tezpremium.uz/MilliyDokon/main/orders.php`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ initData }),
        cache: "no-cache",
      });

      const data = await res.json();
      setOrders(data.ok && Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error("❌ fetchOrders error:", err);
      setOrders([]);
    }
  };

  /* ========================= 💳 PAYMENTS ========================= */
  const fetchPayments = async (initData) => {
    try {
      const url = `https://tezpremium.uz/MilliyDokon/main/payments.php`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ initData }),
        cache: "no-cache",
      });

      const data = await res.json();
      setPayments(data.ok && Array.isArray(data.payments) ? data.payments : []);
    } catch (err) {
      console.error("❌ fetchPayments error:", err);
      setPayments([]);
    }
  };

  /* ========================= ⭐ CREATE ORDER (POST + initData) ========================= */
  const createOrder = async ({ amount, sent, type, overall }) => {
    try {
      const telegram = window.Telegram?.WebApp;
      const initData = telegram?.initData || "";

      if (!initData) throw new Error("initData topilmadi");

      const url = `https://m4746.myxvest.ru/webapp/order.php`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          initData,
          amount,
          sent: sent.replace("@", ""),
          type,
          overall,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        await fetchUserFromApi(initData);
        await fetchOrders(initData);
        return { ok: true };
      }
      return { ok: false, message: data.message };
    } catch (err) {
      console.error("❌ createOrder error:", err);
      return { ok: false };
    }
  };

  /* ========================= 💎 CREATE PREMIUM ORDER (POST + initData) ========================= */
  const createPremiumOrder = async ({ months, sent, overall }) => {
    try {
      const telegram = window.Telegram?.WebApp;
      const initData = telegram?.initData || "";

      if (!initData) throw new Error("initData topilmadi");

      const url = `https://m4746.myxvest.ru/webapp/premium.php`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          initData,
          months,           // amount o‘rniga months
          sent: sent.replace("@", ""),
          overall,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        await fetchUserFromApi(initData);
        await fetchOrders(initData);
        return { ok: true, ...data };
      }

      return { ok: false, message: data.message };
    } catch (e) {
      console.error("❌ createPremiumOrder error:", e);
      return { ok: false, message: e.message };
    }
  };

  /* ========================= 🎁 CREATE GIFT ORDER (POST + initData) ========================= */
  const createGiftOrder = async ({ giftId, sent, price }) => {
    try {
      const balance = Number(apiUser?.balance || 0);
      if (balance < price) {
        return { ok: false, message: "Balans yetarli emas" };
      }

      const telegram = window.Telegram?.WebApp;
      const initData = telegram?.initData || "";

      if (!initData) throw new Error("initData topilmadi");

      const cleanUsername = sent.startsWith("@") ? sent : `@${sent}`;

      const url = `https://m4746.myxvest.ru/webapp/gifting.php`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          initData,
          gift_id: giftId,
          sent: cleanUsername,
        }),
      });

      const data = await res.json();

      if (!data?.ok) {
        return { ok: false, message: data?.message || "Gift xatosi" };
      }

      await fetchUserFromApi(initData);
      await fetchOrders(initData);

      return { ok: true, data };
    } catch (e) {
      console.error("❌ createGiftOrder error:", e);
      return { ok: false, message: e.message };
    }
  };

  /* ========================= 🔄 REFRESH ========================= */
  const refreshUser = async () => {
    const telegram = window.Telegram?.WebApp;
    const initData = telegram?.initData || "";

    if (initData) {
      console.log("🔄 Refreshing user with initData...");
      await fetchUserFromApi(initData);
      await fetchOrders(initData);
      await fetchPayments(initData);
    }
  };

  /* ========================= 👤 USERNAME CHECK (bu o‘zgarmadi) ========================= */
  const checkUsername = async (username) => {
    try {
      if (!username) return { ok: false };

      const clean = username.replace("@", "");
      const url = `https://tezpremium.uz/starsapi/user.php?username=${clean}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.username) {
        return {
          ok: true,
          data: {
            username: data.username,
            name: data.name,
            photo: data.photo,
            has_premium: data.has_premium,
          },
        };
      }
      return { ok: false };
    } catch (err) {
      console.error("❌ checkUsername error:", err);
      return { ok: false };
    }
  };

  /* ========================= TELEGRAM USER ========================= */
  const getTelegramUser = () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return null;

    if (tg.initDataUnsafe?.user?.id) {
      return tg.initDataUnsafe.user;
    }

    if (tg.initData) {
      try {
        const params = new URLSearchParams(tg.initData);
        const raw = params.get("user");
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.error("❌ parse error", e);
      }
    }
    return null;
  };

  /* ========================= INIT ========================= */
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const telegram = window.Telegram?.WebApp;
    const tgUser = getTelegramUser();

    const isTelegramEnv = telegram && typeof telegram.initData === "string" && telegram.initData.length > 0;

    if (telegram) {
      telegram.ready();
      telegram.expand();

      const startParam = telegram?.initDataUnsafe?.start_param;
      if (startParam) {
        console.log("🚀 start_param:", startParam);
        window.__tgStartParam = startParam;
      }
    }

    if (isTelegramEnv && tgUser?.id) {
      console.log("✅ REAL TELEGRAM USER", tgUser.id);

      const realUser = {
        id: String(tgUser.id),
        first_name: tgUser.first_name || "",
        last_name: tgUser.last_name || "",
        username: tgUser.username ? `@${tgUser.username}` : "",
        photo_url: tgUser.photo_url || null,
        isTelegram: true,
      };

      setUser(realUser);

      const initData = telegram.initData;

      (async () => {
        await fetchUserFromApi(initData);
        await fetchOrders(initData);
        await fetchPayments(initData);
      })();
    } else {
      console.warn("⚠️ DEV MODE");

      const fakeId = "7521806735";
      const fakeInitData = ""; // test uchun kerak bo‘lsa haqiqiy initData qo‘ying

      setUser({
        id: fakeId,
        first_name: "Qodirxon",
        last_name: "Dev",
        username: "@behissiyot",
        photo_url: null,
        isTelegram: false,
      });

      (async () => {
        await fetchUserFromApi(fakeInitData);
        await fetchOrders(fakeInitData);
        await fetchPayments(fakeInitData);
      })();
    }
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        user,
        apiUser,
        orders,
        payments,
        loading,
        createOrder,
        createPremiumOrder,
        createGiftOrder,
        refreshUser,
        checkUsername,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const ctx = useContext(TelegramContext);
  if (!ctx) throw new Error("useTelegram must be used inside provider");
  return ctx;
};