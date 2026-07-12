export function formatCurrency(value) {
  return Number(value || 0).toLocaleString("tr-TR") + " TL";
}

export function formatPhone(value) {
  const digits = digitsOnly(value);

  if (digits.length === 11 && digits.startsWith("0")) {
    return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9)].join(" ");
  }

  if (digits.length === 10) {
    return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8)].join(" ");
  }

  if (digits.length === 12 && digits.startsWith("90")) {
    return "+90 " + [digits.slice(2, 5), digits.slice(5, 8), digits.slice(8, 10), digits.slice(10)].join(" ");
  }

  return String(value || "");
}

export function formatDateTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export function stripDigits(value) {
  return String(value || "").replace(/\d/g, "");
}

export function normalizeSearch(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

export function parseAppointment(value) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Randevu formatı geçersiz. Örnek: 2026-07-04 14:30");
  }

  return date.toISOString();
}

export function isSameLocalDay(value, compareDate = new Date()) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getFullYear() === compareDate.getFullYear() &&
    date.getMonth() === compareDate.getMonth() &&
    date.getDate() === compareDate.getDate()
  );
}

export function isOpenJob(job) {
  return job.status !== "completed" && job.status !== "cancelled";
}

export function isOverdueJob(job) {
  if (!job.appointmentAt || !isOpenJob(job)) {
    return false;
  }

  return new Date(job.appointmentAt) < new Date();
}
