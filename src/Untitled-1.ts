// // // // // // import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
// // // // // // import {
// // // // // //   createHubConnection,
// // // // // //   joinConversation,
// // // // // //   leaveConversation,
// // // // // //   onNewMessage,
// // // // // //   offNewMessage,
// // // // // //   onNewHumanRequest,
// // // // // //   offNewHumanRequest,
// // // // // //   onConversationCreated,
// // // // // //   offConversationCreated,
// // // // // //   onConversationUpdated,
// // // // // //   offConversationUpdated,
// // // // // //   onMessageStatusChanged,
// // // // // //   offMessageStatusChanged,
// // // // // //   onNewNotification,
// // // // // //   offNewNotification
// // // // // // } from '@/Services/signalr'
// // // // // // import type {
// // // // // //   MessageDto,
// // // // // //   AttachmentDto,
// // // // // //   ConversationDto,
// // // // // //   NotificationDto
// // // // // // } from '@/Interfaces/Chat/ChatInterfaces'

// // // // // // interface SignalRContextValue {
// // // // // //   joinConversation(id: number): void
// // // // // //   leaveConversation(id: number): void
// // // // // //   onNewMessage(handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void): void
// // // // // //   offNewMessage(handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void): void
// // // // // //   onNewHumanRequest(handler: (payload: { conversationId: number; fromPhone: string }) => void): void
// // // // // //   offNewHumanRequest(handler: (payload: { conversationId: number; fromPhone: string }) => void): void
// // // // // //   onConversationCreated(handler: (convo: ConversationDto) => void): void
// // // // // //   offConversationCreated(handler: (convo: ConversationDto) => void): void
// // // // // //   onConversationUpdated(handler: (convo: ConversationDto) => void): void
// // // // // //   offConversationUpdated(handler: (convo: ConversationDto) => void): void
// // // // // //   onMessageStatusChanged(handler: (msg: MessageDto) => void): void
// // // // // //   offMessageStatusChanged(handler: (msg: MessageDto) => void): void
// // // // // //   onNewNotification(handler: (notification: NotificationDto) => void): void
// // // // // //   offNewNotification(handler: (notification: NotificationDto) => void): void
// // // // // // }

// // // // // // const SignalRContext = createContext<SignalRContextValue>({
// // // // // //   joinConversation: () => {},
// // // // // //   leaveConversation: () => {},
// // // // // //   onNewMessage: () => {},
// // // // // //   offNewMessage: () => {},
// // // // // //   onNewHumanRequest: () => {},
// // // // // //   offNewHumanRequest: () => {},
// // // // // //   onConversationCreated: () => {},
// // // // // //   offConversationCreated: () => {},
// // // // // //   onConversationUpdated: () => {},
// // // // // //   offConversationUpdated: () => {},
// // // // // //   onMessageStatusChanged: () => {},
// // // // // //   offMessageStatusChanged: () => {},
// // // // // //   onNewNotification: () => {},
// // // // // //   offNewNotification: () => {}
// // // // // // })

// // // // // // //tokenno deberia de usar esto por que ahora se trabaja con las cookies
// // // // // // export const SignalRProvider: React.FC<{ token: string; children: ReactNode }> = ({ token, children }) => {
// // // // // //   const [ready, setReady] = useState(false)

// // // // // //   useEffect(() => {
// // // // // //     createHubConnection(token)
// // // // // //       .then(() => setReady(true))
// // // // // //       .catch(() => setReady(true))
// // // // // //   }, [token])

// // // // // //   if (!ready) return null

// // // // // //   return (
// // // // // //     <SignalRContext.Provider
// // // // // //       value={{
// // // // // //         joinConversation,
// // // // // //         leaveConversation,
// // // // // //         onNewMessage,
// // // // // //         offNewMessage,
// // // // // //         onNewHumanRequest,
// // // // // //         offNewHumanRequest,
// // // // // //         onConversationCreated,
// // // // // //         offConversationCreated,
// // // // // //         onConversationUpdated,
// // // // // //         offConversationUpdated,
// // // // // //         onMessageStatusChanged,
// // // // // //         offMessageStatusChanged,
// // // // // //         onNewNotification,
// // // // // //         offNewNotification
// // // // // //       }}
// // // // // //     >
// // // // // //       {children}
// // // // // //     </SignalRContext.Provider>
// // // // // //   )
// // // // // // }

// // // // // // export function useSignalR(): SignalRContextValue {
// // // // // //   return useContext(SignalRContext)
// // // // // // }

// // // // // // /* eslint-disable react-hooks/exhaustive-deps */
// // // // // // import { useEffect } from "react";
// // // // // // import { ToastContainer } from "react-toastify";
// // // // // // import { useNavigate } from "react-router-dom";
// // // // // // import { AppRouter } from "@/Routers/AppRouter";
// // // // // // import ReLoginModal from "@/Components/Common/ReLoginModal";
// // // // // // import OfflineBanner from "@/Components/Common/OfflineBanner";
// // // // // // import { useOnline } from "@/Hooks/Auth/useOnline";
// // // // // // import { SignalRProvider } from "@/Context/SignalRContext";
// // // // // // import { useNotificationsHub } from "@/Hooks/Hub/useNotificationsHub";
// // // // // // import { useDispatch } from "react-redux";
// // // // // // import { enqueuePopup } from "@/Context/Slices/Chat/popupSlice";
// // // // // // import { ThemeProvider } from "@mui/material/styles";
// // // // // // import { theme } from "@/Utils/materialTheme";
// // // // // // import "@/App.css";
// // // // // // import "react-toastify/dist/ReactToastify.css";
// // // // // // import type { AuthData } from "@/Interfaces/Auth/AuthInterface";

// // // // // // function isExternalUrl(url: string): boolean {
// // // // // //   return /^https?:\/\//i.test(url);
// // // // // // }

// // // // // // function sanitizeExternalUrl(url: string): string {
// // // // // //   // Si ya viene con http(s)://, la devolvemos igual; si no, le anteponemos https://
// // // // // //   if (isExternalUrl(url)) return url;
// // // // // //   return `https://${String(url).replace(/^\/+/, "")}`;
// // // // // // }

// // // // // // export default function App() {
// // // // // //   const online = useOnline();

// // // // // //   const authRaw = localStorage.getItem("auth") ?? "{}";
// // // // // //   const { accessToken } = JSON.parse(authRaw) as AuthData;
// // // // // //   const dispatch = useDispatch();
// // // // // //   const lastEvent = useNotificationsHub();
// // // // // //   const navigate = useNavigate();

// // // // // //   // Registro del SW (una sola vez)
// // // // // //   useEffect(() => {
// // // // // //     if ("serviceWorker" in navigator) {
// // // // // //       navigator.serviceWorker.register("/sw.js").catch(console.error);
// // // // // //     }
// // // // // //   }, []);

// // // // // //   // Pedir permiso de notificaciones (una sola vez idealmente)
// // // // // //   useEffect(() => {
// // // // // //     if (!("Notification" in window)) return;
// // // // // //     if (Notification.permission === "default") {
// // // // // //       Notification.requestPermission().catch(() => {});
// // // // // //     }
// // // // // //   }, []);

