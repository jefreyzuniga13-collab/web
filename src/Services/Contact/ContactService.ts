import api from '@/Utils/ApiConfig'
import type { ClienteDetalleResponseDto, ClienteResponseDto, ContactLogInterface } from '@/Interfaces/Contact/ContactInterface';
import type { ApiResponse } from '@/Interfaces/User/UserInterfaces';
import type { PagedResponse } from '@/Interfaces/GlobalInterface';

class ContactService{

    async getAllAsync(
        page: number,
        pageSize: number): Promise<PagedResponse<ContactLogInterface>> {
        const { data } = await api.get<ApiResponse<PagedResponse<ContactLogInterface>>>
        ('/ContactLogs',
            { params: { PageNumber: page, PageSize: pageSize } }
        )
        return data.data;
    }

    async getContactByIdAsync(id: number): Promise<ContactLogInterface> {

        const { data } = await api.get<ApiResponse<ContactLogInterface>>(`/contactLogs/${id}`)
        return data.data;
    }

    async getContactByPhoneAsync(phone: string): Promise<ContactLogInterface> {
        const { data } = await api.get<ApiResponse<ContactLogInterface>>(`/ContactLogs/contact/${phone}`)

        return data.data;
    }
    async createAsync(params: ContactLogInterface): Promise<ContactLogInterface> {
        try {
            const {data} = await api.post<ApiResponse<ContactLogInterface>>('/ContactLogs', params)
            return data.data;
        }
        catch (error) {
            console.error('Error creating contact log:', error)
            throw error;
        }
    }

    async updateContactAsync(params: ContactLogInterface): Promise<ContactLogInterface> {
        try {
        const {data} = await api.put<ApiResponse<ContactLogInterface>>(`/ContactLogs/${params.id}`, params)
        return data.data;
        } catch (error) {
        console.error('Error updating system parameters:', error)
        throw error
        }
    }

    // async verifyContactAsync(id: number){
    //     try{
    //         const response = await api.put<ApiResponse<ContactLogInterface>>(`/Contactlogs/verifyContact/${id}`);
    //         return response.data;
    //     }catch(error){
    //         console.error(error);
    //     }
    // }

    async searchClientesAsync(filtro: string) {
  const { data } = await api.get<ApiResponse<ClienteResponseDto[]>>(
    `/innova/clientes`,
    { params: { filtro } }
  );
  return data.data;
}

async getClienteDetailsAsync(codCliente: string) {
  const { data } = await api.get<ApiResponse<ClienteDetalleResponseDto>>(
    `/innova/clientes/${codCliente}`
  );
  return data.data;
}

async verifyAndLinkAsync(id: number, codcli: string, codigo: number) {
  const { data } = await api.put<ApiResponse<ContactLogInterface>>(
    `/ContactLogs/verifyContact/${id}`,
    { codcli, codigo }
  );
  return data.data;
}
    async toggleAsync(id: number) : Promise<ContactLogInterface> {
         try {
            const {data} = await api.patch<ApiResponse<ContactLogInterface>>(`/ContactLogs/${id}`);
            return data.data;
        } catch (error) {
            console.error('Error toggling contact status:', error);
            throw error;
        }
    }


}

export const contactService = new ContactService();