import api from "@/Utils/ApiConfig";
import type {
  ApiResponse,
  PaginatedUsers,
  User,
  UpdateUserRequest,
  UserHistoryItem,
  PresenceDto,
} from "@/Interfaces/Auth/UserInterfaces";

export type RoleOption = {
  roleId: number;
  roleName: string;
};

export type CompanyOption = {
  companyId: number;
  name: string;
};

class UserService {
  async getUsersAsync(
    filter: string,
    page: number = 1,
    pageSize: number = 10,
    searchQuery: string = ""
  ): Promise<ApiResponse<PaginatedUsers>> {
    const params: Record<string, string | number> = {
      PageNumber: page,
      PageSize: pageSize,
      globalFilter: filter,
    };

    const normalizedSearchQuery = searchQuery.trim();

    if (normalizedSearchQuery !== "") {
      params.Search = normalizedSearchQuery;
    }

    const { data } = await api.get<ApiResponse<PaginatedUsers>>("/Users", {
      params,
    });

    return data;
  }

  async getUserAsync(userId: number): Promise<ApiResponse<User>> {
    const { data } = await api.get<ApiResponse<User>>(`/Users/${userId}`);
    return data;
  }

  async createUserAsync(formData: FormData): Promise<ApiResponse<User>> {
    const { data } = await api.post<ApiResponse<User>>("/Users", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  }

  async updateUserAsync(
    userId: number,
    request: UpdateUserRequest
  ): Promise<ApiResponse<User>> {
    const { data } = await api.put<ApiResponse<User>>(`/Users/${userId}`, request);
    return data;
  }

  async updateUserImage(
    userId: number,
    imageUrl: string
  ): Promise<ApiResponse<User>> {
    const { data } = await api.put<ApiResponse<User>>(
      `/Users/${userId}/updateImage`,
      imageUrl
    );

    return data;
  }

  async uploadUserAvatar(
    userId: number,
    file: File
  ): Promise<ApiResponse<User>> {
    const formData = new FormData();
    formData.append("imageFile", file);

    const { data } = await api.patch<ApiResponse<User>>(
      `/Users/${userId}/avatar`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return data;
  }

  async toggleUserAsync(userId: number): Promise<ApiResponse<User>> {
    const { data } = await api.patch<ApiResponse<User>>(`/Users/${userId}`);
    return data;
  }

  async getRolesAsync(): Promise<ApiResponse<RoleOption[]>> {
    const { data } = await api.get<ApiResponse<RoleOption[]>>("/Roles");
    return data;
  }

  async getCompaniesAsync(): Promise<ApiResponse<CompanyOption[]>> {
    const { data } = await api.get<ApiResponse<CompanyOption[]>>("/Companies");
    return data;
  }

  async getUserHistoryAsync(
    userId: number
  ): Promise<ApiResponse<UserHistoryItem[]>> {
    const { data } = await api.get<ApiResponse<UserHistoryItem[]>>(
      `/Users/${userId}/history`
    );

    return data;
  }

  async getUserPresence(userId: number): Promise<ApiResponse<PresenceDto>> {
    const { data } = await api.get<ApiResponse<PresenceDto>>(
      `/Users/${userId}/status`
    );

    return data;
  }

  async getAgentsByRoleAsync(role: string): Promise<ApiResponse<User[]>> {
    const { data } = await api.get<ApiResponse<User[]>>("/Users/agents", {
      params: { role },
    });

    return data;
  }
}

export const userService = new UserService();