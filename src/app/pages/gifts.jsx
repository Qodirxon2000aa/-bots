import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { useTelegram } from "@/app/context/TelegramContext";
import { TopBar } from "@/app/components/ui/TopBar";
import { Card, CardContent } from "@/app/components/ui/Card";
import Lottie from "lottie-react";
import {
  Copy, Eye, ShoppingCart, Sparkles, CheckCircle2,
  Gift, Loader2, AlertCircle, RefreshCw, Wallet,
  X, User, Send, CheckCheck, EyeOff, Wand2
} from "lucide-react";

import heart from "../assets/heart.json";
import teddy_bear from "../assets/teddy_bear.json";
import gift_box from "../assets/gift_box.json";
import rose from "../assets/rose.json";
import cake from "../assets/cake.json";
import bouquet from "../assets/bouquet.json";
import rocket from "../assets/rocket.json";
import trophy from "../assets/trophy.json";
import ring from "../assets/ring.json";
import diamond from "../assets/diamond.json";
import champagne from "../assets/champagne.json";
import love_teddy from "../assets/love_teddy.json";
import love_heart from "../assets/love_heart.json";
import tree from "../assets/tree.json";
import new_bear from "../assets/new_bear.json";
import bear from "../assets/bear.json";

const GIFT_ANIMATIONS = {
  heart, teddy_bear, gift_box, rose, cake, bouquet,
  rocket, trophy, ring, diamond, champagne,
  love_teddy, love_heart, tree, new_bear, bear,
};

const GIFT_EMOJIS = {
  heart: "❤️", teddy_bear: "🐻", gift_box: "🎁", rose: "🌹",
  cake: "🎂", bouquet: "💐", rocket: "🚀", trophy: "🏆",
  ring: "💍", diamond: "💎", champagne: "🍾", love_teddy: "🧸",
  love_heart: "💝", tree: "🌳", new_bear: "🐻", march_bear: "🐻",
};

const OPENROUTER_API_KEY = "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";
const NFT_API_BASE       = "https://tezpremium.uz/uzbstar/giftlar.php";
const ODDIY_API_BASE     = "https://tezpremium.uz/MilliyDokon/gifts/info.php";
const ORDER_API_BASE     = "https://tezpremium.uz/MilliyDokon/gifts/order.php";
const NFT_ORDER_API_BASE = "https://tezpremium.uz/MilliyDokon/gifts/nft.php";
const USER_CHECK_API     = "https://tezpremium.uz/starsapi/user.php";

const NFT_FILTERS = [
  { key: "all",       label: "Barcha"   },
  { key: "cheap",     label: "Arzon ↑"  },
  { key: "expensive", label: "Qimmat ↓" },
  { key: "new",       label: "Yangi"    },
  { key: "old",       label: "Eski"     },
];

// ── Lottie animatsiya (bir marta) ──
const GiftAnimation = ({ name }) => {
  const animData  = useMemo(() => GIFT_ANIMATIONS[name] ?? null, [name]);
  const wrapRef   = useRef(null);
  const lottieRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [played,  setPlayed]  = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (visible && !played && lottieRef.current) {
      lottieRef.current.goToAndPlay(0, true);
      setPlayed(true);
    }
  }, [visible, played]);

  return (
    <div ref={wrapRef} className="w-full h-full flex items-center justify-center">
      {animData ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={animData}
          loop={false}
          autoplay={false}
          style={{ width: "82%", height: "82%", display: "block" }}
        />
      ) : (
        <span className="text-5xl select-none leading-none">
          {GIFT_EMOJIS[name] || "🎁"}
        </span>
      )}
    </div>
  );
};

