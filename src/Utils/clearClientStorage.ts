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
    // todas las cookies visibles para JavaScript
    if (document.cookie) {
      document.cookie.split(";").forEach(cookie => {
        // Separar el nombre (manejando el caso de cookies vacías o extrañas)
        const partes = cookie.split("=");
        const nombre = partes[0].trim();
        
        if (nombre) {
          // borrar la cookie en la ruta raíz y subrutas
          document.cookie = `${nombre}=; Max-Age=0; path=/;`;
          document.cookie = `${nombre}=; Max-Age=0; path=/crm;`;

          // borrar la cookie especificando el dominio exacto
          document.cookie = `${nombre}=; Max-Age=0; path=/; domain=crmdelipollo.com;`;
          document.cookie = `${nombre}=; Max-Age=0; path=/crm; domain=crmdelipollo.com;`;

          // borrar la cookie para todos los subdominios (si aplica)
          document.cookie = `${nombre}=; Max-Age=0; path=/; domain=.crmdelipollo.com;`;
          document.cookie = `${nombre}=; Max-Age=0; path=/crm; domain=.crmdelipollo.com;`;
        }
      });
    }
  }  catch {}


  //
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
  window.location.replace("/crm/login");
};