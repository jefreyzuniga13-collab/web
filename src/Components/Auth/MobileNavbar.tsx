import React from "react";
import * as Icons from "lucide-react";
import {useLocation,useNavigate} from "react-router-dom";
import {useDispatch,useSelector} from "react-redux";
import { useMenus } from "@/Hooks/Auth/useMenus";
import { markOffline } from "@/Hooks/Auth/useUserPresence";
import { logoutThunk } from "@/Context/Slices/Auth/authThunks";
import { selectUserId } from "@/Context/Slices/Auth/authSlice";
import type { AppDispatch } from "@/Context";
import "@/Styles/Auth/MobileNavbar.css";

type MobileMenuItem = {
  key: string;
  name: string;
  url: string;
  icon: string;
  isLogout?: boolean;
};

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
];

const normalizePath = (
  value: string,
): string => {
  return value
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
};

const getLucideIcon = (
  iconName: string,
): React.ElementType => {
  const icons = Icons as unknown as Record<
    string,
    React.ElementType
  >;

  return icons[iconName] ?? Icons.Menu;
};

const MobileNavbar: React.FC = () => {
  const { menus, error } = useMenus();

  const navigate = useNavigate();
  const location = useLocation();

  const dispatch = useDispatch<AppDispatch>();

  const userId = useSelector(selectUserId);

  const selectedUrl = normalizePath(
    location.pathname,
  );

  const handleLogout = async (): Promise<void> => {
    try {
      if (userId > 0) {
        await markOffline(userId);
      }
    } catch (currentError) {
      console.warn(
        "[MobileNavbar] No se pudo marcar al usuario como desconectado.",
        currentError,
      );
    }

    try {
      /*
       * Único flujo de logout.
       * No se llama useAuth().logout() ni se redirige
       * manualmente porque logoutThunk ya lo realiza.
       */
      await dispatch(logoutThunk()).unwrap();
    } catch (currentError) {
      console.error(
        "[MobileNavbar] No se pudo cerrar la sesión.",
        currentError,
      );
    }
  };

  const handleMenuClick = async (
    item: MobileMenuItem,
  ): Promise<void> => {
    if (item.isLogout) {
      await handleLogout();
      return;
    }

    navigate(
      `/${item.url.replace(/^\/+/, "")}`,
    );
  };

  if (error) {
    return null;
  }

  const allowedMenus =
    MOBILE_ALLOWED_MENU.map((mobileItem) => {
      const backendMenu = menus.find(
        (menu) =>
          normalizePath(menu.url) ===
            normalizePath(mobileItem.url) ||
          menu.name
            .toLowerCase()
            .includes(
              mobileItem.name.toLowerCase(),
            ),
      );

      return {
        ...mobileItem,
        name:
          backendMenu?.name ??
          mobileItem.name,
        url:
          backendMenu?.url ??
          mobileItem.url,
        icon:
          backendMenu?.icon ??
          mobileItem.icon,
      };
    });

  return (
    <nav
      className="mobile-navbar"
      aria-label="Navegación móvil"
    >
      {allowedMenus.map((item) => {
        const Icon = getLucideIcon(
          item.icon,
        );

        const isSelected =
          !item.isLogout &&
          selectedUrl ===
            normalizePath(item.url);

        return (
          <button
            key={item.key}
            type="button"
            className={`mobile-navbar__item ${
              isSelected
                ? "mobile-navbar__item--selected"
                : ""
            } ${
              item.isLogout
                ? "mobile-navbar__item--logout"
                : ""
            }`}
            onClick={() => {
              void handleMenuClick(item);
            }}
            title={item.name}
          >
            <Icon size={19} />
            <span>{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNavbar