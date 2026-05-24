import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { RolContext } from '../App'
import PacienteRow from '../components/PacienteRow'
import ResumenRapido from '../components/ResumenRapido'
import NotificacionesPanel from '../components/NotificacionesPanel'

export default function Dashboard() {
  const { rol } = useContext(RolContext)
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/pacientes')
      .then(r => r.json())
      .then(data => {
        setPacientes(data)
        if (data.length > 0) setSelected(data[0])
      })
      .catch(() => {})
  }, [])

  const solicitarDiagnostico = async () => {
    if (!selected) return
    setLoading(true)
    try {
      await fetch(`/api/diagnosticar/${selected.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol })
      })
      navigate(`/diagnostico/${selected.id}`)
    } catch (e) {
      // fall through
    }
    setLoading(false)
  }

  const pacienteSeleccionado = pacientes.find(p => p.id === selected?.id)

  return (
    <div style={{ paddingTop: 20 }}>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="panel">
          <div className="panel-header">
            PACIENTES EN ESPERA DE DIAGNOSTICO
            <span className="subtitle">({pacientes.length} pacientes)</span>
          </div>
          <div className="panel-body" style={{ padding: '8px' }}>
            {pacientes.map(p => (
              <div key={p.id}>
                <PacienteRow
                  paciente={p}
                  selected={selected?.id === p.id}
                  onSelect={setSelected}
                />
                {pacientes.indexOf(p) < pacientes.length - 1 && <hr className="separator" />}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            RESUMEN RAPIDO - {pacienteSeleccionado?.nombre || 'Seleccione un paciente'}
          </div>
          <ResumenRapido paciente={pacienteSeleccionado} />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">NOTIFICACIONES RECIENTES</div>
        <NotificacionesPanel />
      </div>

      <div className="actions-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <button className="btn btn-primary btn-lg">
            + NUEVO PACIENTE
          </button>
          <button className="btn btn-lg">
            VER TODOS
          </button>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={solicitarDiagnostico}
          disabled={!selected || loading}
        >
          {loading ? 'ANALIZANDO...' : 'SOLICITAR DIAGNOSTICO IA PARA SELECCIONADO'}
        </button>
      </div>
    </div>
  )
}
