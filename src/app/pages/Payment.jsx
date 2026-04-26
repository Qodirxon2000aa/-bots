import { useState, useEffect, useRef } from "react";
import { useTelegram } from "../context/TelegramContext";
import "../../styles/Payment.css";

const PaymentImages = {
  click: "https://api.logobank.uz/media/logos_preview/Click-01_0xvqWH8.png",
  uzcard: "https://logo.clearbit.com/uzcard.uz",
  humo: "https://humocard.uz/bitrix/templates/main/img/logo2.png",
  tonkeeper: "https://i.ibb.co/jkLrSV3X/image-Photoroom-1.png",
};

function openExternalLink(url, provider) {
  if (!url) return;
  const tg = window?.Telegram?.WebApp;

  try {
    if (provider === "tonkeeper") {
      if (tg?.openLink) {
        tg.openLink(url, { try_instant_view: false });
      } else {
        window.location.href = url;
      }
      return;
    }

    if (tg?.openLink) {
      tg.openLink(url, { try_instant_view: false });
    } else if (tg?.openTelegramLink && url.includes("t.me")) {
      tg.openTelegramLink(url);
    } else {
      window.location.href = url;
    }
  } catch (e) {
    window.location.href = url;
  }
}

const PAYMENT_SETTINGS_URL = "https://tezpremium.uz/MilliyDokon/control/settings.php";

async function fetchPaymentSettings() {
  try {
    const res = await fetch(PAYMENT_SETTINGS_URL, { cache: "no-store" });
    const data = await res.json();
    if (data?.ok && data.settings && typeof data.settings === "object") return data.settings;
  } catch (e) {
    console.error("fetchPaymentSettings:", e);
  }
  return null;
}

const PROVIDER_CFG = {
  click: {
    logo: PaymentImages.click,
    title: "Click To'lovi",
    subtitle: "click.uz · Onlayn to'lov",
    btnLabel: "Click orqali to'lash",
    btnSub: "Tez · Xavfsiz · Ishonchli",
    footer: "click.uz tomonidan himoyalangan · SSL xavfsiz",
    topBar: "linear-gradient(90deg,#1d4ed8,#60a5fa,#1d4ed8)",
    btnBg: "linear-gradient(135deg,#ffffff 0%,#2563eb 60%,#3b82f6 100%)",
    btnShadow: "0 4px 22px rgba(37,99,235,.4)",
    btnShadowHover: "0 8px 32px rgba(37,99,235,.6)",
    logoBg: "white",
    logoShadow: "0 4px 18px rgba(37,99,235,.35)",
    payType: "Click · UZS",
  },
  uzcard: {
    logo: PaymentImages.uzcard,
    title: "Uzcard To'lovi",
    subtitle: "uzcard.uz · Onlayn to'lov",
    btnLabel: "Uzcard orqali to'lash",
    btnSub: "Tez · Xavfsiz · Ishonchli",
    footer: "Uzcard tizimi tomonidan himoyalangan",
    topBar: "linear-gradient(90deg,#0b4aa2,#2e7de0,#f59e0b)",
    btnBg: "linear-gradient(135deg,#0b4aa2 0%,#2e7de0 60%,#f59e0b 100%)",
    btnShadow: "0 4px 22px rgba(11,74,162,.4)",
    btnShadowHover: "0 8px 32px rgba(11,74,162,.6)",
    logoBg: "transparent",
    logoShadow: "none",
    payType: "Uzcard · UZS",
  },
  humo: {
    logo: PaymentImages.humo,
    title: "Humo To'lovi",
    subtitle: "humocard.uz · Onlayn to'lov",
    btnLabel: "Humo orqali to'lash",
    btnSub: "Tez · Xavfsiz · Ishonchli",
    footer: "Humo tizimi tomonidan himoyalangan",
    topBar: "linear-gradient(90deg,#b91c1c,#ef4444,#f97316)",
    btnBg: "linear-gradient(135deg,#991b1b 0%,#ef4444 60%,#f97316 100%)",
    btnShadow: "0 4px 22px rgba(185,28,28,.4)",
    btnShadowHover: "0 8px 32px rgba(185,28,28,.6)",
    logoBg: "transparent",
    logoShadow: "none",
    payType: "Humo · UZS",
  },
  tonkeeper: {
    logo: PaymentImages.tonkeeper,
    title: "Tonkeeper To'lovi",
    subtitle: "ton.org · Blockchain to'lov",
    btnLabel: "Tonkeeper orqali to'lash",
    btnSub: "Tez · Xavfsiz · Himoyalangan",
    footer: "TON blockchain tomonidan himoyalangan",
    topBar: "linear-gradient(90deg,#0098ea,#54c0ff,#0098ea)",
    btnBg: "linear-gradient(135deg,#005f99 0%,#0098ea 60%,#54c0ff 100%)",
    btnShadow: "0 4px 22px rgba(0,152,234,.4)",
    btnShadowHover: "0 8px 32px rgba(0,152,234,.6)",
    logoBg: "#0f1923",
    logoShadow: "0 4px 18px rgba(0,152,234,.35)",
    payType: "Tonkeeper · TON",
  },
};

