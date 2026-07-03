import React from "react"
import * as Icons from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { useMenus } from "@/Hooks/Auth/useMenus"
import { useAuth } from "@/Hooks/Auth/useAuth"
import { presenceConnection } from "@/Services/signalr"
import { markOffline } from "@/Hooks/Auth/useUserPresence"
import { logoutThunk } from "@/Context/Slices/Auth/authThunks"
import type { AppDispatch } from "@/Context"
import { selectUserId } from "@/Context/Slices/Auth/authSlice"
import "@/Styles/Auth/MobileNavbar.css"

export const useAppDispatch: () => AppDispatch = useDispatch

type MobileMenuItem = {
  key: string
  name: string
  url: string
  icon: string
  isLogout?: boolean
}

const MOBILE_ALLOWED_MENU: MobileMenuItem[] = [
  {
    key: "dashboard",
    name: "Dashboard",
    url: "performaceDashboard",
    icon: "LayoutDashboard",
  },
  {
    key: "chat",
    name: "Chat",
    url: "chat",
    icon: "MessageSquare",
  },
  {
    key: "logout",
    name: "Salir",
    url: "logout",
    icon: "LogOut",
    isLogout: true,
  },
]

const normalizePath = (value: string) => {
  return value.replace(/^\/+/, "").toLowerCase()
}

const getLucideIcon = (iconName: string): React.ElementType => {
  const icon = (Icons as unknown as Record<string, React.ElementType>)[iconName]

  return icon ?? Icons.Menu
}

const MobileNavbar: React.FC = () => {
  const { menus, error } = useMenus()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { logout: logoutAuth } = useAuth()

  const userId = useSelector(selectUserId)

  const selectedUrl = normalizePath(location.pathname)

  const handleLogout = async () => {
    try {
      await markOffline(Number(userId))
    } catch (error) {
      console.warn(error)
    }

    try {
      await presenceConnection?.stop()
    } catch {
      // no-op
    }

    await logoutAuth()
    dispatch(logoutThunk())
    navigate("/login", { replace: true })
  }

  const onClick = async (item: MobileMenuItem) => {
    if (item.isLogout) {
      await handleLogout()
      return
    }

    navigate(`/${item.url}`)
  }

  if (error) return null

  const allowedMenus = MOBILE_ALLOWED_MENU.map((mobileItem) => {
    const backendMenu = menus.find(
      (menu) =>
        normalizePath(menu.url) === normalizePath(mobileItem.url) ||
        menu.name.toLowerCase().includes(mobileItem.name.toLowerCase())
    )

    return {
      ...mobileItem,
      name: backendMenu?.name ?? mobileItem.name,
      url: backendMenu?.url ?? mobileItem.url,
      icon: backendMenu?.icon ?? mobileItem.icon,
    }
  })

  return (
    <nav className="mobile-navbar" aria-label="Navegación móvil">
      {allowedMenus.map((item) => {
        const Icon = getLucideIcon(item.icon)

        const isSelected =
          !item.isLogout && selectedUrl === normalizePath(item.url)

        return (
          <button
            key={item.key}
            type="button"
            className={`mobile-navbar__item ${
              isSelected ? "mobile-navbar__item--selected" : ""
            } ${item.isLogout ? "mobile-navbar__item--logout" : ""}`}
            onClick={() => void onClick(item)}
            title={item.name}
          >
            <Icon size={19} />

            <span>{item.name}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default MobileNavbar