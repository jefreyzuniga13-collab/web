import { useCallback, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";
import { userService, type CompanyOption, type RoleOption } from "@/Services/auth/UserService";
import type {
  ApiResponse,
  PaginatedUsers,
  User,
  UpdateUserRequest,
} from "@/Interfaces/Auth/UserInterfaces";

type ModalMode = "create" | "edit" | "view";

type UpdateUserMutationRequest = {
  id: number;
  data: UpdateUserRequest;
};

type ToggleUserMutationRequest = {
  id: number;
};

type UsersListParams = {
  globalFilter: string;
  page: number;
  pageSize: number;
};

const userKeys = {
  all: ["users"] as const,
  list: (params: UsersListParams) =>
    ["users", "list", params.globalFilter, params.page, params.pageSize] as const,
  detail: (id: number) => ["users", "detail", id] as const,
  roles: ["users", "roles"] as const,
  companies: ["users", "companies"] as const,
};

const updateUserInCachedLists = (
  queryClient: ReturnType<typeof useQueryClient>,
  updatedUser: User
): void => {
  const cachedQueries = queryClient.getQueriesData<ApiResponse<PaginatedUsers>>({
    queryKey: userKeys.all,
  });

  cachedQueries.forEach(([queryKey, cachedResponse]) => {
    if (cachedResponse === null || cachedResponse === undefined) return;
    if (cachedResponse.data === null || cachedResponse.data === undefined) return;

    const updatedItems = cachedResponse.data.items.map((item) =>
      item.userId === updatedUser.userId ? updatedUser : item
    );

    queryClient.setQueryData<ApiResponse<PaginatedUsers>>(queryKey, {
      ...cachedResponse,
      data: {
        ...cachedResponse.data,
        items: updatedItems,
      },
    });
  });
};

const prependUserToFirstPageIfMatches = (
  queryClient: ReturnType<typeof useQueryClient>,
  createdUser: User
): void => {
  const cachedQueries = queryClient.getQueriesData<ApiResponse<PaginatedUsers>>({
    queryKey: ["users", "list"],
  });

  cachedQueries.forEach(([queryKey, cachedResponse]) => {
    if (cachedResponse === null || cachedResponse === undefined) return;
    if (cachedResponse.data === null || cachedResponse.data === undefined) return;

    const typedKey = queryKey as ReturnType<typeof userKeys.list>;
    const [, , filterValue, pageValue, pageSizeValue] = typedKey;

    if (pageValue !== 1) return;

    const normalizedFilter = filterValue.trim().toLowerCase();
    const fullName = createdUser.fullName
      .trim()
      .toLowerCase();
    const email = (createdUser.email ?? "").trim().toLowerCase();

    const matchesFilter =
      normalizedFilter.length === 0 ||
      fullName.includes(normalizedFilter) ||
      email.includes(normalizedFilter);

    if (!matchesFilter) return;

    const exists = cachedResponse.data.items.some(
      (item) => item.userId === createdUser.userId
    );

    if (exists) return;

    const updatedItems = [createdUser, ...cachedResponse.data.items].slice(0, pageSizeValue);

    queryClient.setQueryData<ApiResponse<PaginatedUsers>>(queryKey, {
      ...cachedResponse,
      data: {
        ...cachedResponse.data,
        items: updatedItems,
        meta: {
          ...cachedResponse.data.meta,
          totalCount: cachedResponse.data.meta.totalCount + 1,
        },
      },
    });
  });
};

const removeSelectedUserState = (): User | null => {
  return null;
};

const useClasicUser = (userId: number | null = null) => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [globalFilter, setGlobalFilterState] = useState<string>("");
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const listParams = useMemo<UsersListParams>(
    () => ({
      globalFilter,
      page,
      pageSize,
    }),
    [globalFilter, page, pageSize]
  );

  const usersQuery = useQuery<ApiResponse<PaginatedUsers>, Error>({
    queryKey: userKeys.list(listParams),
    queryFn: () =>
      userService.getUsersAsync(
        listParams.globalFilter,
        listParams.page,
        listParams.pageSize
      ),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  });

  const userByIdQuery = useQuery<ApiResponse<User>, Error>({
    queryKey: userId !== null ? userKeys.detail(userId) : ["users", "detail", "idle"],
    queryFn: () => {
      if (userId === null) {
        throw new Error("Se requiere un userId válido.");
      }

      return userService.getUserAsync(userId);
    },
    enabled: userId !== null,
    staleTime: 1000 * 60 * 5,
  });

  const rolesQuery = useQuery<ApiResponse<RoleOption[]>, Error>({
    queryKey: userKeys.roles,
    queryFn: () => userService.getRolesAsync(),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const companiesQuery = useQuery<ApiResponse<CompanyOption[]>, Error>({
    queryKey: userKeys.companies,
    queryFn: () => userService.getCompaniesAsync(),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const createMutation = useMutation<ApiResponse<User>, Error, FormData>({
    mutationFn: (formData: FormData) => userService.createUserAsync(formData),
    onSuccess: (response: ApiResponse<User>) => {
      const createdUser = response.data;

      queryClient.setQueryData<ApiResponse<User>>(
        userKeys.detail(createdUser.userId),
        response
      );

      prependUserToFirstPageIfMatches(queryClient, createdUser);

      toast.success(response.message || "Usuario creado");
      setModalOpen(false);
      setSelectedUser(removeSelectedUserState());
      setModalMode("create");
      setPage(1);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear usuario");
    },
  });

  const updateMutation = useMutation<
    ApiResponse<User>,
    Error,
    UpdateUserMutationRequest
  >({
    mutationFn: ({ id, data }: UpdateUserMutationRequest) =>
      userService.updateUserAsync(id, data),
    onSuccess: (response: ApiResponse<User>) => {
      const updatedUser = response.data;

      queryClient.setQueryData<ApiResponse<User>>(
        userKeys.detail(updatedUser.userId),
        response
      );

      updateUserInCachedLists(queryClient, updatedUser);

      if (selectedUser !== null && selectedUser.userId === updatedUser.userId) {
        setSelectedUser(updatedUser);
      }

      toast.success(response.message || "Usuario actualizado");
      setModalOpen(false);
      setSelectedUser(removeSelectedUserState());
      setModalMode("create");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar usuario");
    },
  });

  const toggleMutation = useMutation<
    ApiResponse<User>,
    Error,
    ToggleUserMutationRequest
  >({
    mutationFn: ({ id }: ToggleUserMutationRequest) => userService.toggleUserAsync(id),
    onSuccess: (response: ApiResponse<User>) => {
      const updatedUser = response.data;

      queryClient.setQueryData<ApiResponse<User>>(
        userKeys.detail(updatedUser.userId),
        response
      );

      updateUserInCachedLists(queryClient, updatedUser);

      if (selectedUser !== null && selectedUser.userId === updatedUser.userId) {
        setSelectedUser(updatedUser);
      }

      toast.success(response.message || "Estado de usuario actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al cambiar estado");
    },
  });

  const fetchById = useCallback(
    async (id: number): Promise<ApiResponse<User>> => {
      const cached = queryClient.getQueryData<ApiResponse<User>>(userKeys.detail(id));

      if (cached !== undefined && cached !== null) {
        setSelectedUser(cached.data);
        return cached;
      }

      const response = await queryClient.fetchQuery<ApiResponse<User>, Error>({
        queryKey: userKeys.detail(id),
        queryFn: () => userService.getUserAsync(id),
        staleTime: 1000 * 60 * 5,
      });

      setSelectedUser(response.data);
      return response;
    },
    [queryClient]
  );

  const openCreate = useCallback((): void => {
    setSelectedUser(null);
    setModalMode("create");
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((user: User): void => {
    setSelectedUser(user);
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  const openView = useCallback((user: User): void => {
    setSelectedUser(user);
    setModalMode("view");
    setModalOpen(true);
  }, []);

  const closeModal = useCallback((): void => {
    setModalOpen(false);
    setSelectedUser(null);
    setModalMode("create");
  }, []);

  const handleCreate = useCallback(
    async (formData: FormData): Promise<ApiResponse<User>> => {
      return createMutation.mutateAsync(formData);
    },
    [createMutation]
  );

  const handleUpdate = useCallback(
    async (data: UpdateUserRequest): Promise<ApiResponse<User>> => {
      if (selectedUser === null) {
        throw new Error("No hay usuario seleccionado para actualizar.");
      }

      return updateMutation.mutateAsync({
        id: selectedUser.userId,
        data,
      });
    },
    [selectedUser, updateMutation]
  );

  const handleToggle = useCallback(
    async (id: number): Promise<ApiResponse<User>> => {
      return toggleMutation.mutateAsync({ id });
    },
    [toggleMutation]
  );

  const handleChangeFilter = useCallback((value: string): void => {
    setGlobalFilterState(value);
    setPage(1);
  }, []);

  const users = usersQuery.data?.data.items ?? [];
  const totalCount = usersQuery.data?.data.meta.totalCount ?? 0;
  const currentPage = usersQuery.data?.data.meta.currentPage ?? page;
  const currentPageSize = usersQuery.data?.data.meta.pageSize ?? pageSize;

  const selectedUserResolved = useMemo<User | null>(() => {
    if (selectedUser !== null) {
      return selectedUser;
    }

    if (userId !== null) {
      return userByIdQuery.data?.data ?? null;
    }

    return null;
  }, [selectedUser, userId, userByIdQuery.data]);

  const error =
    usersQuery.error ??
    userByIdQuery.error ??
    rolesQuery.error ??
    companiesQuery.error ??
    createMutation.error ??
    updateMutation.error ??
    toggleMutation.error ??
    null;

  return {
    usersResponse: usersQuery.data ?? null,
    userResponse: userByIdQuery.data ?? null,
    rolesResponse: rolesQuery.data ?? null,
    companiesResponse: companiesQuery.data ?? null,

    users,
    selectedUser: selectedUserResolved,
    roles: rolesQuery.data?.data ?? [],
    companies: companiesQuery.data?.data ?? [],

    loading:
      usersQuery.isLoading ||
      userByIdQuery.isLoading ||
      rolesQuery.isLoading ||
      companiesQuery.isLoading ||
      createMutation.isPending ||
      updateMutation.isPending ||
      toggleMutation.isPending,

    loadingList: usersQuery.isFetching,
    loadingItem:
      userByIdQuery.isFetching ||
      createMutation.isPending ||
      updateMutation.isPending ||
      toggleMutation.isPending,

    error,

    page: currentPage,
    pageSize: currentPageSize,
    totalCount,
    globalFilter,
    isModalOpen,
    modalMode,

    setPage,
    setPageSize,
    setGlobalFilter: handleChangeFilter,

    openCreate,
    openEdit,
    openView,
    closeModal,

    fetchById,
    create: handleCreate,
    update: handleUpdate,
    toggle: handleToggle,

    refetchUsers: usersQuery.refetch,
    refetchRoles: rolesQuery.refetch,
    refetchCompanies: companiesQuery.refetch,
  };
};

export default useClasicUser;