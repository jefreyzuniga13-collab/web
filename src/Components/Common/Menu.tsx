import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { LuNotepadText } from "react-icons/lu";
import { RiContactsBookFill } from "react-icons/ri";
import { RiInboxArchiveFill } from "react-icons/ri";
import { MdAdsClick } from "react-icons/md";
import "@/Styles/Chat/Menu.css";

const Menu = () => {
  const { t } = useTranslation();

  return (
    <aside className="menu-container">
      <div className="menu-imageBox">
        <img
          src="https://i.ibb.co/QvGQNqLV/logopcg.png"
          alt={"menu.logo"}
          className="menu-logo"
        />
      </div>

      <ul className="menu-options">
        <li>
          <RiInboxArchiveFill className="menu-icons" />
          <span> Inbox</span>
        </li>
        <li>
          <MdAdsClick className="menu-icons" />
          <span>Asign to</span>
        </li>
        <li>
          <LuNotepadText className="menu-icons" />
         <span> Asign to me</span>
        </li>
        <li>
          <RiContactsBookFill className="menu-icons" />
         <span> Contect</span>
        </li>
      </ul>

      <Link to="/login" replace className="menu-logout">
        <img
          src="https://i.ibb.co/tpfwg3xW/user-Profile.jpg"
          className="menu-profileImage"
          alt={t("menu.profile")}
        />
        <span className="menu-profile-text">Cerrar Sesión</span>
      </Link>
    </aside>
  );
};

export default Menu;