import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/Context";
import type {
  CompanySelectorItem,
  CompanyState,
} from "@/Interfaces/Auth/CompanyInterface";

const initialState: CompanyState = {
  companies: [],
  activeCompanyId: null,
  activeCompanyImage: '',
  whatsAppPhone:'',
  activeCompanyName: "",
  isGlobalMode: true,
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setCompanies(state, action: PayloadAction<CompanySelectorItem[]>) {
      state.companies = action.payload;
    },

    setActiveCompany(state, action: PayloadAction<CompanySelectorItem | null>) {
      if (!action.payload) {
        state.activeCompanyId = null;
        state.activeCompanyName = "";
        state.activeCompanyImage = ''
        state.whatsAppPhone = ''
        state.isGlobalMode = true;
        return;
      }

      state.activeCompanyId = action.payload.companyId;
      state.activeCompanyName = action.payload.name;
      state.isGlobalMode = false;
      state.activeCompanyImage = action.payload.imageUrl ?? '';
      state.whatsAppPhone = action.payload.whatsAppPhone ?? "";
    },

    clearActiveCompany(state) {
      state.activeCompanyId = null;
      state.activeCompanyName = "";
      state.isGlobalMode = true;
      state.activeCompanyImage = '';
      state.whatsAppPhone = '';
    },

    clearCompanyState(state) {
      state.companies = [];
      state.activeCompanyId = null;
      state.activeCompanyName = "";
      state.isGlobalMode = true;
      state.activeCompanyImage = ''
     state.whatsAppPhone = ''
    },
  },
});

export const {
  setCompanies,
  setActiveCompany,
  clearActiveCompany,
  clearCompanyState,
} = companySlice.actions;

export const selectCompanies = (state: RootState) => state.company.companies;

export const selectActiveCompanyId = (state: RootState) =>
  state.company.activeCompanyId;

export const selectActiveCompanyName = (state: RootState) =>
  state.company.activeCompanyName;

export const selectActiveCompanyWhPhone = (state: RootState) =>
  state.company.whatsAppPhone;

export const selectActiveCompanyImage = (state: RootState) =>
  state.company.activeCompanyImage;

export const selectIsGlobalCompanyMode = (state: RootState) =>
  state.company.isGlobalMode;

export default companySlice.reducer;