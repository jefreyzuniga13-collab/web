import type { ContactLogInterface } from "@/Interfaces/Contact/ContactInterface"
import { contactService } from "@/Services/Contact/ContactService"
import { useCallback, useState } from "react"

export function useContacts(){
    const [contacts] = useState<ContactLogInterface[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
   

    const getContactById = useCallback(async (id: number) => {
        setLoading(true)
        setError(null)

        try {
        const param = await contactService.getContactByIdAsync(id);
        return param
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
        setError(err.message || `Error getting contat with name ${id}`)
        return null
        } finally {
        setLoading(false)
        }
    }, [])
    
    return {
        contacts,
        loading,
        error,
        getContactById,
    }
}