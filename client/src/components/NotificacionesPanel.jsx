import { useState, useEffect } from 'react'

export default function NotificacionesPanel() {
  const [notificaciones, setNotificaciones] = useState([])

  useEffect(() => {
    fetch('/api/notificaciones')
      .then(r => r.json())
      .then(setNotificaciones)
      .catch(() => {})
  }, [])

  const iconos = {
    warning: '\u26A0\uFE0F',
    check: '\u2705',
    cloud_upload: '\u2601\uFE0F',
    info: '\u2139\uFE0F'
  }

  return (
    <div className="panel-body">
      {notificaciones.map(n => (
        <div key={n.id} className="notif-item">
          <span className="icono">{iconos[n.icono] || iconos.info}</span>
          <div>
            <span>{n.mensaje}</span>
            <br />
            <span style={{ color: '#999', fontSize: 10 }}>
              {new Date(n.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
