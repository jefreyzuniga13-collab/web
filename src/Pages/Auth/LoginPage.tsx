
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import "@/Styles/Auth/LoginPresentation.css";
import useLoginForm from "@/Hooks/Auth/useLoginForm";
import { ActivationSesionModal } from "@/Components/Auth/ActivationSesionModal";
import logopcg from '@/assets/pcgroup.png'
import addGroup from '@/assets/Add_Group_2025.png'
import { FaFacebook } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa6";
import { FaInstagramSquare } from "react-icons/fa";
import { FaTiktok } from "react-icons/fa";

export default function LoginPresentation() {
  const { t } = useTranslation();
  const {
    formik,
    loading,
    showPassword,
    toggleShowPassword,
    canSubmit,
    formError,
    showModal,
    confirmLogin,
    cancelLogin
  } = useLoginForm();


  //Inicar sesión cuando se hace click en el enter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEnterKey = (event: any) => {
    if (event.key === 'Enter') {
      confirmLogin();
    }
  };

  return (
    <div className={`login ${loading ? 'login--loading' : ''}`}>
      <div className="login__container">   
        {/* <aside className="login__info-panel">
           <h1 className="login__title">PC Group SA, soluciones informaticas sin limites</h1>
          <img
            className="login__image"
            src={`${logopcg}`}
            alt={t("login.imageAlt")}
          />
          
          <ul className="social_media_container">
            <li className="social_media_list"><a href="https://www.facebook.com/61567499630347"
            target="_blank" className="social_media_link"><FaFacebook fontSize={12} className="social_media_icons"/></a></li>
            <li className="social_media_list"><a href="https://www.instagram.com/pcgroupsa/"
            target="_blank" className="social_media_link"><FaInstagramSquare fontSize={12} className="social_media_icons"/></a></li>
            <li className="social_media_list"><a href="https://www.tiktok.com/@pcgroupsa"
            target="_blank" className="social_media_link"><FaTiktok fontSize={12} className="social_media_icons"/></a></li>
            <li className="social_media_list"><a href="https://ni.linkedin.com/company/pc-group-s-a"
            target="_blank" className="social_media_link"><FaLinkedin fontSize={12} className="social_media_icons"/></a></li>
          </ul>
        </aside> */}

        <section className={`login__form-section ${formError ? 'login__form-section--error' : ''}`}>
          {formError && <div className="login__error">{formError}</div>}

          <div className="image__container">
            <img
            className="login__image"
            src={`${addGroup}`}
            alt={t("login.imageAlt")}
          />
          </div>
          <form onSubmit={formik.handleSubmit} noValidate>
            <label htmlFor="email" className="login__label">
              {t("login.emailLabel")}
            </label>

            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              autoFocus
              onKeyDown={handleEnterKey}
              error={formik.touched.email ? formik.errors.email : undefined}
            />

            <label htmlFor="password" className="login__label">
              {t("login.passwordLabel")}
            </label>

            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("login.passwordPlaceholder")}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.password ? formik.errors.password : undefined
              }
              rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
              onIconClick={toggleShowPassword}
              onKeyDown={handleEnterKey}
            />

            <div className="login__options">
              <Link to="/forgot-password" replace className="login__forgot-link">
                {t("login.forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit || loading}
              className="login__submit-button"
              onKeyDown={handleEnterKey}
            >
           <p className="login__submit-text">
               {loading ? `${t("login.submit")}…` : t("login.submit")}
           </p>
            </Button>
          </form>

            <ul className="social_media_container">
            <li className="social_media_list"><a href="https://www.facebook.com/61567499630347"
            target="_blank" className="social_media_link"><FaFacebook fontSize={12} className="social_media_icons"/></a></li>
            <li className="social_media_list"><a href="https://www.instagram.com/pcgroupsa/"
            target="_blank" className="social_media_link"><FaInstagramSquare fontSize={12} className="social_media_icons"/></a></li>
            <li className="social_media_list"><a href="https://www.tiktok.com/@pcgroupsa"
            target="_blank" className="social_media_link"><FaTiktok fontSize={12} className="social_media_icons"/></a></li>
            <li className="social_media_list"><a href="https://ni.linkedin.com/company/pc-group-s-a"
            target="_blank" className="social_media_link"><FaLinkedin fontSize={12} className="social_media_icons"/></a></li>
          </ul>
        
        </section>
       </div>

          <img
              className="login__image-footer"
              src={`${logopcg}`}
              alt={t("login.imageAlt")}
            />
        <p className="login__footer">©<span className="derechos">2025 PC Group S.A. Todos los derechos reservados.</span></p>
        <p className="login__footer"><span className="derechos">Add Group 2.0</span></p>

      {showModal && (
        <ActivationSesionModal
          onAccept={confirmLogin}
          onCancel={cancelLogin}
        />
      )}
    </div>
  );
}