// ── User Search Hook ──
const useUserSearch = () => {
  const [username,     setUsername]   = useState("");
  const [anonim,       setAnonim]     = useState(false);
  const [userInfo,     setUserInfo]   = useState(null);
  const [checkLoading, setCheckLoad]  = useState(false);
  const [checkError,   setCheckError] = useState(null);
  const debounceRef = useRef(null);

  const cleanUsername = username.replace(/^@/, "").trim();

  useEffect(() => {
    if (!cleanUsername) { setUserInfo(null); setCheckError(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCheckLoad(true);
      setCheckError(null);
      setUserInfo(null);
      try {
        const res  = await fetch(`${USER_CHECK_API}?username=${encodeURIComponent(cleanUsername)}`);
        const data = await res.json();
        if (data.username) setUserInfo(data);
        else setCheckError(data.message || data.error || "Foydalanuvchi topilmadi");
      } catch {
        setCheckError("Tekshirib bo'lmadi");
      } finally {
        setCheckLoad(false);
      }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [cleanUsername]);

  return { username, setUsername, cleanUsername, anonim, setAnonim, userInfo, checkLoading, checkError };
};

// ── AI Comment Hook ──
const useAIComment = () => {
  const [commentOn,   setCommentOn]   = useState(false);
  const [comment,     setComment]     = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiPrompt,    setAiPrompt]    = useState("");
  const [showAiInput, setShowAiInput] = useState(false);

  const generateAIGreeting = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);

    const FREE_MODELS = [
      "mistralai/mistral-7b-instruct:free",
      "huggingfaceh4/zephyr-7b-beta:free",
      "openchat/openchat-7b:free",
      "gryphe/mythomist-7b:free",
    ];

    for (const model of FREE_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://tezpremium.uz",
            "X-Title": "Gift App",
          },
          body: JSON.stringify({
            model,
            max_tokens: 150,
            messages: [{
              role: "user",
              content: `Write a short sincere greeting in Uzbek language for: "${aiPrompt}". Only return the greeting text, nothing else.`,
            }],
          }),
        });
        const data = await response.json();
        if (data.error) continue;
        const text = data?.choices?.[0]?.message?.content?.trim() || "";
        if (text) { setComment(text); setShowAiInput(false); setAiLoading(false); return; }
      } catch { /* next model */ }
    }

    const fallbacks = [
      `💝 ${aiPrompt} munosabati bilan sizni qalbdan tabriklayman! Baxt, sog'lik va omad tilayman! 🎉`,
      `🌸 Aziz do'stim, ${aiPrompt} bilan tabriklayman! Hayotingiz doim baxtli bo'lsin! ✨`,
      `🎊 ${aiPrompt}! Sizga eng yaxshi tilaklar! Sog'lik, baxt va farovonlik tilayman! 💫`,
    ];
    setComment(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    setShowAiInput(false);
    setAiLoading(false);
  };

  return { commentOn, setCommentOn, comment, setComment, aiLoading, aiPrompt, setAiPrompt, showAiInput, setShowAiInput, generateAIGreeting };
};

