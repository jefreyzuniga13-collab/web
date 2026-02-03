import React from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import App from "@/App"
import { store } from "@/Context"
import "@/index.css"

import api, { apiPCG } from "@/Utils/ApiConfig"
import { setupRequestInterceptor } from "@/Interceptors/requestInterceptor"
import { setupResponseInterceptor } from "@/Interceptors/responseInterceptor"
import { setupNetworkInterceptor } from "@/Utils/setupInterceptors"

setupRequestInterceptor(api)
setupResponseInterceptor(api)      // refresh solo en CRM
setupNetworkInterceptor(api)

setupNetworkInterceptor(apiPCG)    // timeout/network para PCG también

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)