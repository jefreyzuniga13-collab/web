import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotifications, fetchUnreadCount } from '@/Context/Slices/notificationsSlice'
import type { RootState, AppDispatch } from '@/Context'

export function useNotifications(page = 1, pageSize = 10) {
  const dispatch = useDispatch<AppDispatch>()
  const { list, meta, unreadCount, loadingList, loadingCount } = useSelector(
    (state: RootState) => state.notifications
  )

  useEffect(() => {
    dispatch(fetchNotifications({ page, pageSize }))
  }, [dispatch, page, pageSize])

  useEffect(() => {
    dispatch(fetchUnreadCount())
  }, [dispatch])

  return { list, meta, unreadCount, loadingList, loadingCount }
}