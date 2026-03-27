export function round2(n: number): number {
  return Math.round((Number(n ?? 0) + Number.EPSILON) * 100) / 100;
}

export  function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

export function n(v: unknown): number {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
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