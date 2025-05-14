import React, { useState } from 'react'
import * as Icons from 'lucide-react'
import { useMenus } from '@/Hooks/useMenus'
import MenuItem from '@/Components/Chat/MenuItem'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '@/Context/Slices/authSlice'
import '@/Styles/Chat/Navbar.css'

const Navbar: React.FC = () => {
  const { menus, loading, error } = useMenus()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selected, setSelected] = useState<string>('Dashboard')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleCollapse = () => setCollapsed(prev => !prev)
  const handleMobileToggle = () => setMobileOpen(prev => !prev)

  const onClick = (url: string, text: string) => {
    setSelected(text)
    // Cerrar sesión
    if (text.toLowerCase().includes('cerrar')) {
      dispatch(logout())
      navigate('/login')
      return
    }
    navigate(`/${url}`)
  }

  if (loading) return <div className="navbar-loading">Cargando menú…</div>
  if (error) return <div className="navbar-error">Error cargando menú: {error}</div>

  return (
    <nav className={`navbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="menu-header">
        <img
          src="https://i.ibb.co/B5tvT539/logopcg.webp"
          alt="PC Group S.A logo"
          className="menu-logo"
        />
        <button className="collapse-button" onClick={handleCollapse}>
          {collapsed 
            ? <Icons.ChevronRight size={20} /> 
            : <Icons.ChevronLeft  size={20} />}
        </button>
        <button className="mobile-menu-toggle" onClick={handleMobileToggle}>
          <Icons.Menu size={24} />
        </button>
      </div>

      <ul className={`menu-items ${mobileOpen ? 'open' : ''}`}>
        {menus.map(m => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = (Icons as any)[m.icon] ?? Icons.Menu
          return (
            <MenuItem
              key={m.menuId}
              icon={<Icon size={20} />}
              text={m.name}
              onClick={() => onClick(m.url, m.name)}
              selectedOption={selected}
            />
          )
        })}
      </ul>

      <div className="navbar-footer">
        <p>© 2025 PC Group S.A. Todos los derechos reservados.</p>
      </div>
    </nav>
  )
}

export default Navbar