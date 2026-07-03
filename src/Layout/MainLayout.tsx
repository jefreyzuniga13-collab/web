import React, { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import Navbar from "@/Components/Auth/Menu"
import MobileNavbar from "@/Components/Auth/MobileNavbar"
import { AssignModal } from "@/Components/Chat/AssignModal"
import type { RootState } from "@/Context"

const MOBILE_QUERY = "(max-width: 700px)"

const MOBILE_ALLOWED_ROUTES = new Set([
  "",
  "chat",
  "performaceDashboard",
])

const normalizePath = (value: string) => {
  return value.replace(/^\/+/, "").split("/")[0]
}

const MainLayout: React.FC = () => {
  const location = useLocation()

  const { isAuthenticated, userId, checkingSession } = useSelector(
    (state: RootState) => state.auth
  )

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY)

    const syncMobile = () => {
      setIsMobile(mediaQuery.matches)
    }

    syncMobile()

    mediaQuery.addEventListener("change", syncMobile)

    return () => {
      mediaQuery.removeEventListener("change", syncMobile)
    }
  }, [])

  if (checkingSession) {
    return null
  }

  if (!isAuthenticated || !userId) {
    return <Outlet />
  }

  const currentRoute = normalizePath(location.pathname)

  if (isMobile && !MOBILE_ALLOWED_ROUTES.has(currentRoute)) {
    return <Navigate to="/chat" replace />
  }

  return (
    <div
      className={`general-container ${
        isMobile ? "general-container--mobile" : ""
      }`}
    >
      {!isMobile && <Navbar id={Number(userId)} />}

      <AssignModal />

      <main className="general-container__content">
        <Outlet />
      </main>

      {isMobile && <MobileNavbar />}
    </div>
  )
}

export default MainLayout