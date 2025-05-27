import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/Components/Chat/Menu'
import type { AuthData } from '@/Interfaces/Auth/AuthInterface'

const MainLayout: React.FC = () => {
    const authRaw = localStorage.getItem('auth') || '{}'
  const { userId } = JSON.parse(authRaw) as AuthData

  return (
    <div className='general-container'>
        <Navbar id= {Number(userId)}/>
        <Outlet />
    </div>
  )
}

export default MainLayout;