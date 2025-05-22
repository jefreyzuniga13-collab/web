
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  fetchUsers,
  fetchUserById,
  createUser,
  updateUser,
  deleteUser,
  fetchRoles,
  fetchCompanies,
  clearCurrentUser
} from '@/Context/Slices/userSlice';
import type { AppDispatch, RootState } from '@/Context';
import type { CreateUserRequest, UpdateUserRequest, User } from '@/Interfaces/User/UserInterfaces';

export const useUsers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, currentUser, loading, error, pagination, roles, companies } = useSelector((state: RootState) => state.users);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [tempUserData, setTempUserData] = useState<User | null>(null);
  
  useEffect(() => {
    loadUsers();
    loadRoles();
    loadCompanies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = (page = 1) => {
    dispatch(fetchUsers({ page, pageSize: pagination.pageSize, search: searchQuery }));
  };

  const loadRoles = () => {
    dispatch(fetchRoles());
  };

  const loadCompanies = () => {
    dispatch(fetchCompanies());
  };

  const getUserById = (userId: number) => {
    dispatch(fetchUserById(userId))
      .unwrap()
      .then(() => {
        setShowUserDetail(true);
      })
      .catch((error) => {
        toast.error(`Error al cargar el usuario: ${error}`);
      });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    dispatch(fetchUsers({ page: 1, pageSize: pagination.pageSize, search: value }));
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchUsers({ page, pageSize: pagination.pageSize, search: searchQuery }));
  };

  const handleCreateUser = (userData: CreateUserRequest) => {
    dispatch(createUser(userData))
      .unwrap()
      .then(() => {
        toast.success('Usuario creado exitosamente');
        loadUsers();
        setShowCreateModal(false);
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .catch((error) => {
        //toast.error(`Error al crear usuario: ${error}`);
        toast.error(`Error al crear usuario.`);
      });
  };

  const handleUpdateUser = (userId: number, userData: UpdateUserRequest) => {
    dispatch(updateUser({ userId, userData }))
      .unwrap()
      .then(() => {
        toast.success('Usuario actualizado exitosamente');
        loadUsers();
        setShowEditModal(false);
      })
      .catch((error) => {
        toast.error(`Error al actualizar usuario: ${error}`);
      });
  };

  const handleDeleteUser = (userId: number) => {
    dispatch(deleteUser(userId))
      .unwrap()
      .then(() => {
        toast.success('Usuario eliminado exitosamente');
        loadUsers();
        setShowDeleteConfirm(false);
      })
      .catch((error) => {
        toast.error(`Error al eliminar usuario: ${error}`);
      });
  };

  const openEditModal = (user: User) => {
    dispatch(fetchUserById(user.userId))
      .unwrap()
      .then(() => {
        setShowEditModal(true);
      });
  };

  const openDeleteConfirm = (user: User) => {
    setTempUserData(user);
    setShowDeleteConfirm(true);
  };

  const openCreateModal = () => {
    dispatch(clearCurrentUser());
    setShowCreateModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteConfirm(false);
    setShowUserDetail(false);
    dispatch(clearCurrentUser());
  };

  return {
    users,
    currentUser,
    loading,
    error,
    pagination,
    roles,
    companies,
    searchQuery,
    showCreateModal,
    showEditModal,
    showDeleteConfirm,
    showUserDetail,
    tempUserData,
    loadUsers,
    getUserById,
    handleSearch,
    handlePageChange,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    openEditModal,
    openDeleteConfirm,
    openCreateModal,
    closeModals,
    setShowUserDetail
  };
};