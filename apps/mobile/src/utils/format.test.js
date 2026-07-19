import { describe, expect, it, vi } from "vitest";
import {
  digitsOnly,
  formatPhone,
  isOpenJob,
  isOverdueJob,
  normalizeSearch,
  parseAppointment,
  stripDigits
} from "./format";

describe("mobil biçimlendirme yardımcıları", () => {
  it("telefon alanında yalnızca rakam bırakır ve numarayı okunur gösterir", () => {
    expect(digitsOnly("0 (555) abc 123-45-67")).toBe("05551234567");
    expect(formatPhone("05551234567")).toBe("0555 123 45 67");
  });

  it("ad alanındaki rakamları kaldırır", () => {
    expect(stripDigits("İzzet123 Erdoğan45")).toBe("İzzet Erdoğan");
  });

  it("Türkçe karakterleri aramada eşleşebilir hale getirir", () => {
    expect(normalizeSearch("İZZET IŞIK")).toBe("izzet isik");
    expect(normalizeSearch("ÇÖĞÜŞ")).toBe("cogus");
  });

  it("randevu metnini ISO tarihine çevirir ve geçersiz değeri reddeder", () => {
    expect(parseAppointment("2026-07-20 14:30")).toMatch(/^2026-07-20T/);
    expect(parseAppointment(" ")).toBeNull();
    expect(() => parseAppointment("yarın öğlen")).toThrow("Randevu formatı geçersiz");
  });

  it("yalnızca açık ve tarihi geçmiş işi gecikmiş sayar", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"));

    expect(isOpenJob({ status: "pending" })).toBe(true);
    expect(isOverdueJob({ status: "pending", appointmentAt: "2026-07-19T12:00:00.000Z" })).toBe(true);
    expect(isOverdueJob({ status: "completed", appointmentAt: "2026-07-19T12:00:00.000Z" })).toBe(false);
    expect(isOverdueJob({ status: "pending", appointmentAt: "2026-07-21T12:00:00.000Z" })).toBe(false);

    vi.useRealTimers();
  });
});
