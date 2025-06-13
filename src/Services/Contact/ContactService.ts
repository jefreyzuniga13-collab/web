import api from '@/Utils/ApiConfig'
import type { ContactLogInterface } from '@/Interfaces/Contact/ContactInterface';
import type { ApiResponse } from '@/Interfaces/User/UserInterfaces';

class ContactService{
    async getContactByIdAsync(id: number): Promise<ContactLogInterface> {

        const { data } = await api.get<ApiResponse<ContactLogInterface>>(`/contactLogs/${id}`)

        return data.data;

    }

    async updateSystemParams(params: ContactLogInterface) {
        try {
        const response = await api.put<ApiResponse<ContactLogInterface>>(`/contactLogs/${params.id}`, params)
        return response.data
        } catch (error) {
        console.error('Error updating system parameters:', error)
        throw error
        }
    }
}

export const contactService = new ContactService();