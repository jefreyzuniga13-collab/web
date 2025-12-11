import {useCallback, useState} from 'react'
import type {UserEcommerceDto} from '@/Interfaces/Ecommerce/UserEcommerceInterface'
import {UserEcommerceService} from '@/Services/Ecommerce/UserEcommerceService'
import {toast} from 'react-toastify'

export const useUserEcommerce = () =>{
    const [userEcommerce, setUserEcommerce] = useState< number | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)

    const CreateAsync = useCallback(async (req: UserEcommerceDto)=>{
        setLoading(true)
        setError(null)

        try{
            const res = await UserEcommerceService.Create(req);

            if(res.success){
                setUserEcommerce(res.data)
                toast.success(res.message);
            }else{
                toast.error(res.message);
            }

            return res.data
            
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }catch(err: any){
            setError(err)
        }finally{
            setLoading(false)
        }
    }, [])
    
    return{
        userEcommerce,
        setUserEcommerce,
        loading,
        error,
        CreateAsync,
    }
}