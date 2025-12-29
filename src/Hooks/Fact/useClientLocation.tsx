import {useCallback, useState} from 'react'
import {ClientLocationService} from '@/Services/Fact/ClientLocationService'
import {toast} from 'react-toastify'
import type { ClientLocationDto } from '@/Interfaces/Fact/ClientLocationInterface'

export const useClientLocation = () =>{
    const [clientLocation, setClientLocation] = useState<ClientLocationDto | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)

    const CreateAsync = useCallback(async (req: ClientLocationDto)=>{
        setLoading(true)
        setError(null)

        try{
            const res = await ClientLocationService.Create(req);

            if(res.success){
                setClientLocation(res.data)
                // toast.success(res.message);
                return res.data
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

    const GetAsync = useCallback(async (req: number)=>{
        setLoading(false)
        setError(null)

        try{
            const res = await ClientLocationService.Get(req);
            if(res.success){
                setClientLocation(res.data)
                // toast.success(res.message)
            }else{
                toast.error(res.message)
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }catch(err: any){
            setError(err)
        }finally{
            setLoading(false)
        }
    }, [])


    const GetTransCostAsync = useCallback(async (req: number)=>{
        setLoading(false)
        setError(null)

        try{
            const res = await ClientLocationService.GetTranspCost(req);
            if(res.success){
                return res;
                // setClientLocation(res.data)
                // toast.success(res.message)
            }else{
                toast.error(res.message)
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }catch(err: any){
            setError(err)
        }finally{
            setLoading(false)
        }
    }, [])
    
    return{
        clientLocation,
        setClientLocation,
        loading,
        error,
        CreateAsync,
        GetAsync,
        GetTransCostAsync
    }
}