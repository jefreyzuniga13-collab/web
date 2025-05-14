import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/Components/Chat/Menu'

const MainLayout: React.FC = () => {
  return (
    <>
      <nav className="navbar-container">
        <Navbar />
      </nav>
      <main className="layout-content">
        <Outlet />
      </main>
    </>
  )
}

export default MainLayout