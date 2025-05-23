import api from '@/Utils/ApiConfig'
import type { NotificationsResponse } from '@/Interfaces/Chat/ChatInterfaces'

export const getNotifications = (page = 1, pageSize = 10) => {
  return api.get<NotificationsResponse>(`/Notifications`, {
    params: { pageNumber: page, pageSize, unreadOnly: false }
  })
}

export const getUnreadCount = () => {
  return api.get<number>(`/Notifications/unread-count`)
}