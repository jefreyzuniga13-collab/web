import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';

interface AssignModalState {
  isOpen: boolean;
  conversation?: ConversationDto;
}

const initialState: AssignModalState = {
  isOpen: false,
  conversation: undefined
};

const assignModalSlice = createSlice({
  name: 'assignModal',
  initialState,
  reducers: {
    openAssignModal(state, action: PayloadAction<ConversationDto>) {
      state.conversation = action.payload;
      state.isOpen = true;
    },
    closeAssignModal(state) {
      state.isOpen = false;
      state.conversation = undefined;
    }
  }
});

export const { openAssignModal, closeAssignModal } = assignModalSlice.actions;
export default assignModalSlice.reducer;