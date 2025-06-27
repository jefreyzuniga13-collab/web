import api from '@/Utils/ApiConfig'
import type { ContactLogInterface } from '@/Interfaces/Contact/ContactInterface';
import type { ApiResponse } from '@/Interfaces/User/UserInterfaces';

class ContactService{
    async getContactByIdAsync(id: number): Promise<ContactLogInterface> {

        const { data } = await api.get<ApiResponse<ContactLogInterface>>(`/contactLogs/${id}`)

        return data.data;

    }

    async getContactByPhoneAsync(phone: string): Promise<ContactLogInterface> {

        const { data } = await api.get<ApiResponse<ContactLogInterface>>(`/ContactLogs/contact/${phone}`)

        return data.data;

    }

    async updateContactAsync(params: ContactLogInterface) {
        try {
        const response = await api.put<ApiResponse<ContactLogInterface>>(`/ContactLogs/${params.id}`, params)
        return response.data;
        } catch (error) {
        console.error('Error updating system parameters:', error)
        throw error
        }
    }

    async verifyContactAsync(id: number){
        try{
            const response = await api.put<ApiResponse<ContactLogInterface>>(`/Contactlogs/verifyContact/${id}`);
            return response.data;
        }catch(error){
            console.error(error);
        }
    }
}

export const contactService = new ContactService();