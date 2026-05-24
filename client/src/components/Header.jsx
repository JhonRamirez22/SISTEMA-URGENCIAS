import { useContext } from 'react'
import { RolContext } from '../App'

export default function Header({ notificacionesCount }) {
  const { rol } = useContext(RolContext)

  const doctores = {
    medico: 'Dr. Oscar Andres Osorio',
    enfermera: 'Enf. Maria Fernanda Lopez',
    admin: 'Admin. Sistema IA'
  }

  return (
    <header className="header">
      <div className="header-left">
        <span style={{ fontSize: 20 }}>{'\u{1F3E5}'}</span>
        <span className="header-title">SISTEMA IA - SALA DE URGENCIAS</span>
      </div>
      <div className="header-right">
        <span className="header-doctor">{doctores[rol]}</span>
        <button className="notif-bell" title="Notificaciones">
          {'\u{1F514}'}
          {notificacionesCount > 0 && (
            <span className="notif-badge">{notificacionesCount}</span>
          )}
        </button>
      </div>
    </header>
  )
}
