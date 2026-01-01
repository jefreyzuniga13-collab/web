import { Link } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import Input from '@/Components/Common/Input'
import Select from '@/Components/Common/Select'
import Button from '@/Components/Common/Button'
import '@/Styles/Auth/RegisterPresentation.css'
import useRegisterForm from '@/Hooks/Auth/useRegisterForm'

export default function RegisterPresentation() {
  const {
    formik,
    companies,
    fetchError,
    loading,
    showPassword,
    toggleShowPassword,
    canSubmit,
    formError
  } = useRegisterForm()

  return (
    <div className={`register ${loading ? 'register--loading' : ''}`}>
      <div className="register__container">
        <aside className="register__info-panel">
          <h1 className="register__title">Crear cuenta</h1>
          <p className="register__description">
            Completa el formulario para crear tu cuenta y comenzar a usar la plataforma.
          </p>
          <ul className="register__steps">
            {[
              'Ingresa tu información personal',
              'Selecciona tu empresa',
              'Crea una contraseña segura',
              'Confirma y finaliza el registro'
            ].map((step, index) => (
              <li key={index} className="register__steps-item">{step}</li>
            ))}
          </ul>
          <img 
            src="https://i.ibb.co/F26HCTK/singup.png" 
            alt="Registro de usuario" 
            className="register__image"
          />
        </aside>

        <section
          className={`register__form-section ${(formError || fetchError) ? 'register__form-section--error' : ''}`}
        >
          {(formError || fetchError) && (
            <div className="register__error">{formError || fetchError}</div>
          )}

          <form onSubmit={formik.handleSubmit} className="register__form-grid" noValidate>
            <div className="register__field-group">
              <label htmlFor="fullName" className="register__label">Nombre completo</label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Ej. Juan Pérez"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fullName ? formik.errors.fullName : undefined}
              />

              <label htmlFor="email" className="register__label">Correo electrónico</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email ? formik.errors.email : undefined}
              />

              <label htmlFor="companyId" className="register__label">Empresa</label>
              <Select
                id="companyId"
                name="companyId"
                options={companies}
                value={formik.values.companyId}
                onChange={e => formik.setFieldValue('companyId', Number(e.target.value))}
                onBlur={() => formik.setFieldTouched('companyId', true)}
                error={formik.touched.companyId ? formik.errors.companyId : undefined}
                placeholder="Selecciona una empresa"
              />

              <label htmlFor="phone" className="register__label">Teléfono</label>
              <Input
                id="phone"
                name="phone"
                placeholder="Ej. 8888-8888"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone ? formik.errors.phone : undefined}
              />
            </div>

            <div className="register__field-group">
              <label htmlFor="identifier" className="register__label">Identificador</label>
              <Input
                id="identifier"
                name="identifier"
                placeholder="Ej. 001234"
                value={formik.values.identifier}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.identifier ? formik.errors.identifier : undefined}
              />

              <label htmlFor="password" className="register__label">Contraseña</label>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
                onIconClick={toggleShowPassword}
                error={formik.touched.password ? formik.errors.password : undefined}
              />
            </div>

            <div className="register__actions">
              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit || loading}
                className="register__submit-button"
              >
                {loading ? 'Registrando…' : 'Crear cuenta'}
              </Button>

              <p className="register__login-text">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/" className="register__login-link">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}