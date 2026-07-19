import { describe, expect, it } from "vitest";
import { buildServiceCsv } from "./exportData";

describe("mobil CSV dışa aktarma", () => {
  it("kısmi ödemede kalan tutarı doğru hesaplar", () => {
    const csv = buildServiceCsv([], [{
      requestCode: "SRV-200",
      title: "Klima bakımı",
      price: 1800,
      paidAmount: 750,
      paymentStatus: "partial",
      status: "pending",
      priority: "high",
      productCategory: "cooling",
      customer: { name: "Ayşe Yılmaz" }
    }]);

    expect(csv).toContain('"1800.00","750.00","1050.00"');
    expect(csv).toContain('"Kısmi ödendi"');
  });

  it("ödenen toplamı aşsa bile kalan tutarı eksi yazmaz", () => {
    const csv = buildServiceCsv([], [{ price: 500, paidAmount: 700, customer: {} }]);
    expect(csv).toContain('"500.00","700.00","0.00"');
  });

  it("hücre başındaki formül karakterlerini etkisizleştirir", () => {
    const csv = buildServiceCsv([{ name: "=1+1", phone: "", address: "", note: "@test" }], []);
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"\'@test"');
  });
});
