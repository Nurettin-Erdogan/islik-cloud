export const productCategories = [
  { value: "heating", label: "Kombi / Isıtma" },
  { value: "cooling", label: "Klima / Soğutma" },
  { value: "white_goods", label: "Beyaz eşya" },
  { value: "electronics", label: "Elektronik" },
  { value: "computer", label: "Bilgisayar" },
  { value: "phone", label: "Telefon" },
  { value: "other", label: "Diğer" }
];

export const statuses = [
  { value: "pending", label: "Talep alındı" },
  { value: "in_progress", label: "İncelemede" },
  { value: "completed", label: "Tamamlandı" },
  { value: "cancelled", label: "İptal edildi" }
];

export const priorities = [
  { value: "low", label: "Düşük" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Yüksek" },
  { value: "urgent", label: "Acil" }
];

export const paymentStatuses = [
  { value: "unpaid", label: "Ödenmedi" },
  { value: "partial", label: "Kısmi" },
  { value: "paid", label: "Ödendi" }
];

export const statusLabels = Object.fromEntries(statuses.map((item) => [item.value, item.label]));
export const priorityLabels = Object.fromEntries(priorities.map((item) => [item.value, item.label]));
export const paymentStatusLabels = Object.fromEntries(paymentStatuses.map((item) => [item.value, item.label]));
export const productCategoryLabels = Object.fromEntries(productCategories.map((item) => [item.value, item.label]));
