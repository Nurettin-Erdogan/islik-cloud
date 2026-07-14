const productLabels = {
  heating: "Kombi / Isıtma",
  cooling: "Klima / Soğutma",
  white_goods: "Beyaz eşya",
  electronics: "Elektronik",
  computer: "Bilgisayar",
  phone: "Telefon",
  other: "Diğer"
};
const statusLabels = {
  pending: "Talep alındı",
  in_progress: "İncelemede",
  completed: "Tamamlandı",
  cancelled: "İptal edildi"
};
const priorityLabels = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
  urgent: "Acil"
};
const paymentLabels = {
  unpaid: "Ödenmedi",
  partial: "Kısmi ödendi",
  paid: "Ödendi"
};

function protectSpreadsheetValue(value) {
  const text = String(value ?? "");
  return /^[=+\-@\t\r\n]/.test(text) ? "'" + text : text;
}

function csvCell(value) {
  const protectedValue = protectSpreadsheetValue(value).replace(/"/g, '""');
  return '"' + protectedValue + '"';
}

function csvRow(values) {
  return values.map(csvCell).join(",");
}

function safeDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("tr-TR");
}

export function buildServiceCsv(customers, jobs) {
  const rows = [
    csvRow([
      "Kayıt Türü",
      "Takip Kodu",
      "Müşteri",
      "Telefon",
      "Adres",
      "Talep",
      "Ürün",
      "Durum",
      "Öncelik",
      "Ödeme Durumu",
      "Randevu",
      "Toplam",
      "Ödenen",
      "Kalan",
      "Not"
    ])
  ];

  for (const customer of customers || []) {
    rows.push(
      csvRow([
        "Müşteri",
        "",
        customer.name,
        customer.phone,
        customer.address,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        customer.note
      ])
    );
  }

  for (const job of jobs || []) {
    const total = Number(job.price || 0);
    const paid = Number(job.paidAmount || 0);
    const product = [productLabels[job.productCategory] || job.productCategory, job.productBrand, job.productModel]
      .filter(Boolean)
      .join(" - ");

    rows.push(
      csvRow([
        "Talep",
        job.requestCode,
        job.customer?.name,
        job.customer?.phone,
        job.customer?.address,
        job.title,
        product,
        statusLabels[job.status] || job.status,
        priorityLabels[job.priority] || job.priority,
        paymentLabels[job.paymentStatus] || job.paymentStatus,
        safeDate(job.appointmentAt),
        total.toFixed(2),
        paid.toFixed(2),
        Math.max(total - paid, 0).toFixed(2),
        job.description
      ])
    );
  }

  return rows.join("\n");
}
