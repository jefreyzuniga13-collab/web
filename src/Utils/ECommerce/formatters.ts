import { format, differenceInCalendarDays, isValid, isToday, isYesterday } from 'date-fns';
import { format as formatz, toZonedTime } from "date-fns-tz";

export function round2(n: number): number {
  return Math.round((Number(n ?? 0) + Number.EPSILON) * 100) / 100;
}

export  function safeStr(v: unknown): string {
  return String(v ?? "").trim();
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

export const formatCurrencyNIO = (value?: number | null) => {
  const n = Number(value ?? 0)
  // Separador invisible evita que traductores del navegador lo lean como CAD.
  const symbol = `C\u200B$`
  return `${symbol} ${n.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
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

// Formatear fechas
export const formatoNicaragua = (fecha: Date) => {
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1;
    const año = fecha.getFullYear();

    const diaFormateado = dia < 10 ? `0${dia}` : dia;
    const mesFormateado = mes < 10 ? `0${mes}` : mes;

    return `${año}/${mesFormateado}/${diaFormateado}`;
};

import type { PaymentMethod } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import { parseISO } from "date-fns";
import { CHANNEL, type ChannelType } from '@/Interfaces/Wh/MetaChannelId';
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';
import { contactService } from '@/Services/auth/ContactService';
import { es } from 'date-fns/locale/es';

export const formatTimeNI = (iso?: string) => {
  if (!iso) return "";
  const d = parseISO(iso);
  // Reutilizable logica de pago unico e multipago, 
  //deberia de reutilizarse pero lo hace todo el checkout page algo malo

  return new Intl.DateTimeFormat("es-NI", {
    timeZone: "America/Managua",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
};

export const normalizeDate = (value?: string | Date | null) => {
  if (!value) return null;

  if (value instanceof Date) {
    return format(value, "yyyy-MM-dd");
  }

  return String(value).slice(0, 10);
};

export const getManaguaToday = () => {
  const zone = "America/Managua";
  const today = toZonedTime(new Date(), zone);

  return formatz(today, "yyyy-MM-dd", { timeZone: zone });
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

export function ValidateNegativeVakue (value: number){
  return value > 0 ? 10 : 20
}

export function  cleanApiText(value: string){
  return (typeof value).trim()
}

export function containtFormaPago(string: string){
  const keyWord = ["3D0", "3D1", "3D4", "3D5", "3D6"];


  const contienePalabras = keyWord.some(palabra => palabra.includes(string));


  return contienePalabras;
}

export function getParam(value: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getLast4(value: string): string {
  const clean = value.trim();
  return clean.length >= 4 ? clean.slice(-4) : clean;
}


export function normalizePath(pathname: string) {
  if (!pathname) return "/";
  const normalized = pathname.replace(/\/+$/, "");
  return normalized === "" ? "/" : normalized;
}

export function methodLabel(m: PaymentMethod): string {
  if (m === "cash") return "Efectivo";
  if (m === "card") return "Tarjeta";
  return "Transferencia";
}

export const getLicenseMessage = (
  expiryDateString: string,
  customMessage?: string
) => {
  if (!expiryDateString) return ''

  const expiryDate = new Date(expiryDateString)
  const today = new Date()
  const daysLeft = differenceInCalendarDays(expiryDate, today)
  const expiryDateFormatted = format(expiryDate, 'dd/MM/yyyy')

  let statusText = ''

  if (daysLeft < 0) {
    statusText = 'Tu licencia ha expirado'
  } else if (daysLeft === 0) {
    statusText = 'Tu licencia vence hoy'
  } else if (daysLeft === 1) {
    statusText = 'Tu licencia vence mañana'
  } else {
    statusText = `Tu licencia vencerá en ${daysLeft} días`
  }

  if (customMessage?.trim()) {
    return customMessage
      .replace(/\{daysLeft\}/g, String(daysLeft))
      .replace(/\{expiryDate\}/g, expiryDateFormatted)
      .replace(/\{statusText\}/g, statusText)
  }

  if (daysLeft < 0) {
    return `Tu licencia ha expirado el ${expiryDateFormatted}. Para seguir disfrutando de todas las funcionalidades del servicio sin interrupciones, por favor gestiona tu renovación o ponte en contacto con nuestro equipo de soporte técnico.`
  }

  if (daysLeft === 0) {
    return 'Atención: Tu licencia de uso vence hoy. Para evitar la suspensión de tu cuenta y mantener el acceso a tus datos, te recomendamos realizar la renovación lo antes posible.'
  }

  if (daysLeft === 1) {
    return 'Urgente: Tu licencia vence mañana. Asegura la continuidad de tu servicio renovando tu suscripción hoy mismo.'
  }

  if (daysLeft > 1 && daysLeft <= 7) {
    return `Tu licencia SaaS vencerá en ${daysLeft} días, el ${expiryDateFormatted}. Te sugerimos planificar tu renovación con anticipación para evitar cortes en el servicio.`
  }

  return `Información de tu suscripción: Tu licencia actual está activa y vencerá el ${expiryDateFormatted}. No es necesario realizar ninguna acción por el momento.`
}

export const clampQty = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return 1
  if (n > 100) return 100
  return Math.floor(n)
}

// Evita errores en codProductos
export const cleanText = (value: string | number | null | undefined) => {
  return String(value ?? "").trim()
}

export const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message

  const payload = error as {
    message?: string
    response?: {
      data?: {
        message?: string
        data?: {
          header?: {
            msj?: string
          }
        }
      }
    }
  }

  return (
    payload.response?.data?.data?.header?.msj ||
    payload.response?.data?.message ||
    payload.message ||
    "No se pudo agregar el producto."
  )
}

export const formatDateInput = (value?: string | Date | null) => {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
};

export const formatNumber = (value?: number | null) => {
  return new Intl.NumberFormat("es-NI", {
    maximumFractionDigits: 0,
  }).format(value ?? 0);
};

export const formatMinutes = (value?: number | null) => {
  return `${new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value ?? 0)} min`;
};

export const formatDecimal = (value?: number | null) => {
  return new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value ?? 0);
};

// CHAT
const MANAGUA_OFFSET = "-06:00";

const hasTimezoneInfo = (value: string) => {
  return /([zZ]|[+-]\d{2}:?\d{2})$/.test(value)
}

export const parseApiDateNI = (value?: string | Date | null): Date | null => {
  if (!value) return null

  if (value instanceof Date) {
    return value
  }

  const raw = String(value).trim()

  if (!raw) return null

  // Si la API ya manda Z o -06:00, se respeta.
  if (hasTimezoneInfo(raw)) {
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? null : date
  }

  // Si viene sin zona, se asume hora local de Nicaragua.
  const normalized = raw.includes("T")
    ? `${raw}${MANAGUA_OFFSET}`
    : `${raw}T00:00:00${MANAGUA_OFFSET}`

  const date = new Date(normalized)

  return Number.isNaN(date.getTime()) ? null : date
}

export const getElapsedMsFromNI = (value?: string | Date | null): number => {
  const date = parseApiDateNI(value)

  if (!date) return 0

  const diff = Date.now() - date.getTime()

  return diff > 0 ? diff : 0
}

export const formatTime = (iso?: string) => {
  if (!iso) return "";
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "";
};

export const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export const getChannel = (channelId?: number | null): ChannelType | null => {
  if (channelId === CHANNEL.Whatsapp) return CHANNEL.Whatsapp
  if (channelId === CHANNEL.Messenger) return CHANNEL.Messenger
  if (channelId === CHANNEL.Instagram) return CHANNEL.Instagram

  return null
}

export const getConversationIdentifier = async (
  conversation: ConversationDto
): Promise<string> => {
  const res = await contactService.getById(conversation.clientContactId)

  if (res.data.metaChannelId === CHANNEL.Whatsapp) return res.data.waId ?? ""
  if (res.data.metaChannelId === CHANNEL.Messenger) return res.data.psid ?? ""
  if (res.data.metaChannelId === CHANNEL.Instagram) return res.data.psid ?? ""

  return ""
}

export const getConversationDateValue = (conversation: ConversationDto): string => {
  return (
    conversation.lastActivity ||
    conversation.clientLastMessageAt ||
    conversation.updatedAt ||
    conversation.createdAt ||
    ""
  )
}

export const parseConversationDate = (value?: string | null): Date | null => {
  if (!value) return null

  const parsed = parseISO(value)

  if (isValid(parsed)) return parsed

  const fallback = new Date(value)

  return isValid(fallback) ? fallback : null
}

export const getConversationGroupLabel = (date: Date): string => {
  if (isToday(date)) return "Hoy"
  if (isYesterday(date)) return "Ayer"

  return format(date, "EEEE d 'de' MMMM", { locale: es })
}

export const getConversationGroupKey = (date: Date): string => {
  return format(date, "yyyy-MM-dd")
}
