import api from '@/Utils/ApiConfig'
import type { NotificationsResponse } from '@/Interfaces/Chat/ChatInterfaces'
import type { PagedResponse } from '@/Interfaces/GlobalInterface'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { NotificationRequestDto, NotificationResponseDto } from '@/Interfaces/Notification/NotificationInterfaces'

export const getNotifications = (page = 1, pageSize = 10) => {
  return api.get<NotificationsResponse>(`/Notifications`, {
    params: { pageNumber: page, pageSize, unreadOnly: false }
  })
}

export const getUnreadCount = () => {
  return api.get<number>(`/Notifications/unread-count`)
}

class NotificationServ {
  async GetAllAsync(
    page: number,
    pageSize: number
  ): Promise<PagedResponse<NotificationResponseDto>>{

    const params = {
      PageNumber: page,
      PageSize: pageSize,
    };

    const {data} = await api.get<ApiResponse<PagedResponse<NotificationResponseDto>>>(
      `/Notifications`,
      {params}
    );

    return data.data;
  }

  async GetByIdAsync(id: number): 
  Promise<NotificationResponseDto>{
   const {data} = await api.get<ApiResponse<NotificationResponseDto>>(
      `/Notifications/${id}` )

    return data.data;
  }

  async CreateAsync(request: NotificationRequestDto): Promise<NotificationResponseDto> {
    console.log("create request sent", request);
    const { data } = await api.post<ApiResponse<NotificationResponseDto>>(
      `/Notifications`,
      request
    );
    return data.data;
  }

  // async CreateAsync(request: NotificationRequestDto): 
  // Promise<NotificationResponseDto>{
  //   console.log("create request sended", request);
  //  const {data} = await api.post<ApiResponse<NotificationResponseDto>>(
  //     `/Notifications`,
  //   {request}
  //   )
  //   return data.data;
  // }

  async ToggleActiveAsync(id: number): Promise<NotificationResponseDto>{
    const {data} = await api.put(`/Notifications/${id}`);

    return data.data;
  }

  async UpdateAsync(id: number, request: NotificationRequestDto): Promise<NotificationResponseDto>{
    const {data} = await api.patch<ApiResponse<NotificationResponseDto>>(`/Notifications/${id}`,
      {request}
    )
    return data.data;
  }
}

export const NotificationService = new NotificationServ();