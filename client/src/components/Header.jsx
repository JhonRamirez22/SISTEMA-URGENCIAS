import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { RolContext } from '../App'

export default function Header({ notificacionesCount }) {
  const { rol } = useContext(RolContext)
  const navigate = useNavigate()
  const ahora = new Date()
  const fecha = ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hora = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-icon">{'\u{1F3E5}'}</div>
        <span className="header-title">Sala de Urgencias — Panel de Control</span>
      </div>
      <div className="header-right">
        <div className="header-meta">
          <div className="turno">Turno activo</div>
          <div className="fecha">{fecha} — {hora}</div>
        </div>
        <button className="notif-btn" onClick={() => navigate('/notificaciones')} title="Notificaciones">
          {'\u{1F514}'}
          {notificacionesCount > 0 && <span className="notif-badge">{notificacionesCount}</span>}
        </button>
      </div>
    </header>
  )
}