// // // // // //   // Vigilar token (logout si desaparece)
// // // // // //   useEffect(() => {
// // // // // //     if (!accessToken) return;

// // // // // //     const handleStorage = (e: StorageEvent) => {
// // // // // //       if (e.key === "auth") {
// // // // // //         const token = JSON.parse(e.newValue || "{}").accessToken;
// // // // // //         if (!token) navigate("/login", { replace: true });
// // // // // //       }
// // // // // //     };

// // // // // //      const checkToken = () => {
// // // // // //       const token = JSON.parse(localStorage.getItem("auth") || "{}").accessToken;
// // // // // //       if (!token) navigate("/login", { replace: true });
// // // // // //     };

// // // // // //     window.addEventListener("storage", handleStorage);
// // // // // //     const interval = setInterval(checkToken, 3000);

// // // // // //     return () => {
// // // // // //       window.removeEventListener("storage", handleStorage);
// // // // // //       clearInterval(interval);
// // // // // //     };
// // // // // //   }, [accessToken, navigate]);

// // // // // //   function shouldShowDesktopNotification() {
// // // // // //     return document.visibilityState === "hidden" || !document.hasFocus();
// // // // // //   } 

// // // // // //   // Escucha y muestra notificaciones emitidas internamente
// // // // // //   useEffect(() => {
// // // // // //     const onDesktopNotify = (e: Event) => {

// // // // // //       // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // // // // //       const evt = (e as CustomEvent).detail as any;
// // // // // //       if (shouldShowDesktopNotification()) {
// // // // // //         showDesktopNotification(evt).catch(() => {});
// // // // // //       }
// // // // // //     };

// // // // // //     window.addEventListener("DesktopNotify", onDesktopNotify);
// // // // // //     return () => window.removeEventListener("DesktopNotify", onDesktopNotify);
// // // // // //   }, []);

// // // // // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
// // // // // //   function mapNotificationPayload(evt: any) {

// // // // // //     const title = evt?.title ?? "Nueva notificación";
// // // // // //     const body =
// // // // // //       evt?.body ??
// // // // // //       (evt?.content && String(evt.content).trim()) ??
// // // // // //       "Tienes una nueva notificación";

// // // // // //     // Prioriza url del evento; si no, fallback EXTERNO (sanitizado)
// // // // // //     const rawUrl =
// // // // // //       evt?.url ??
// // // // // //       "https://staging.dsujq9sb48iiw.amplifyapp.com/chat/"; // tu staging
    
// // // // // //     const url = sanitizeExternalUrl(String(rawUrl));

// // // // // //     return { title, body, url };
// // // // // //   }


// // // // // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // // // // //   async function showDesktopNotification(evt: any) {
// // // // // //     if (!("Notification" in window)) return;
// // // // // //     if (Notification.permission !== "granted") return;

// // // // // //     const { title, body, url } = mapNotificationPayload(evt);

// // // // // //     const reg = await navigator.serviceWorker.getRegistration();

// // // // // //         await reg?.showNotification(title, {
// // // // // //           body,
// // // // // //           icon: "/logopcg.png",
// // // // // //           badge: "/logopcg.png",
// // // // // //           requireInteraction: true,
// // // // // //           tag: "latest-message",
// // // // // //           renotify: true,
// // // // // //           data: { url },
// // // // // //         } as NotificationOptions & { renotify: boolean });
// // // // // //   }


// // // // // //   // Mensajes desde el SW (fallback si el SW decide postMessage en vez de abrir él mismo)
// // // // // //   useEffect(() => {
// // // // // //     if (!("serviceWorker" in navigator)) return;
// // // // // //     const handler = (e: MessageEvent) => {
// // // // // //       if (e.data?.type === "NAVIGATE" && e.data?.url) {
// // // // // //         const url = String(e.data.url);
// // // // // //         if (isExternalUrl(url)) {
// // // // // //           //  abrir externas con window.open
// // // // // //           window.open(sanitizeExternalUrl(url), "_blank", "noopener,noreferrer");
// // // // // //         } else {
// // // // // //           navigate(url);
// // // // // //         }
// // // // // //       }
// // // // // //     };
// // // // // //     navigator.serviceWorker.addEventListener("message", handler);
// // // // // //     return () => navigator.serviceWorker.removeEventListener("message", handler);
// // // // // //   }, [navigate]);

// // // // // //   useEffect(() => {
// // // // // //     if (!lastEvent) return;

// // // // // //     dispatch(enqueuePopup(lastEvent));

// // // // // //     if (shouldShowDesktopNotification()) {
// // // // // //       showDesktopNotification(lastEvent).catch(() => {});
// // // // // //     }
// // // // // //   }, [lastEvent, dispatch]);

// // // // // //   // Sonido
// // // // // //   useEffect(() => {
// // // // // //     if (!lastEvent) return;
// // // // // //     try {
// // // // // //       const audio = new Audio("/notification.mp3");
// // // // // //       audio.play().catch(() => {});
// // // // // //     // eslint-disable-next-line no-empty
// // // // // //     } catch {}
// // // // // //   }, [lastEvent]);

// // // // // //   return (
// // // // // //      <ThemeProvider theme={theme}>
// // // // // //       <ToastContainer
// // // // // //         position="top-right"
// // // // // //         autoClose={500}
// // // // // //         hideProgressBar={false}
// // // // // //         newestOnTop={false}
// // // // // //         closeOnClick
// // // // // //         pauseOnHover
// // // // // //         draggable
// // // // // //         theme="colored"
// // // // // //       />

// // // // // //       {accessToken ? (
// // // // // //         // No se pasa el accessToken, por que ahora es con cookies
// // // // // //         <SignalRProvider token={accessToken}>
// // // // // //           {!online && <OfflineBanner onRetry={() => window.location.reload()} />}
// // // // // //           <ReLoginModal />
// // // // // //           <AppRouter />
// // // // // //         </SignalRProvider>
// // // // // //       ) : (
// // // // // //         // Rutas públicas (login, cart, checkout, etc.)
// // // // // //         <AppRouter />
// // // // // //       )}
// // // // // //     </ThemeProvider>
// // // // // //   );
// // // // // // }


// // // // // //aquo ya no uso token por medio dl localstorage ahor aso redux y cookies.

// // // // // import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
// // // // // import { authService } from '@/Services/auth/AuthService';
// // // // // import type { AuthData, AuthMe } from '@/Interfaces/Auth/AuthInterface';
// // // // // import type { RootState } from '@/Context/index';

// // // // // interface AuthState {
// // // // //   isAuthenticated: boolean;
// // // // //   userId: string | null;
// // // // //   expiresAt: string | null;
// // // // //   checkingSession: boolean;
// // // // //   roles: string[];
// // // // //   empresaId: string;
// // // // // }

// // // // // const initialState: AuthState = {
// // // // //   isAuthenticated: false,
// // // // //   userId: null,
// // // // //   expiresAt: null,
// // // // //   checkingSession: false,
// // // // //   roles: [],
// // // // //   empresaId: ''
// // // // // };

// // // // // export const refreshTokenThunk = createAsyncThunk<
// // // // //   AuthData,
// // // // //   void,
// // // // //   { rejectValue: string }
// // // // // >(
// // // // //   'auth/refreshToken',
// // // // //   async (_, { rejectWithValue }) => {
// // // // //     try {
// // // // //       return await authService.refreshTokenAsync();
// // // // //     } catch {
// // // // //       return rejectWithValue('No se pudo renovar token');
// // // // //     }
// // // // //   }
// // // // // );

