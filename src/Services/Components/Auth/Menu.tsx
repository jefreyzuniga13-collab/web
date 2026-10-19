import React, { useState } from "react";
import * as Icons from "lucide-react";
import {SquareArrowLeft,SquareArrowRight} from "lucide-react";
import {useLocation,useNavigate} from "react-router-dom";
import {useDispatch,useSelector} from "react-redux";
import { useMenus } from "@/Hooks/Auth/useMenus";
import MenuItem from "@/Services/Components/Auth/MenuItem";
import { markOffline } from "@/Hooks/Auth/useUserPresence";
import { logoutThunk } from "@/Context/Slices/Auth/authThunks";
import type { AppDispatch } from "@/Context";
import { selectActiveCompanyImage, selectActiveCompanyName, selectActiveCompanyWhPhone,} from "@/Context/Slices/Auth/companySlice";
import { selectCompanyImageUrl, selectUserFullName, selectUserId, selectUserImageUrl,} from "@/Context/Slices/Auth/authSlice"
import Profile from "@/assets/img/profile.png";
import "@/Styles/Auth/Navbar.css";

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
  const icons =
    Icons as unknown as Record<
      string,
      React.ElementType
    >;

  return icons[iconName] ?? Icons.Menu;
};

const Navbar: React.FC = () => {
  const {
    menus,
    loading,
    error,
  } = useMenus();

  const [collapsed, setCollapsed] =
    useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const dispatch =
    useDispatch<AppDispatch>();

  const userId = useSelector(
    selectUserId,
  );

  const userFullName = useSelector(
    selectUserFullName,
  );

  const userImageUrl = useSelector(
    selectUserImageUrl,
  );

  const companyImageUrl = useSelector(
    selectCompanyImageUrl,
  );

  const activeCompanyImage = useSelector(
    selectActiveCompanyImage,
  );

  const activeCompanyName = useSelector(
    selectActiveCompanyName,
  );

  const activeCompanyWhPhone =
    useSelector(
      selectActiveCompanyWhPhone,
    );

  const selectedUrl = normalizePath(
    location.pathname,
  );

  const companyImageSrc =
    activeCompanyImage ||
    companyImageUrl;

  const companyHeader = [
    activeCompanyName,
    activeCompanyWhPhone,
  ]
    .filter(Boolean)
    .join(" - ");

  const handleLogout =
    async (): Promise<void> => {
      try {
        if (userId > 0) {
          await markOffline(userId);
        }
      } catch (currentError) {
        console.warn(
          "[Navbar] No se pudo marcar al usuario como desconectado.",
          currentError,
        );
      }

      try {
        await dispatch(
          logoutThunk(),
        ).unwrap();
      } catch (currentError) {
        console.error(
          "[Navbar] No se pudo cerrar la sesión.",
          currentError,
        );
      }
    };

  const handleMenuClick = async (
    url: string,
    text: string,
  ): Promise<void> => {
    const normalizedUrl =
      normalizePath(url);

    const normalizedText =
      text.toLowerCase();

    const isLogout =
      normalizedText.includes(
        "cerrar",
      ) ||
      normalizedText.includes(
        "salir",
      ) ||
      normalizedUrl === "logout";

    if (isLogout) {
      await handleLogout();
      return;
    }

    navigate(
      `/${url.replace(/^\/+/, "")}`,
    );
  };

  if (error) {
    return (
      <div className="navbar__error">
        Error cargando menú.
      </div>
    );
  }

  return (
    <nav
      className={`navbar ${
        collapsed
          ? "navbar--collapsed"
          : ""
      }`}
      aria-label="Navegación principal"
    >
      <div className="navbar__header">
        <button
          type="button"
          className="navbar__collapse-btn"
          onClick={() => {
            setCollapsed(
              (current) => !current,
            );
          }}
          aria-label={
            collapsed
              ? "Expandir menú"
              : "Contraer menú"
          }
          title={
            collapsed
              ? "Expandir menú"
              : "Contraer menú"
          }
        >
          {collapsed ? (
            <SquareArrowRight
              size={20}
            />
          ) : (
            <SquareArrowLeft
              size={20}
            />
          )}
        </button>
      </div>

      <ul className="navbar__menu">
        {loading &&
        menus.length === 0 ? (
          <li className="navbar__menu-loading">
            Cargando menú...
          </li>
        ) : (
          menus.map((menu) => {
            const Icon =
              getLucideIcon(
                menu.icon,
              );

            const isSelected =
              selectedUrl ===
              normalizePath(
                menu.url,
              );

            return (
              <MenuItem
                key={menu.menuId}
                icon={
                  <Icon size={20} />
                }
                text={menu.name}
                onClick={() => {
                  void handleMenuClick(
                    menu.url,
                    menu.name,
                  );
                }}
                selected={isSelected}
                className={
                  collapsed
                    ? "collapsed-styles"
                    : ""
                }
                collapsed={collapsed}
              />
            );
          })
        )}
      </ul>

      <div className="navbar__profile">
        <img
          src={
            userImageUrl || Profile
          }
          alt="Foto de perfil"
          className="navbar__profile-photo"
        />

        <span className="navbar__profile-name">
          {userFullName ||
            "Usuario"}
        </span>

        {companyImageSrc && (
          <img
            src={companyImageSrc}
            alt="Logo de la empresa"
            className="navbar__logo"
          />
        )}

        {companyHeader && (
          <p className="navbar__header__text">
            {companyHeader}
          </p>
        )}
      </div>

      <p className="navbar__copyright">
        © {new Date().getFullYear()}{" "}
        PC Group S.A.
      </p>
    </nav>
  );
};

export default Navbar;