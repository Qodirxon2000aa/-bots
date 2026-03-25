import { useState, useEffect } from 'react';
import { useTelegram } from '@/app/context/TelegramContext';
import { TopBar } from '@/app/components/ui/TopBar';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { ChipGroup, Chip } from '@/app/components/ui/Chip';
import {
  History,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

/* ── SHARED STYLES (payment.jsx dan olingan) ── */
const MODAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Sora:wght@400;500;600;700;800&display=swap');

  @keyframes rcpt-fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes rcpt-slideUp {
    from { transform:translateY(60px); opacity:0; }
    to   { transform:translateY(0);    opacity:1; }
  }
  @keyframes rcpt-pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:.45; transform:scale(0.7); }
  }
  @keyframes rcpt-shimmer {
    0%   { left:-60%; }
    100% { left:120%; }
  }
  @keyframes rcpt-rowFade {
    from { opacity:0; transform:translateX(-8px); }
    to   { opacity:1; transform:translateX(0); }
  }

  .rcpt-overlay {
    position:fixed; inset:0; z-index:1000;
    background:rgba(0,0,0,.75);
    backdrop-filter:blur(10px);
    display:flex; align-items:flex-end; justify-content:center;
    animation:rcpt-fadeIn .28s ease forwards;
    font-family:'Sora',sans-serif;
  }
  .rcpt-sheet {
    width:100%; max-width:440px;
    background:#0f0f0f;
    border-radius:28px 28px 0 0;
    padding:0 0 44px;
    box-shadow:0 -4px 60px rgba(0,0,0,.7),
               0 0 0 1px rgba(255,255,255,.07),
               inset 0 1px 0 rgba(255,255,255,.04);
    animation:rcpt-slideUp .38s cubic-bezier(.22,1,.36,1) forwards;
    overflow:hidden; position:relative;
    transition:opacity .3s ease, transform .3s ease;
    max-height:90vh; overflow-y:auto;
  }
  .rcpt-top-bar { height:4px; }
  .rcpt-handle {
    width:40px; height:4px; border-radius:2px;
    background:rgba(255,255,255,.1);
    margin:16px auto 0;
  }
  .rcpt-close {
    position:absolute; top:22px; right:18px;
    width:30px; height:30px; border-radius:50%;
    background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.09);
    cursor:pointer; font-size:13px;
    color:rgba(255,255,255,.45);
    display:flex; align-items:center; justify-content:center;
    transition:all .18s;
  }
  .rcpt-close:hover { background:rgba(255,255,255,.1); color:rgba(255,255,255,.85); }
  .rcpt-header {
    padding:20px 22px 18px;
    display:flex; align-items:center; gap:14px;
    border-bottom:1px dashed rgba(255,255,255,.09);
  }
  .rcpt-logo {
    width:50px; height:50px; border-radius:14px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .rcpt-logo img { width:32px; height:32px; object-fit:contain; }
  .rcpt-header h2 {
    font-size:16px; font-weight:700; color:#fff; margin:0 0 3px;
    letter-spacing:-.3px;
  }
  .rcpt-header p {
    font-size:11px; color:rgba(255,255,255,.35); margin:0;
    font-family:'JetBrains Mono',monospace;
  }
  .rcpt-amount {
    padding:22px 22px 18px;
    border-bottom:1px dashed rgba(255,255,255,.09);
    text-align:center;
  }
  .rcpt-amount-label {
    font-size:10px; font-weight:600; color:rgba(255,255,255,.3);
    letter-spacing:1.8px; text-transform:uppercase; margin-bottom:8px;
  }
  .rcpt-amount-val {
    font-size:36px; font-weight:800; color:#fff;
    letter-spacing:-1.5px; line-height:1;
  }
  .rcpt-amount-val span {
    font-size:17px; font-weight:600;
    color:rgba(255,255,255,.4); margin-left:5px; letter-spacing:0;
  }
  .rcpt-rows {
    padding:18px 22px;
    border-bottom:1px dashed rgba(255,255,255,.09);
    display:flex; flex-direction:column; gap:12px;
  }
  .rcpt-row {
    display:flex; justify-content:space-between; align-items:center;
    animation:rcpt-rowFade .3s ease both;
  }
  .rcpt-row:nth-child(1){animation-delay:.05s}
  .rcpt-row:nth-child(2){animation-delay:.10s}
  .rcpt-row:nth-child(3){animation-delay:.15s}
  .rcpt-row:nth-child(4){animation-delay:.20s}
  .rcpt-row:nth-child(5){animation-delay:.25s}
  .rcpt-row:nth-child(6){animation-delay:.30s}
  .rcpt-row-k { font-size:12px; color:rgba(255,255,255,.35); font-weight:500; }
  .rcpt-row-v {
    font-size:12px; color:rgba(255,255,255,.8); font-weight:600;
    font-family:'JetBrains Mono',monospace; text-align:right;
  }
  .rcpt-badge {
    display:inline-flex; align-items:center; gap:6px;
    padding:4px 11px; border-radius:20px;
    font-size:11px; font-weight:700;
    font-family:'JetBrains Mono',monospace;
  }
  .rcpt-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .rcpt-dot.pulse { animation:rcpt-pulse 1.3s ease infinite; }
  .rcpt-scissors {
    padding:12px 22px;
    border-bottom:1px dashed rgba(255,255,255,.09);
    display:flex; align-items:center; gap:10px;
  }
  .rcpt-dash {
    flex:1; height:1px;
    background:repeating-linear-gradient(90deg,
      rgba(255,255,255,.12) 0,rgba(255,255,255,.12) 6px,
      transparent 6px,transparent 12px);
  }
  .rcpt-scissors-icon { font-size:15px; opacity:.22; }
  .rcpt-actions { padding:18px 22px 0; display:flex; flex-direction:column; gap:10px; }
  .rcpt-pay-btn {
    display:flex; align-items:center; justify-content:space-between;
    padding:15px 16px; border-radius:16px; text-decoration:none;
    border:none; position:relative; overflow:hidden;
    transition:transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease;
    cursor:pointer; width:100%;
  }
  .rcpt-pay-btn:hover { transform:translateY(-2px) scale(1.01); }
  .rcpt-pay-btn::after {
    content:''; position:absolute; top:0; left:-60%;
    width:45%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);
    transform:skewX(-18deg);
    animation:rcpt-shimmer 2.8s ease infinite; pointer-events:none;
  }
  .rcpt-btn-icon {
    width:36px; height:36px; border-radius:10px;
    background:rgba(255,255,255,.2);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .rcpt-btn-icon img { width:23px; height:23px; object-fit:contain; }
  .rcpt-btn-left { display:flex; align-items:center; gap:11px; }
  .rcpt-btn-title { font-size:14px; font-weight:700; color:white; letter-spacing:-.2px; }
  .rcpt-btn-sub { font-size:10px; color:rgba(255,255,255,.6); font-weight:500; margin-top:2px; }
  .rcpt-btn-arrow {
    width:30px; height:30px; border-radius:8px;
    background:rgba(255,255,255,.18);
    display:flex; align-items:center; justify-content:center;
    font-size:15px; color:white; flex-shrink:0;
    transition:transform .2s;
  }
  .rcpt-pay-btn:hover .rcpt-btn-arrow { transform:translateX(4px); }
  .rcpt-close-btn {
    width:100%; height:44px;
    background:rgba(255,255,255,.07);
    border:1px solid rgba(255,255,255,.09);
    border-radius:14px;
    color:rgba(255,255,255,.55);
    font-size:13px; font-weight:600;
    cursor:pointer; transition:all .18s;
    font-family:'Sora',sans-serif;
  }
  .rcpt-close-btn:hover { background:rgba(255,255,255,.11); color:rgba(255,255,255,.85); }
  .rcpt-footer {
    text-align:center; font-size:10px; color:rgba(255,255,255,.18);
    padding:14px 22px 0; font-family:'JetBrains Mono',monospace; letter-spacing:.4px;
  }

  /* TON badge in amount section */
  .rcpt-ton-badge {
    margin-top:8px;
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(0,152,234,0.12);
    border:1px solid rgba(0,152,234,0.25);
    border-radius:20px; padding:4px 14px;
  }

  @media (max-width: 380px) {
    .rcpt-sheet { padding:0 0 32px; border-radius:20px 20px 0 0; }
    .rcpt-header { padding:16px 16px 14px; gap:10px; }
    .rcpt-logo { width:42px; height:42px; border-radius:11px; }
    .rcpt-logo img { width:26px; height:26px; }
    .rcpt-header h2 { font-size:14px; }
    .rcpt-amount { padding:16px 16px 14px; }
    .rcpt-amount-val { font-size:28px; }
    .rcpt-amount-val span { font-size:14px; }
    .rcpt-rows { padding:14px 16px; gap:10px; }
    .rcpt-row-k,.rcpt-row-v { font-size:11px; }
    .rcpt-actions { padding:14px 16px 0; }
    .rcpt-pay-btn { padding:12px 14px; border-radius:13px; }
    .rcpt-footer { font-size:9px; padding:11px 16px 0; }
  }
`;

/* ── PROVIDER CONFIG ── */
const PROVIDER_CFG = {
  Click: {
    logo: 'https://api.logobank.uz/media/logos_preview/Click-01_0xvqWH8.png',
    title: "Click To'lovi",
    subtitle: 'click.uz · Onlayn to\'lov',
    btnLabel: "Click orqali to'lash",
    btnSub: 'Tez · Xavfsiz · Ishonchli',
    footer: "click.uz tomonidan himoyalangan · SSL xavfsiz",
    topBar: 'linear-gradient(90deg,#1d4ed8,#60a5fa,#1d4ed8)',
    btnBg: 'linear-gradient(135deg,#ffffff 0%,#2563eb 60%,#3b82f6 100%)',
    btnShadow: '0 4px 22px rgba(37,99,235,.4)',
    logoBg: 'white',
    logoShadow: '0 4px 18px rgba(37,99,235,.35)',
    payType: 'Click · UZS',
  },
  Tonkeeper: {
    logo: 'https://i.ibb.co/jkLrSV3X/image-Photoroom-1.png',
    title: "Tonkeeper To'lovi",
    subtitle: 'ton.org · Blockchain to\'lov',
    btnLabel: "Tonkeeper orqali to'lash",
    btnSub: 'Tez · Xavfsiz · Himoyalangan',
    footer: 'TON blockchain tomonidan himoyalangan',
    topBar: 'linear-gradient(90deg,#0098ea,#54c0ff,#0098ea)',
    btnBg: 'linear-gradient(135deg,#005f99 0%,#0098ea 60%,#54c0ff 100%)',
    btnShadow: '0 4px 22px rgba(0,152,234,.4)',
    logoBg: '#0f1923',
    logoShadow: '0 4px 18px rgba(0,152,234,.35)',
    payType: 'Tonkeeper · TON',
  },
};

const STATUS_STYLE = {
  paid:    { label: "To'landi ✓",     color: '#22c55e', dot: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  pending: { label: 'Kutilmoqda',      color: '#f59e0b', dot: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  failed:  { label: 'Bekor qilingan',  color: '#ef4444', dot: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  cancel:  { label: 'Bekor qilingan',  color: '#ef4444', dot: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  cancelled:{ label: 'Bekor qilingan', color: '#ef4444', dot: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

/* ── RECEIPT MODAL ── */
function PaymentReceiptModal({ payment, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const tg = window.Telegram?.WebApp;
  const handlePay = () => {
    const link = payment.link;
    if (!link) return;
    const provider = payment.type?.toLowerCase();
    try {
      if (provider === 'tonkeeper') {
        if (tg?.openLink) tg.openLink(link, { try_instant_view: false });
        else window.location.href = link;
      } else {
        if (tg?.openLink) tg.openLink(link, { try_instant_view: false });
        else window.location.href = link;
      }
    } catch {
      window.location.href = link;
    }
  };

  const typeKey = payment.type || 'Click';
  const cfg = PROVIDER_CFG[typeKey] || PROVIDER_CFG.Click;

  const statusKey = payment.status?.toLowerCase?.().trim() || 'pending';
  const s = STATUS_STYLE[statusKey] || STATUS_STYLE.failed;

  const isPending = statusKey === 'pending';
  const hasLink = !!payment.link;

  // Parse date
  const parseDate = (dateStr) => {
    try {
      if (!dateStr) return new Date();
      const cleaned = dateStr.replace(/📆|⏰/g, '').trim();
      const [datePart, timePart] = cleaned.split('|').map((x) => x.trim());
      if (datePart) {
        const [dd, mm, yyyy] = datePart.split('.');
        if (dd && mm && yyyy) {
          const time = timePart && timePart !== 'soat' ? timePart : '00:00';
          const parsed = new Date(`${yyyy}-${mm}-${dd}T${time}:00`);
          if (!isNaN(parsed.getTime())) return parsed;
        }
      }
      const fallback = new Date(dateStr);
      return isNaN(fallback.getTime()) ? new Date() : fallback;
    } catch {
      return new Date();
    }
  };

  const dateObj = parseDate(payment.date);
  const dateStr = format(dateObj, 'dd.MM.yyyy');
  const timeStr = format(dateObj, 'HH:mm');
  const refCode = `#${String(payment.order_id).padStart(8, '0')}`;

  return (
    <>
      <style>{MODAL_STYLES}</style>
      <div className="rcpt-overlay" onClick={handleClose}>
        <div
          className="rcpt-sheet"
          onClick={(e) => e.stopPropagation()}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(40px)',
          }}
        >
          {/* Top accent bar */}
          <div className="rcpt-top-bar" style={{ background: cfg.topBar }} />
          <div className="rcpt-handle" />
          <button className="rcpt-close" onClick={handleClose}>✕</button>

          {/* Header */}
          <div className="rcpt-header">
            <div
              className="rcpt-logo"
              style={{ background: cfg.logoBg, boxShadow: cfg.logoShadow }}
            >
              <img
                src={cfg.logo}
                alt={typeKey}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <div>
              <h2>{cfg.title}</h2>
              <p>{cfg.subtitle}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="rcpt-amount">
            <div className="rcpt-amount-label">To'lov miqdori</div>
            <div className="rcpt-amount-val">
              {Number(payment.amount).toLocaleString('uz-UZ')}
              <span>so'm</span>
            </div>

            {typeKey === 'Tonkeeper' && payment.ton && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                <div className="rcpt-ton-badge">
                  <svg width="13" height="13" viewBox="0 0 28 28" fill="none">
                    <path d="M14 2L3 8.5v11L14 26l11-6.5v-11L14 2z" fill="#0098ea" opacity=".3" />
                    <path d="M14 2L3 8.5 14 15l11-6.5L14 2z" fill="#0098ea" />
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0098ea', fontFamily: "'JetBrains Mono', monospace" }}>
                    ≈ {payment.ton} TON
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Rows */}
          <div className="rcpt-rows">
            <div className="rcpt-row">
              <span className="rcpt-row-k">Qabul qiluvchi</span>
              <span className="rcpt-row-v">Starsbot</span>
            </div>
            <div className="rcpt-row">
              <span className="rcpt-row-k">To'lov turi</span>
              <span className="rcpt-row-v">{cfg.payType}</span>
            </div>
            {typeKey === 'Tonkeeper' && payment.ton && (
              <div className="rcpt-row">
                <span className="rcpt-row-k">TON miqdori</span>
                <span className="rcpt-row-v" style={{ color: '#0098ea' }}>{payment.ton} TON</span>
              </div>
            )}
            <div className="rcpt-row">
              <span className="rcpt-row-k">Sana / Vaqt</span>
              <span className="rcpt-row-v">{dateStr} · {timeStr}</span>
            </div>
            <div className="rcpt-row">
              <span className="rcpt-row-k">Referans</span>
              <span className="rcpt-row-v" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{refCode}</span>
            </div>
            <div className="rcpt-row">
              <span className="rcpt-row-k">Holat</span>
              <span className="rcpt-badge" style={{ background: s.bg, color: s.color }}>
                <span
                  className={`rcpt-dot ${statusKey === 'pending' ? 'pulse' : ''}`}
                  style={{ background: s.dot }}
                />
                {s.label}
              </span>
            </div>
          </div>

          {/* Scissors divider */}
          <div className="rcpt-scissors">
            <div className="rcpt-dash" />
            <span className="rcpt-scissors-icon">✂</span>
            <div className="rcpt-dash" />
          </div>

          {/* Actions */}
          <div className="rcpt-actions">
            {isPending && hasLink && (
              <button
                className="rcpt-pay-btn"
                onClick={handlePay}
                style={{ background: cfg.btnBg, boxShadow: cfg.btnShadow }}
              >
                <div className="rcpt-btn-left">
                  <div className="rcpt-btn-icon">
                    <img
                      src={cfg.logo}
                      alt={typeKey}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <div className="rcpt-btn-title">{cfg.btnLabel}</div>
                    <div className="rcpt-btn-sub">{cfg.btnSub}</div>
                  </div>
                </div>
                <div className="rcpt-btn-arrow">→</div>
              </button>
            )}

            <button className="rcpt-close-btn" onClick={handleClose}>
              Yopish
            </button>
          </div>

          <div className="rcpt-footer">{cfg.footer}</div>
        </div>
      </div>
    </>
  );
}

