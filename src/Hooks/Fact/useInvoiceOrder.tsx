import {useCallback, useState} from 'react'
import type { Currencyto, InvoiceOrderInterface, InvoiceOrderRequestDto, NearestBranchRequestDto, NearestBranchResponseDto } from "@/Interfaces/Fact/InvoiceOrderInterface"
import { InvoiceOrderService } from '@/Services/Fact/InvoiceOrderService';
import { toast } from 'react-toastify';

const useInvoiceOrder = () => {
  const [invoiceOrders, setInvoiceOrders] = useState<InvoiceOrderRequestDto | null>(null)
  const [invoiceOrder, setInvoiceOrder] = useState<InvoiceOrderInterface | null>(null);
  const [nearestBranch, setNearestBranch] = useState<NearestBranchResponseDto | null>(null);
  const[transportationCost, setTransportationCost] = useState<number>(0)
  const [currency, setCurrency] = useState<Currencyto[] | []>([])

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const CreateAsync = useCallback(async(req: InvoiceOrderRequestDto)=>{
    setLoading(false)
    setError(null)

    try{
        const res = await InvoiceOrderService.Create(req);

        if(res.success){
            setInvoiceOrders(res.data);
            return res.success;
            // toast.success(res.message);
        }else{
            toast.error(res.message);
        }
        
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }catch(err: any){
        setError(err)
    }finally{
        setLoading(false)
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
  

  const GetNearestBranchAsync = useCallback(async(req: NearestBranchRequestDto)=>{
    setLoading(false)
    setError(null)

    try{
        const data = await InvoiceOrderService.GetNearestBranch(req);

        if(data.success){

            console.log("Data de GetNearestBranchAsync", data.data)
            setNearestBranch(data.data)
            // toast.success(data.message)
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
    setLoading(false)
    setError(null)

    try{
        const res = await InvoiceOrderService.GetTransportationCost(req);

        if(res.success){
            setTransportationCost(res.data)
            // toast.success(res.success)
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
        setLoading(false)
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
    GetCurrencyAsync
  }
}

export default useInvoiceOrder
