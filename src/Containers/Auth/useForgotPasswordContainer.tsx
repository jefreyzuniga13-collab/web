import { useAuth } from '@/Hooks/useAuth'
import type { ForgotPasswordRequest } from '@/Interfaces/Auth/AuthInterface'
import {useFormik} from 'formik'
import {useMemo} from 'react'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'


const useForgotPasswordContainer = () => {
    const {t} = useTranslation();
    const {forgotPasswordAsync, loading} = useAuth();

    const validationSchema = useMemo(
        ()=>
            Yup.object<ForgotPasswordRequest>({
                email: Yup.string()
                .email(t("forgotPassword.invalidEmail"))
                .required(t("forgotPassword.requiredEmail", {field: t("forgotPassword.emailLabel")}))
            }),
            [t]
    )

    const formik = useFormik<ForgotPasswordRequest>({
        initialValues: {email:""},
        validationSchema,
        validateOnBlur: true,
        validateOnChange:false,
        onSubmit: async(values, {setStatus, setSubmitting})=>{
            setStatus(undefined);

            try{
                const {email}= values;
                await forgotPasswordAsync({email});

            }catch(err:unknown){
                const msg =
                err instanceof Error ? err.message : t("forgotPassword.errors");
                setStatus(msg)
            }finally{
                setSubmitting(false);
            }
        }
    })

  return {
    formik,
    loading,
    canSubmit: formik.isValid && formik.dirty && !loading,
    formError: formik.status as string | undefined
  }
}

export default useForgotPasswordContainer;