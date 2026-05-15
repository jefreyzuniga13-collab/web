import React from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import App from "@/App"
import { persistor, store } from "@/Context"
import "@/index.css"
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/Utils/Https/reactQuery";
import api, { apiPCG } from "@/Utils/ApiConfig"
import { setupRequestInterceptor } from "@/Interceptors/requestInterceptor"
import { setupResponseInterceptor } from "@/Interceptors/responseInterceptor"
import { setupEmpresaInterceptor, setupNetworkInterceptor } from "@/Interceptors/setupInterceptors"
import { PersistGate } from 'redux-persist/integration/react'

setupRequestInterceptor(api)
setupResponseInterceptor(api)      // refresh solo api CRM
setupNetworkInterceptor(api)
setupEmpresaInterceptor(apiPCG);
setupNetworkInterceptor(apiPCG)    // timeout/network para api PCG también

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
       <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
      <BrowserRouter
      //  basename="/crm"
       >
        <App />
      </BrowserRouter>
      </QueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
)