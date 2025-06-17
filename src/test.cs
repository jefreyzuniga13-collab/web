import useLoginForm from "@/Hooks/Auth/useLoginForm";
import { ActivationSesionModal } from "@/Components/Auth/ActivationSesionModal";

const LoginPage = () => {
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

  return (
    <>
      <form onSubmit={formik.handleSubmit}>
        {/* Tu formulario de login aquí */}
      </form>

      {showModal && (
        <ActivationSesionModal
          onAccept={confirmLogin}
          onCancel={cancelLogin}
        />
      )}
    </>
  );
};

export default LoginPage;
