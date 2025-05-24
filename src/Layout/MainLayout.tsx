import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/Components/Chat/Menu'

const MainLayout: React.FC = () => {
  return (
    <div className='general-container'>
        <Navbar />
        <Outlet />
    </div>
  )
}

export default MainLayout;