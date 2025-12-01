/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CategoriaPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface";
import { CategoryPCGyService } from "@/Services/CategoryPCGyService";
import { useCallback, useState } from "react";

export function useCategoryPCG(){
    const [categoryPcg, setCategoryPcg] = useState<CategoriaPCGInterface[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)

    const GetAll = useCallback(async () =>{
    setLoading(true);
    setError(null)

    try{
        const item = await CategoryPCGyService.GetAll();
        setCategoryPcg(item)
    }catch(err: any){
        setError(err)

    }finally{
        setLoading(false)
    }
 },[])  
 
 return{
    categoryPcg,
     loading,
     error,
     GetAll,
 }
}