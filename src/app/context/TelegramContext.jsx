import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";

const TelegramContext = createContext(null);

const SERVICE_STATUS_API = "https://tezpremium.uz/MilliyDokon/control/status.php";

const DEFAULT_SERVICE_SETTINGS = {
  webapp: "on",
  stars: "on",
  premium: "on",
  gift: "on",
  nft: "on",
};

function normalizeServiceSettings(raw) {
  const out = { ...DEFAULT_SERVICE_SETTINGS };
  if (!raw || typeof raw !== "object") return out;
  for (const k of Object.keys(DEFAULT_SERVICE_SETTINGS)) {
    if (raw[k] != null && raw[k] !== "") {
      out[k] = String(raw[k]).trim().toLowerCase();
    }
  }
  return out;
}

export const TelegramProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [apiUser, setApiUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceSettings, setServiceSettings] = useState(() => ({ ...DEFAULT_SERVICE_SETTINGS }));
  const [statusLoading, setStatusLoading] = useState(true);
  const fetchedRef = useRef(false);
  const initDataRef = useRef("");

  const fetchServiceStatus = useCallback(async (options = {}) => {
    const silent = !!options.silent;
    if (!silent) setStatusLoading(true);
    try {
      const res = await fetch(SERVICE_STATUS_API, { cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.settings) {
        setServiceSettings(normalizeServiceSettings(data.settings));
      } else {
        setServiceSettings({ ...DEFAULT_SERVICE_SETTINGS });
      }
    } catch (err) {
      console.error("fetchServiceStatus error:", err);
      setServiceSettings({ ...DEFAULT_SERVICE_SETTINGS });
    } finally {
      if (!silent) setStatusLoading(false);
    }
  }, []);

  const isFeatureEnabled = useCallback(
    (feature) => {
      if (apiUser?.is_admin) return true;
      const val = serviceSettings[feature];
      if (val === undefined || val === null || val === "") return true;
      const s = String(val).toLowerCase();
      return s === "on" || s === "1" || s === "true" || s === "yes";
    },
    [apiUser?.is_admin, serviceSettings]
  );

  const getInitData = () => {
    const telegram = window.Telegram?.WebApp;
    try {
      telegram?.ready();
    } catch {
      /* ignore */
    }
    const directInitData = telegram?.initData?.trim();
    if (directInitData) {
      initDataRef.current = directInitData;
      return directInitData;
    }

    if (initDataRef.current) return initDataRef.current;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const searchInitData = searchParams.get("tgWebAppData");
      if (searchInitData) {
        const decoded = decodeURIComponent(searchInitData);
        initDataRef.current = decoded;
        return decoded;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashInitData = hashParams.get("tgWebAppData");
      if (hashInitData) {
        const decoded = decodeURIComponent(hashInitData);
        initDataRef.current = decoded;
        return decoded;
      }

      const urlMatch = window.location.href.match(/[?#&]tgWebAppData=([^&]+)/);
      if (urlMatch?.[1]) {
        const decoded = decodeURIComponent(urlMatch[1]);
        initDataRef.current = decoded;
        return decoded;
      }
    } catch (e) {
      console.error("hash initData parse error:", e);
    }

    return "";
  };

  const buildAuthPayload = (initDataArg) => {
    const resolved = (initDataArg || getInitData() || "").trim();
    return {
      initData: resolved,
      init_data: resolved,
    };
  };

  /* ========================= USER FETCH ========================= */
  const fetchUserFromApi = async (initData) => {
    try {
      const authPayload = buildAuthPayload(initData);
      if (!authPayload.initData) {
        const fallback = { balance: "0", is_admin: false };
        setApiUser(fallback);
        return fallback;
      }

      const res = await fetch("https://tezpremium.uz/MilliyDokon/main/get_user.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(authPayload),
        cache: "no-cache",
      });

      const data = await res.json();
      if (!data.ok) {
        const fallback = { balance: "0", is_admin: false };
        setApiUser(fallback);
        return fallback;
      }

      const userData = { ...data.data, is_admin: !!data.is_admin };
      setApiUser(userData);
      return userData;
    } catch (err) {
      console.error("fetchUserFromApi error:", err);
      const fallback = { balance: "0", is_admin: false };
      setApiUser(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  };

  /* ========================= CREATE ORDER (Stars) ========================= */
  const createOrder = async ({ amount, sent, type, overall }) => {
    try {
      const initData = getInitData();

      if (!initData) {
        toast.error("Telegram initData topilmadi");
        return { ok: false, message: "initData topilmadi" };
      }

      const cleanSent = sent.replace("@", "").trim();

      const res = await fetch("https://tezpremium.uz/MilliyDokon/orders/stars.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...buildAuthPayload(initData),
          amount,
          sent: cleanSent,
          type,        // 'stars'
          overall,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.ok === true) {
        await fetchUserFromApi(initData);
        await fetchOrders(initData);

        return { 
          ok: true, 
          message: data.message, 
          order_id: data.order_id 
        };
      }

      return { 
        ok: false, 
        message: data.message || "Buyurtma yaratilmadi" 
      };
    } catch (err) {
      console.error("❌ createOrder error:", err);
      toast.error("To'lov amalga oshmadi", {
        description: err.message || "Server bilan bog'lanishda xatolik",
      });
      return { ok: false, message: err.message };
    }
  };

  /* ========================= CREATE PREMIUM ORDER ========================= */
  const createPremiumOrder = async ({ months, sent, overall }) => {
    try {
      const telegramInitData = window.Telegram?.WebApp?.initData?.trim();
      const initData = telegramInitData || initDataRef.current || "";
      if (!initData) {
        toast.error("Telegram initData topilmadi");
        return { ok: false, message: "initData topilmadi" };
      }

      const cleanSent = sent.replace("@", "").trim();
      const monthsNumber = Number(months) || 0;
      if (![3, 6, 12].includes(monthsNumber)) {
        return { ok: false, message: "Noto'g'ri premium muddat (3/6/12)" };
      }

      const res = await fetch("https://tezpremium.uz/MilliyDokon/orders/premium.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          initData,
          amount: monthsNumber,
          sent: cleanSent,
          overall,
        }),
      });

      const raw = await res.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      const okValue = data?.ok;
      const isOkFlag =
        okValue === true || okValue === "true" || okValue === 1 || okValue === "1";
      const resolvedOrderId = data?.order_id || data?.data?.order_id || null;
      const isSuccess = isOkFlag || !!resolvedOrderId;
      if (isSuccess) {
        await fetchUserFromApi(initData);
        await fetchOrders(initData);

        return { 
          ok: true, 
          message: data?.message || "Premium order created successfully",
          order_id: resolvedOrderId,
        };
      }

      return { 
        ok: false, 
        message: data?.message || raw || "Premium buyurtma yaratilmadi" 
      };
    } catch (e) {
      console.error("createPremiumOrder error:", e);
      return { ok: false, message: e.message };
    }
  };

  /* ========================= FETCH ORDERS ========================= */
  const fetchOrders = async (initData) => {
    try {
      const authPayload = buildAuthPayload(initData);
      if (!authPayload.initData) {
        setOrders([]);
        return;
      }

      const res = await fetch("https://tezpremium.uz/MilliyDokon/main/orders.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(authPayload),
        cache: "no-cache",
      });
      const data = await res.json();
      setOrders(data.ok && Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error("fetchOrders error:", err);
      setOrders([]);
    }
  };

  /* ========================= FETCH PAYMENTS ========================= */
  const fetchPayments = async (initData) => {
    try {
      const authPayload = buildAuthPayload(initData);
      if (!authPayload.initData) {
        setPayments([]);
        return;
      }

      const res = await fetch("https://tezpremium.uz/MilliyDokon/main/payments.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(authPayload),
        cache: "no-cache",
      });
      const data = await res.json();
      setPayments(data.ok && Array.isArray(data.payments) ? data.payments : []);
    } catch (err) {
      console.error("fetchPayments error:", err);
      setPayments([]);
    }
  };

  /* ========================= CREATE GIFT ORDER ========================= */
  const createGiftOrder = async ({ giftId, sent, price, comment = "", anonim = false }) => {
    try {
      const balance = Number(apiUser?.balance || 0);
      if (balance < price) {
        toast.error("Balans yetarli emas");
        return { ok: false, message: "Balans yetarli emas" };
      }

      const initData = getInitData();
      if (!initData) throw new Error("initData topilmadi");

      const clean = sent.replace("@", "").trim();
      const username = clean ? `@${clean}` : "";

      const giftIdStr = String(giftId ?? "").trim();
      if (!giftIdStr || !/^\d+$/.test(giftIdStr)) {
        return { ok: false, message: "Noto'g'ri gift ID" };
      }

      const res = await fetch("https://tezpremium.uz/MilliyDokon/gifts/order.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          initData,
          init_data: initData,
          gift_id: giftIdStr,
          username,
          comment: String(comment || "").trim(),
          anonim: anonim ? "true" : "false",
        }),
      });

      const raw = await res.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (data?.ok === true || data?.status === "success") {
        toast.success("Gift muvaffaqiyatli yuborildi!");
        await fetchUserFromApi(initData);
        await fetchOrders(initData);
        return { ok: true, order_id: data.order_id };
      }

      return { ok: false, message: data?.message || raw || "Gift xatosi" };
    } catch (e) {
      console.error("createGiftOrder error:", e);
      toast.error("Gift yuborishda xatolik");
      return { ok: false, message: e.message };
    }
  };

  /* ========================= REFRESH ========================= */
  const refreshUser = async () => {
    const initData = getInitData();
    if (initData) {
      await fetchUserFromApi(initData);
      await fetchOrders(initData);
      await fetchPayments(initData);
    }
    await fetchServiceStatus({ silent: true });
  };

  /* ========================= CHECK USERNAME ========================= */
  const checkUsername = async (username) => {
    try {
      if (!username) return { ok: false };
      const clean = username.replace("@", "");
      const res = await fetch(`https://tezpremium.uz/starsapi/user.php?username=${clean}`);
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
      return { ok: false, message: "Foydalanuvchi topilmadi" };
    } catch (err) {
      console.error("checkUsername error:", err);
      return { ok: false, message: "Xatolik yuz berdi" };
    }
  };

  /* ========================= GET TELEGRAM USER ========================= */
  const getTelegramUser = () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return null;

    if (tg.initDataUnsafe?.user) return tg.initDataUnsafe.user;

    if (tg.initData) {
      try {
        const params = new URLSearchParams(tg.initData);
        const userStr = params.get("user");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        console.error("parse user error", e);
      }
    }
    return null;
  };

  /* ========================= SERVICE STATUS (status.php) ========================= */
  useEffect(() => {
    void fetchServiceStatus({ silent: false });
    const id = setInterval(() => void fetchServiceStatus({ silent: true }), 60000);
    return () => clearInterval(id);
  }, [fetchServiceStatus]);

  /* ========================= INIT ========================= */
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const telegram = window.Telegram?.WebApp;
    const tgUser = getTelegramUser();

    const isTelegramEnv = !!telegram?.initData && telegram.initData.length > 0;

    if (telegram) {
      telegram.ready();
      telegram.expand();
    }

    if (isTelegramEnv) {
      const initData = telegram.initData;
      initDataRef.current = initData;

      const u = tgUser || telegram.initDataUnsafe?.user;
      if (u?.id) {
        setUser({
          id: String(u.id),
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          username: u.username ? `@${u.username}` : "",
          photo_url: u.photo_url || null,
          isTelegram: true,
        });
      } else {
        setUser({
          id: "0",
          first_name: "Foydalanuvchi",
          username: "",
          isTelegram: true,
        });
      }

      (async () => {
        await fetchUserFromApi(initData);
        await fetchOrders(initData);
        await fetchPayments(initData);
      })();
    } else {
      console.warn("⚠️ DEV MODE");
      setUser({
        id: "7521806735",
        first_name: "Test",
        username: "@testuser",
        isTelegram: false,
      });
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
        serviceSettings,
        statusLoading,
        fetchServiceStatus,
        isFeatureEnabled,
        createOrder,
        createPremiumOrder,
        createGiftOrder,
        refreshUser,
        checkUsername,
        getInitData,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const ctx = useContext(TelegramContext);
  if (!ctx) throw new Error("useTelegram must be used inside TelegramProvider");
  return ctx;
};