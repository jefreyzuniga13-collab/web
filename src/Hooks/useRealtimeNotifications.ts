import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { fetchUnreadCount, fetchNotifications } from '@/Context/Slices/notificationsSlice'
import type { AppDispatch } from '@/Context'
import { notificationsConnection } from '@/Services/signalr'

export function useRealtimeNotifications(
  currentPage: number = 1,
  pageSize: number = 10
) {
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (dto: { type: string; data: any }) => {
      // 1) Mostrar toast
      toast.info(`📬 Nueva notificación: ${dto.data.payload}`, {
        position: 'top-right',
        autoClose: 5000
      })
      // 2) Refrescar badge y (si estás en página) la lista
      dispatch(fetchUnreadCount())
      dispatch(fetchNotifications({ page: currentPage, pageSize }))
    }

    notificationsConnection?.on('ReceiveNotification', handler)
    return () => {
      notificationsConnection?.off('ReceiveNotification', handler)
    }
  }, [dispatch, currentPage, pageSize])
}