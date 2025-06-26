/* eslint-disable @typescript-eslint/no-explicit-any */
import {useState, useEffect} from 'react'
import type { CompanyInterface } from '@/Interfaces/Company/CompanyInterface'
import {CompanyService} from '@/Services/CompanyService'

export const useCompany = () => {

    const [companies, setCompanies] = useState<CompanyInterface[] | null>(null)
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
         getAllAsync();
    }, [])
    
    const getAllAsync = async()=>{
        setLoading(true)
        setError(null)
        try{
            const data = await CompanyService.getAllAsync();
            setCompanies(data);
        }catch(err: any){
            setError(err)
            console.error("Error. Company request.")
        }finally{
            setLoading(false)
        }
    }

  return {
    error,
    loading,
    companies,
    getAllAsync
  }
}
