/* eslint-disable no-empty */
import { persistor } from "@/Context";
import { queryClient } from "@/Utils/Https/reactQuery";
// import api from "@/Utils/ApiConfig";

export const limpiarAlmacenamientoCliente = async () => {
  // try {
  //   await api.post("/Auth/logout");
  // } catch {}

  try {
    queryClient.clear();
  } catch {}

  try {
    persistor.pause();
    await persistor.purge();
    await persistor.flush();
  } catch {}

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}

  try {
    document.cookie.split(";").forEach(cookie => {
      const nombre = cookie.split("=")[0].trim();

      document.cookie = `${nombre}=; Max-Age=0; path=/;`;
      document.cookie = `${nombre}=; Max-Age=0; path=/crm;`;
      document.cookie = `${nombre}=; Max-Age=0; path=/; domain=orbitrachat.com;`;
      document.cookie = `${nombre}=; Max-Age=0; path=/crm; domain=orbitrachat.com;`;
      document.cookie = `${nombre}=; Max-Age=0; path=/; domain=.orbitrachat.com;`;
      document.cookie = `${nombre}=; Max-Age=0; path=/crm; domain=.orbitrachat.com;`;
    });
  } catch {}

  try {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  } catch {}

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
  } catch {}

  // Recargar y navegar a la pagina de inicio
  // window.location.replace("/login");
};