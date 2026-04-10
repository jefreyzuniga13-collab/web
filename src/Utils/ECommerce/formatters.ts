export function round2(n: number): number {
  return Math.round((Number(n ?? 0) + Number.EPSILON) * 100) / 100;
}

export  function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

export const normalizeNumber = (v: unknown, fallback = 0) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return n
}


export function toNumberNoLeadingZeros(raw: string): number {
  const s = String(raw ?? "").trim();
  if (!s) return 0;

  if (s.length > 1 && s.startsWith("0") && s[1] !== ".") {
    return 0;
  }

  const cleaned = s.replace(/[^\d.]/g, "");
  const num = Number(cleaned);

  return Number.isFinite(num) ? num : 0;
}


export function money(value: unknown): string {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export function randomPhoneNumber(): string {
    const first = Math.floor(Math.random() * 9) + 1;

    let rest = "";
    for (let i = 0; i < 7; i++) {
      rest += Math.floor(Math.random() * 10);
    }

    return `${first}${rest}`;
  }

export   const formatCurrencyNIO = (value?: number | null) => {
    const n = Number(value ?? 0)
    return `C$ ${n.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }


  export const generateRandomString = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numberChars = "0123456789"
  let result = ""
  let hasUppercase = false
  let hasNumber = false

  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    const char = characters[randomIndex]
    result += char
    if (uppercaseChars.includes(char)) hasUppercase = true
    if (numberChars.includes(char)) hasNumber = true
  }

  if (!hasUppercase) {
    result =
      result.substring(0, Math.floor(Math.random() * 6)) +
      uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)] +
      result.substring(Math.floor(Math.random() * 6) + 1)
  }
  if (!hasNumber) {
    result =
      result.substring(0, Math.floor(Math.random() * 6)) +
      numberChars[Math.floor(Math.random() * numberChars.length)] +
      result.substring(Math.floor(Math.random() * 6) + 1)
  }

  return result
}


export const formatoNicaragua = (fecha: Date) => {
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1;
    const año = fecha.getFullYear();

    const diaFormateado = dia < 10 ? `0${dia}` : dia;
    const mesFormateado = mes < 10 ? `0${mes}` : mes;

    return `${año}/${mesFormateado}/${diaFormateado}`;
};


import { parseISO } from "date-fns";

export const formatTimeNI = (iso?: string) => {
  if (!iso) return "";
  const d = parseISO(iso);
  return new Intl.DateTimeFormat("es-NI", {
    timeZone: "America/Managua",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
};

export const formatDateTimeNI = (iso?: string) => {
  if (!iso) return "";
  const d = parseISO(iso);
  return new Intl.DateTimeFormat("es-NI", {
    timeZone: "America/Managua",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
};

export function getParam(value: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getLast4(value: string): string {
  const clean = value.trim();
  return clean.length >= 4 ? clean.slice(-4) : clean;
}