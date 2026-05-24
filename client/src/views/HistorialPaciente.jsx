import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function HistorialPaciente() {
  const { id } = useParams()
  const [paciente, setPaciente] = useState(null)
  const [auditoria, setAuditoria] = useState([])

  useEffect(() => {
    fetch(`/api/pacientes/${id}`)
      .then(r => r.json())
      .then(setPaciente)
      .catch(() => {})
    fetch(`/api/auditoria?paciente_id=${id}`)
      .then(r => r.json())
      .then(setAuditoria)
      .catch(() => {})
  }, [id])

  if (!paciente) return (
    <div className="page-content">
      <div className="loading"><div className="spinner" /><p>Cargando historial...</p></div>
    </div>
  )

  const eventos = [
    ...auditoria.map(a => ({
      fecha: new Date(a.timestamp),
      titulo: a.accion.replace(/_/g, ' '),
      detalle: a.detalle,
      tipo: a.accion.includes('RECHAZAR') ? 'critico' : 'accion'
    }))
  ].sort((a, b) => b.fecha - a.fecha)

  return (
    <div className="page-content">
      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
        <Link to="/" style={{ color: 'var(--blue-600)', textDecoration: 'none' }}>{'\u2190'} Panel Principal</Link>
        {' | Historial Clinico | '}{paciente.nombre}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">{'\u{1F3E5}'} Datos del Paciente</div>
          <div className="card-body">
            <div className="section-title">{paciente.nombre}</div>
            <table style={{ fontSize: 13, width: '100%' }}>
              <tbody>
                <tr><td style={{ color: 'var(--gray-500)', padding: '3px 0' }}>ID</td><td><strong>#{paciente.id}</strong></td></tr>
                <tr><td style={{ color: 'var(--gray-500)', padding: '3px 0' }}>Edad</td><td>{paciente.edad} anos</td></tr>
                <tr><td style={{ color: 'var(--gray-500)', padding: '3px 0' }}>Peso</td><td>{paciente.peso_kg} kg</td></tr>
                <tr><td style={{ color: 'var(--gray-500)', padding: '3px 0' }}>Tipo Sangre</td><td>{paciente.tipo_sangre}</td></tr>
                <tr><td style={{ color: 'var(--gray-500)', padding: '3px 0' }}>Antecedentes</td><td>{paciente.antecedentes?.join(', ') || 'Ninguno'}</td></tr>
                <tr><td style={{ color: 'var(--gray-500)', padding: '3px 0' }}>Alergias</td><td style={{ color: 'var(--red-600)' }}>{paciente.alergias?.join(', ') || 'Ninguna'}</td></tr>
                <tr><td style={{ color: 'var(--gray-500)', padding: '3px 0' }}>Estado actual</td><td><span className="badge badge-pending">{paciente.estado}</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">{'\u{1F4C5}'} Linea de Tiempo Clinica</div>
          <div className="card-body">
            <div className="timeline">
              {eventos.length === 0 && <div className="empty-state"><div className="icon">{'\u{1F4CB}'}</div><p>Sin eventos registrados</p></div>}
              {eventos.map((ev, i) => (
                <div key={i} className={`timeline-item ${ev.tipo}`}>
                  <div className="timeline-date">{ev.fecha.toLocaleString('es-CO')}</div>
                  <div className="timeline-title">{ev.titulo}</div>
                  <div className="timeline-detail">{ev.detalle}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
