/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ProductoModificadorPCGInterface, 
    ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface";

import { ProductPCGService } from "@/Services/ProductPCGService";
import { useCallback, useState } from "react";

export function useProductPCG(){
    const [productPcg, setProductPcg] = useState<ProductoPCGInterface[]>([])
    const [productModifiers, setProductModifiers] = useState<ProductoModificadorPCGInterface[]>([])
    const [loadingProductPcg, setLoadingProductPcg] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)

    const GetAll = useCallback(async (descripcion: string) =>{
    setLoadingProductPcg(true);
    setError(null)

    try{
        const item = await ProductPCGService.getAll(descripcion);
        setProductPcg(item)
    }catch(err: any){
        setError(err)

    }finally{
        setLoadingProductPcg(false)
    }
 },[])  
 

 const GetByCategory = useCallback(async (codGrupo: string) =>{
    setLoadingProductPcg(true);
    setError(null)

    try{
        const item = await ProductPCGService.GetByCategory(codGrupo);
        setProductPcg(item)
    }catch(err: any){
        setError(err)

    }finally{
        setLoadingProductPcg(false)
    }
 },[])  

  const GetByCode = useCallback(async (codProducto: string) =>{
    setLoadingProductPcg(true);
    setError(null)
    try{
        const item = await ProductPCGService.GetByCode(codProducto);
        setProductPcg(item)
    }catch(err: any){
        setError(err)

    }finally{
        setLoadingProductPcg(false)
    }
 },[])


   const getProductModifiers = useCallback(async (codProducto: string) =>{
    setLoadingProductPcg(true);
    setError(null)
    try{
        const item = await ProductPCGService.getProductModifiers(codProducto);
        setProductModifiers(item)
        return item;
    }catch(err: any){
        setError(err)

    }finally{
        setLoadingProductPcg(false)
    }
 },[])
 
 return{
     productPcg,
     productModifiers,
     loadingProductPcg,
     error,
     GetAll,
     GetByCode,
     GetByCategory,
     getProductModifiers
 }
}