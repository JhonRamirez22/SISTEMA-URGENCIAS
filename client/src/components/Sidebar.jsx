import { useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { RolContext } from '../App'

export default function Sidebar({ notificacionesCount }) {
  const { rol, setRol } = useContext(RolContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  const dores = {
    medico: { nombre: 'Dr. Ramirez', iniciales: 'JR' },
    enfermera: { nombre: 'Enf. Maria Lopez', iniciales: 'ML' },
    admin: { nombre: 'Admin. Sistema', iniciales: 'AD' },
  }

  const user = dores[rol]

  const links = [
    { to: '/', icon: '\u{1F4CA}', label: 'Panel Principal' },
    { to: '/paciente/nuevo', icon: '\u{2795}', label: 'Nuevo Ingreso' },
    { to: '/auditoria', icon: '\u{1F4CB}', label: 'Auditoria', roles: ['medico', 'admin'] },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">{'\u{1F3E5}'}</span>
        <span className="sidebar-brand-text">
          SISTEMA IA<small>Urgencias v2.0</small>
        </span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">Principal</div>
        {links.filter(l => !l.roles || l.roles.includes(rol)).map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-section" style={{ marginTop: 8 }}>Notificaciones</div>
        <button className="sidebar-link" onClick={() => navigate('/notificaciones')} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit' }}>
          <span className="icon">{'\u{1F514}'}</span>
          <span>Alertas</span>
          {notificacionesCount > 0 && <span className="badge">{notificacionesCount}</span>}
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout}>
          <div className="sidebar-user-avatar">{user.iniciales}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.nombre}</div>
            <div className="sidebar-user-role">
              <select
                value={rol}
                onChange={e => setRol(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'transparent', border: 'none', color: 'inherit',
                  fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: 0.7, padding: 0
                }}
              >
                <option value="medico" style={{color:'#000'}}>Medico</option>
                <option value="enfermera" style={{color:'#000'}}>Enfermera</option>
                <option value="admin" style={{color:'#000'}}>Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
