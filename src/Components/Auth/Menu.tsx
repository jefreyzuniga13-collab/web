import React, { useEffect, useState } from 'react'
import * as Icons from 'lucide-react'
import { useMenus } from '@/Hooks/Auth/useMenus'
import MenuItem from '@/Components/Auth/MenuItem'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout, selectUserId } from '@/Context/Slices/Auth/authSlice'
import '@/Styles/Auth/Navbar.css'
import { SquareArrowLeft, SquareArrowRight } from 'lucide-react'
import { useUsers } from '@/Hooks/Auth/useUsers'
import { getPresenceConnection } from '@/Services/signalr/signalr'
import { markOffline } from '@/Hooks/Auth/useUserPresence'
import { useAuth } from '@/Hooks/Auth/useAuth'
import Profile from '@/assets/img/profile.png'

interface NavbarProps {
  id: number
}

const Navbar: React.FC<NavbarProps> = ({ id }) => {
  const { menus, error } = useMenus()
  const [collapsed, setCollapsed] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentUser, loading: userLoading, fetchOne } = useUsers()
  const { logout: logoutAuth } = useAuth()
  const userId = useSelector(selectUserId)

  useEffect(() => {
    if (!currentUser) {
      fetchOne(id)
    }
  }, [currentUser, fetchOne, id])

  const selectedUrl = location.pathname.replace(/^\//, '')

  const onClick = async (url: string, text: string) => {
    if (text.toLowerCase().includes('cerrar')) {
      try {
        await markOffline(Number(userId))
      } catch (e) {
        console.warn(e)
      }

      try {
        const presenceConnection = getPresenceConnection()
        await presenceConnection?.stop()
      } catch (e) {
        console.warn(e)
      }

      await logoutAuth()
      dispatch(logout())
      navigate('/login', { replace: true })
      return
    }

    navigate(`/${url}`)
  }

  if (error) {
    return <div className="navbar__error">Error cargando menú.</div>
  }

  return (
    <nav className={`navbar ${collapsed ? 'navbar--collapsed' : ''}`}>
      <div className="navbar__header">
        <img
          src="https://i.ibb.co/B5tvT539/logopcg.webp"
          alt="PC Group S.A logo"
          className="navbar__logo"
        />

        <button
          className="navbar__collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          type="button"
        >
          {collapsed ? <SquareArrowRight size={20} /> : <SquareArrowLeft size={20} />}
        </button>
      </div>

      <ul className="navbar__menu">
        {menus.map((m) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = (Icons as any)[m.icon] ?? Icons.Menu;
          const isSelected = selectedUrl === m.url

          return (
            <MenuItem
              key={m.menuId}
              icon={<Icon size={20} />}
              text={m.name}
              onClick={() => onClick(m.url, m.name)}
              selected={isSelected}
              className={collapsed ? 'collapsed-styles' : ''}
              collapsed={collapsed}
            />
          )
        })}
      </ul>

      {userLoading ? (
        <div className="navbar__profile">
          <div className="navbar__profile-loading">Cargando usuario...</div>
        </div>
      ) : currentUser ? (
        <div className="navbar__profile">
          <img
            src={currentUser.imageUrl && currentUser.imageUrl !== '' ? currentUser.imageUrl : Profile}
            alt="Foto de perfil"
            className="navbar__profile-photo"
          />
          <span className="navbar__profile-name">{currentUser.fullName}</span>
        </div>
      ) : null}

      <p className="navbar__copyright">© 2025 PC Group S.A.</p>
    </nav>
  )
}

export default Navbar