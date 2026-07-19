import { describe, expect, it } from "vitest";
import { buildServiceCsv } from "./exportData";

describe("buildServiceCsv", () => {
  it("ödenen ve kalan tutarı ayrı sütunlarda dışa aktarır", () => {
    const csv = buildServiceCsv([], [{
      requestCode: "SRV-100",
      title: "Kombi bakımı",
      price: 2500,
      paidAmount: 900,
      paymentStatus: "partial",
      status: "in_progress",
      priority: "normal",
      productCategory: "heating",
      customer: { name: "İzzet Erdoğan", phone: "05551234567", address: "Ankara" }
    }]);

    expect(csv).toContain('"2500.00","900.00","1600.00"');
    expect(csv).toContain('"Kısmi ödendi"');
    expect(csv.startsWith("\ufeff")).toBe(true);
  });

  it("hesap tablosu formüllerini çalıştırılmayacak biçimde kaçışlar", () => {
    const csv = buildServiceCsv([{
      name: "=HYPERLINK(\"https://example.com\")",
      phone: "+123",
      address: "@komut",
      note: "-10"
    }], []);

    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
    expect(csv).toContain('"\'+123"');
    expect(csv).toContain('"\'@komut"');
    expect(csv).toContain('"\'-10"');
  });
});
