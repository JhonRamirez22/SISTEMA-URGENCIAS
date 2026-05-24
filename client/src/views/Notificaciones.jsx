import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Notificaciones() {
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
    info: '\u2139\uFE0F',
  }

  return (
    <div className="page-content">
      <div className="card">
        <div className="card-header">{'\u{1F514}'} Centro de Notificaciones</div>
        <div className="card-body">
          {notificaciones.length === 0 && (
            <div className="empty-state">
              <div className="icon">{'\u{1F514}'}</div>
              <p>No hay notificaciones recientes</p>
            </div>
          )}
          {notificaciones.map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--gray-100)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>{iconos[n.icono] || iconos.info}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{n.mensaje}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
                  Paciente #{n.paciente_id} — {new Date(n.timestamp).toLocaleString('es-CO')}
                </div>
              </div>
              {n.paciente_id && (
                <Link to={`/diagnostico/${n.paciente_id}`} className="btn btn-sm btn-ghost">Ver {'\u2192'}</Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
