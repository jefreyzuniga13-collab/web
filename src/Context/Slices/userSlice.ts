
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '@/Services/User/UserService';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/Interfaces/User/UserInterfaces';

interface UserState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  roles: { roleId: number, roleName: string }[];
  companies: { companyId: number, name: string }[];
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  },
  roles: [],
  companies: []
};

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ page, pageSize, search }: { page: number, pageSize: number, search?: string }, { rejectWithValue }) => {
    try {
      return await userService.getUsersAsync(page, pageSize, search);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (userId: number, { rejectWithValue }) => {
    try {
      return await userService.getUserAsync(userId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: CreateUserRequest, { rejectWithValue }) => {
    try {
      return await userService.createUserAsync(userData);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, userData }: { userId: number, userData: UpdateUserRequest }, { rejectWithValue }) => {
    try {
      await userService.updateUserAsync(userId, userData);
      return { userId, ...userData };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId: number, { rejectWithValue }) => {
    try {
      await userService.deleteUserAsync(userId);
      return userId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchRoles = createAsyncThunk(
  'users/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getRolesAsync();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchCompanies = createAsyncThunk(
  'users/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getCompaniesAsync();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        const { items, meta } = action.payload;
        state.users = items;
        state.pagination = meta;
        state.loading = false;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.userId !== action.payload);
        state.loading = false;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.companies = action.payload;
      });
  }
});

export const { clearCurrentUser } = userSlice.actions;
export default userSlice.reducer;