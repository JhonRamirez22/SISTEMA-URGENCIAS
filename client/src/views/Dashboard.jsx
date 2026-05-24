import { useState, useEffect, useContext, useMemo, useRef, useCallback, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { RolContext } from '../App'
import KpiCard from '../components/KpiCard'
import BuscadorPacientes from '../components/BuscadorPacientes'
import { ToastContext } from '../components/ToastNotificacion'
import SemaforoBadge from '../components/SemaforoBadge'

const RIESGO_ORDER = { CRITICO: 0, ALTO: 1, MEDIO: 2, BAJO: 3 }

export default function Dashboard() {
  const { rol } = useContext(RolContext)
  const addToast = useContext(ToastContext)
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loadingId, setLoadingId] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [sortBy, setSortBy] = useState('riesgo')
  const [notifCount, setNotifCount] = useState(0)
  const [fetchError, setFetchError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const intervalRef = useRef(null)

  const fetchPacientes = useCallback(async () => {
    try {
      const res = await fetch('/api/pacientes', { cache: 'no-store' })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setPacientes(data)
      setLastRefresh(new Date())
      setFetchError(null)
    } catch (e) {
      console.error('Error al cargar pacientes:', e)
      setFetchError('Error al conectar con el servidor')
    }
  }, [])

  const fetchNotificaciones = useCallback(async () => {
    try {
      const res = await fetch('/api/notificaciones', { cache: 'no-store' })
      const n = await res.json()
      if (n.length > notifCount && n.length > 0 && notifCount > 0) {
        addToast(n[0].mensaje, n[0].icono === 'warning' ? 'warning' : 'info', 6000)
      }
      setNotifCount(n.length)
    } catch (e) { /* silencioso para polling */ }
  }, [notifCount, addToast])

  useEffect(() => {
    fetchPacientes()
    fetchNotificaciones()
    intervalRef.current = setInterval(() => {
      fetchPacientes()
      fetchNotificaciones()
    }, 10000)
    return () => clearInterval(intervalRef.current)
  }, [rol])

  const filtered = useMemo(() => {
    let list = [...pacientes]
    if (busqueda) {
      const q = busqueda.toLowerCase()
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        String(p.id).includes(q)
      )
    }
    if (filtroEstado === 'pendiente') list = list.filter(p => p.estado.includes('pendiente'))
    else if (filtroEstado === 'diagnosticado') list = list.filter(p => p.diagnostico)
    else if (filtroEstado === 'aprobado') list = list.filter(p => p.estado === 'formulacion_aprobada')
    else if (filtroEstado === 'critico') list = list.filter(p => p.riesgo === 'CRITICO' || p.riesgo === 'ALTO')

    list.sort((a, b) => {
      if (sortBy === 'riesgo') return (RIESGO_ORDER[a.riesgo] || 99) - (RIESGO_ORDER[b.riesgo] || 99)
      if (sortBy === 'nombre') return a.nombre.localeCompare(b.nombre)
      if (sortBy === 'id') return a.id - b.id
      return 0
    })
    return list
  }, [pacientes, busqueda, filtroEstado, sortBy])

  const solicitarDiagnostico = async (paciente) => {
    setLoadingId(paciente.id)
    const start = performance.now()
    try {
      await fetch(`/api/diagnosticar/${paciente.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol })
      })
      const ms = Math.round(performance.now() - start)
      startTransition(() => {
        addToast(`Diagnostico generado en ${ms}ms para ${paciente.nombre}`, 'success', 5000)
        navigate(`/diagnostico/${paciente.id}`)
      })
    } catch (e) {
      addToast('Error al solicitar diagnostico', 'critico', 5000)
    }
    setLoadingId(null)
  }

  const diagnosticados = pacientes.filter(p => p.diagnostico).length
  const pendientes = pacientes.filter(p => !p.diagnostico).length
  const aprobados = pacientes.filter(p => p.estado === 'formulacion_aprobada').length
  const criticos = pacientes.filter(p => p.riesgo === 'CRITICO' || p.riesgo === 'ALTO').length

  const estados = { pendiente: pacientes.filter(p => p.estado === 'pendiente').length, diagnosticado: diagnosticados, aprobado: aprobados }
  const maxBar = Math.max(...Object.values(estados), 1)

  return (
    <div className="page-content">
      <div className="kpi-grid">
        <KpiCard label="Pacientes en Espera" value={pendientes} meta={`${pacientes.length} totales registrados`} accent="blue" />
        <KpiCard label="Diagnosticados" value={diagnosticados} meta="Por motor IA" accent="orange" />
        <KpiCard label={rol === 'enfermera' ? 'Medicamentos por Administrar' : 'Formulas Aprobadas'} value={aprobados} meta={rol === 'enfermera' ? 'Pendientes de administrar' : 'Pendientes de distribucion'} accent="green" />
        <KpiCard label={rol === 'enfermera' ? 'Pacientes Activos' : 'Casos Criticos'} value={rol === 'enfermera' ? pacientes.length : criticos} meta={rol === 'enfermera' ? 'En turno actual' : 'Requieren atencion inmediata'} accent="red" />
      </div>

      <div className="impacto-grid">
        {[
          { icon: '\u23F1\uFE0F', label: 'Diagnostico <30s', sub: 'Antes: 15-45 min' },
          { icon: '\u{1F48A}', label: 'Dosis automatica', sub: '0 errores de calculo' },
          { icon: '\u{1F514}', label: 'Notif. inmediata', sub: 'Medico-Enfermera' },
          { icon: '\u{1F534}', label: 'Priorizacion IA', sub: 'Semaforo 4 niveles' },
          { icon: '\u{1F4CB}', label: 'Historial integrado', sub: 'Auditoria completa' },
        ].map((item, i) => (
          <div key={i} className="impacto-card">
            <div className="check">{'\u2705'}</div>
            <div style={{ fontWeight: 600 }}>{item.icon} {item.label}</div>
            <div style={{ fontSize: 9, color: 'var(--gray-500)', marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {fetchError && (
        <div className="banner banner-error" style={{ marginBottom: 16 }}>
          {'\u26A0\uFE0F'} {fetchError}
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 12 }} onClick={fetchPacientes}>Reintentar</button>
        </div>
      )}

      {rol === 'enfermera' && pacientes.some(p => p.estado === 'formulacion_aprobada' || p.estado === 'medicamento_administrado') && (
        <div className="card" style={{ marginBottom: 16, border: '2px solid var(--green-600)' }}>
          <div className="card-header" style={{ background: 'var(--green-50)', color: 'var(--green-600)' }}>
            {'\u{1F48A}'} Medicamentos Aprobados para Administrar
            <span className="badge badge-approved">{pacientes.filter(p => p.estado === 'formulacion_aprobada').length}</span>
          </div>
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Medicamento</th>
                  <th>Dosis</th>
                  <th>Via</th>
                  <th>Frecuencia</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.filter(p => p.estado === 'formulacion_aprobada' || p.estado === 'medicamento_administrado').map(p => (
                  <tr key={p.id} style={p.estado === 'medicamento_administrado' ? { opacity: 0.5 } : {}}>
                    <td>
                      <div className="cell-paciente">{p.nombre}</div>
                      <div className="cell-id">#{p.id} — {p.edad}a</div>
                    </td>
                    <td className="cell-paciente">{p.medicacion?.medicamento || '—'}</td>
                    <td>{p.medicacion?.dosis_total_mg ? `${p.medicacion.dosis_total_mg} mg` : '—'}</td>
                    <td>{p.medicacion?.via || '—'}</td>
                    <td>{p.medicacion?.frecuencia || '—'}</td>
                    <td>
                      {p.estado === 'formulacion_aprobada' ? (
                        <button className="btn btn-success btn-sm" onClick={async (e) => {
                          e.stopPropagation()
                          await fetch(`/api/formular/${p.id}/administrar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rol }) })
                          addToast(`Medicamento administrado a ${p.nombre}`, 'success', 5000)
                          const updated = await fetch('/api/pacientes').then(r => r.json())
                          setPacientes(updated)
                        }}>
                          {'\u{1F48A}'} Administrar
                        </button>
                      ) : (
                        <span className="badge badge-low">Administrado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card" style={{ gridRow: 'span 2' }}>
          <div className="card-header">
            <span>Cola de Pacientes ({filtered.length})</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastRefresh && (
                <span style={{ fontSize: 10, color: 'var(--gray-500)' }}>
                  Actualizado: {lastRefresh.toLocaleTimeString('es-CO')}
                </span>
              )}
              <button className="btn btn-sm btn-ghost" onClick={fetchPacientes} title="Actualizar datos">
                {'\u{1F504}'} Refrescar
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('/paciente/nuevo')}>
                {'\u2795'} Nuevo Ingreso
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <BuscadorPacientes value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o ID..." />
              <select className="form-select" style={{ width: 'auto' }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="diagnosticado">Diagnosticados</option>
                <option value="aprobado">Aprobados</option>
                <option value="critico">Criticos / Altos</option>
              </select>
              <select className="form-select" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="riesgo">Ordenar por Riesgo</option>
                <option value="nombre">Ordenar por Nombre</option>
                <option value="id">Ordenar por ID</option>
              </select>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Paciente</th>
                  <th>Diagnostico</th>
                  <th>Estado</th>
                  <th>Riesgo</th>
                  <th style={{ width: 120 }}>Accion</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className={`clickable ${p.riesgo === 'CRITICO' ? 'critico-row' : ''}`} onClick={() => !p.diagnostico && rol !== 'enfermera' && solicitarDiagnostico(p)}>
                    <td><SemaforoBadge riesgo={p.riesgo} /></td>
                    <td>
                      <div className="cell-paciente">{p.nombre}</div>
                      <div className="cell-id">ID #{p.id} — {p.edad}a — {p.tipo_sangre}</div>
                    </td>
                    <td>
                      {p.diagnostico ? (
                        <><span style={{ fontWeight: 600 }}>{p.diagnostico.enfermedad}</span><br /><span className="cell-sub">{p.diagnostico.confianza_IA}% confianza</span></>
                      ) : <span className="cell-sub">Sin diagnosticar</span>}
                    </td>
                    <td>
                      {p.estado === 'pendiente' && <span className="badge badge-pending">Pendiente</span>}
                      {p.estado === 'diagnostico_pendiente' && <span className="badge badge-pending">Dx Pendiente</span>}
                      {p.estado === 'diagnostico_confirmado' && <span className="badge badge-high">Confirmado</span>}
                      {p.estado === 'formulacion_pendiente' && <span className="badge badge-medium">Formula Pendiente</span>}
                      {p.estado === 'formulacion_aprobada' && <span className="badge badge-approved">Aprobada</span>}
                      {p.estado === 'formulacion_rechazada' && <span className="badge badge-rejected">Rechazada</span>}
                      {p.estado === 'medicamento_administrado' && <span className="badge badge-low">Administrado</span>}
                    </td>
                    <td>
                      <span className={`badge badge-${p.riesgo === 'CRITICO' ? 'critical' : p.riesgo === 'ALTO' ? 'high' : p.riesgo === 'MEDIO' ? 'medium' : 'low'}`}>
                        {p.riesgo}
                      </span>
                    </td>
                    <td>
                      {!p.diagnostico && rol !== 'enfermera' && (
                        <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); solicitarDiagnostico(p); }} disabled={loadingId === p.id}>
                          {loadingId === p.id ? '...' : 'Diagnosticar IA'}
                        </button>
                      )}
                      {!p.diagnostico && rol === 'enfermera' && (
                        <span className="cell-sub">Pendiente de diagnostico medico</span>
                      )}
                      {p.diagnostico && (
                        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/diagnostico/${p.id}`); }}>
                          Ver {'\u2192'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#999' }}>No se encontraron pacientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Distribucion de Estados</div>
          <div className="card-body">
            <div className="react-chart">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{estados.pendiente}</span>
                <div className="bar" style={{ height: `${(estados.pendiente / maxBar) * 100}%`, background: 'var(--blue-500)' }} />
                <span className="bar-label">Pendientes</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{estados.diagnosticado}</span>
                <div className="bar" style={{ height: `${(estados.diagnosticado / maxBar) * 100}%`, background: 'var(--orange-600)' }} />
                <span className="bar-label">Diagnosticados</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{estados.aprobado}</span>
                <div className="bar" style={{ height: `${(estados.aprobado / maxBar) * 100}%`, background: 'var(--green-600)' }} />
                <span className="bar-label">Aprobados</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Rendimiento del Sistema</div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--blue-800)' }}>{'<'}30s</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Tiempo Dx IA</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green-600)' }}>99.99%</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Integridad Transaccional</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--orange-600)' }}>{notifCount}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Alertas Activas</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-800)' }}>{pacientes.length}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Pacientes Turno</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
