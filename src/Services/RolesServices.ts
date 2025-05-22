import api from '@/Utils/ApiConfig'
import type { ApiResponse, RoleResponseDto } from '@/Interfaces/Auth/AuthInterface'
import type { AxiosError } from 'axios'

function formatError(error: unknown): Error{
    const axiosError = error as AxiosError<ApiResponse<RoleResponseDto[]>>;
    const message = axiosError.response?.data?.message ?? axiosError.message;
    return new Error(message);
}
class RoleService{
    async getRolesAsync(): Promise<RoleResponseDto[]>{
        try{
            const {data} = await api.get<ApiResponse<RoleResponseDto[]>>("/Roles");
            return data.data;

        }catch(err){
        throw formatError(err);
        }
    }
}

export const RolesServices = new RoleService();