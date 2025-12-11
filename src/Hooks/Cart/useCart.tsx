/* eslint-disable @typescript-eslint/no-explicit-any */
import {useState} from 'react'
import {CartService} from '@/Services/Cart/CartService'
import { toast } from 'react-toastify'
import type { SendLinkRequestDto } from '@/Interfaces/Cart/SendLinkInterface'

export const useCart = () => {
    const [cart, setCart] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null)

    const SendMessageLink = async(req: SendLinkRequestDto)=>{
        setLoading(true)
        setError(null)
        try{
            const data = await CartService.SendMessageLink(req);
            setCart(data.data);
            if(data.success){
                toast.success(data.message);
            }else{
                toast.error(data.message)
            }
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
    SendMessageLink,
    cart
  }
}
