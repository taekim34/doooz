/**
 * 24 representative timezones (one per UTC offset hour).
 * Includes Seoul (UTC+9) and Tokyo (UTC+9, shared).
 */
export const TIMEZONES = [
  { value: "Pacific/Midway", label: "UTC-11 · 미드웨이", labelJa: "UTC-11 · ミッドウェー", labelEn: "UTC-11 · Midway" },
  { value: "Pacific/Honolulu", label: "UTC-10 · 호놀룰루", labelJa: "UTC-10 · ホノルル", labelEn: "UTC-10 · Honolulu" },
  { value: "America/Anchorage", label: "UTC-9 · 앵커리지", labelJa: "UTC-9 · アンカレッジ", labelEn: "UTC-9 · Anchorage" },
  { value: "America/Los_Angeles", label: "UTC-8 · 로스앤젤레스", labelJa: "UTC-8 · ロサンゼルス", labelEn: "UTC-8 · Los Angeles" },
  { value: "America/Denver", label: "UTC-7 · 덴버", labelJa: "UTC-7 · デンバー", labelEn: "UTC-7 · Denver" },
  { value: "America/Chicago", label: "UTC-6 · 시카고", labelJa: "UTC-6 · シカゴ", labelEn: "UTC-6 · Chicago" },
  { value: "America/New_York", label: "UTC-5 · 뉴욕", labelJa: "UTC-5 · ニューヨーク", labelEn: "UTC-5 · New York" },
  { value: "America/Caracas", label: "UTC-4 · 카라카스", labelJa: "UTC-4 · カラカス", labelEn: "UTC-4 · Caracas" },
  { value: "America/Sao_Paulo", label: "UTC-3 · 상파울루", labelJa: "UTC-3 · サンパウロ", labelEn: "UTC-3 · São Paulo" },
  { value: "Atlantic/South_Georgia", label: "UTC-2 · 사우스조지아", labelJa: "UTC-2 · サウスジョージア", labelEn: "UTC-2 · South Georgia" },
  { value: "Atlantic/Azores", label: "UTC-1 · 아조레스", labelJa: "UTC-1 · アゾレス", labelEn: "UTC-1 · Azores" },
  { value: "Europe/London", label: "UTC+0 · 런던", labelJa: "UTC+0 · ロンドン", labelEn: "UTC+0 · London" },
  { value: "Europe/Paris", label: "UTC+1 · 파리", labelJa: "UTC+1 · パリ", labelEn: "UTC+1 · Paris" },
  { value: "Europe/Helsinki", label: "UTC+2 · 헬싱키", labelJa: "UTC+2 · ヘルシンキ", labelEn: "UTC+2 · Helsinki" },
  { value: "Europe/Moscow", label: "UTC+3 · 모스크바", labelJa: "UTC+3 · モスクワ", labelEn: "UTC+3 · Moscow" },
  { value: "Asia/Dubai", label: "UTC+4 · 두바이", labelJa: "UTC+4 · ドバイ", labelEn: "UTC+4 · Dubai" },
  { value: "Asia/Karachi", label: "UTC+5 · 카라치", labelJa: "UTC+5 · カラチ", labelEn: "UTC+5 · Karachi" },
  { value: "Asia/Dhaka", label: "UTC+6 · 다카", labelJa: "UTC+6 · ダッカ", labelEn: "UTC+6 · Dhaka" },
  { value: "Asia/Bangkok", label: "UTC+7 · 방콕", labelJa: "UTC+7 · バンコク", labelEn: "UTC+7 · Bangkok" },
  { value: "Asia/Singapore", label: "UTC+8 · 싱가포르", labelJa: "UTC+8 · シンガポール", labelEn: "UTC+8 · Singapore" },
  { value: "Asia/Seoul", label: "UTC+9 · 서울", labelJa: "UTC+9 · ソウル", labelEn: "UTC+9 · Seoul" },
  { value: "Australia/Sydney", label: "UTC+10 · 시드니", labelJa: "UTC+10 · シドニー", labelEn: "UTC+10 · Sydney" },
  { value: "Pacific/Noumea", label: "UTC+11 · 누메아", labelJa: "UTC+11 · ヌメア", labelEn: "UTC+11 · Nouméa" },
  { value: "Pacific/Auckland", label: "UTC+12 · 오클랜드", labelJa: "UTC+12 · オークランド", labelEn: "UTC+12 · Auckland" },
] as const;

export type TimezoneEntry = (typeof TIMEZONES)[number];
