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