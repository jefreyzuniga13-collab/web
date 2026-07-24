import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  clearCurrentUser,
  createUser,
  fetchCompanies,
  fetchRoles,
  fetchUserById,
  fetchUsers,
  toggleUserAsync,
  updateUser,
} from "@/Context/Slices/Auth/userSlice";

import type { AppDispatch, RootState } from "@/Context";

import type { UpdateUserRequest } from "@/Interfaces/Auth/UserInterfaces";
import type { AgentDto } from "@/Interfaces/Chat/ChatInterfaces";

import { AgentService } from "@/Services/auth/AgentService";

type ModalMode = "create" | "edit" | "view";

const USER_QUERY_KEYS = {
  root: ["users"] as const,

  page: (
    page: number,
    pageSize: number,
    search: string,
    globalFilter: string,
  ) => ["users", "page", page, pageSize, search, globalFilter] as const,

  detail: (userId: number) => ["users", "detail", userId] as const,

  roles: ["users", "roles"] as const,

  companies: ["users", "companies"] as const,

  agents: ["users", "agents"] as const,
};

export function useUsers() {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const {
    users,
    currentUser,
    loading: reduxLoading,
    error,
    pagination: { currentPage, pageSize, totalCount },
    roles,
    companies,
  } = useSelector((state: RootState) => state.users);

  const [modalMode, setModalMode] = useState<ModalMode>("create");

  const [isModalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [globalFilter, setGlobalFilter] = useState("");

  const [agents, setAgents] = useState<AgentDto[]>([]);

  /**
   * Obtiene una página de usuarios.
   *
   * staleTime = 0 porque fetchUsers actualiza Redux.
   * De esta manera, cambiar de página siempre sincroniza
   * correctamente userSlice con la página solicitada.
   */
  const fetchPage = useCallback(
    async (page = 1, size = pageSize) => {
      return queryClient.fetchQuery({
        queryKey: USER_QUERY_KEYS.page(page, size, search, globalFilter),

        queryFn: () =>
          dispatch(
            fetchUsers({
              globalFilter,
              page,
              pageSize: size,
              search,
            }),
          ).unwrap(),

        staleTime: 0,
      });
    },
    [dispatch, globalFilter, pageSize, queryClient, search],
  );

  /**
   * Carga exclusivamente los datos necesarios
   * para la página /users.
   *
   * Debe llamarse desde UsersPage.
   * Usar useUsers() por sí solo no hace peticiones.
   */
  const loadInitialData = useCallback(async (): Promise<void> => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: USER_QUERY_KEYS.roles,

        queryFn: () => dispatch(fetchRoles()).unwrap(),

        staleTime: 30 * 60 * 1000,
      }),

      queryClient.ensureQueryData({
        queryKey: USER_QUERY_KEYS.companies,

        queryFn: () => dispatch(fetchCompanies()).unwrap(),

        staleTime: 30 * 60 * 1000,
      }),

      fetchPage(1, pageSize),
    ]);
  }, [dispatch, fetchPage, pageSize, queryClient]);

  /**
   * Obtiene un usuario por ID.
   *
   * Se almacena temporalmente en TanStack Query
   * y también actualiza currentUser en Redux.
   */
  const fetchOne = useCallback(
    async (id: number) => {
      if (id <= 0) {
        throw new Error("El identificador del usuario no es válido.");
      }

      return queryClient.fetchQuery({
        queryKey: USER_QUERY_KEYS.detail(id),

        queryFn: () => dispatch(fetchUserById(id)).unwrap(),

        staleTime: 2 * 60 * 1000,
      });
    },
    [dispatch, queryClient],
  );

  const createMutation = useMutation({
    mutationFn: (data: FormData) => dispatch(createUser(data)).unwrap(),

    onSuccess: async () => {
      toast.success("Usuario creado");

      await queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.root,
      });

      await fetchPage(1);

      setModalOpen(false);
      dispatch(clearCurrentUser());
    },

    onError: () => {
      toast.error("Error al crear usuario");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      dispatch(
        updateUser({
          userId: id,
          userData: data,
        }),
      ).unwrap(),

    onSuccess: async (_, variables) => {
      toast.success("Usuario actualizado");

      await queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.detail(variables.id),
      });

      await queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.root,
      });

      await fetchPage(currentPage);

      setModalOpen(false);
      dispatch(clearCurrentUser());
    },

    onError: () => {
      toast.error("Error al actualizar usuario");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => dispatch(toggleUserAsync(id)).unwrap(),

    onSuccess: async () => {
      toast.success("Estado de usuario cambiado");

      await queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.root,
      });

      await fetchPage(currentPage);
    },

    onError: () => {
      toast.error("Error al cambiar estado de usuario");
    },
  });

  const agentsMutation = useMutation({
    mutationFn: () => AgentService.getAgentsAsync(),

    onSuccess: (response) => {
      setAgents(response);

      queryClient.setQueryData(USER_QUERY_KEYS.agents, response);
    },

    onError: (currentError) => {
      console.error("Error fetching agents:", currentError);
    },
  });

  const setPage = useCallback(
    (page: number) => {
      return fetchPage(page, pageSize);
    },
    [fetchPage, pageSize],
  );

  const setPageSize = useCallback(
    (size: number) => {
      return fetchPage(1, size);
    },
    [fetchPage],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    dispatch(clearCurrentUser());
  }, [dispatch]);

  const create = useCallback(
    async (data: FormData): Promise<void> => {
      await createMutation.mutateAsync(data);
    },
    [createMutation],
  );

  const update = useCallback(
    async (id: number, data: UpdateUserRequest): Promise<void> => {
      await updateMutation.mutateAsync({
        id,
        data,
      });
    },
    [updateMutation],
  );

  const toggleUser = useCallback(
    async (id: number): Promise<void> => {
      await toggleMutation.mutateAsync(id);
    },
    [toggleMutation],
  );

  const openCreate = useCallback(() => {
    dispatch(clearCurrentUser());

    setModalMode("create");
    setModalOpen(true);
  }, [dispatch]);

  const openEdit = useCallback(
    async (id: number) => {
      dispatch(clearCurrentUser());

      setModalMode("edit");
      setModalOpen(true);

      try {
        await fetchOne(id);
      } catch (currentError) {
        console.error("Error al cargar el usuario:", currentError);

        toast.error("No se pudo cargar el usuario.");
      }
    },
    [dispatch, fetchOne],
  );

  const openView = useCallback(
    async (id: number) => {
      dispatch(clearCurrentUser());

      setModalMode("view");
      setModalOpen(true);

      try {
        await fetchOne(id);
      } catch (currentError) {
        console.error("Error al cargar el usuario:", currentError);

        toast.error("No se pudo cargar el usuario.");
      }
    },
    [dispatch, fetchOne],
  );

  const getAgents = useCallback(async (): Promise<void> => {
    const cachedAgents = queryClient.getQueryData<AgentDto[]>(
      USER_QUERY_KEYS.agents,
    );

    if (cachedAgents) {
      setAgents(cachedAgents);
      return;
    }

    await agentsMutation.mutateAsync();
  }, [agentsMutation, queryClient]);

  const handleSubmit = useCallback(
    (data: FormData | UpdateUserRequest) => {
      if (modalMode === "create") {
        void create(data as FormData);
        return;
      }

      if (modalMode === "edit" && currentUser) {
        void update(currentUser.userId, data as UpdateUserRequest);
      }
    },
    [create, currentUser, modalMode, update],
  );

  const loading =
    reduxLoading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    toggleMutation.isPending ||
    agentsMutation.isPending;

  return {
    users,
    currentUser,
    roles,
    companies,
    loading,
    error,

    page: currentPage,
    pageSize,
    totalCount,

    search,
    setSearch,

    globalFilter,
    setGlobalFilter,

    agents,

    fetchPage,
    loadInitialData,
    fetchOne,
    setPage,
    setPageSize,

    modalMode,
    isModalOpen,

    openCreate,
    openEdit,
    openView,
    closeModal,

    handleSubmit,
    toggleUser,
    getAgents,
    update,
    create,
  };
}
