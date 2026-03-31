import React from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import App from "@/App"
import { store } from "@/Context"
import "@/index.css"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import api, { apiPCG } from "@/Utils/ApiConfig"
import { setupRequestInterceptor } from "@/Interceptors/requestInterceptor"
import { setupResponseInterceptor } from "@/Interceptors/responseInterceptor"
import { setupNetworkInterceptor } from "@/Interceptors/setupInterceptors"

const queryClient = new QueryClient()


setupRequestInterceptor(api)
setupResponseInterceptor(api)      // refresh solo api CRM
setupNetworkInterceptor(api)

setupNetworkInterceptor(apiPCG)    // timeout/network para api PCG también

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
)