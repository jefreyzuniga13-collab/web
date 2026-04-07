import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '@/Components/Auth/Menu';
import { AssignModal } from '@/Components/Chat/AssignModal';
import type { RootState } from '@/Context';

const MainLayout: React.FC = () => {
  const { isAuthenticated, userId, checkingSession } = useSelector((state: RootState) => state.auth);

  if (checkingSession) {
    return null;
  }

  if (!isAuthenticated || !userId) {
    return <Outlet />;
  }

  return (
    <div className="general-container">
      <Navbar id={Number(userId)} />
      <AssignModal />
      <Outlet />
    </div>
  );
};

export default MainLayout;