import type { INNOVAClientResultInterface } from "@/Interfaces/InnovaInterface";
import { InnovaService } from "@/Services/InnovaService";
import { useState } from "react";

export function useInnova (){
    const [data, setData] = useState<INNOVAClientResultInterface[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)


    const getAllAsync = async() => {
        setLoading(true);
        setError(null)
        try{
            const result = await InnovaService.getInnovaClientAsync();
            setData(result);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }catch(err: any){
            setError(err)
        }finally{
            setLoading(false)
        }
    };

    return{
        data,
        loading,
        error,
        getAllAsync
    }
}