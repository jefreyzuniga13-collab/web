import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/Components/Menu/Menu';
import { AssignModal } from '@/Components/Chat/AssignModal';
import type { AuthData } from '@/Interfaces/Auth/AuthInterface';

const MainLayout: React.FC = () => {
  const authRaw = localStorage.getItem('auth') || '{}';
  const { userId } = JSON.parse(authRaw) as AuthData;
  const isAuthenticated = Boolean(userId);

  if (!isAuthenticated) return <Outlet />;

  return (
    <div className="general-container">
      <Navbar id={Number(userId)} />
      {/*Modal global */}
      <AssignModal />
      <Outlet />
    </div>                                             
  );
};

export default MainLayout;