// // // // // export const checkSessionThunk = createAsyncThunk<
// // // // //   AuthMe,
// // // // //   void,
// // // // //   { rejectValue: string }
// // // // // >(
// // // // //   'auth/checkSession',
// // // // //   async (_, { rejectWithValue }) => {
// // // // //     try {
// // // // //       return await authService.meAsync();
// // // // //     } catch {
// // // // //       return rejectWithValue('No hay sesión activa');
// // // // //     }
// // // // //   }
// // // // // );

// // // // // const authSlice = createSlice({
// // // // //   name: 'auth',
// // // // //   initialState,
// // // // //   reducers: {
// // // // //     setCredentials(state, action: PayloadAction<AuthData>) {
// // // // //       const creds = action.payload;
// // // // //       state.isAuthenticated = true;
// // // // //       state.userId = String(creds.userId);
// // // // //       state.expiresAt = creds.expiresAt;
// // // // //       state.empresaId = String(creds.empresaId ?? '');
// // // // //       state.checkingSession = false;
// // // // //     },
// // // // //     setAuthenticated(state, action: PayloadAction<boolean>) {
// // // // //       state.isAuthenticated = action.payload;
// // // // //       state.checkingSession = false;

// // // // //       if (!action.payload) {
// // // // //         state.userId = null;
// // // // //         state.expiresAt = null;
// // // // //         state.roles = [];
// // // // //         state.empresaId = '';
// // // // //       }
// // // // //     },
// // // // //     startCheckingSession(state) {
// // // // //       state.checkingSession = true;
// // // // //     },
// // // // //     finishCheckingSession(state) {
// // // // //       state.checkingSession = false;
// // // // //     },
// // // // //     logout(state) {
// // // // //       state.isAuthenticated = false;
// // // // //       state.userId = null;
// // // // //       state.expiresAt = null;
// // // // //       state.checkingSession = false;
// // // // //       state.roles = [];
// // // // //       state.empresaId = '';
// // // // //     }
// // // // //   },
// // // // //   extraReducers: (builder) => {
// // // // //     builder.addCase(refreshTokenThunk.pending, (state) => {
// // // // //       state.checkingSession = true;
// // // // //     });

// // // // //     builder.addCase(refreshTokenThunk.fulfilled, (state, { payload }) => {
// // // // //       state.isAuthenticated = true;
// // // // //       state.userId = String(payload.userId);
// // // // //       state.expiresAt = payload.expiresAt;
// // // // //       state.empresaId = String(payload.empresaId ?? '');
// // // // //       state.checkingSession = false;
// // // // //     });

// // // // //     builder.addCase(refreshTokenThunk.rejected, (state) => {
// // // // //       state.isAuthenticated = false;
// // // // //       state.userId = null;
// // // // //       state.expiresAt = null;
// // // // //       state.checkingSession = false;
// // // // //       state.roles = [];
// // // // //       state.empresaId = '';
// // // // //     });

// // // // //     builder.addCase(checkSessionThunk.pending, (state) => {
// // // // //       state.checkingSession = true;
// // // // //     });

// // // // //     builder.addCase(checkSessionThunk.fulfilled, (state, { payload }) => {
// // // // //       state.isAuthenticated = true;
// // // // //       state.userId = String(payload.userId);
// // // // //       state.expiresAt = null;
// // // // //       state.roles = payload.roles ?? [];
// // // // //       state.empresaId = String(payload.empresaId ?? '');
// // // // //       state.checkingSession = false;
// // // // //     });

// // // // //     builder.addCase(checkSessionThunk.rejected, (state) => {
// // // // //       state.isAuthenticated = false;
// // // // //       state.userId = null;
// // // // //       state.expiresAt = null;
// // // // //       state.roles = [];
// // // // //       state.empresaId = '';
// // // // //       state.checkingSession = false;
// // // // //     });
// // // // //   }
// // // // // });

// // // // // export const {
// // // // //   setCredentials,
// // // // //   setAuthenticated,
// // // // //   startCheckingSession,
// // // // //   finishCheckingSession,
// // // // //   logout
// // // // // } = authSlice.actions;

// // // // // export const selectIsAdmin = (state: RootState) =>
// // // // //   state.auth.roles.some(
// // // // //     r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'root'
// // // // //   );

// // // // // export const selectUserId = (state: RootState) => Number(state.auth.userId);

// // // // // export const selectEmpresaId = (state: RootState) => state.auth.empresaId;

// // // // // export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

// // // // // export default authSlice.reducer;

// // // // // import { useEffect } from 'react';
// // // // // import { useDispatch, useSelector } from 'react-redux';
// // // // // import type { AppDispatch, RootState } from '@/Context';
// // // // // import { checkSessionThunk } from '@/Context/Slices/Auth/authSlice';

// // // // // interface SessionBootstrapProps {
// // // // //   children: React.ReactNode;
// // // // // }

// // // // // export default function SessionBootstrap({ children }: SessionBootstrapProps) {
// // // // //   const dispatch = useDispatch<AppDispatch>();
// // // // //   const checkingSession = useSelector((state: RootState) => state.auth.checkingSession);

// // // // //   useEffect(() => {
// // // // //     dispatch(checkSessionThunk());
// // // // //   }, [dispatch]);

// // // // //   if (checkingSession) {
// // // // //     return null;
// // // // //   }

// // // // //   return <>{children}</>;
// // // // // }

