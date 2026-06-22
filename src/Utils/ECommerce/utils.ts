import type { PowertranzBrowserInfoDto } from "@/Interfaces/Ecommerce/powertranzInterface";
import * as turf from "@turf/turf";

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const from = turf.point([lon1, lat1]);
  const to = turf.point([lon2, lat2]);
  return turf.distance(from, to, { units: "kilometers" });
}

export function obtenerBrowserInfo(): PowertranzBrowserInfoDto {
  return {
    Language: window?.navigator?.language ?? "es-NI",
    ScreenHeight: window?.screen?.height?.toString() ?? "",
    ScreenWidth: window?.screen?.width?.toString() ?? "",
    TimeZone: String(new Date().getTimezoneOffset() * -1),
    UserAgent: window?.navigator?.userAgent ?? "",
    Ip: null,
    JavaEnabled:
      typeof window !== "undefined" && typeof window.navigator?.javaEnabled === "function"
        ? window.navigator.javaEnabled()
        : false,
    JavascriptEnabled: true,
    ColorDepth: window?.screen?.colorDepth?.toString() ?? "",
    ChallengeWindowSize: 5,
    ChallengeIndicator: "01",
    AcceptHeader: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  };
}