// ── Modal Shell ──
const ModalShell = ({ title, subtitle, thumbContent, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-md bg-background rounded-t-3xl shadow-2xl z-10 overflow-y-auto pb-[50px]" style={{ maxHeight: "92vh" }}>
      <div className="p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg">{title}</h2>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="w-20 h-20 mx-auto rounded-2xl bg-accent/30 overflow-hidden mb-5">
          {thumbContent}
        </div>
        {children}
      </div>
    </div>
  </div>
);

// ── User Input Section ──
const UserInputSection = ({ username, setUsername, cleanUsername, userInfo, checkLoading, checkError }) => (
  <div className="space-y-2 mb-3">
    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kimga yuborish?</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">@</span>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="username"
        className="w-full pl-7 pr-10 py-3 rounded-xl bg-accent/40 border border-border text-sm font-medium focus:outline-none focus:border-primary focus:bg-accent/20 transition-all"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {checkLoading  && <Loader2    className="w-4 h-4 animate-spin text-muted-foreground" />}
        {!checkLoading && userInfo    && <CheckCheck  className="w-4 h-4 text-green-500" />}
        {!checkLoading && checkError  && cleanUsername && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>
    </div>

    {userInfo && !checkLoading && (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
        {userInfo.photo ? (
          <img src={userInfo.photo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-green-500" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{userInfo.name || userInfo.first_name || cleanUsername}</p>
          <p className="text-xs text-muted-foreground">@{userInfo.username || cleanUsername}</p>
        </div>
        <CheckCheck className="w-4 h-4 text-green-500 shrink-0 ml-auto" />
      </div>
    )}
  </div>
);

// ── Comment Section ──
const CommentSection = ({ commentOn, setCommentOn, comment, setComment, aiLoading, aiPrompt, setAiPrompt, showAiInput, setShowAiInput, generateAIGreeting }) => (
  <>
    <button
      onClick={() => setCommentOn((v) => !v)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all mb-2 text-left
        ${commentOn ? "bg-blue-500/10 border-blue-500/30 text-blue-500" : "bg-accent/30 border-border text-muted-foreground hover:bg-accent/50"}`}
    >
      <span className="text-base shrink-0">💬</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">Izoh qo'shish</p>
        <p className="text-[11px] opacity-70">Giftga xabar biriktirish</p>
      </div>
      <div className={`ml-auto w-9 h-5 rounded-full transition-all relative shrink-0 ${commentOn ? "bg-blue-500" : "bg-border"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${commentOn ? "left-4" : "left-0.5"}`} />
      </div>
    </button>

    {commentOn && (
      <div className="mb-3 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Xabar matni</span>
          <button
            onClick={() => setShowAiInput(!showAiInput)}
            className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg hover:bg-blue-500/20"
          >
            <Wand2 className="w-3 h-3" />
            AI BILAN YOZISH
          </button>
        </div>

        {showAiInput && (
          <div className="mb-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-2">
            <p className="text-[11px] text-blue-600 font-medium">Kimga va nima uchunligini ayting:</p>
            <div className="flex gap-2">
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Masalan: Onamga tug'ilgan kun tabrigi"
                className="flex-1 bg-white text-black placeholder:text-gray-400 border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
              />
              <button
                onClick={generateAIGreeting}
                disabled={aiLoading || !aiPrompt}
                className="bg-blue-500 text-white p-2 rounded-lg disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tabrik yoki xabar yozing..."
          maxLength={200}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-accent/40 border border-border text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-accent/20 transition-all placeholder:text-muted-foreground/50 resize-none"
        />
        <p className="text-right text-[10px] text-muted-foreground/50 mt-1">{comment.length}/200</p>
      </div>
    )}
  </>
);

// ── Anonim Toggle ──
const AnonimToggle = ({ anonim, setAnonim }) => (
  <button
    onClick={() => setAnonim((v) => !v)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all mb-4 text-left
      ${anonim ? "bg-primary/10 border-primary/30 text-primary" : "bg-accent/30 border-border text-muted-foreground hover:bg-accent/50"}`}
  >
    <EyeOff className="w-4 h-4 shrink-0" />
    <div className="min-w-0">
      <p className="text-sm font-semibold">Anonim yuborish</p>
      <p className="text-[11px] opacity-70">Kim yuborganini ko'rsatmaydi</p>
    </div>
    <div className={`ml-auto w-9 h-5 rounded-full transition-all relative shrink-0 ${anonim ? "bg-primary" : "bg-border"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${anonim ? "left-4" : "left-0.5"}`} />
    </div>
  </button>
);

// ── Success Overlay ──
const SuccessOverlay = ({ text = "Gift muvaffaqiyatli jo'natildi" }) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center animate-in fade-in duration-300"
    style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", backgroundColor: "rgba(0,0,0,0.55)" }}
  >
    <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
      <div className="w-28 h-28 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shadow-2xl shadow-green-500/20">
        <CheckCircle2 className="w-14 h-14 text-green-400" />
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-white">🎉 Yuborildi!</p>
        <p className="text-sm text-white/60 mt-1">{text}</p>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════════
// ── BUY MODAL — Oddiy Gifts ──
// ════════════════════════════════════════════════
const BuyOddiyModal = ({ gift, onClose, onSuccess }) => {
  const navigate        = useNavigate();
  const { user }        = useTelegram();           // ← Telegram context
  const userSearch      = useUserSearch();
  const aiComment       = useAIComment();
  const [orderLoading, setOrderLoad]  = useState(false);
  const [orderError,   setOrderError] = useState(null);
  const [ordered,      setOrdered]    = useState(false);

  const { cleanUsername, anonim, userInfo } = userSearch;
  const { commentOn, comment }              = aiComment;

  // Real Telegram ID → DEV MODE da fakeId ishlatiladi
  const getSenderId = () => user?.id || "";

  const handleOrder = async () => {
    if (!cleanUsername) return;

    const senderId = getSenderId();
    if (!senderId) {
      setOrderError("Foydalanuvchi ID topilmadi. Iltimos qayta kiring.");
      return;
    }

    setOrderLoad(true);
    setOrderError(null);
    try {
      const params = new URLSearchParams({
        user_id: String(senderId),
        gift_id:  String(gift.id),
        username: `@${cleanUsername}`,
        anonim:   anonim ? "true" : "false",
      });
      if (commentOn && comment.trim()) params.append("comment", comment.trim());

      console.log("🎁 ODDIY URL:", `${ORDER_API_BASE}?${params.toString()}`);

      const res      = await fetch(`${ORDER_API_BASE}?${params.toString()}`);
      const rawText  = await res.text();
      const jsonStart = rawText.indexOf("{");
      const data     = JSON.parse(jsonStart >= 0 ? rawText.slice(jsonStart) : rawText);

      console.log("🎁 ODDIY ORDER javobi:", data);

      if (data.ok === true) {
        setOrdered(true);
        onSuccess && onSuccess();
        setTimeout(() => { onClose(); navigate("/gifts"); }, 3000);
      } else {
        setOrderError(data.message || data.error || "Xatolik yuz berdi");
      }
    } catch (err) {
      setOrderError("Serverga ulanib bo'lmadi: " + err.message);
    } finally {
      setOrderLoad(false);
    }
  };

  const canOrder = !orderLoading && cleanUsername && (userInfo || anonim) && !ordered;

  return (
    <>
      <ModalShell
        title="Gift yuborish"
        subtitle={`${gift.name.replace(/_/g, " ")} · ${gift.price.toLocaleString("uz-UZ")} UZS`}
        thumbContent={<GiftAnimation name={gift.name} />}
        onClose={onClose}
      >
        <UserInputSection {...userSearch} />
        <CommentSection   {...aiComment} />
        <AnonimToggle anonim={anonim} setAnonim={userSearch.setAnonim} />

        {orderError && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-500">{orderError}</p>
          </div>
        )}

        {!ordered && (
          <button
            onClick={handleOrder}
            disabled={!canOrder}
            className={`w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-bold transition-all
              ${canOrder
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            {orderLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Yuborilmoqda...</>
              : <><Send    className="w-4 h-4" />Gift yuborish</>}
          </button>
        )}
      </ModalShell>

      {ordered && <SuccessOverlay text="Gift muvaffaqiyatli jo'natildi" />}
    </>
  );
};

// ════════════════════════════════════════════════
// ── BUY MODAL — NFT Gifts ──
// ════════════════════════════════════════════════
const BuyNftModal = ({ gift, onClose, onSuccess }) => {
  const navigate   = useNavigate();
  const { user }   = useTelegram();                // ← Telegram context
  const userSearch = useUserSearch();
  const [orderLoading, setOrderLoad]  = useState(false);
  const [orderError,   setOrderError] = useState(null);
  const [ordered,      setOrdered]    = useState(false);

  const { cleanUsername } = userSearch;

  const formatName = (nftId) => {
    if (!nftId) return "Gift";
    return nftId.split("-")[0].replace(/([A-Z])/g, " $1").trim();
  };

  // Real Telegram ID → DEV MODE da fakeId ishlatiladi
  const getSenderId = () => user?.id || "";

  const handleOrder = async () => {
    if (!cleanUsername) return;

    const senderId = getSenderId();
    if (!senderId) {
      setOrderError("Foydalanuvchi ID topilmadi. Iltimos qayta kiring.");
      return;
    }

    setOrderLoad(true);
    setOrderError(null);
    try {
      const params = new URLSearchParams({
        user_id:  String(senderId),
        gift_id:  String(gift.id),
        sent:     `@${cleanUsername}`,
      });

      console.log("✨ NFT URL:", `${NFT_ORDER_API_BASE}?${params.toString()}`);

      const res      = await fetch(`${NFT_ORDER_API_BASE}?${params.toString()}`);
      const rawText  = await res.text();
      const jsonStart = rawText.indexOf("{");
      const data     = JSON.parse(jsonStart >= 0 ? rawText.slice(jsonStart) : rawText);

      console.log("✨ NFT ORDER javobi:", data);

      if (data.ok === true) {
        setOrdered(true);
        onSuccess && onSuccess();
        setTimeout(() => { onClose(); navigate("/gifts"); }, 3000);
      } else {
        setOrderError(data.message || data.error || "Xatolik yuz berdi");
      }
    } catch (err) {
      setOrderError("Serverga ulanib bo'lmadi: " + err.message);
    } finally {
      setOrderLoad(false);
    }
  };

  const canOrder = !orderLoading && cleanUsername.length > 2 && !ordered;

  return (
    <>
      <ModalShell
        title="NFT Gift yuborish"
        subtitle={`${formatName(gift.nft_id)} · ${gift.price.toLocaleString("uz-UZ")} UZS`}
        thumbContent={
          <img
            src={gift.photo}
            alt={formatName(gift.nft_id)}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        }
        onClose={onClose}
      >
        <UserInputSection {...userSearch} />

        {orderError && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-500">{orderError}</p>
          </div>
        )}

        {!ordered && (
          <button
            onClick={handleOrder}
            disabled={!canOrder}
            className={`w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-bold transition-all
              ${canOrder
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            {orderLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Yuborilmoqda...</>
              : <><Send    className="w-4 h-4" />NFT Gift yuborish</>}
          </button>
        )}
      </ModalShell>

      {ordered && <SuccessOverlay text="NFT Gift muvaffaqiyatli jo'natildi" />}
    </>
  );
};

// ════════════════════════════════════════════════
// ── MAIN PAGE ──
// ════════════════════════════════════════════════
export default function GiftsPage() {
  const navigate    = useNavigate();
  const { apiUser } = useTelegram();

  const [mainTab,      setMainTab]      = useState("nft");
  const [oddiyFilter,  setOddiyFilter]  = useState("cheap");
  const [activeFilter, setActiveFilter] = useState("all");
  const [copiedId,     setCopiedId]     = useState(null);
  const [gifts,        setGifts]        = useState([]);
  const [nftLoading,   setNftLoading]   = useState(true);
  const [nftError,     setNftError]     = useState(null);
  const [oddiyGifts,   setOddiyGifts]   = useState([]);
  const [oddiyLoading, setOddiyLoading] = useState(false);
  const [oddiyError,   setOddiyError]   = useState(null);
  const [buyGift,      setBuyGift]      = useState(null);
  const [buyNftGift,   setBuyNftGift]   = useState(null);

  const userBalance = Number(apiUser?.balance || 0);

  const fetchNftGifts = async (type = "all") => {
    setNftLoading(true);
    setNftError(null);
    try {
      const url  = type === "all" ? NFT_API_BASE : `${NFT_API_BASE}?type=${type}`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok) setGifts(data.gifts || []);
      else setNftError("Ma'lumot olishda xatolik");
    } catch {
      setNftError("Serverga ulanib bo'lmadi");
    } finally {
      setNftLoading(false);
    }
  };

  const fetchOddiyGifts = async () => {
    setOddiyLoading(true);
    setOddiyError(null);
    try {
      const res  = await fetch(ODDIY_API_BASE);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok) setOddiyGifts(data.gifts || []);
      else setOddiyError("Ma'lumot olishda xatolik");
    } catch {
      setOddiyError("Serverga ulanib bo'lmadi");
    } finally {
      setOddiyLoading(false);
    }
  };

  useEffect(() => {
    if (mainTab === "nft") fetchNftGifts(activeFilter);
    else if (mainTab === "oddiy" && oddiyGifts.length === 0) fetchOddiyGifts();
  }, [activeFilter, mainTab]);

  const handleFilterChange = (key) => {
    if (key === activeFilter) return;
    setActiveFilter(key);
    setGifts([]);
  };

  const handleMainTab = (tab) => {
    if (tab === mainTab) return;
    setMainTab(tab);
    if (tab === "nft") { setGifts([]); setNftError(null); setNftLoading(true); }
  };

  const handleCopy = (gift) => {
    navigator.clipboard.writeText(gift.link).catch(() => {});
    setCopiedId(gift.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatName = (nftId) => {
    if (!nftId) return "Gift";
    return nftId.split("-")[0].replace(/([A-Z])/g, " $1").trim();
  };

  const canBuy = (price) => userBalance >= price;

  const oddiyList = useMemo(() =>
    [...oddiyGifts].sort((a, b) =>
      oddiyFilter === "cheap" ? a.price - b.price : b.price - a.price
    ), [oddiyGifts, oddiyFilter]
  );

  const minOddiyPrice = useMemo(() =>
    oddiyGifts.length > 0 ? Math.min(...oddiyGifts.map((g) => g.price)) : 0,
    [oddiyGifts]
  );

  const minNftPrice = useMemo(() =>
    gifts.length > 0 ? Math.min(...gifts.map((g) => g.price)) : 0,
    [gifts]
  );

  const canAffordAny = gifts.length > 0 && userBalance >= minNftPrice;

  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Gifts" subtitle="Telegram sovg'alari" />

      <div className="p-3 space-y-4 pb-24">

        {/* Balance card */}
        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs mb-1">Sizning balansingiz</p>
                <h2 className="text-2xl font-bold leading-none">
                  {userBalance.toLocaleString("uz-UZ")}
                  <span className="text-base font-normal ml-1">UZS</span>
                </h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            {mainTab === "nft" && !nftLoading && gifts.length > 0 && !canAffordAny && (
              <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-white/80" />
                <p className="text-xs text-white/80">Giftlar sotib olish uchun balansingizni to'ldiring</p>
                <button
                  onClick={() => navigate("/payment")}
                  className="ml-auto shrink-0 text-xs font-semibold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-all"
                >
                  To'ldirish
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main tabs */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "nft",   icon: <Sparkles className="w-4 h-4" />,                   label: "NFT Giftlar"   },
            { key: "oddiy", icon: <span className="text-base leading-none">🎁</span>, label: "Oddiy Giftlar" },
          ].map(({ key, icon, label }) => (
            <button key={key} onClick={() => handleMainTab(key)}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-all
                ${mainTab === key
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-accent/40 text-muted-foreground border-border hover:bg-accent"}`}>
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ══ NFT ══ */}
        {mainTab === "nft" && (
          <>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              {NFT_FILTERS.map((f) => (
                <button key={f.key} onClick={() => handleFilterChange(f.key)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border whitespace-nowrap
                    ${activeFilter === f.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-accent/50 text-muted-foreground border-border hover:bg-accent"}`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card><CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-pink-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Jami giftlar</p>
                    <p className="text-xl font-bold leading-none mt-0.5">{nftLoading ? "—" : gifts.length}</p>
                  </div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Eng arzon</p>
                    <p className="text-xl font-bold leading-none mt-0.5">
                      {nftLoading || gifts.length === 0 ? "—" : minNftPrice.toLocaleString("uz-UZ")}
                    </p>
                  </div>
                </div>
              </CardContent></Card>
            </div>

            <Card>
              <CardContent className="pt-4 px-3 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base">
                    {NFT_FILTERS.find((f) => f.key === activeFilter)?.label ?? "Giftlar"}
                  </h3>
                  <div className="flex items-center gap-2">
                    {!nftLoading && <span className="text-xs text-muted-foreground">{gifts.length} ta</span>}
                    <button onClick={() => fetchNftGifts(activeFilter)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                      <RefreshCw className={`w-3.5 h-3.5 ${nftLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {nftLoading && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" /><p className="text-sm">Yuklanmoqda...</p>
                  </div>
                )}
                {!nftLoading && nftError && (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mb-3 text-red-500/60" />
                    <p className="text-sm mb-3">{nftError}</p>
                    <button onClick={() => fetchNftGifts(activeFilter)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
                      <RefreshCw className="w-3 h-3" /> Qayta urinish
                    </button>
                  </div>
                )}
                {!nftLoading && !nftError && gifts.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Gift className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Bu kategoriyada giftlar yo'q</p>
                  </div>
                )}
                {!nftLoading && !nftError && gifts.length > 0 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {gifts.map((gift) => {
                      const affordable = canBuy(gift.price);
                      return (
                        <div key={gift.id} className={`rounded-xl border overflow-hidden transition-all
                          ${affordable ? "border-border/50" : "border-border/30 opacity-70"}`}>
                          <div className="relative w-full aspect-square bg-accent/20">
                            <img src={gift.photo} alt={formatName(gift.nft_id)}
                              className="w-full h-full object-cover" loading="lazy"
                              onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling.style.display = "flex"; }} />
                            <div className="absolute inset-0 items-center justify-center" style={{ display: "none" }}>
                              <Gift className="w-10 h-10 text-muted-foreground/30" />
                            </div>
                            {!affordable && (
                              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                <div className="bg-background/90 rounded-lg px-2 py-1 flex items-center gap-1">
                                  <Wallet className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground font-medium">Balans yetmaydi</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="h-px bg-border/30" />
                          <div className="p-2.5 space-y-1.5">
                            <p className="font-semibold text-xs leading-tight truncate">{formatName(gift.nft_id)}</p>
                            <p className="text-[10px] text-muted-foreground/70 truncate">{gift.model} · {gift.backdrop}</p>
                            <p className={`font-bold text-sm ${affordable ? "" : "text-red-500/70"}`}>
                              {gift.price.toLocaleString("uz-UZ")}
                              <span className="font-normal text-xs text-muted-foreground ml-0.5">UZS</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground/50">{gift.created_at}</p>
                            <div className="flex gap-1.5 pt-0.5">
                              <button onClick={() => handleCopy(gift)}
                                className={`flex-1 flex items-center justify-center gap-1 h-7 rounded-lg border text-[11px] font-medium transition-all
                                  ${copiedId === gift.id
                                    ? "bg-green-500/10 text-green-500 border-green-500/30"
                                    : "text-muted-foreground border-border/60 hover:border-border"}`}>
                                {copiedId === gift.id
                                  ? <><CheckCircle2 className="w-3 h-3 shrink-0" /><span>OK</span></>
                                  : <><Copy className="w-3 h-3 shrink-0" /><span>Copy</span></>}
                              </button>
                              <button onClick={() => window.open(gift.link, "_blank")}
                                className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg border border-border/60 text-muted-foreground text-[11px] font-medium hover:border-border transition-all">
                                <Eye className="w-3 h-3 shrink-0" /><span>View</span>
                              </button>
                            </div>
                            <button
                              onClick={() => affordable && setBuyNftGift(gift)}
                              disabled={!affordable}
                              className={`w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all
                                ${affordable
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                                  : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                              {affordable
                                ? <><ShoppingCart className="w-3.5 h-3.5 shrink-0" />Yuborish</>
                                : <><Wallet className="w-3.5 h-3.5 shrink-0" />Balans yetmaydi</>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ══ ODDIY ══ */}
        {mainTab === "oddiy" && (
          <>
            <div className="flex gap-1.5">
              {[
                { key: "cheap",     label: "Arzon ↑" },
                { key: "expensive", label: "Qimmat ↓" },
              ].map((f) => (
                <button key={f.key} onClick={() => setOddiyFilter(f.key)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border whitespace-nowrap
                    ${oddiyFilter === f.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-accent/50 text-muted-foreground border-border hover:bg-accent"}`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card><CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <span className="text-lg">🎁</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Jami giftlar</p>
                    <p className="text-xl font-bold leading-none mt-0.5">{oddiyLoading ? "—" : oddiyList.length}</p>
                  </div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Eng arzon</p>
                    <p className="text-xl font-bold leading-none mt-0.5">
                      {oddiyLoading || oddiyGifts.length === 0 ? "—" : minOddiyPrice.toLocaleString("uz-UZ")}
                    </p>
                  </div>
                </div>
              </CardContent></Card>
            </div>

            <Card>
              <CardContent className="pt-4 px-3 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base">Oddiy Giftlar</h3>
                  <div className="flex items-center gap-2">
                    {!oddiyLoading && <span className="text-xs text-muted-foreground">{oddiyList.length} ta</span>}
                    <button onClick={fetchOddiyGifts}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                      <RefreshCw className={`w-3.5 h-3.5 ${oddiyLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {oddiyLoading && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" /><p className="text-sm">Yuklanmoqda...</p>
                  </div>
                )}
                {!oddiyLoading && oddiyError && (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mb-3 text-red-500/60" />
                    <p className="text-sm mb-3">{oddiyError}</p>
                    <button onClick={fetchOddiyGifts}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
                      <RefreshCw className="w-3 h-3" /> Qayta urinish
                    </button>
                  </div>
                )}
                {!oddiyLoading && !oddiyError && oddiyList.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Gift className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Giftlar topilmadi</p>
                  </div>
                )}
                {!oddiyLoading && !oddiyError && oddiyList.length > 0 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {oddiyList.map((gift) => {
                      const affordable = canBuy(gift.price);
                      return (
                        <div key={gift.id} className={`rounded-xl border overflow-hidden transition-all
                          ${affordable ? "border-border/50" : "border-border/30 opacity-70"}`}>
                          <div className="relative w-full aspect-square bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center overflow-hidden">
                            <GiftAnimation name={gift.name} />
                            {!affordable && (
                              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                <div className="bg-background/90 rounded-lg px-2 py-1 flex items-center gap-1">
                                  <Wallet className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground font-medium">Balans yetmaydi</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="h-px bg-border/30" />
                          <div className="p-2.5 space-y-1.5">
                            <p className="font-semibold text-xs leading-tight truncate capitalize">
                              {gift.name.replace(/_/g, " ")}
                            </p>
                            <p className={`font-bold text-sm ${affordable ? "" : "text-red-500/70"}`}>
                              {gift.price.toLocaleString("uz-UZ")}
                              <span className="font-normal text-xs text-muted-foreground ml-0.5">UZS</span>
                            </p>
                            <button
                              onClick={() => affordable && setBuyGift(gift)}
                              disabled={!affordable}
                              className={`w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all mt-1
                                ${affordable
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                                  : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                              {affordable
                                ? <><ShoppingCart className="w-3.5 h-3.5 shrink-0" />Sotib olish</>
                                : <><Wallet className="w-3.5 h-3.5 shrink-0" />Balans yetmaydi</>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── ODDIY BUY MODAL ── */}
      {buyGift && (
        <BuyOddiyModal
          gift={buyGift}
          onClose={() => setBuyGift(null)}
          onSuccess={() => {}}
        />
      )}

      {/* ── NFT BUY MODAL ── */}
      {buyNftGift && (
        <BuyNftModal
          gift={buyNftGift}
          onClose={() => setBuyNftGift(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}