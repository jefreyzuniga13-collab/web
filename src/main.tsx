import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { PersistGate } from "redux-persist/integration/react";

import App from "@/App";
import CustomLoader from "@/Components/Common/CustomLoader";
import { persistor, store } from "@/Context";
import { queryClient } from "@/Utils/Https/reactQuery";
import api, { apiPCG } from "@/Utils/ApiConfig";
import { setupRequestInterceptor } from "@/Interceptors/requestInterceptor";
import { setupResponseInterceptor } from "@/Interceptors/responseInterceptor";
import { setupEmpresaInterceptor } from "@/Interceptors/setupInterceptors";
import { cleanStalePwa } from "@/Utils/cleanStalePwa";
import { ensureLatestAppVersion } from "@/Utils/ensureAppVersion";
import {
  enablePwa,
  isPwaSilentPath,
  silencePwaOnPublicRoute,
} from "@/Utils/pwaLifecycle";

import "@/index.css";

setupRequestInterceptor(api);
setupResponseInterceptor(api);
setupEmpresaInterceptor(apiPCG);

async function startApp(): Promise<void> {
  if (isPwaSilentPath()) {
    const reloading = await silencePwaOnPublicRoute();

    if (reloading) {
      return;
    }

    renderApp();
    return;
  }

  const versionReloading = await ensureLatestAppVersion();

  if (versionReloading) {
    return;
  }

  const reloading = await cleanStalePwa();

  if (reloading) {
    return;
  }

  enablePwa();
  renderApp();
}

function renderApp(): void {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <PersistGate loading={<CustomLoader />} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter basename="/crm">
              <App />
            </BrowserRouter>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </React.StrictMode>
  );
}

void startApp();
