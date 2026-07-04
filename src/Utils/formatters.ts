/* eslint-disable @typescript-eslint/no-explicit-any */
export type QuickOptionsInput = unknown;

/**
 * Intenta extraer un array de strings desde diferentes formatos:
 * - array de strings
 * - string JSON (["a","b"])
 * - string separada por '|'
 * - objetos tipo { value: '...' } o { value: [...] }
 */
export const parseQuickOptions = (selectedParam: QuickOptionsInput): string[] => {
  const p = selectedParam as any;

  const split = (s: string) =>
    String(s)
      .split("|")
      .map(x => x.trim())
      .filter(Boolean);

  if (Array.isArray(p)) {
    return p.filter((v: any) => typeof v === "string");
  }

  if (typeof p === "string") {
    try {
      const j = JSON.parse(p);
      if (Array.isArray(j)) return j.filter((v: any) => typeof v === "string");
    } catch {
      return split(p);
    }
  }

  if (typeof p?.value === "string") {
    try {
      const j = JSON.parse(p.value);
      if (Array.isArray(j)) return j.filter((v: any) => typeof v === "string");
    } catch {
      return split(p.value);
    }
  }

  if (Array.isArray(p?.value)) {
    return p.value.filter((v: any) => typeof v === "string");
  }

  return [];
};

/**
 * Formatea un teléfono de Nicaragua:
 * - Normaliza a dígitos
 * - Quita prefijo 505 si viene
 * - Muestra "505 - XXXXXXXX" o '---' si no hay valor.
 */
export const formatNiPhone = (value?: string | number | null): string => {
  if (value == null) return "---";

  const digits = String(value).replace(/\D/g, "");
  let local = digits.startsWith("505") ? digits.slice(3) : digits;

  if (!local) return "---";
  if (local.length > 8) local = local.slice(-8);

  return `505 - ${local}`;
};

/**
 * Devuelve '---' cuando el valor es null/undefined/cadena vacía.
 */
export const displayOrDash = (
  v?: string | number | null
): string => {
  return v === null || v === undefined || v === "" ? "---" : String(v);
};

/**
 * Formatea fechas a 'dd/MM/yyyy HH:mm' usando locale es-NI.
 * Si no es una fecha válida, devuelve displayOrDash(v).
 */
export const formatDate = (
  v?: string | number | Date | null
): string => {
  if (!v) return "---";

  const d = new Date(v);
  if (isNaN(d.getTime())) return displayOrDash(v as any);

  return new Intl.DateTimeFormat("es-NI", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};


export const formatearHoraNicaragua = (isoString: string, hour12: boolean = true): string => {

  const coincidencia = isoString.match(/T(\d{2}):(\d{2}):(\d{2})/);
  
  if (!coincidencia) {
    throw new Error("El formato de fecha no contiene una hora válida (HH:MM:SS)");
  }

  // Desestructuramos el resultado del regex
  const [, horaStr, minutos, segundos] = coincidencia;
  let hora = parseInt(horaStr, 10);

  if (hour12) {
    const ampm = hora >= 12 ? 'p. m.' : 'a. m.';
    hora = hora % 12;
    hora = hora ? hora : 12;
    return `${hora}:${minutos}:${segundos} ${ampm}`;
  }

  return `${horaStr}:${minutos}:${segundos}`;
};


// Para onbtener la horqa nicaragua
export const getNicaraguaIsoDate = () => {
  const now = new Date()
  const offsetMs = 6 * 60 * 60 * 1000
  const nicaraguaDate = new Date(now.getTime() - offsetMs)

  return nicaraguaDate.toISOString().replace("Z", "")
}