// // // // using AspNetCoreRateLimit;
// // // // using CustomerService.API.Data.Context;
// // // // using CustomerService.API.Delegations;
// // // // using CustomerService.API.Hosted;
// // // // using CustomerService.API.Hosted.Inactivity;
// // // // using CustomerService.API.Hosted.Inactivity.Handlers;
// // // // using CustomerService.API.Hubs;
// // // // using CustomerService.API.Hubs.Impl;
// // // // using CustomerService.API.Hubs.Interface;
// // // // using CustomerService.API.Interceptor;
// // // // using CustomerService.API.Middlewares;
// // // // using CustomerService.API.Pipelines.Implementations;
// // // // using CustomerService.API.Pipelines.Interfaces;
// // // // using CustomerService.API.Repositories.Implementations;
// // // // using CustomerService.API.Repositories.Implementations.Auth;
// // // // using CustomerService.API.Repositories.Implementations.Chat;
// // // // using CustomerService.API.Repositories.Implementations.Crm;
// // // // using CustomerService.API.Repositories.Implementations.Meta;
// // // // using CustomerService.API.Repositories.Implementations.Proc;
// // // // using CustomerService.API.Repositories.Interfaces;
// // // // using CustomerService.API.Repositories.Interfaces.Auth;
// // // // using CustomerService.API.Repositories.Interfaces.Chat;
// // // // using CustomerService.API.Repositories.Interfaces.Crm;
// // // // using CustomerService.API.Repositories.Interfaces.Meta;
// // // // using CustomerService.API.Repositories.Interfaces.Proc;
// // // // using CustomerService.API.Services.Implementations;
// // // // using CustomerService.API.Services.Implementations.Auth;
// // // // using CustomerService.API.Services.Implementations.Chat;
// // // // using CustomerService.API.Services.Implementations.Crm;
// // // // using CustomerService.API.Services.Implementations.Meta;
// // // // using CustomerService.API.Services.Implementations.Meta.Security;
// // // // using CustomerService.API.Services.Interfaces;
// // // // using CustomerService.API.Services.Interfaces.Auth;
// // // // using CustomerService.API.Services.Interfaces.Chat;
// // // // using CustomerService.API.Services.Interfaces.Crm;
// // // // using CustomerService.API.Services.Interfaces.Meta;
// // // // using CustomerService.API.Services.Interfaces.Meta.Security;
// // // // using CustomerService.API.Utils;
// // // // using CustomerService.API.Utils.Cookies;
// // // // using CustomerService.API.Utils.Gemini;
// // // // using CustomerService.API.Utils.Jwt;
// // // // using CustomerService.API.Utils.Tenant;
// // // // using CustomerService.API.WhContext;
// // // // using HealthChecks.ApplicationStatus.DependencyInjection;
// // // // using HealthChecks.UI.Client;
// // // // using Mapster;
// // // // using MapsterMapper;
// // // // using Microsoft.AspNetCore.Authentication.JwtBearer;
// // // // using Microsoft.AspNetCore.CookiePolicy;
// // // // using Microsoft.AspNetCore.Diagnostics.HealthChecks;
// // // // using Microsoft.EntityFrameworkCore;
// // // // using Microsoft.Extensions.Diagnostics.HealthChecks;
// // // // using Microsoft.Extensions.Options;
// // // // using Microsoft.IdentityModel.Tokens;
// // // // using Microsoft.OpenApi.Models;
// // // // using Serilog;
// // // // using System.Reflection;
// // // // using System.Security.Claims;
// // // // using System.Text;
// // // // using System.Text.Json.Serialization;

// // // // var builder = WebApplication.CreateBuilder(args);

// // // // Log.Logger = new LoggerConfiguration()
// // // //     .ReadFrom.Configuration(builder.Configuration)
// // // //     .Enrich.FromLogContext()
// // // //     .CreateLogger();

// // // // builder.Host.UseSerilog();

// // // // builder.Services.AddSingleton<ConversationStatusChangeInterceptor>();
// // // // builder.Services.AddScoped<CompanyIdSaveChangesInterceptor>();

// // // // builder.Services.AddDbContext<CustomerSupportContext>((sp, opts) =>
// // // // {
// // // //     opts.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));

// // // //     opts.AddInterceptors(
// // // //         sp.GetRequiredService<ConversationStatusChangeInterceptor>(),
// // // //         sp.GetRequiredService<CompanyIdSaveChangesInterceptor>()
// // // //     );
// // // // });

// // // // builder.Services.Configure<MessengerOptions>(
// // // //     builder.Configuration.GetSection("Meta:Messenger"));

// // // // builder.Services.Configure<InstagramOptions>(
// // // //     builder.Configuration.GetSection("Meta:Instagram"));

// // // // builder.Services.Configure<CookieSettings>(
// // // //     builder.Configuration.GetSection("CookieSettings"));

// // // // var origins = builder.Configuration
// // // //     .GetSection("Cors:AllowedOrigins")
// // // //     .Get<string[]>() ?? Array.Empty<string>();

// // // // builder.Services.AddCors(options =>
// // // // {
// // // //     options.AddPolicy("CorsPolicy", policy =>
// // // //     {
// // // //         policy.WithOrigins(origins)
// // // //               .AllowAnyHeader()
// // // //               .AllowAnyMethod()
// // // //               .AllowCredentials();
// // // //     });
// // // // });

// // // // builder.Configuration
// // // //     .SetBasePath(Directory.GetCurrentDirectory())
// // // //     .AddJsonFile(Path.Combine("WhContext", "messages.json"), optional: false, reloadOnChange: true);

// // // // builder.Services.Configure<MessagePrompts>(
// // // //     builder.Configuration.GetSection("Prompts"));

// // // // builder.Services.Configure<MessageKeywords>(
// // // //     builder.Configuration.GetSection("Keywords"));

// // // // builder.Services.Configure<GeminiOptions>(
// // // //     builder.Configuration.GetSection("Gemini"));

// // // // builder.Services.AddTransient<GeminiDelegatingHandler>();

// // // // builder.Services.AddHttpClient<IGeminiClient, GeminiClient>(client =>
// // // // {
// // // //     client.BaseAddress = new Uri("https://generativelanguage.googleapis.com");
// // // // })
// // // // .AddHttpMessageHandler<GeminiDelegatingHandler>();

// // // // builder.Services.AddScoped<IAuthCookieHelper, AuthCookieHelper>();

// // // // var jwtSection = builder.Configuration.GetSection("JwtSettings");
// // // // builder.Services.Configure<JwtSettings>(jwtSection);
// // // // var keyBytes = Encoding.UTF8.GetBytes(jwtSection["Key"]!);

// // // // builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

// // // // builder.Services.AddScoped<ICustomMessageRespository, CustomMessageRespository>();
// // // // builder.Services.AddScoped<IUserRepository, UserRepository>();
// // // // builder.Services.AddScoped<IRoleRepository, RoleRepository>();
// // // // builder.Services.AddScoped<IAuthTokenRepository, AuthTokenRepository>();
// // // // builder.Services.AddScoped<IUserRoleRepository, UserRoleRepository>();
// // // // builder.Services.AddScoped<ICompanyRepository, CompanyRepository>();
// // // // builder.Services.AddScoped<IConversationRepository, ConversationRepository>();
// // // // builder.Services.AddScoped<IMessageRepository, MessageRepository>();
// // // // builder.Services.AddScoped<IAttachmentRepository, AttachmentRepository>();
// // // // builder.Services.AddScoped<IMenuRepository, MenuRepository>();
// // // // builder.Services.AddScoped<IRoleMenuRepository, RoleMenuRepository>();
// // // // builder.Services.AddScoped<IContactLogRepository, ContactLogRespository>();
// // // // builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
// // // // builder.Services.AddScoped<INotificationRecipientRepository, NotificationRecipientRepository>();
// // // // builder.Services.AddScoped<IOpeningHourRepository, OpeningHourRepository>();
// // // // builder.Services.AddScoped<ISystemParamRepository, SystemParamRepository>();
// // // // builder.Services.AddScoped<IInnovaRepository, InnovaRepository>();
// // // // builder.Services.AddScoped<IWorkShiftRepository, WorkShiftRepository>();
// // // // builder.Services.AddScoped<ITemplateCategoryRepository, TemplateCategoryRepository>();
// // // // builder.Services.AddScoped<IWaTemplateRepositorio, WaTemplateRepositorio>();
// // // // builder.Services.AddScoped<IConversationCategoryRepository, ConversationCategoryRepository>();
// // // // builder.Services.AddScoped<IProductCatalogRepository, ProductCatalogRepository>();
// // // // builder.Services.AddScoped<ITicketDetailRepository, TicketDetailRepository>();
// // // // builder.Services.AddScoped<IDynamicParamUserRepository, DynamicParamUserRepository>();
// // // // builder.Services.AddScoped<ILogCartRepository, LogCartRepository>();
// // // // builder.Services.AddScoped<IStatusRepository, StatusRepository>();
// // // // builder.Services.AddScoped<IClientRepository, ClientRepository>();
// // // // builder.Services.AddScoped<IOutsourcedSystemRepository, OutsourcedSystemsRepository>();
// // // // builder.Services.AddScoped<IOutsourcedDeviceRepository, OutsourcedDeviceRepository>();
// // // // builder.Services.AddScoped<ICredentialRepository, CredentialRepository>();
// // // // builder.Services.AddScoped<ICatCredencialRepository, CatCredencialRepository>();
// // // // builder.Services.AddScoped<IClientOutsourcedSystemsRepository, ClientOutsourcedSystemsRepository>();
// // // // builder.Services.AddScoped<IClientContactRepository, ClientContactRepository>();
// // // // builder.Services.AddScoped<ISystemDefaultsRepository, SystemDefaultsRepository>();
// // // // builder.Services.AddScoped<IUserSessionRepository, UserSessionRepository>();
// // // // builder.Services.AddScoped<IMessageSourceRepository, MessageSourceRepository>();
// // // // builder.Services.AddScoped<IPerformanceRepository, PerformanceRepository>();
// // // // builder.Services.AddScoped<IDynamicParamRepository, DynamicParamRepository>();
// // // // builder.Services.AddScoped<ICompanySystemParamRepository, CompanySystemParamRepository>();
// // // // builder.Services.AddScoped<ICompanyMetaConfigRepository, CompanyMetaConfigRepository>();
// // // // builder.Services.AddScoped<ICompanyMetaAssetRepository, CompanyMetaAssetRepository>();

// // // // builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// // // // builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();

// // // // builder.Services.AddScoped<ICustomMessageService, CustomMessageService>();
// // // // builder.Services.AddScoped<ICompanyService, CompanyService>();
// // // // builder.Services.AddScoped<IAttachmentService, AttachmentService>();
// // // // builder.Services.AddScoped<IUserService, UserService>();
// // // // builder.Services.AddScoped<IConversationService, ConversationService>();
// // // // builder.Services.AddScoped<IMessageService, MessageService>();
// // // // builder.Services.AddScoped<IRoleService, RoleService>();
// // // // builder.Services.AddScoped<ITokenService, TokenService>();
// // // // builder.Services.AddScoped<ILogCartService, LogCartService>();
// // // // builder.Services.AddScoped<IStatusService, StatusService>();
// // // // builder.Services.AddScoped<IAuthService, AuthService>();
// // // // builder.Services.AddScoped<IWhatsAppService, WhatsAppService>();
// // // // builder.Services.AddScoped<IMessagePipeline, MessagePipeline>();
// // // // builder.Services.AddScoped<IMenuService, MenuService>();
// // // // builder.Services.AddScoped<IContactLogService, ContactLogService>();
// // // // builder.Services.AddScoped<IInnovaService, InnovaService>();
// // // // builder.Services.AddScoped<INicDatetime, NicDatetime>();
// // // // builder.Services.AddScoped<INotificationService, NotificationService>();
// // // // builder.Services.AddScoped<INotificationRecipientService, NotificationRecipientService>();
// // // // builder.Services.AddScoped<ISystemParamService, SystemParamService>();
// // // // builder.Services.AddScoped<IOpeningHourService, OpeningHourService>();
// // // // builder.Services.AddScoped<IWorkShiftService, WorkShiftService>();
// // // // builder.Services.AddScoped<ITemplateCategoryService, TemplateCategoryService>();
// // // // builder.Services.AddScoped<IWaTemplateService, WaTemplateService>();
// // // // builder.Services.AddScoped<IProductCatalogService, ProductCatalogService>();
// // // // builder.Services.AddScoped<IConversationCategoryService, ConversationCategoryService>();
// // // // builder.Services.AddScoped<ITicketDetailService, TicketDetailService>();
// // // // builder.Services.AddScoped<IUserSessionService, UserSessionService>();
// // // // builder.Services.AddScoped<ICatCredencialService, CatCredencialService>();
// // // // builder.Services.AddScoped<IOutsourcedDeviceService, OutsourcedDeviceService>();
// // // // builder.Services.AddScoped<IOutsourcedSystemService, OutsourcedSystemService>();
// // // // builder.Services.AddScoped<IClientService, ClientService>();
// // // // builder.Services.AddScoped<ICredentialService, CredentialService>();
// // // // builder.Services.AddScoped<IPDFServices, PDFServices>();
// // // // builder.Services.AddScoped<IDeviceDetector, DeviceDetector>();
// // // // builder.Services.AddScoped<IIpGeoService, IpGeoService>();
// // // // builder.Services.AddScoped<ITenantProvider, TenantProvider>();
// // // // builder.Services.AddScoped<IPerformanceService, PerformanceService>();
// // // // builder.Services.AddScoped<IDynamicParamService, DynamicParamService>();
// // // // builder.Services.AddScoped<ICartService, CartService>();
// // // // builder.Services.AddScoped<ICompanySystemParamService, CompanySystemParamService>();
// // // // builder.Services.AddScoped<ICompanyMetaConfigProvider, CompanyMetaConfigProvider>();
// // // // builder.Services.AddScoped<ICompanyResolverFromWebhook, CompanyResolverFromWebhook>();
// // // // builder.Services.AddScoped<ICompanyContext, CompanyContext>();

// // // // builder.Services.AddTransient<IEmailService, EmailService>();

// // // // builder.Services.AddScoped<IConversationInactivityEngine, ConversationInactivityEngine>();
// // // // builder.Services.AddScoped<IConversationInactivityHandler, AfterHoursPauseHandler>();
// // // // builder.Services.AddScoped<IConversationInactivityHandler, AgentAutoCloseHandler>();
// // // // builder.Services.AddScoped<IConversationInactivityHandler, BotInactivityHandler>();
// // // // builder.Services.AddScoped<IConversationInactivityHandler, WaitingInactivityHandler>();
// // // // builder.Services.AddScoped<IConversationInactivityHandler, HumanInactivityHandler>();

// // // // builder.Services.AddHostedService<InactivityHostedService>();
// // // // builder.Services.AddHostedService<WebsiteContextHostedService>();

// // // // var mapsterConfig = TypeAdapterConfig.GlobalSettings;
// // // // mapsterConfig.Scan(Assembly.GetExecutingAssembly());
// // // // builder.Services.AddSingleton(mapsterConfig);
// // // // builder.Services.AddScoped<IMapper, ServiceMapper>();

// // // // builder.Services.AddScoped<IPresenceService, PresenceService>();
// // // // builder.Services.AddSingleton<ISignalRNotifyService, SignalRNotifyService>();

// // // // builder.Services.AddResponseCaching();
// // // // builder.Services.AddResponseCompression();

// // // // builder.Services.Configure<EmailSettings>(
// // // //     builder.Configuration.GetSection("EmailSettings"));

// // // // builder.Services.AddOptions();
// // // // builder.Services.Configure<IpRateLimitOptions>(
// // // //     builder.Configuration.GetSection("IpRateLimiting"));
// // // // builder.Services.AddInMemoryRateLimiting();
// // // // builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

