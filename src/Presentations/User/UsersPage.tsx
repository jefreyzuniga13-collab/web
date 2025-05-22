
import React, { useState } from 'react';
import { useUsers } from '@/Hooks/useUsers';
import UserTable from '@/Components/Users/UserTable';
import Pagination from '@/Components/Users/Pagination';
import Modal from '@/Components/Users/Modal';
import UserForm from '@/Components/Users/UserForm';
import UserDetail from '@/Components/Users/UserDetail';
import DeleteConfirmation from '@/Components/Users/DeleteConfirmation';
import Button from '@/Components/Common/Button';
import Input from '@/Components/Common/Input2';
import { Search, UserPlus } from 'lucide-react';
import Spinner from '@/Components/Common/Spinner';
import '@/Styles/Users/UsersPage.css';
import {useRoles} from '@/Hooks/useRoles'


const UsersPage: React.FC = () => {
  const {
    users,
    currentUser,
    loading,
    error,
    pagination,
    // roles,
    companies,
    searchQuery,
    showCreateModal,
    showEditModal,
    showDeleteConfirm,
    showUserDetail,
    tempUserData,
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
  } = useUsers();

  const {roles} = useRoles();

  const [searchInput, setSearchInput] = useState('');
  
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchInput);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    handleSearch('');
  };

  const handleIconClick = (e: React.MouseEvent) => {
    handleSearchSubmit(e);
  };

  return (

    <div className="users-page">
      <div className="users-header">
        <h1>Administración de Usuarios</h1>
        <Button variant="primary" onClick={openCreateModal} className="create-user-btn">
          <UserPlus size={18} />
          Nuevo Usuario
        </Button>
      </div>

      <div className="users-controls">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <Input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchInput}
              onChange={handleSearchInput}
              onKeyPress={handleKeyPress}
              rightIcon={<Search size={18} />}
              onIconClick={handleIconClick}
            />
          </div>
          <div className="search-buttons">
            <Button type="submit" variant="primary">Buscar</Button>
            {searchQuery && (
              <Button type="button" variant="tertiary" onClick={handleClearSearch}>
                Limpiar
              </Button>
            )}
          </div>
        </form>
      </div>

      {error && <div className="users-error">Error: {error}</div>}
      
      {loading && !users.length ? (
        <div className="users-loading">
          <Spinner size={40} text="Cargando usuarios..." />
        </div>
      ) : (
        <>
          <UserTable
            users={users}
            onEdit={openEditModal}
            onDelete={openDeleteConfirm}
            onView={getUserById}
            loading={loading}
          />
          
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeModals}
        title="Crear Nuevo Usuario"
        size="large"
      >
        <UserForm
          roles={roles}
          companies={companies}
          onSubmit={handleCreateUser}
          onCancel={closeModals}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={closeModals}
        title="Editar Usuario"
        size="large"
      >
        {currentUser && (
          <UserForm
            initialData={currentUser}
            roles={roles}
            companies={companies}
            isEditing={true}
            onSubmit={(data) => handleUpdateUser(currentUser.userId, data)}
            onCancel={closeModals}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={closeModals}
        title="Confirmar Eliminación"
        size="small"
      >
        {tempUserData && (
          <DeleteConfirmation
            userName={tempUserData.fullName}
            isActive={tempUserData.isActive}
            onConfirm={() => handleDeleteUser(tempUserData.userId)}
            onCancel={closeModals}
            loading={loading}
          />
        )}
      </Modal>

      {/* User Detail Modal */}
      <Modal
        isOpen={showUserDetail}
        onClose={() => setShowUserDetail(false)}
        title="Detalle de Usuario"
        size="large"
      >
        {currentUser && <UserDetail user={currentUser} onClose={() => setShowUserDetail(false)} />}
      </Modal>
    </div>
  );
};

export default UsersPage;