import { useCallback, useMemo, useState,} from "react";
import {keepPreviousData,useMutation,useQuery,useQueryClient,} from "@tanstack/react-query";
import { toast } from "react-toastify";
import {userService,type CompanyOption,} from "@/Services/auth/UserService";
import type { ApiResponse, PaginatedUsers, User, UpdateUserRequest,} from "@/Interfaces/Auth/UserInterfaces";

type ModalMode = "create" | "edit" | "view";

type UpdateUserMutationRequest = {
  id: number;
  data: UpdateUserRequest;
};

type UsersListParams = {
  globalFilter: string;
  page: number;
  pageSize: number;
};

const userKeys = {
  all: ["users"] as const,

  lists: () => [...userKeys.all, "list"] as const,

  list: (params: UsersListParams) =>
    [
      ...userKeys.lists(),
      params.globalFilter,
      params.page,
      params.pageSize,
    ] as const,

  detail: (id: number) =>
    [...userKeys.all, "detail", id] as const,

  companies: () =>
    [...userKeys.all, "companies"] as const,
};

const isPaginatedUsersResponse = (
  response:
    | ApiResponse<PaginatedUsers>
    | undefined,
): response is ApiResponse<PaginatedUsers> => {
  return Boolean(
    response?.data &&
      Array.isArray(response.data.items) &&
      response.data.meta,
  );
};

const updateUserInCachedLists = (
  queryClient: ReturnType<
    typeof useQueryClient
  >,
  updatedUser: User,
): void => {
  const cachedQueries =
    queryClient.getQueriesData<
      ApiResponse<PaginatedUsers>
    >({
      queryKey: userKeys.lists(),
    });

  cachedQueries.forEach(
    ([queryKey, cachedResponse]) => {
      if (
        !isPaginatedUsersResponse(
          cachedResponse,
        )
      ) {
        return;
      }

      const exists = cachedResponse.data.items.some(
        (user) =>
          user.userId ===
          updatedUser.userId,
      );

      if (!exists) {
        return;
      }

      queryClient.setQueryData<
        ApiResponse<PaginatedUsers>
      >(queryKey, {
        ...cachedResponse,
        data: {
          ...cachedResponse.data,
          items:
            cachedResponse.data.items.map(
              (user) =>
                user.userId ===
                updatedUser.userId
                  ? updatedUser
                  : user,
            ),
        },
      });
    },
  );
};

const prependUserToCachedFirstPages = (
  queryClient: ReturnType<
    typeof useQueryClient
  >,
  createdUser: User,
): void => {
  const cachedQueries =
    queryClient.getQueriesData<
      ApiResponse<PaginatedUsers>
    >({
      queryKey: userKeys.lists(),
    });

  cachedQueries.forEach(
    ([queryKey, cachedResponse]) => {
      if (
        !isPaginatedUsersResponse(
          cachedResponse,
        )
      ) {
        return;
      }

      const typedKey =
        queryKey as ReturnType<
          typeof userKeys.list
        >;

      const [
        ,
        ,
        filterValue,
        pageValue,
        pageSizeValue,
      ] = typedKey;

      if (pageValue !== 1) {
        return;
      }

      const normalizedFilter = String(
        filterValue ?? "",
      )
        .trim()
        .toLowerCase();

      const fullName =
        createdUser.fullName
          .trim()
          .toLowerCase();

      const email = (
        createdUser.email ?? ""
      )
        .trim()
        .toLowerCase();

      const matchesFilter =
        normalizedFilter.length === 0 ||
        fullName.includes(
          normalizedFilter,
        ) ||
        email.includes(normalizedFilter);

      if (!matchesFilter) {
        return;
      }

      const alreadyExists =
        cachedResponse.data.items.some(
          (user) =>
            user.userId ===
            createdUser.userId,
        );

      if (alreadyExists) {
        return;
      }

      const updatedItems = [
        createdUser,
        ...cachedResponse.data.items,
      ].slice(0, pageSizeValue);

      queryClient.setQueryData<
        ApiResponse<PaginatedUsers>
      >(queryKey, {
        ...cachedResponse,
        data: {
          ...cachedResponse.data,
          items: updatedItems,
          meta: {
            ...cachedResponse.data.meta,
            totalCount:
              cachedResponse.data.meta
                .totalCount + 1,
          },
        },
      });
    },
  );
};

