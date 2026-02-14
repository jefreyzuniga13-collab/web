// import type { InnovaClient, INNOVAClientResultInterface } from "@/Interfaces/Crm/InnovaInterface";
// import { InnovaService } from "@/Services/Crm/InnovaService";
// import { useState } from "react";

// const initialStatus: InnovaClient = {
// nombre: '',
// codCliente: '',
// direccion: '',
// telefono: '',
// celular: '',
// finalContrato: '',
// saldoUltimoCorte: 0.00
// }

// export function useInnova (){
//     const [data, setData] = useState<INNOVAClientResultInterface[]>([])
//     const [client, setClient] = useState<InnovaClient>(initialStatus)
//     const [loading, setLoading] = useState<boolean>(false)
//     const [error, setError] = useState<string | null>(null)


//     const getAllAsync = async() => {
//         setLoading(true);
//         setError(null)
//         try{
//             const result = await InnovaService.getInnovaClientAsync();
//             setData(result);

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         }catch(err: any){
//             setError(err)
//         }finally{
//             setLoading(false)
//         }
//     };

//     const getByIdAsync = async(codClient: string) => {
//         setLoading(true);
//         setError(null)
//         try{
            
//             const result = await InnovaService.getInnovaClientByIdAsync(codClient);
//             setClient(result);

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         }catch(err: any){
//             setError(err)
//         }finally{
//             setLoading(false)
//         }
//     };

//     return{
//         data,
//         loading,
//         error,
//         getAllAsync,
//         client,
//         getByIdAsync,
//         setClient
//     }
// }