// // // // builder.Services.Configure<AppSettings>(
// // // //     builder.Configuration.GetSection("AppSettings"));

// // // // builder.Services.Configure<TempKey>(
// // // //     builder.Configuration.GetSection("TempKey"));

// // // // builder.Services.AddMemoryCache();


// // // // builder.Services.Configure<AuthTokenSettings>(
// // // //     builder.Configuration.GetSection("AuthTokenSettings"));

// // // // builder.Services.AddHealthChecks()
// // // //     .AddApplicationStatus("api_status", tags: new[] { "api" })
// // // //     .AddSqlServer(
// // // //         builder.Configuration.GetConnectionString("DefaultConnection")!,
// // // //         name: "sql",
// // // //         failureStatus: HealthStatus.Degraded,
// // // //         tags: new[] { "db", "sql", "sqlserver" }
// // // //     );

// // // // builder.Services.AddHealthChecksUI()
// // // //     .AddInMemoryStorage();

// // // // builder.Services.AddSignalR();

// // // // // META
// // // // builder.Services.AddScoped<IHubDispatcher, HubDispatcher>();
// // // // builder.Services.AddScoped<IMetaWebhookSecurityService, MetaWebhookSecurityService>();
// // // // builder.Services.AddScoped<IIncomingEventPipeline, CustomerService.API.Pipelines.Implementations.CoreIncomingEventPipeline>();
// // // // builder.Services.AddScoped<IConversationFlowEngine, ConversationFlowEngine>();
// // // // builder.Services.AddScoped<IContactResolver, ContactResolver>();
// // // // builder.Services.AddScoped<IConversationResolver, ConversationResolver>();
// // // // builder.Services.AddScoped<IChannelMessageSender, WhatsappMessageSender>();
// // // // builder.Services.AddScoped<IChannelMessageSender, MessengerMessageSender>();
// // // // builder.Services.AddScoped<IChannelMessageSender, InstagramMessageSender>();
// // // // builder.Services.AddScoped<IWebhookChannelService, WhatsappWebhookService>();
// // // // builder.Services.AddScoped<IWebhookChannelService, MessengerWebhookService>();
// // // // builder.Services.AddScoped<IWebhookChannelService, InstagramWebhookService>();
// // // // builder.Services.AddScoped<IWebhookDispatcherService, WebhookDispatcherService>();
// // // // builder.Services.AddScoped<IMetaGraphClient, MetaGraphClient>();
// // // // builder.Services.AddScoped<IChannelRecipientResolver, ChannelRecipientResolver>();
// // // // builder.Services.AddScoped<IMessengerService, MessengerService>();
// // // // builder.Services.AddScoped<IInstagramService, InstagramService>();
// // // // builder.Services.AddScoped<ISharedPipelineSteps, SharedPipelineSteps>();

// // // // builder.Services.Configure<CookiePolicyOptions>(options =>
// // // // {
// // // //     options.MinimumSameSitePolicy = SameSiteMode.Unspecified;
// // // //     options.HttpOnly = HttpOnlyPolicy.Always;
// // // //     options.Secure = CookieSecurePolicy.Always;
// // // // });

// // // // builder.Services.AddAuthentication(options =>
// // // // {
// // // //     options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
// // // //     options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
// // // // })
// // // // .AddJwtBearer(options =>
// // // // {
// // // //     options.RequireHttpsMetadata = true;
// // // //     options.SaveToken = false;

// // // //     options.TokenValidationParameters = new TokenValidationParameters
// // // //     {
// // // //         ValidateIssuer = true,
// // // //         ValidIssuer = jwtSection["Issuer"],
// // // //         ValidateAudience = true,
// // // //         ValidAudience = jwtSection["Audience"],
// // // //         ValidateIssuerSigningKey = true,
// // // //         IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
// // // //         ValidateLifetime = true,
// // // //         RoleClaimType = ClaimTypes.Role,
// // // //         ClockSkew = TimeSpan.Zero
// // // //     };
// // // //     options.Events = new JwtBearerEvents
// // // //     {
// // // //         OnMessageReceived = context =>
// // // //         {
// // // //             var cookieSettings = context.HttpContext.RequestServices
// // // //                 .GetRequiredService<IOptions<CookieSettings>>()
// // // //                 .Value;

// // // //             var path = context.HttpContext.Request.Path;

// // // //             if (context.Request.Cookies.TryGetValue(cookieSettings.AccessTokenCookieName, out var cookieToken) &&
// // // //                 !string.IsNullOrWhiteSpace(cookieToken))
// // // //             {
// // // //                 context.Token = cookieToken;
// // // //                 return Task.CompletedTask;
// // // //             }

// // // //             var accessToken = context.Request.Query["access_token"];
// // // //             if (!string.IsNullOrEmpty(accessToken) &&
// // // //                 (path.StartsWithSegments("/hubs/chat") ||
// // // //                  path.StartsWithSegments("/hubs/notifications") ||
// // // //                  path.StartsWithSegments("/hubs/presence") ||
// // // //                  path.StartsWithSegments("/hubs/users") ||
// // // //                  path.StartsWithSegments("/hubs/performance")))
// // // //             {
// // // //                 context.Token = accessToken;
// // // //             }

// // // //             return Task.CompletedTask;
// // // //         },

// // // //         OnAuthenticationFailed = context =>
// // // //         {
// // // //             context.NoResult();
// // // //             context.Response.StatusCode = StatusCodes.Status401Unauthorized;

// // // //             if (context.Exception is SecurityTokenExpiredException)
// // // //             {
// // // //                 context.Response.Headers["X-Token-Expired"] = "true";
// // // //             }

// // // //             return Task.CompletedTask;
// // // //         },

// // // //         OnChallenge = async context =>
// // // //         {
// // // //             context.HandleResponse();

// // // //             if (context.Response.HasStarted)
// // // //                 return;

// // // //             context.Response.StatusCode = StatusCodes.Status401Unauthorized;
// // // //             context.Response.ContentType = "application/json";

// // // //             await context.Response.WriteAsJsonAsync(
// // // //                 ApiResponse<object>.Fail("No autorizado: token ausente, expirado o inválido."));
// // // //         }
// // // //     };
// // // // });

// // // // builder.Services.AddAuthorization(options =>
// // // // {
// // // //     options.AddPolicy("AdminPolicy", policy => policy.RequireRole("Admin"));
// // // //     options.AddPolicy("AgentPolicy", policy => policy.RequireRole("Support"));
// // // // });

// // // // builder.Services.AddEndpointsApiExplorer();

// // // // builder.Services.AddSwaggerGen(options =>
// // // // {
// // // //     options.EnableAnnotations();
// // // //     options.SwaggerDoc("v1", new OpenApiInfo
// // // //     {
// // // //         Title = "CustomerSupport.API",
// // // //         Version = "v1"
// // // //     });

// // // //     //options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
// // // //     //{
// // // //     //    Name = "Authorization",
// // // //     //    In = ParameterLocation.Header,
// // // //     //    Type = SecuritySchemeType.ApiKey,
// // // //     //    Scheme = "Bearer",
// // // //     //    BearerFormat = "JWT",
// // // //     //    Description = "Usa: Bearer {token}"
// // // //     //});