const useClasicUser = () => {
  const queryClient = useQueryClient();

  const [page, setPageState] =
    useState(1);

  const [pageSize, setPageSizeState] =
    useState(20);

  const [
    globalFilter,
    setGlobalFilterState,
  ] = useState("");

  const [modalMode, setModalMode] =
    useState<ModalMode>("create");

  const [isModalOpen, setModalOpen] =
    useState(false);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState<User | null>(null);

  const listParams =
    useMemo<UsersListParams>(
      () => ({
        globalFilter:
          globalFilter.trim(),
        page,
        pageSize,
      }),
      [
        globalFilter,
        page,
        pageSize,
      ],
    );

  /*
   * Esta petición solamente se ejecuta cuando
   * UsersPage monta este hook.
   */
  const usersQuery = useQuery<
    ApiResponse<PaginatedUsers>,
    Error
  >({
    queryKey:
      userKeys.list(listParams),

    queryFn: () =>
      userService.getUsersAsync(
        listParams.globalFilter,
        listParams.page,
        listParams.pageSize,
      ),

    placeholderData: keepPreviousData,

    staleTime: 30 * 1000,

    gcTime: 5 * 60 * 1000,

    refetchOnWindowFocus: false,
  });

  /*
   * Las empresas también se cargan únicamente
   * al entrar en la administración de usuarios.
   */
  const companiesQuery = useQuery<
    ApiResponse<CompanyOption[]>,
    Error
  >({
    queryKey: userKeys.companies(),

    queryFn: () =>
      userService.getCompaniesAsync(),

    staleTime: 30 * 60 * 1000,

    gcTime: 60 * 60 * 1000,

    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation<
    ApiResponse<User>,
    Error,
    FormData
  >({
    mutationFn: (formData) =>
      userService.createUserAsync(
        formData,
      ),

    onSuccess: (response) => {
      const createdUser =
        response.data;

      queryClient.setQueryData<
        ApiResponse<User>
      >(
        userKeys.detail(
          createdUser.userId,
        ),
        response,
      );

      prependUserToCachedFirstPages(
        queryClient,
        createdUser,
      );

      toast.success(
        response.message ||
          "Usuario creado",
      );

      setModalOpen(false);
      setSelectedUser(null);
      setModalMode("create");
      setPageState(1);
    },

    onError: (error) => {
      toast.error(
        error.message ||
          "Error al crear usuario",
      );
    },
  });

  const updateMutation = useMutation<
    ApiResponse<User>,
    Error,
    UpdateUserMutationRequest
  >({
    mutationFn: ({ id, data }) =>
      userService.updateUserAsync(
        id,
        data,
      ),

    onSuccess: (response) => {
      const updatedUser =
        response.data;

      queryClient.setQueryData<
        ApiResponse<User>
      >(
        userKeys.detail(
          updatedUser.userId,
        ),
        response,
      );

      updateUserInCachedLists(
        queryClient,
        updatedUser,
      );

      toast.success(
        response.message ||
          "Usuario actualizado",
      );

      setModalOpen(false);
      setSelectedUser(null);
      setModalMode("create");
    },

    onError: (error) => {
      toast.error(
        error.message ||
          "Error al actualizar usuario",
      );
    },
  });

  const toggleMutation = useMutation<
    ApiResponse<User>,
    Error,
    number
  >({
    mutationFn: (id) =>
      userService.toggleUserAsync(id),

    onSuccess: (response) => {
      const updatedUser =
        response.data;

      queryClient.setQueryData<
        ApiResponse<User>
      >(
        userKeys.detail(
          updatedUser.userId,
        ),
        response,
      );

      updateUserInCachedLists(
        queryClient,
        updatedUser,
      );

      setSelectedUser(
        (currentUser) =>
          currentUser?.userId ===
          updatedUser.userId
            ? updatedUser
            : currentUser,
      );

      toast.success(
        response.message ||
          "Estado de usuario actualizado",
      );
    },

    onError: (error) => {
      toast.error(
        error.message ||
          "Error al cambiar estado",
      );
    },
  });

  const openCreate =
    useCallback((): void => {
      setSelectedUser(null);
      setModalMode("create");
      setModalOpen(true);
    }, []);

  /*
   * No realiza GET /user/{id}.
   * Utiliza el usuario que ya vino en la tabla.
   */
  const openEdit = useCallback(
    (user: User): void => {
      setSelectedUser(user);
      setModalMode("edit");
      setModalOpen(true);
    },
    [],
  );

  const openView = useCallback(
    (user: User): void => {
      setSelectedUser(user);
      setModalMode("view");
      setModalOpen(true);
    },
    [],
  );

  const closeModal =
    useCallback((): void => {
      setModalOpen(false);
      setSelectedUser(null);
      setModalMode("create");
    }, []);

  const create = useCallback(
    (formData: FormData) => {
      return createMutation.mutateAsync(
        formData,
      );
    },
    [createMutation],
  );

  const update = useCallback(
    (data: UpdateUserRequest) => {
      if (!selectedUser) {
        return Promise.reject(
          new Error(
            "No hay un usuario seleccionado.",
          ),
        );
      }

      return updateMutation.mutateAsync({
        id: selectedUser.userId,
        data,
      });
    },
    [
      selectedUser,
      updateMutation,
    ],
  );

  const toggle = useCallback(
    (id: number) => {
      return toggleMutation.mutateAsync(
        id,
      );
    },
    [toggleMutation],
  );

  const setPage = useCallback(
    (newPage: number): void => {
      setPageState(newPage);
    },
    [],
  );

  const setPageSize = useCallback(
    (newPageSize: number): void => {
      setPageSizeState(newPageSize);
      setPageState(1);
    },
    [],
  );

  const setGlobalFilter =
    useCallback(
      (value: string): void => {
        setGlobalFilterState(value);
        setPageState(1);
      },
      [],
    );

  const users =
    usersQuery.data?.data.items ?? [];

  const totalCount =
    usersQuery.data?.data.meta
      .totalCount ?? 0;

  const currentPage =
    usersQuery.data?.data.meta
      .currentPage ?? page;

  const currentPageSize =
    usersQuery.data?.data.meta
      .pageSize ?? pageSize;

  const error =
    usersQuery.error ??
    companiesQuery.error ??
    createMutation.error ??
    updateMutation.error ??
    toggleMutation.error ??
    null;

  const loadingMutation =
    createMutation.isPending ||
    updateMutation.isPending ||
    toggleMutation.isPending;

  return {
    users,
    selectedUser,

    companies:
      companiesQuery.data?.data ??
      [],

    page: currentPage,
    pageSize: currentPageSize,
    totalCount,

    globalFilter,

    modalMode,
    isModalOpen,

    loading:
      usersQuery.isLoading ||
      companiesQuery.isLoading ||
      loadingMutation,

    loadingList:
      usersQuery.isFetching,

    loadingItem: loadingMutation,

    error,

    setPage,
    setPageSize,
    setGlobalFilter,

    openCreate,
    openEdit,
    openView,
    closeModal,

    create,
    update,
    toggle,

    refetchUsers:
      usersQuery.refetch,

    refetchCompanies:
      companiesQuery.refetch,
  };
};

export default useClasicUser;