function ReceiptModal({ provider, link, paymentId, amount, tonAmount, status, statusLoading, onCheckStatus, onClose, onPaid }) {
  const [visible, setVisible] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!paymentId || status === "paid" || status === "failed") return;
    pollRef.current = setInterval(() => onCheckStatus(paymentId), 4000);
    return () => clearInterval(pollRef.current);
  }, [paymentId, status]);

  useEffect(() => {
    if (status === "paid") {
      clearInterval(pollRef.current);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onPaid(), 300);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [status]);

  const handleClose = () => {
    clearInterval(pollRef.current);
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const statusMap = {
    pending: { label: "Kutilmoqda", color: "#f59e0b", dot: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
    paid:    { label: "To'landi ✓", color: "#22c55e", dot: "#22c55e", bg: "rgba(34,197,94,0.15)" },
    failed:  { label: "Xato",       color: "#ef4444", dot: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  };
  const s = statusMap[status] || statusMap.pending;
  const cfg = PROVIDER_CFG[provider] || PROVIDER_CFG.click;

  const now = new Date();
  const dateStr = now.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  const refCode = paymentId ? `#${String(paymentId).padStart(8, "0")}` : "#--------";

  return (
    <div className="rcpt-overlay" onClick={handleClose}>
      <div
        className="rcpt-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)" }}
      >
        <div className="rcpt-top-bar" style={{ background: cfg.topBar }} />
        <div className="rcpt-handle" />
        <button className="rcpt-close" onClick={handleClose}>✕</button>

        <div className="rcpt-header">
          <div className="rcpt-logo" style={{ background: cfg.logoBg, boxShadow: cfg.logoShadow }}>
            <img src={cfg.logo} alt={provider} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          </div>
          <div>
            <h2>{cfg.title}</h2>
            <p>{cfg.subtitle}</p>
          </div>
        </div>

        <div className="rcpt-amount">
          <div className="rcpt-amount-label">To'lov miqdori</div>
          <div className="rcpt-amount-val">
            {amount ? Number(amount).toLocaleString("uz-UZ") : "—"}
            <span>so'm</span>
          </div>
          {provider === "tonkeeper" && tonAmount && (
            <div style={{
              marginTop: 8,
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(0,152,234,0.12)",
              border: "1px solid rgba(0,152,234,0.25)",
              borderRadius: 20, padding: "4px 14px",
            }}>
              <svg width="13" height="13" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L3 8.5v11L14 26l11-6.5v-11L14 2z" fill="#0098ea" opacity=".3"/>
                <path d="M14 2L3 8.5 14 15l11-6.5L14 2z" fill="#0098ea"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0098ea", fontFamily: "'JetBrains Mono', monospace" }}>
                ≈ {tonAmount} TON
              </span>
            </div>
          )}
        </div>

        <div className="rcpt-rows">
          <div className="rcpt-row">
            <span className="rcpt-row-k">Qabul qiluvchi</span>
            <span className="rcpt-row-v">Starsbot</span>
          </div>
          <div className="rcpt-row">
            <span className="rcpt-row-k">To'lov turi</span>
            <span className="rcpt-row-v">{cfg.payType}</span>
          </div>
          {provider === "tonkeeper" && tonAmount && (
            <div className="rcpt-row">
              <span className="rcpt-row-k">TON miqdori</span>
              <span className="rcpt-row-v" style={{ color: "#0098ea" }}>{tonAmount} TON</span>
            </div>
          )}
          <div className="rcpt-row">
            <span className="rcpt-row-k">Chegirma</span>
            <span className="rcpt-row-v">0%</span>
          </div>
          <div className="rcpt-row">
            <span className="rcpt-row-k">Sana / Vaqt</span>
            <span className="rcpt-row-v">{dateStr} · {timeStr}</span>
          </div>
          <div className="rcpt-row">
            <span className="rcpt-row-k">Referans</span>
            <span className="rcpt-row-v" style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{refCode}</span>
          </div>
          <div className="rcpt-row">
            <span className="rcpt-row-k">Holat</span>
            <span className="rcpt-badge" style={{ background: s.bg, color: s.color }}>
              <span
                className={`rcpt-dot ${status !== "paid" && status !== "failed" ? "pulse" : ""}`}
                style={{ background: s.dot }}
              />
              {s.label}
            </span>
          </div>
        </div>

        <div className="rcpt-scissors">
          <div className="rcpt-dash" />
          <span className="rcpt-scissors-icon">✂</span>
          <div className="rcpt-dash" />
        </div>

        <div className="rcpt-actions">
          <button
            className="rcpt-pay-btn"
            onClick={() => openExternalLink(link, provider)}
            style={{ background: cfg.btnBg, boxShadow: cfg.btnShadow, width: "100%", border: "none" }}
          >
            <div className="rcpt-btn-left">
              <div className="rcpt-btn-icon">
                <img src={cfg.logo} alt={provider} onError={(e) => { e.currentTarget.style.display = "none"; }} />
              </div>
              <div>
                <div className="rcpt-btn-title">{cfg.btnLabel}</div>
                <div className="rcpt-btn-sub">{cfg.btnSub}</div>
              </div>
            </div>
            <div className="rcpt-btn-arrow">→</div>
          </button>

          <div className="rcpt-refresh-row">
            <span className="rcpt-refresh-label">To'lov holatini yangilash</span>
            <button
              className="rcpt-refresh-btn"
              onClick={() => onCheckStatus(paymentId)}
              disabled={statusLoading}
            >
              {statusLoading ? (
                <>
                  <svg className="rcpt-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Tekshirilmoqda
                </>
              ) : "🔄 Yangilash"}
            </button>
          </div>
        </div>

        <div className="rcpt-footer">{cfg.footer}</div>
      </div>
    </div>
  );
}

/** Uzcard / Humo: avto-to‘lov yo‘q — karta raqami va qo‘lda o‘tkazish (settings.php) */
function ManualTransferModal({
  provider,
  paymentId,
  amount,
  cardPan,
  cardName,
  status,
  statusLoading,
  onCheckStatus,
  onClose,
  onPaid,
}) {
  const [visible, setVisible] = useState(false);
  const pollRef = useRef(null);
  const cfg = PROVIDER_CFG[provider] || PROVIDER_CFG.uzcard;

  const terminal = status === "paid" || status === "failed" || status === "cancel";

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!paymentId || terminal) return;
    pollRef.current = setInterval(() => onCheckStatus(paymentId), 4000);
    return () => clearInterval(pollRef.current);
  }, [paymentId, status, terminal]);

  useEffect(() => {
    if (status !== "paid") return;
    clearInterval(pollRef.current);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onPaid(), 300);
    }, 800);
    return () => clearTimeout(t);
  }, [status]);

  const handleClose = () => {
    clearInterval(pollRef.current);
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const statusMap = {
    pending: { label: "Kutilmoqda", color: "#f59e0b", dot: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
    paid: { label: "To'landi ✓", color: "#22c55e", dot: "#22c55e", bg: "rgba(34,197,94,0.15)" },
    failed: { label: "Xato", color: "#ef4444", dot: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    cancel: { label: "Bekor qilindi", color: "#94a3b8", dot: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  };
  const s = statusMap[status] || statusMap.pending;

  const copyCard = async () => {
    const raw = String(cardPan || "").replace(/\s/g, "");
    if (!raw) return;
    try {
      await navigator.clipboard.writeText(raw);
      window.Telegram?.WebApp?.showPopup?.({ message: "Karta raqami nusxalandi" });
    } catch {
      try {
        window.Telegram?.WebApp?.showPopup?.({ message: raw });
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="rcpt-overlay" onClick={handleClose}>
      <div
        className="rcpt-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)" }}
      >
        <div className="rcpt-top-bar" style={{ background: cfg.topBar }} />
        <div className="rcpt-handle" />
        <button type="button" className="rcpt-close" onClick={handleClose}>✕</button>

        <div className="rcpt-header">
          <div className="rcpt-logo" style={{ background: cfg.logoBg, boxShadow: cfg.logoShadow }}>
            <img src={cfg.logo} alt={provider} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          </div>
          <div>
            <h2>{cfg.title}</h2>
            <p>Qo'lda o'tkazish · {cfg.payType}</p>
          </div>
        </div>

        <div className="rcpt-amount">
          <div className="rcpt-amount-label">To'lov miqdori</div>
          <div className="rcpt-amount-val">
            {amount ? Number(amount).toLocaleString("uz-UZ") : "—"}
            <span>so'm</span>
          </div>
        </div>

        <p className="manual-transfer-hint">
          Bu yerda avtomatik to'lov yo'q. Iltimos, <strong>aniq shu miqdordagi</strong> mablag'ni quyidagi kartaga
          o'tkazing. O'tkazgach pastdagi «Yangilash»ni bosing — tekshiruvdan keyin balans yangilanadi.
        </p>
        <p className="manual-transfer-hint manual-transfer-hint--warn">
          ⏱️ Eslatma: bu to'lov 10 daqiqadan keyin avtomatik bekor qilinadi.
        </p>
        {!String(cardPan || "").trim() && (
          <p className="manual-transfer-hint manual-transfer-hint--warn">
            Karta raqami hozircha yuklanmadi. Administratorga murojaat qiling — serverda karta rekviziti sozlanganini tekshiring.
          </p>
        )}

        <div className="rcpt-rows" style={{ paddingTop: 8 }}>
          <div className="rcpt-row">
            <span className="rcpt-row-k">Karta raqami</span>
            <span className="rcpt-row-v manual-card-pan">{cardPan || "—"}</span>
          </div>
          {!!String(cardName || "").trim() && (
            <div className="rcpt-row">
              <span className="rcpt-row-k">Karta egasi</span>
              <span className="rcpt-row-v">{String(cardName).trim()}</span>
            </div>
          )}
          <div className="rcpt-row">
            <span className="rcpt-row-k">To'lov ID</span>
            <span className="rcpt-row-v" style={{ fontSize: 11, wordBreak: "break-all" }}>{paymentId || "—"}</span>
          </div>
          <div className="rcpt-row">
            <span className="rcpt-row-k">Holat</span>
            <span className="rcpt-badge" style={{ background: s.bg, color: s.color }}>
              <span
                className={`rcpt-dot ${!terminal ? "pulse" : ""}`}
                style={{ background: s.dot }}
              />
              {s.label}
            </span>
          </div>
        </div>

        <div className="rcpt-scissors">
          <div className="rcpt-dash" />
          <span className="rcpt-scissors-icon">✂</span>
          <div className="rcpt-dash" />
        </div>

        <div className="rcpt-actions">
          <button
            type="button"
            className="rcpt-pay-btn"
            onClick={copyCard}
            disabled={!String(cardPan || "").trim()}
            style={{
              background: cfg.btnBg,
              boxShadow: cfg.btnShadow,
              width: "100%",
              border: "none",
              opacity: String(cardPan || "").trim() ? 1 : 0.45,
            }}
          >
            <div className="rcpt-btn-left">
              <div className="rcpt-btn-icon">
                <span style={{ fontSize: 18 }}>📋</span>
              </div>
              <div>
                <div className="rcpt-btn-title">Karta raqamini nusxalash</div>
                <div className="rcpt-btn-sub">Bank ilovasiga qo'shish uchun</div>
              </div>
            </div>
          </button>

          <div className="rcpt-refresh-row">
            <span className="rcpt-refresh-label">To'lov qabul qilinganini tekshirish</span>
            <button
              type="button"
              className="rcpt-refresh-btn"
              onClick={() => onCheckStatus(paymentId)}
              disabled={statusLoading || terminal}
            >
              {statusLoading ? (
                <>
                  <svg className="rcpt-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Tekshirilmoqda
                </>
              ) : "🔄 Yangilash"}
            </button>
          </div>
        </div>

        <div className="rcpt-footer">Qo'lda o'tkazish · admin tekshiruvi</div>
      </div>
    </div>
  );
}

function SuccessOverlay({ amount, onDone }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 700);
    const t3 = setTimeout(() => setPhase(3), 4500);
    const t4 = setTimeout(() => onDone(), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const phaseClass = [phase >= 1 ? "sp1" : "", phase >= 2 ? "sp2" : ""].join(" ");

  return (
    <div
      className={`success-overlay ${phaseClass}`}
      style={{ animation: phase === 3 ? "successFadeOut .5s ease forwards" : "successFadeIn .35s ease forwards" }}
    >
      {phase >= 1 && (
        <div className="confetti-container">
          {Array.from({ length: 28 }).map((_, i) => {
            const colors = ["#22c55e","#4ade80","#86efac","#2563eb","#60a5fa","#fbbf24","#f9a8d4"];
            return (
              <div key={i} className="confetti-dot" style={{
                left: `${5 + (i * 3.3) % 92}%`,
                top: "-10px",
                width: `${5 + (i % 4) * 3}px`,
                height: `${8 + (i % 3) * 4}px`,
                background: colors[i % colors.length],
                opacity: 0.85,
                animationDuration: `${1.2 + (i % 5) * 0.2}s`,
                animationDelay: `${(i * 0.07).toFixed(2)}s`,
              }} />
            );
          })}
        </div>
      )}

      <div className="success-circle-wrap">
        <div className="success-ripple r1" />
        <div className="success-ripple r2" />
        <div className="success-circle">
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
            <path
              className="success-check"
              d="M10 22L18 30L33 13"
              stroke="white" strokeWidth="3.5"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <h2 className="success-title">To'lov amalga oshdi!</h2>
      <p className="success-sub">Mablag' muvaffaqiyatli qabul qilindi</p>

      <div className="success-amount-card">
        <div className="success-amount-label">To'langan summa</div>
        <div className="success-amount-val">
          {amount ? Number(amount).toLocaleString("uz-UZ") : "—"}
          <span>so'm</span>
        </div>
      </div>

      <p className="success-redirect-hint">bosh sahifaga yo'naltirilmoqda...</p>
    </div>
  );
}

function TonRateCard({ amount, tonRate, loading }) {
  const amountNum = parseFloat(amount);
  const isValidAmount = amount && !isNaN(amountNum) && amountNum >= 1000;

  const tonAmount = isValidAmount && tonRate
    ? (amountNum / tonRate.ton_uzs).toFixed(4)
    : null;

  return (
    <div className="ton-rate-card">
      <div className="ton-rate-left">
        <div className="ton-icon-wrap">
          <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L3 8.5v11L14 26l11-6.5v-11L14 2z" fill="#0098ea" opacity=".35"/>
            <path d="M14 2L3 8.5 14 15l11-6.5L14 2z" fill="#0098ea"/>
          </svg>
        </div>
        <div>
          <div className="ton-rate-label">TON kursi</div>
          <div className="ton-rate-sub">
            {loading
              ? "yuklanmoqda..."
              : tonRate
                ? `1 TON ≈ ${Number(tonRate.ton_uzs).toLocaleString("uz-UZ")} so'm`
                : "ma'lumot yo'q"
            }
          </div>
        </div>
      </div>

      <div className="ton-rate-right">
        {loading ? (
          <div className="ton-rate-loading">
            <div className="ton-rate-spin" />
            <span>kurs olinmoqda</span>
          </div>
        ) : tonAmount ? (
          <>
            <div className="ton-amount-big">
              ≈ {tonAmount}
              <span>TON</span>
            </div>
            <div className="ton-rate-detail">
              {tonRate && `$${tonRate.ton_usd} · ${Number(tonRate.usd_uzs).toLocaleString("uz-UZ")} so'm/$`}
            </div>
          </>
        ) : (
          <div className="ton-amount-big" style={{ color: "rgba(0,152,234,0.3)", fontSize: 13 }}>
            summa kiriting
          </div>
        )}
      </div>
    </div>
  );
}

export default function Payment() {
  const { user, getInitData, serviceSettings } = useTelegram();
  const [method, setMethod] = useState("click");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());
  const [submitLoading, setSubmitLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalProvider, setModalProvider] = useState(null);
  const [modalLink, setModalLink] = useState(null);
  const [modalPaymentId, setModalPaymentId] = useState(null);
  const [modalTonAmount, setModalTonAmount] = useState(null);
  const [modalStatus, setModalStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  /** Uzcard / Humo: qo'lda karta — ReceiptModal o'rniga */
  const [manualTransfer, setManualTransfer] = useState(null);

  const [showSuccess, setShowSuccess] = useState(false);

  const [tonRate, setTonRate] = useState(null);
  const [tonRateLoading, setTonRateLoading] = useState(false);

  const paymentMethods = ["click", "uzcard", "humo", "tonkeeper"];
  const methodEnabledMap = {
    click: true,
    tonkeeper: true,
    uzcard: String(serviceSettings?.uzcard ?? "on").toLowerCase() === "on",
    humo: String(serviceSettings?.humo ?? "on").toLowerCase() === "on",
  };

  const isMethodEnabled = (m) => !!methodEnabledMap[m];

  useEffect(() => {
    if (isMethodEnabled(method)) return;
    const fallback = paymentMethods.find((m) => isMethodEnabled(m)) || "click";
    setMethod(fallback);
  }, [method, serviceSettings]);

  useEffect(() => {
    if (method === "tonkeeper") {
      fetchTonRate();
    }
  }, [method]);

  const debounceRef = useRef(null);
  useEffect(() => {
    if (method !== "tonkeeper") return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!tonRate) fetchTonRate();
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [amount, method]);

  const fetchTonRate = async () => {
    try {
      setTonRateLoading(true);
      const res = await fetch("https://tezpremium.uz/MilliyDokon/ton/kurs.php");
      const data = await res.json();
      if (data.status === "ok") {
        setTonRate(data);
      }
    } catch (err) {
      console.error("❌ fetchTonRate:", err);
    } finally {
      setTonRateLoading(false);
    }
  };

  const handleImageLoad = (m) => setLoadedImages((prev) => new Set(prev).add(m));
  const isImageLoaded = (m) => loadedImages.has(m);
  const handleImageError = (m) => {
    setFailedImages((prev) => new Set(prev).add(m));
    setLoadedImages((prev) => new Set(prev).add(m));
  };
  const isImageFailed = (m) => failedImages.has(m);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    if (value === "" || !isNaN(parseFloat(value))) setError("");
  };

  const checkClickStatus = async (paymentId) => {
    try {
      setStatusLoading(true);
      const res = await fetch(`https://tezpremium.uz/MilliyDokon/click_status.php?payment_id=${paymentId}`);
      const data = await res.json();
      const newStatus = data.status || "pending";
      setModalStatus(newStatus);
      return newStatus;
    } catch (err) {
      console.error("❌ checkClickStatus:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  const checkTonStatus = async (paymentId) => {
    try {
      setStatusLoading(true);
      const res = await fetch(`https://tezpremium.uz/MilliyDokon/ton/ton_status.php?payment_id=${paymentId}`);
      const data = await res.json();
      const newStatus = data.status || "pending";
      setModalStatus(newStatus);
      return newStatus;
    } catch (err) {
      console.error("❌ checkTonStatus:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  const checkUzcardStatus = async (paymentId) => {
    try {
      setStatusLoading(true);
      const res = await fetch(`https://tezpremium.uz/MilliyDokon/uzcard/status.php?payment_id=${paymentId}`);
      const data = await res.json();
      const newStatus = data.status || "pending";
      setModalStatus(newStatus);
      return newStatus;
    } catch (err) {
      console.error("❌ checkUzcardStatus:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  const checkHumoStatus = async (paymentId) => {
    try {
      setStatusLoading(true);
      const res = await fetch(`https://tezpremium.uz/MilliyDokon/payments/status.php?payment_id=${paymentId}`);
      const data = await res.json();
      const newStatus = data.status || "pending";
      setModalStatus(newStatus);
      return newStatus;
    } catch (err) {
      console.error("❌ checkHumoStatus:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePaid = () => {
    setModalOpen(false);
    setModalLink(null);
    setManualTransfer(null);
    setShowSuccess(true);
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    window.location.href = "/";
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!isMethodEnabled(method)) {
      const methodName = method === "uzcard" ? "Uzcard" : method === "humo" ? "Humo" : method;
      setError(`${methodName} to'lovi hozircha o'chirilgan`);
      return;
    }
    if (!amount || isNaN(amountNum))    { setError("To'lov miqdorini kiriting"); return; }
    if (amountNum < 1000)               { setError("To'lov miqdori 1000 so'mdan kam bo'lmasligi kerak"); return; }
    if (amountNum > 1000000)            { setError("To'lov miqdori 1,000,000 so'mdan oshmasligi kerak"); return; }
    if (!user?.id)                      { setError("Foydalanuvchi topilmadi"); return; }

    setError("");
    setSubmitLoading(true);

    try {
      if (method === "click") {
        const res  = await fetch(`https://tezpremium.uz/MilliyDokon/click.php?user_id=${user.id}&amount=${amountNum}`);
        const data = await res.json();

        if (data.ok && data.link) {
          setModalProvider("click");
          setModalLink(data.link);
          setModalPaymentId(data.payment_id);
          setModalTonAmount(null);
          setModalStatus(null);
          setModalOpen(true);
          if (data.payment_id) {
            const init = await checkClickStatus(data.payment_id);
            if (init === "paid") handlePaid();
          }
        } else {
          setError(data.message || "To'lovda xatolik yuz berdi");
        }

      } else if (method === "uzcard") {
        const initData = (typeof getInitData === "function" ? getInitData() : "")?.trim();
        if (!initData) {
          setError("Telegram initData topilmadi");
          return;
        }

        const res = await fetch("https://tezpremium.uz/MilliyDokon/uzcard/review.php", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            initData,
            amount: Math.floor(amountNum),
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
          setError((data && data.message) || raw || `HTTP ${res.status}`);
          return;
        }
        if (!data || typeof data !== "object") {
          setError(raw || "Uzcard javobi JSON emas");
          return;
        }

        if (data.ok && data.payment_id) {
          const settings = await fetchPaymentSettings();
          const cardPan = String(settings?.uzcard ?? "").trim();
          const cardName = String(settings?.uzcard_name ?? "").replace(/\\\//g, "/").trim();
          setModalStatus(null);
          setManualTransfer({
            provider: "uzcard",
            paymentId: data.payment_id,
            cardPan,
            cardName,
          });
          const init = await checkUzcardStatus(data.payment_id);
          if (init === "paid") handlePaid();
        } else {
          setError(data.message || "Uzcard to'lovida xatolik yuz berdi");
        }
      } else if (method === "humo") {
        const initData = (typeof getInitData === "function" ? getInitData() : "")?.trim();
        if (!initData) {
          setError("Telegram initData topilmadi");
          return;
        }

        const res = await fetch("https://tezpremium.uz/MilliyDokon/payments/review.php", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            initData,
            amount: Math.floor(amountNum),
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
          setError((data && data.message) || raw || `HTTP ${res.status}`);
          return;
        }
        if (!data || typeof data !== "object") {
          setError(raw || "Humo javobi JSON emas");
          return;
        }

        if (data.ok && data.payment_id) {
          const settings = await fetchPaymentSettings();
          const cardPan = String(settings?.humo ?? "").trim();
          const cardName = String(settings?.humo_name ?? "").replace(/\\\//g, "/").trim();
          setModalStatus(null);
          setManualTransfer({
            provider: "humo",
            paymentId: data.payment_id,
            cardPan,
            cardName,
          });
          const init = await checkHumoStatus(data.payment_id);
          if (init === "paid") handlePaid();
        } else {
          setError(data.message || "Humo to'lovida xatolik yuz berdi");
        }
      } else if (method === "tonkeeper") {
        const res  = await fetch(`https://tezpremium.uz/MilliyDokon/ton/tonpay.php?user_id=${user.id}&amount=${amountNum}`);
        const data = await res.json();

        if (data.status === "ok" && data.link) {
          setModalProvider("tonkeeper");
          setModalLink(data.link);
          setModalPaymentId(data.payment_id || null);
          setModalTonAmount(data.ton || null);
          setModalStatus(null);
          setModalOpen(true);
          if (data.payment_id) {
            const init = await checkTonStatus(data.payment_id);
            if (init === "paid") handlePaid();
          }
        } else {
          setError(data.message || "To'lovda xatolik yuz berdi");
        }
      }
    } catch (err) {
      setError(err?.message || "To'lov yuborishda xatolik yuz berdi");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <div className="payment-wrapper">
        <div className="payment-card">
          <div className="payment-row">
            <div className="payment-row-column">
              <span className="payment-label">Qabul qiluvchi</span>
              <span className="payment-receiver">Starsbot</span>
            </div>
            <div className="payment-row-column">
              <span className="payment-label">Chegirma</span>
              <span className="payment-price">0%</span>
            </div>
          </div>
        </div>

        <div className="payment-input-block" style={{ marginBottom: 20 }}>
          <p className="payment-info-text">
            ℹ️ To'lov miqdori 1000 so'mdan kam va 1,000,000 so'mdan oshmasligi kerak
          </p>
          <p className="payment-info-text payment-info-warn">
            ⏱️ Eslatma: to'lov 10 daqiqadan keyin avtomatik bekor qilinadi.
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 className="payment-title">To'lov tizimini tanlang</h3>
          <div className="payment-methods">
            {paymentMethods.map((m) => (
              <div
                key={m}
                onClick={() => {
                  if (!isMethodEnabled(m)) return;
                  setMethod(m);
                  setError("");
                }}
                className={`payment-method ${method === m ? "selected" : ""} ${!isMethodEnabled(m) ? "disabled" : ""}`}
                style={{ cursor: isMethodEnabled(m) ? "pointer" : "not-allowed" }}
              >
                {!isImageLoaded(m) && <div className="payment-skeleton" />}
                {!isImageFailed(m) ? (
                  <img
                    src={PaymentImages[m]}
                    alt={m.charAt(0).toUpperCase() + m.slice(1)}
                    className={`payment-logo ${isImageLoaded(m) ? "loaded" : ""}`}
                    onLoad={() => handleImageLoad(m)}
                    onError={() => handleImageError(m)}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 40,
                      fontWeight: 700,
                      color: ({ click: "#fdb813", uzcard: "#0b4aa2", humo: "#b91c1c", tonkeeper: "#0098ea" })[m] || "#64748b",
                    }}
                  >
                    {({ click: "C", uzcard: "U", humo: "H", tonkeeper: "T" })[m] || "P"}
                  </span>
                )}
                {!isMethodEnabled(m) && <span className="payment-method-off-badge">OFF</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="payment-input-block">
          <label htmlFor="amount-input" className="payment-input-label">
            To'lov miqdori (so'm)
          </label>
          <input
            id="amount-input"
            type="number"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Masalan: 50000"
            className="payment-input"
            style={{ cursor: "text", pointerEvents: "auto", opacity: 1 }}
          />
          {error && <p className="payment-error">⚠️ {error}</p>}

          {method === "tonkeeper" && (
            <TonRateCard
              amount={amount}
              tonRate={tonRate}
              loading={tonRateLoading}
            />
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="payment-button"
          style={{ cursor: submitLoading ? "not-allowed" : "pointer", opacity: submitLoading ? 0.7 : 1 }}
          disabled={submitLoading}
        >
          {submitLoading ? "⏳ Yuklanmoqda..." : "✓ Yuborish"}
        </button>
      </div>

      {modalOpen && (
        <ReceiptModal
          provider={modalProvider}
          link={modalLink}
          paymentId={modalPaymentId}
          amount={amount}
          tonAmount={modalTonAmount}
          status={modalStatus}
          statusLoading={statusLoading}
          onCheckStatus={
            modalProvider === "click"
              ? checkClickStatus
              : modalProvider === "uzcard"
                ? checkUzcardStatus
                : modalProvider === "humo"
                  ? checkHumoStatus
                  : checkTonStatus
          }
          onClose={() => setModalOpen(false)}
          onPaid={handlePaid}
        />
      )}

      {manualTransfer && (
        <ManualTransferModal
          provider={manualTransfer.provider}
          paymentId={manualTransfer.paymentId}
          amount={amount}
          cardPan={manualTransfer.cardPan}
          cardName={manualTransfer.cardName}
          status={modalStatus}
          statusLoading={statusLoading}
          onCheckStatus={manualTransfer.provider === "uzcard" ? checkUzcardStatus : checkHumoStatus}
          onClose={() => {
            setManualTransfer(null);
            setModalStatus(null);
          }}
          onPaid={handlePaid}
        />
      )}

      {showSuccess && (
        <SuccessOverlay
          amount={amount}
          onDone={handleSuccessDone}
        />
      )}
    </>
  );
}