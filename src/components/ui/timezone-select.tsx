import { TIMEZONES, type TimezoneEntry } from "@/lib/timezones";

const labelKey: Record<string, keyof TimezoneEntry> = {
  ko: "label",
  ja: "labelJa",
  en: "labelEn",
};

export function TimezoneSelect({
  name,
  defaultValue = "Asia/Seoul",
  locale = "ko",
}: {
  name: string;
  defaultValue?: string;
  locale?: string;
}) {
  const key = labelKey[locale] ?? "label";
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      {TIMEZONES.map((tz) => (
        <option key={tz.value} value={tz.value}>
          {tz[key]}
        </option>
      ))}
    </select>
  );
}