/* ── STATUS MAP for cards ── */
const statusMap = {
  paid: {
    label: "To'landi",
    variant: 'success',
    icon: <CheckCircle2 className="w-4 h-4 text-success" />,
  },
  pending: {
    label: 'Jarayonda',
    variant: 'warning',
    icon: <Loader2 className="w-4 h-4 text-warning animate-spin" />,
  },
  failed: {
    label: 'Bekor qilingan',
    variant: 'destructive',
    icon: <XCircle className="w-4 h-4 text-destructive" />,
  },
  cancel: {
    label: 'Bekor qilingan',
    variant: 'destructive',
    icon: <XCircle className="w-4 h-4 text-destructive" />,
  },
  cancelled: {
    label: 'Bekor qilingan',
    variant: 'destructive',
    icon: <XCircle className="w-4 h-4 text-destructive" />,
  },
  default: {
    label: "Nomaʼlum",
    variant: 'secondary',
    icon: null,
  },
};

export function HistoryPage() {
  const { user } = useTelegram();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);

  /* ── FETCH ── */
  useEffect(() => {
    if (!user?.id) {
      setError('Foydalanuvchi ID topilmadi');
      setLoading(false);
      return;
    }
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://tezpremium.uz/MilliyDokon/main/payments.php?user_id=${user.id}`
        );
        if (!res.ok) throw new Error(`Server xatosi: ${res.status}`);
        const data = await res.json();
        if (data.ok !== true) throw new Error(data.description || data.message || 'API xatosi');
        setPayments(data.payments || []);
      } catch (e) {
        setError(e.message || "Ma'lumotlarni yuklab bo'lmadi");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [user?.id]);

  /* ── HELPERS ── */
  const getStatusConfig = (status) => {
    if (!status) return statusMap.default;
    const key = status.toLowerCase().trim();
    return statusMap[key] || statusMap.default;
  };

  const parseApiDate = (dateStr) => {
    try {
      if (!dateStr) return new Date();
      const cleaned = dateStr.replace(/📆|⏰/g, '').trim();
      const [datePart, timePart] = cleaned.split('|').map((s) => s.trim());
      if (datePart) {
        const [dd, mm, yyyy] = datePart.split('.');
        if (dd && mm && yyyy) {
          const time = timePart && timePart !== 'soat' ? timePart : '00:00';
          const parsed = new Date(`${yyyy}-${mm}-${dd}T${time}:00`);
          if (!isNaN(parsed.getTime())) return parsed;
        }
      }
      const fallback = new Date(dateStr);
      return isNaN(fallback.getTime()) ? new Date() : fallback;
    } catch {
      return new Date();
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === 'all') return true;
    const status = p.status?.toLowerCase?.().trim() || '';
    if (filter === 'cancel') return status === 'cancel' || status === 'cancelled';
    return status === filter;
  });

  /* ── LOADING / ERROR ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <EmptyState
          icon={<XCircle className="w-16 h-16 text-destructive" />}
          title="Xatolik"
          description={error}
        />
      </div>
    );
  }

  /* ── MAIN UI ── */
  return (
    <div className="min-h-screen bg-background">
      <TopBar title="To'lovlar tarixi" subtitle="Barcha tranzaksiyalar" />

      <div className="p-4 space-y-5">
        <ChipGroup>
          <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>Hammasi</Chip>
          <Chip selected={filter === 'paid'} onClick={() => setFilter('paid')}>To'landi</Chip>
          <Chip selected={filter === 'pending'} onClick={() => setFilter('pending')}>Jarayonda</Chip>
          <Chip selected={filter === 'failed'} onClick={() => setFilter('failed')}>Bekor qilingan</Chip>
        </ChipGroup>

        {filteredPayments.length ? (
          filteredPayments.map((tx) => {
            const statusCfg = getStatusConfig(tx.status);
            const dateObj = parseApiDate(tx.date);

            return (
              <Card
                key={tx.order_id}
                onClick={() => setSelectedPayment(tx)}
                className="cursor-pointer hover:shadow-md transition"
              >
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">To'lov turi: {tx.type || "To'lov"}</p>
                      <p className="text-xs text-muted-foreground">Raqami: #{tx.order_id}</p>
                    </div>
                    {statusCfg.icon}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{Number(tx.amount).toLocaleString('uz-UZ')} UZS</span>
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(dateObj, 'dd MMM yyyy • HH:mm')}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon={<History className="w-16 h-16" />}
            title="Maʼlumot yo'q"
            description={
              filter === 'all'
                ? "Hozircha tranzaksiya mavjud emas"
                : `Bu filtr bo'yicha (${statusMap[filter]?.label || filter}) tranzaksiya topilmadi`
            }
          />
        )}
      </div>

      {/* Receipt Modal — payment.jsx uslubida */}
      {selectedPayment && (
        <PaymentReceiptModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}

export default HistoryPage;