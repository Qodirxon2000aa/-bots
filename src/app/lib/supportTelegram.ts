/** Yordam va «Biz bilan ulanish» — bir xil kontakt */
export const SUPPORT_TELEGRAM_URL = 'https://t.me/moliyachi_menejer';

export function openSupportTelegram() {
  const tg = window.Telegram?.WebApp;
  try {
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(SUPPORT_TELEGRAM_URL);
    } else if (tg?.openLink) {
      tg.openLink(SUPPORT_TELEGRAM_URL, { try_instant_view: false });
    } else {
      window.open(SUPPORT_TELEGRAM_URL, '_blank', 'noopener,noreferrer');
    }
  } catch {
    window.open(SUPPORT_TELEGRAM_URL, '_blank', 'noopener,noreferrer');
  }
}
