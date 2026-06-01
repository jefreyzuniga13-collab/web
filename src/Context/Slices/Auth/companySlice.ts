import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/Context";
import type {
  CompanySelectorItem,
  CompanyState,
} from "@/Interfaces/Auth/CompanyInterface";

const initialState: CompanyState = {
  companies: [],
  activeCompanyId: null,
  activeCompanyName: "Todas las empresas",
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
        state.activeCompanyName = "Todas las empresas";
        state.isGlobalMode = true;
        return;
      }

      state.activeCompanyId = action.payload.companyId;
      state.activeCompanyName = action.payload.name;
      state.isGlobalMode = false;
    },

    clearActiveCompany(state) {
      state.activeCompanyId = null;
      state.activeCompanyName = "Todas las empresas";
      state.isGlobalMode = true;
    },

    clearCompanyState(state) {
      state.companies = [];
      state.activeCompanyId = null;
      state.activeCompanyName = "Todas las empresas";
      state.isGlobalMode = true;
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

export const selectIsGlobalCompanyMode = (state: RootState) =>
  state.company.isGlobalMode;

export default companySlice.reducer;