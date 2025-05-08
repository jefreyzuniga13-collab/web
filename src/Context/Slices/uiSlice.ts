import { createSlice } from '@reduxjs/toolkit'

interface UiState {
  reloginModalOpen: boolean
}

const initialState: UiState = {
  reloginModalOpen: false
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openReLoginModal(state) {
      state.reloginModalOpen = true
    },
    closeReLoginModal(state) {
      state.reloginModalOpen = false
    }
  }
})

export const { openReLoginModal, closeReLoginModal } = uiSlice.actions
export default uiSlice.reducer