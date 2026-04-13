import { afterEach, describe, expect, it } from "vitest";
import { familyToday, formatDateInFamilyTz, toFamilyDate } from "./family-tz";
import { resetClock, setClock } from "./clock";

/**
 * v2 #6 regression: a chore with due_date = 2026-04-11 is still "today" in
 * Asia/Seoul right up until KST midnight, not UTC midnight or LA midnight.
 */
describe("family-tz local day boundaries", () => {
  afterEach(() => resetClock());

  it("KST 2026-04-11 23:30 is still 2026-04-11 local", () => {
    // 2026-04-11T14:30Z == 2026-04-11T23:30 KST == 2026-04-11T07:30 LA
    const instant = Date.UTC(2026, 3, 11, 14, 30);
    setClock({ now: () => instant });
    expect(familyToday("Asia/Seoul")).toBe("2026-04-11");
    expect(familyToday("America/Los_Angeles")).toBe("2026-04-11");
  });

  it("KST 2026-04-12 00:30 is 2026-04-12 local while LA is still 2026-04-11", () => {
    // 2026-04-11T15:30Z == 2026-04-12T00:30 KST == 2026-04-11T08:30 LA
    const instant = Date.UTC(2026, 3, 11, 15, 30);
    setClock({ now: () => instant });
    expect(familyToday("Asia/Seoul")).toBe("2026-04-12");
    expect(familyToday("America/Los_Angeles")).toBe("2026-04-11");
  });

  it("toFamilyDate round-trips a UTC instant to the family-local day", () => {
    const noonUtc = new Date(Date.UTC(2026, 3, 11, 12, 0));
    expect(toFamilyDate(noonUtc, "Asia/Seoul")).toBe("2026-04-11");
    expect(toFamilyDate(noonUtc, "America/Los_Angeles")).toBe("2026-04-11");
  });

  it("formatDateInFamilyTz uses the provided pattern and zone", () => {
    const instant = new Date(Date.UTC(2026, 3, 11, 14, 30));
    expect(formatDateInFamilyTz(instant, "Asia/Seoul", "yyyy-MM-dd HH:mm")).toBe(
      "2026-04-11 23:30",
    );
    expect(
      formatDateInFamilyTz(instant, "America/Los_Angeles", "yyyy-MM-dd HH:mm"),
    ).toBe("2026-04-11 07:30");
  });
});
