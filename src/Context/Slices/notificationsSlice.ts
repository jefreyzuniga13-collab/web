import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { getNotifications, getUnreadCount } from '@/Services/NotificationService'
import type { NotificationsResponse, NotificationDto } from '@/Interfaces/Chat/ChatInterfaces'

interface NotificationsState {
  list: NotificationDto[]
  meta: NotificationsResponse['meta']
  unreadCount: number
  loadingList: boolean
  loadingCount: boolean
  error?: string
}

const initialState: NotificationsState = {
  list: [],
  meta: { currentPage: 1, pageSize: 0, totalCount: 0, totalPages: 0 },
  unreadCount: 0,
  loadingList: false,
  loadingCount: false,
}

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchList',
  async ({ page, pageSize }: { page: number; pageSize: number }) => {
    const res = await getNotifications(page, pageSize)
    return res.data
  }
)

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchCount',
  async () => {
    const res = await getUnreadCount()
    return res.data
  }
)

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    decrementUnread(state) {
      if (state.unreadCount > 0) state.unreadCount--
    },
    markAllReadLocally(state) {
      state.unreadCount = 0
      state.list = state.list.map(n => ({ ...n, isRead: true }))
    }
  },
  extraReducers: builder => {
    builder
      // lista
      .addCase(fetchNotifications.pending, state => {
        state.loadingList = true
        state.error = undefined
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<NotificationsResponse>) => {
        state.loadingList = false
        state.list = action.payload.items
        state.meta = action.payload.meta
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loadingList = false
        state.error = action.error.message
      })
      // contador
      .addCase(fetchUnreadCount.pending, state => {
        state.loadingCount = true
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
        state.loadingCount = false
        state.unreadCount = action.payload
      })
      .addCase(fetchUnreadCount.rejected, state => {
        state.loadingCount = false
      })
  }
})

export const { decrementUnread, markAllReadLocally } = slice.actions
export default slice.reducer