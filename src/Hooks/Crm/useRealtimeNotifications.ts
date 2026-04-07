import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { fetchNotifications } from '@/Context/Slices/Crm/notificationsSlice'
import type { AppDispatch } from '@/Context'
import { notificationsConnection } from '@/Services/signalr/signalr'
import type { NotificationDto } from '@/Interfaces/Chat/ChatInterfaces'

export function useRealtimeNotifications(
  currentPage: number = 1,
  pageSize: number = 10
) {
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    const handler = (dto: NotificationDto) => {
      toast.info(`📬 ${dto.payload}`) 
      // dispatch(fetchUnreadCount())
      dispatch(fetchNotifications({ page: currentPage, pageSize }))
    }

    notificationsConnection?.on('Notification', handler)
    return () => {
      notificationsConnection?.off('Notification', handler)
    }
  }, [dispatch, currentPage, pageSize])
}