// // // //     //options.AddSecurityRequirement(new OpenApiSecurityRequirement
// // // //     //{
// // // //     //    {
// // // //     //        new OpenApiSecurityScheme
// // // //     //        {
// // // //     //            Reference = new OpenApiReference
// // // //     //            {
// // // //     //                Type = ReferenceType.SecurityScheme,
// // // //     //                Id = "Bearer"
// // // //     //            }
// // // //     //        },
// // // //     //        Array.Empty<string>()
// // // //     //    }
// // // //     //});
// // // // });

// // // // builder.Services.AddControllers()
// // // //     .AddJsonOptions(options =>
// // // //     {
// // // //         options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
// // // //     });

// // // // builder.Services.AddHttpContextAccessor();

// // // // var app = builder.Build();

// // // // app.UseSerilogRequestLogging();

// // // // app.UseHttpsRedirection();

// // // // app.UseRouting();

// // // // app.UseCors("CorsPolicy");

// // // // app.UseCookiePolicy();

// // // // app.UseStaticFiles(new StaticFileOptions
// // // // {
// // // //     OnPrepareResponse = context =>
// // // //     {
// // // //         var origin = context.Context.Request.Headers.Origin.ToString();

// // // //         if (!string.IsNullOrWhiteSpace(origin) &&
// // // //             origins.Contains(origin, StringComparer.OrdinalIgnoreCase))
// // // //         {
// // // //             context.Context.Response.Headers["Access-Control-Allow-Origin"] = origin;
// // // //             context.Context.Response.Headers["Vary"] = "Origin";
// // // //             context.Context.Response.Headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
// // // //             context.Context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
// // // //         }
// // // //     }
// // // // });

// // // // app.UseResponseCompression();
// // // // app.UseResponseCaching();
// // // // app.UseIpRateLimiting();

// // // // app.UseSwagger();
// // // // app.UseSwaggerUI(options =>
// // // // {
// // // //     options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
// // // // });

// // // // app.UseAuthentication();
// // // // app.UseMiddleware<TenantMiddleware>();
// // // // app.UseAuthorization();
// // // // app.UseErrorHandling();

// // // // app.MapGet("/api/v1/liveness", () => Results.Ok(new { status = "alive commercial crm" }))
// // // //     .AllowAnonymous();

// // // // app.MapHealthChecks("/healthz", new HealthCheckOptions
// // // // {
// // // //     Predicate = _ => true,
// // // //     ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
// // // // });

// // // // app.MapHealthChecksUI();

// // // // app.MapHub<ChatHub>("/hubs/chat");
// // // // app.MapHub<NotificationsHub>("/hubs/notifications");
// // // // app.MapHub<PresenceHub>("/hubs/presence");
// // // // app.MapHub<UserHub>("/hubs/users");
// // // // app.MapHub<PerformanceHub>("/hubs/performance");

// // // // app.MapControllers();

// // // // app.Run();
// // // // //en el program esta el cookies, de como lo ricine la apinamespace CustomerService.API.Utils.Cookies
// // // {
// // //     public class CookieSettings
// // //     {
// // //         public string AccessTokenCookieName { get; set; } = "access_token";
// // //         public string RefreshTokenCookieName { get; set; } = "refresh_token";
// // //         public string Domain { get; set; } = string.Empty;
// // //         public string Path { get; set; } = "/";
// // //         public bool HttpOnly { get; set; } = true;
// // //         public bool Secure { get; set; } = true;
// // //         public string SameSite { get; set; } = "None";
// // //         public int AccessTokenExpirationMinutes { get; set; } = 15;
// // //         public int RefreshTokenExpirationDays { get; set; } = 7;

// // //     }
// // // }using CustomerService.API.Dtos.RequestDtos.auth;
// // using CustomerService.API.Dtos.RequestDtos.crm;
// // using CustomerService.API.Dtos.ResponseDtos.Auth;
// // using CustomerService.API.Services.Implementations;
// // using CustomerService.API.Services.Interfaces;
// // using CustomerService.API.Services.Interfaces.Auth;
// // using CustomerService.API.Utils;
// // using CustomerService.API.Utils.Cookies;
// // using Microsoft.AspNetCore.Authorization;
// // using Microsoft.AspNetCore.Http;
// // using Microsoft.AspNetCore.Mvc;
// // using Swashbuckle.AspNetCore.Annotations;
// // using System.Threading.Tasks;

// // namespace CustomerService.API.Controllers
// // {
// //     [ApiController]
// //     [Route("api/v1/[controller]")]
// //     public class AuthController : ControllerBase
// //     {
// //         private readonly IAuthService _auth;
// //         private readonly IDeviceDetector _deviceDetector;
// //         private readonly IIpGeoService _ipGeo;
// //         private readonly ITokenService _tokenService;
// //         private readonly IAuthCookieHelper _authCookieHelper;
// //         public AuthController(IAuthService auth, 
// //             IDeviceDetector deviceDetector, IIpGeoService ipGeo, ITokenService tokenService,
// //             IAuthCookieHelper authCookieHelper)
// //         {
// //             _deviceDetector = deviceDetector;
// //             _auth = auth;
// //             _ipGeo = ipGeo;
// //             _tokenService = tokenService;
// //             _authCookieHelper = authCookieHelper;
// //         }

// //         #region Auth
// //         [HttpPost("register", Name = "Register")]
// //         [AllowAnonymous]
// //         [SwaggerOperation(Summary = "Register a new user and send verification email")]
// //         [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status201Created)]
// //         [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
// //         public async Task<IActionResult> Register([FromBody] RegisterRequest req)
// //         {
// //             await _auth.RegisterAsync(req);
// //             var response = new ApiResponse<object>(
// //                 data: null,
// //                 message: "Usuario registrado correctamente. Revisa tu correo para activar la cuenta."
// //             );
// //             return Created(string.Empty, response);
// //         }

// //         /// <summary>
// //         /// Recuperar datos de inicio sesión del usuario
// //         /// </summary>
// //         /// <returns>Datos del navegador y geolocalización</returns>
// //         private RequestClientContext BuildClientContext()
// //         {
// //             string? GetIp()
// //             {
// //                 if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
// //                 {
// //                     var ip = forwardedFor.FirstOrDefault();
// //                     if (!string.IsNullOrWhiteSpace(ip))
// //                         return ip.Split(',')[0].Trim();
// //                 }

// //                 var remoteIp = HttpContext.Connection.RemoteIpAddress;
// //                 return remoteIp?.MapToIPv4().ToString();
// //             }

// //             return new RequestClientContext
// //             {
// //                 PublicIp = GetIp(),
// //                 UserAgent = Request.Headers["User-Agent"].ToString(),
// //                 Origin = Request.Headers["Origin"].ToString(),
// //                 Referer = Request.Headers["Referer"].ToString()
// //             };
// //         }

// //         [HttpPost("login", Name = "Login")]
// //         [AllowAnonymous]
// //         public async Task<IActionResult> Login([FromBody] LoginRequest req)
// //         {
// //             var ctx = BuildClientContext();
// //             ctx.Geo = await _ipGeo.GetInfoAsync(ctx.PublicIp);
// //             ctx.Device = _deviceDetector.Detect(ctx.UserAgent ?? "");

