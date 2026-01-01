import {useCallback, useState} from 'react'
import type { Currencyto, InvoiceOrderInterface, InvoiceOrderRequestDto, 
    NearestBranchRequestDto, NearestBranchResponseDto, 
    PrintOrdenFactInterfaceRaw } from "@/Interfaces/Ecommerce/InvoiceOrderInterface"
import { InvoiceOrderService } from '@/Services/Ecommerce/InvoiceOrderService';
import { toast } from 'react-toastify';

const useInvoiceOrder = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [invoiceOrders, setInvoiceOrders] = useState<InvoiceOrderRequestDto | null>(null)
  const [invoiceOrder, setInvoiceOrder] = useState<InvoiceOrderInterface | null>(null);
  const [nearestBranch, setNearestBranch] = useState<NearestBranchResponseDto | null>(null);
  const[transportationCost, setTransportationCost] = useState<number>(0)
  const [currency, setCurrency] = useState<Currencyto[] | []>([])
  const [printOrdenFac, setPrintOrdenFac] = useState<PrintOrdenFactInterfaceRaw | null>(null)
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingInvoice, setLoadingInvoice] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const CreateAsync = useCallback(async(req: InvoiceOrderRequestDto)=>{
    setLoadingInvoice(false)
    setError(null)

    try{
        const res = await InvoiceOrderService.Create(req);

        if(res.success){
            // setInvoiceOrders(res.data);
            setLoadingInvoice(false)
            return res;
            // toast.success(res.message);
        }else{
            toast.error(res.message);
        }
        
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }catch(err: any){
        setError(err)
    }finally{
        setLoadingInvoice(false)
    }
  }, [])
  
  const GetLastestAsync = useCallback(async(req: number)=>{
    setLoading(false);
    setError(null)
    try{
        const res = await InvoiceOrderService.GetLastest(req);

        if(res.success){
            setInvoiceOrder(res.data)
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
  },[])


  const PrintDetFacAsync = useCallback(async(req: string)=>{
    setLoading(false);
    setError(null)
    try{
        const res = await InvoiceOrderService.PrintDetFac(req);

        if(res.success){
            setLoading(false)
            setPrintOrdenFac(res.data)
            return res.data
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
  },[])
  

  const GetNearestBranchAsync = useCallback(async(req: NearestBranchRequestDto)=>{
    setLoading(true)
    setError(null)

    try{
        const data = await InvoiceOrderService.GetNearestBranch(req);

        if(data.success){
            setNearestBranch(data.data)
            // toast.success(data.message)
            setLoading(false)
            return data.data
        }else{
            toast.error(data.message);
        }
        
        return data.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }catch(err: any){
        setError(err)
    }finally{
        setLoading(false)
    }
  }, [])

  const GetTransportationCostAsync = useCallback(async (req: number)=>{
    setLoading(true)
    setError(null)

    try{
        const res = await InvoiceOrderService.GetTransportationCost(req);

        if(res.success){
            setTransportationCost(res.data)
            // toast.success(res.success)
            setLoading(false)
            return res.data
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


    const GetCurrencyAsync = useCallback(async()=>{
        setLoading(true)
        setError(null)

        try {
            const res = await InvoiceOrderService.GetCurrency();

            if(res.success){
                setCurrency(res.data)
                // toast.success(res.message)
            }else{
                toast.error(res.message)
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err)
        }finally{
            setLoading(false)
        }
    }, [])
  
  return {
    invoiceOrders,
    invoiceOrder,
    nearestBranch,
    transportationCost,
    currency,
    loading,
    error,
    CreateAsync,
    GetLastestAsync,
    GetNearestBranchAsync,
    GetTransportationCostAsync,
    GetCurrencyAsync,
    PrintDetFacAsync,
    printOrdenFac,
    setPrintOrdenFac,
    loadingInvoice
  }
}

export default useInvoiceOrder
