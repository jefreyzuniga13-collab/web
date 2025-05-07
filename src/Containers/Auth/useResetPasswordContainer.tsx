import { useAuth } from '@/Hooks/useAuth'
import type { ResetPasswordRequest } from '@/Interfaces/Auth/AuthInterface'
import {useFormik} from 'formik'
import {useMemo} from 'react'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import {useState} from 'react'

const useResetPasswordContainer = () => {
    const {t} = useTranslation();
    const {resetPasswordAsync, loading} = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmShowPassword, setShowConfirmNewPassword] = useState(false);

    const validationSchema = useMemo(
        ()=>
            Yup.object<ResetPasswordRequest>({
                token: Yup.string()
                .required(t("resetPassword.requiredToken", {field: t("forgotPassword.tokenLabel")})),
                newPassword: Yup.string()
                .required(t("resetPassword.requiredNewPassword", {field: t("forgotPassword.newPasswordLabel")})),
                confirmNewPassword: Yup.string()
                .required(t("resetPassword.requiredConfirmNewPassword", {field: t("forgotPassword.confirmNewPasswordLabel")}))
            }),
            [t]
    )

    const formik = useFormik<ResetPasswordRequest>({
        initialValues: {token: '', newPassword: '', confirmNewPassword: ''},
        validationSchema,
        validateOnBlur: true,
        validateOnChange:false,
        onSubmit: async(values, {setStatus, setSubmitting})=>{
            setStatus(undefined);

            try{
                const {token, newPassword, confirmNewPassword}= values;
                await resetPasswordAsync({
                    token, 
                    newPassword,
                    confirmNewPassword
                });

            }catch(err:unknown){
                const msg =
                err instanceof Error ? err.message : t("resetPassword.errors.ResetPasswordFailed");
                setStatus(msg)
            }finally{
                setSubmitting(false);
            }
        }
    })

  return {
    formik,
    loading,
    showPassword,
    toggleShowPassword: () => setShowPassword((v) => !v),
    showConfirmShowPassword,
    toggleShowConfirmPassword: () => setShowConfirmNewPassword((v) => !v),
    canSubmit: formik.isValid && formik.dirty && !loading,
    formError: formik.status as string | undefined,
  }
}

export default useResetPasswordContainer;