import { createSlice } from "@reduxjs/toolkit"

interface activeSesiónModalState{
    isOpen: boolean
}
const initialState: activeSesiónModalState ={
    isOpen: true,
}

export const activeSesionModalSlice = createSlice({
    name: "activateModalSlice",
    initialState,
    reducers:{
        openActiveSesionModal(state){
            state.isOpen = true;
        },
        closeActiveSesionModal(state){
            state.isOpen = false;
        }
    }
})

export const {openActiveSesionModal, closeActiveSesionModal} = activeSesionModalSlice.actions;
export default activeSesionModalSlice.reducer;