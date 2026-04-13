/**
 * 24 representative timezones (one per UTC offset hour).
 * Includes Seoul (UTC+9) and Tokyo (UTC+9, shared).
 */
export const TIMEZONES = [
  { value: "Pacific/Midway", label: "UTC-11 · 미드웨이", labelJa: "UTC-11 · ミッドウェー" },
  { value: "Pacific/Honolulu", label: "UTC-10 · 호놀룰루", labelJa: "UTC-10 · ホノルル" },
  { value: "America/Anchorage", label: "UTC-9 · 앵커리지", labelJa: "UTC-9 · アンカレッジ" },
  { value: "America/Los_Angeles", label: "UTC-8 · 로스앤젤레스", labelJa: "UTC-8 · ロサンゼルス" },
  { value: "America/Denver", label: "UTC-7 · 덴버", labelJa: "UTC-7 · デンバー" },
  { value: "America/Chicago", label: "UTC-6 · 시카고", labelJa: "UTC-6 · シカゴ" },
  { value: "America/New_York", label: "UTC-5 · 뉴욕", labelJa: "UTC-5 · ニューヨーク" },
  { value: "America/Caracas", label: "UTC-4 · 카라카스", labelJa: "UTC-4 · カラカス" },
  { value: "America/Sao_Paulo", label: "UTC-3 · 상파울루", labelJa: "UTC-3 · サンパウロ" },
  { value: "Atlantic/South_Georgia", label: "UTC-2 · 사우스조지아", labelJa: "UTC-2 · サウスジョージア" },
  { value: "Atlantic/Azores", label: "UTC-1 · 아조레스", labelJa: "UTC-1 · アゾレス" },
  { value: "Europe/London", label: "UTC+0 · 런던", labelJa: "UTC+0 · ロンドン" },
  { value: "Europe/Paris", label: "UTC+1 · 파리", labelJa: "UTC+1 · パリ" },
  { value: "Europe/Helsinki", label: "UTC+2 · 헬싱키", labelJa: "UTC+2 · ヘルシンキ" },
  { value: "Europe/Moscow", label: "UTC+3 · 모스크바", labelJa: "UTC+3 · モスクワ" },
  { value: "Asia/Dubai", label: "UTC+4 · 두바이", labelJa: "UTC+4 · ドバイ" },
  { value: "Asia/Karachi", label: "UTC+5 · 카라치", labelJa: "UTC+5 · カラチ" },
  { value: "Asia/Dhaka", label: "UTC+6 · 다카", labelJa: "UTC+6 · ダッカ" },
  { value: "Asia/Bangkok", label: "UTC+7 · 방콕", labelJa: "UTC+7 · バンコク" },
  { value: "Asia/Singapore", label: "UTC+8 · 싱가포르", labelJa: "UTC+8 · シンガポール" },
  { value: "Asia/Seoul", label: "UTC+9 · 서울", labelJa: "UTC+9 · ソウル" },
  { value: "Australia/Sydney", label: "UTC+10 · 시드니", labelJa: "UTC+10 · シドニー" },
  { value: "Pacific/Noumea", label: "UTC+11 · 누메아", labelJa: "UTC+11 · ヌメア" },
  { value: "Pacific/Auckland", label: "UTC+12 · 오클랜드", labelJa: "UTC+12 · オークランド" },
] as const;