// //             var result = await _auth.LoginAsync(req, ctx);

// //             _authCookieHelper.SetAuthCookies(
// //                 Response,
// //                 Request,
// //                 result.AccessToken,
// //                 result.RefreshToken,
// //                 result.ExpiresAt
// //             );

// //             var response = new ApiResponse<AuthResponseDto>(
// //                 data: result,
// //                 message: "Inicio de sesión exitoso."
// //             );

// //             return Ok(response);
// //         }

// //         [HttpPost("logout/{id}", Name = "logout")]
// //         public async Task<IActionResult> LogOut(int id, CancellationToken ct = default)
// //         {
// //             var result = await _auth.LogoutAsync(id, ct);

// //             _authCookieHelper.ClearAuthCookies(Response, Request);

// //             var response = new ApiResponse<LogOutAtResponseDto>(
// //                 data: result,
// //                 message: "Sessión cerrada."
// //             );

// //             return Ok(response);
// //         }

// //         [HttpPost("refresh", Name = "RefreshToken")]
// //         [AllowAnonymous]
// //         public async Task<IActionResult> Refresh()
// //         {
// //             var refreshToken = _authCookieHelper.GetRefreshToken(Request);

// //             if (string.IsNullOrWhiteSpace(refreshToken))
// //             {
// //                 return BadRequest(new ApiResponse<object>(
// //                     data: null,
// //                     message: "Refresh token requerido.",
// //                     success: false
// //                 ));
// //             }

// //             var result = await _auth.RefreshTokenAsync(refreshToken);

// //             _authCookieHelper.SetAuthCookies(
// //                 Response,
// //                 Request,
// //                 result.AccessToken,
// //                 result.RefreshToken,
// //                 result.ExpiresAt
// //             );

// //             var response = new ApiResponse<AuthResponseDto>(
// //                 data: result,
// //                 message: "Token de acceso renovado correctamente."
// //             );

// //             return Ok(response);
// //         }

// //         [HttpPost("forgot-password", Name = "ForgotPassword")]
// //         [AllowAnonymous]
// //         [SwaggerOperation(Summary = "Send password reset link to user email")]
// //         [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
// //         [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
// //         public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
// //         {
// //             await _auth.ForgotPasswordAsync(req);
// //             var response = new ApiResponse<object>(
// //                 data: null,
// //                 message: "Enlace para restablecer contraseña enviado al correo."
// //             );
// //             return Ok(response);
// //         }

// //         [HttpPost("reset-password", Name = "ResetPassword")]
// //         [AllowAnonymous]
// //         [SwaggerOperation(Summary = "Reset user password using provided token")]
// //         [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
// //         [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
// //         public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
// //         {
// //             await _auth.ResetPasswordAsync(req);
// //             var response = new ApiResponse<object>(
// //                 data: null,
// //                 message: "Contraseña restablecida correctamente."
// //             );
// //             return Ok(response);
// //         }

// //         [HttpGet("verify-email", Name = "VerifyEmail")]
// //         [AllowAnonymous]
// //         [SwaggerOperation(Summary = "Verify user email using token")]
// //         [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
// //         [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
// //         public async Task<IActionResult> VerifyEmail([FromQuery] string token)
// //         {
// //             await _auth.VerifyEmailAsync(token);
// //             var response = new ApiResponse<object>(
// //                 data: null,
// //                 message: "Correo verificado exitosamente."
// //             );
// //             return Ok(response);
// //         }

// //         #endregion

// //         #region Token Temporal - Carrito

// //         public class TempLinkResolveRequestDto
// //         {
// //             public string Token { get; set; } = string.Empty;
// //         }

// //         [HttpPost("TempLink/Resolve")]
// //         [AllowAnonymous]
// //         [SwaggerOperation(Summary = "Valida el token temporal y devuelve los datos asociados")]
// //         [ProducesResponseType(typeof(ApiResponse<TempLinkResolveResponseDto>), StatusCodes.Status200OK)]
// //         [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
// //         public async Task<IActionResult> ResolveTempLink(
// //             [FromBody] string token, CancellationToken ct)
// //         {
// //             if (token == null || string.IsNullOrWhiteSpace(token))
// //             {
// //                 return BadRequest(new ApiResponse<object>(
// //                     data: null,
// //                     message: "Token requerido.",
// //                     success: false,
// //                     errors: null
// //                 ));
// //             }

// //             var result = await _tokenService.ResolveTempLinkAsync(token);

// //             if (result == null)
// //             {
// //                 return BadRequest(new ApiResponse<object>(
// //                     data: null,
// //                     message: "Token inválido o expirado.",
// //                     success: false,
// //                     errors: null
// //                 ));
// //             }

// //             return Ok(new ApiResponse<TempLinkResolveResponseDto>(
// //                 data: result,
// //                 message: "Token válido.",
// //                 success: true,
// //                 errors: null
// //             ));
// //         }


// //         [HttpPost("TempLink/Revoke/{orderId}")]
// //         [AllowAnonymous]
// //         [SwaggerOperation(Summary = "Revoca los tokens temporales asociados a un pedido")]
// //         [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
// //         [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
// //         public async Task<IActionResult> RevokeTempLink(int orderId, 
// //             CancellationToken ct = default)
// //         {
// //             if (orderId <= 0)
// //             {
// //                 var errorResponse = new ApiResponse<bool>(
// //                     data: false,
// //                     message: "OrderId inválido."
// //                 );
// //                 return BadRequest(errorResponse);
// //             }

// //             await _tokenService.RevokeCartTokensByOrderAsync(orderId, ct);

// //             var response = new ApiResponse<bool>(
// //                 data: true,
// //                 message: "Tokens revocados correctamente."
// //             );

// //             return Ok(response);
// //         }

// //         #endregion
// //     }
// // }import React from "react"
// import ReactDOM from "react-dom/client"
// import { Provider } from "react-redux"
// import { BrowserRouter } from "react-router-dom"
// import App from "@/App"
// import { store } from "@/Context"
// import "@/index.css"
// import { QueryClientProvider } from "@tanstack/react-query";
// import { queryClient } from "@/Utils/Https/reactQuery";

// import api, { apiPCG } from "@/Utils/ApiConfig"

// import { setupRequestInterceptor } from "@/Interceptors/requestInterceptor"
// import { setupResponseInterceptor } from "@/Interceptors/responseInterceptor"
// import { setupEmpresaInterceptor, setupNetworkInterceptor } from "@/Interceptors/setupInterceptors"


// setupRequestInterceptor(api)
// setupResponseInterceptor(api)      // refresh solo api CRM
// setupNetworkInterceptor(api)

// setupEmpresaInterceptor(apiPCG);
// setupNetworkInterceptor(apiPCG)    // timeout/network para api PCG también

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <Provider store={store}>
//       <QueryClientProvider client={queryClient}>
//       <BrowserRouter>
//         <App />
//       </BrowserRouter>
//       </QueryClientProvider>
//     </Provider>
//   </React.StrictMode>
// )import type { AxiosInstance } from "axios";

// export function setupRequestInterceptor(instance: AxiosInstance) {
//   instance.interceptors.request.use((config) => {
//     return config;
//   });
// }

//dame lista de archvio a actualizar corto y preciso, solo los nombres dame