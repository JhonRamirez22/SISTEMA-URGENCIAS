import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { RolContext } from '../App'
import { ToastContext } from '../components/ToastNotificacion'
import ProgresoFlujo from '../components/ProgresoFlujo'
import ModalConfirmacion from '../components/ModalConfirmacion'

export default function DiagnosticoIA() {
  const { id } = useParams()
  const { rol } = useContext(RolContext)
  const addToast = useContext(ToastContext)
  const navigate = useNavigate()
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [accion, setAccion] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [readonly, setReadonly] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const checkRes = await fetch(`/api/diagnosticar/${id}`)
        const checkData = await checkRes.json()

        const estadoAvanzado = checkData.estado &&
          (checkData.estado.includes('confirmado') ||
           checkData.estado.includes('formulacion') ||
           checkData.estado.includes('aprobada') ||
           checkData.estado.includes('rechazada') ||
           checkData.estado.includes('administrado'))

        const esEnfermera = rol === 'enfermera'

        if (estadoAvanzado || esEnfermera) {
          setReadonly(true)
          setResultado(checkData)
          setElapsed(0)
          setLoading(false)
          addToast('Vista de solo lectura — diagnostico ya procesado', 'info', 3000)
          return
        }

        const start = performance.now()
        const res = await fetch(`/api/diagnosticar/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rol })
        })
        const data = await res.json()
        setElapsed(Math.round(performance.now() - start))
        setResultado(data)
        setReadonly(false)
        if (res.ok) {
          addToast(`Motor IA completado en ${Math.round(performance.now() - start)}ms`, 'success', 4000)
        }
      } catch (e) {
        addToast('Error al cargar diagnostico', 'critico')
      }
      setLoading(false)
    }
    load()
  }, [id, rol])

  const confirmarDiagnostico = async () => {
    setAccion('confirmando')
    try {
      const res = await fetch(`/api/diagnosticar/${id}/confirmar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rol })
      })
      if (!res.ok) throw new Error()
      addToast('Diagnostico confirmado exitosamente', 'success')
      navigate(`/formulacion/${id}`)
    } catch (e) {
      addToast('Error al confirmar diagnostico', 'critico')
    }
    setAccion(null)
    setShowConfirm(false)
  }

  const rechazarDiagnostico = async (motivo) => {
    setAccion('rechazando')
    try {
      await fetch(`/api/diagnosticar/${id}/rechazar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rol, motivo })
      })
      addToast('Diagnostico rechazado', 'warning')
      navigate('/')
    } catch (e) {
      addToast('Error al rechazar', 'critico')
    }
    setAccion(null)
    setShowReject(false)
  }

  if (loading) return (
    <div className="page-content">
      <div className="loading">
        <div className="spinner" />
        <p style={{ fontSize: 14, fontWeight: 500, marginTop: 12 }}>Ejecutando Motor IA...</p>
        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>Analizando examenes y contrastando con base de conocimiento</p>
      </div>
    </div>
  )

  if (!resultado) return (
    <div className="page-content">
      <div className="banner banner-error">Error al obtener el diagnostico. Verifique los datos del paciente.</div>
    </div>
  )

  const diagPrincipal = resultado.diagnosticos?.[0]
  const estaConfirmado = resultado.estado === 'diagnostico_confirmado'
  const puedeConfirmar = rol === 'medico' && !estaConfirmado && !readonly

  return (
    <div className="page-content">
      {readonly && (
        <div className="banner banner-info" style={{ marginBottom: 12 }}>
          {'\u{1F512}'} Vista de solo lectura — los datos mostrados no modifican el estado del paciente.
        </div>
      )}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-600)', marginBottom: 12 }}>
            <span><Link to="/" style={{ color: 'var(--blue-600)', textDecoration: 'none' }}>{'\u2190'} Panel Principal</Link> | Diagnostico IA | Paciente: {resultado.nombre}</span>
            <span className="badge badge-pending">Tiempo motor IA: {elapsed}ms</span>
          </div>
          <ProgresoFlujo paso={2} />
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-header">Datos del Paciente</div>
          <div className="card-body">
            <div className="section-title">Informacion General</div>
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              <strong>{resultado.nombre}</strong><br />
              Edad: {resultado.edad} anos | Peso: {resultado.peso_kg} kg | Sangre: {resultado.tipo_sangre}<br />
              Antecedentes: <span style={{ color: 'var(--orange-600)' }}>{resultado.antecedentes?.join(', ') || 'Ninguno'}</span><br />
              Alergias: <span style={{ color: 'var(--red-600)' }}>{resultado.alergias?.join(', ') || 'Ninguna'}</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--gray-200)', margin: '10px 0' }} />
            <div className="section-title">Examenes ({resultado.examenes?.length || 0})</div>
            {resultado.examenes?.map((ex, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '3px 0' }}>
                <span style={{ color: ex.alterado ? 'var(--red-600)' : 'var(--green-600)', fontWeight: 700 }}>{ex.alterado ? '\u26A0' : '\u2713'}</span>
                <span style={{ flex: 1, color: ex.alterado ? 'var(--red-600)' : 'var(--gray-700)' }}>
                  {ex.nombre}: <strong>{ex.valor}</strong> {ex.unidad} (Ref: {ex.ref})
                </span>
                <span className={`badge ${ex.alterado ? 'badge-critical' : 'badge-low'}`} style={{ fontSize: 9 }}>
                  {ex.alterado ? 'ALTERADO' : 'NORMAL'}
                </span>
              </div>
            ))}
            <hr style={{ border: 'none', borderTop: '1px solid var(--gray-200)', margin: '10px 0' }} />
            <div style={{ fontSize: 12, fontWeight: 600 }}>Resumen: {resultado.examenes_alterados}/{resultado.total_examenes} examenes alterados</div>
            <div style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--gray-500)' }}>Historial usado en analisis: {resultado.antecedentes?.length > 0 ? 'Si' : 'No'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Resultado del Analisis IA</div>
          <div className="card-body">
            <div className={`banner ${resultado.riesgo === 'CRITICO' ? 'banner-error' : resultado.riesgo === 'ALTO' ? 'banner-warning' : 'banner-info'}`}>
              {'\u{1F534}'} RIESGO: {resultado.riesgo}
            </div>

            <div className="section-title" style={{ fontSize: 12, marginTop: 12 }}>DIAGNOSTICO PRINCIPAL</div>
            <div style={{ fontSize: 20, fontWeight: 700, margin: '4px 0' }}>{diagPrincipal?.enfermedad || 'Sin diagnostico'}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 8 }}>{diagPrincipal?.descripcion || ''}</div>

            <div style={{ background: 'var(--blue-50)', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--blue-800)' }}>CONFIANZA: {diagPrincipal?.confianza_IA || 0}%</div>
              <div style={{ fontSize: 10, color: 'var(--gray-600)' }}>Condiciones cumplidas + sintomas coincidentes + antecedentes</div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>Sintomas asociados: {resultado.sintomas?.join(', ') || 'Ninguno'}</div>

            <div className="estado-pendiente" style={{ marginTop: 14 }}>
              ESTADO: {estaConfirmado ? 'CONFIRMADO' : 'PENDIENTE DE CONFIRMACION MEDICA'}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Enfermedades Descartadas</div>
          <div className="card-body">
            <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--gray-500)', marginBottom: 10 }}>Patologias analizadas y descartadas por el motor IA</div>
            {resultado.descartados?.map((d, i) => (
              <div key={i} style={{
                background: d.enfermedad?.includes('CRITICA') ? 'var(--red-50)' : 'var(--gray-50)',
                border: `1px solid ${d.enfermedad?.includes('CRITICA') ? 'var(--red-600)' : 'var(--gray-300)'}`,
                borderRadius: 6, padding: '8px 12px', marginBottom: 6
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: d.enfermedad?.includes('CRITICA') ? 'var(--red-600)' : 'var(--gray-800)' }}>
                  {'\u274C'} {d.enfermedad}
                </div>
                <div style={{ fontSize: 10, color: 'var(--gray-600)', marginTop: 2 }}>{d.motivo}</div>
              </div>
            ))}
            <div style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--gray-500)', marginTop: 6 }}>+ patologias adicionales (ver reporte completo)</div>
          </div>
        </div>
      </div>

      <div className="actions-bar">
        {puedeConfirmar && (
          <>
            <button className="btn btn-success btn-lg" onClick={() => setShowConfirm(true)}>
              {'\u2705'} CONFIRMAR DIAGNOSTICO
            </button>
            <button className="btn btn-danger btn-lg" onClick={() => setShowReject(true)}>
              {'\u274C'} RECHAZAR DIAGNOSTICO
            </button>
          </>
        )}
        {!puedeConfirmar && (
          <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--gray-500)' }}>
            {rol !== 'medico' ? 'Solo el rol Medico puede confirmar o rechazar diagnosticos.' : 'Diagnostico procesado.'}
          </div>
        )}
      </div>

      <ModalConfirmacion
        open={showConfirm}
        title="Confirmar Diagnostico IA"
        onConfirm={confirmarDiagnostico}
        onCancel={() => setShowConfirm(false)}
        confirmLabel="Confirmar y Proceder a Formulacion"
        confirmVariant="success"
        loading={accion === 'confirmando'}
      >
        <p style={{ fontSize: 14, marginBottom: 8 }}>Esta por confirmar el diagnostico:</p>
        <div style={{ background: 'var(--blue-50)', padding: 12, borderRadius: 8 }}>
          <strong>{diagPrincipal?.enfermedad}</strong> — {diagPrincipal?.confianza_IA}% confianza<br />
          <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Paciente: {resultado.nombre} | Riesgo: {resultado.riesgo}</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 8 }}>Al confirmar se habilitara la formulacion farmacologica.</p>
      </ModalConfirmacion>

      <ModalConfirmacion
        open={showReject}
        title="Rechazar Diagnostico IA"
        onConfirm={() => {
          const motivo = document.getElementById('reject-motivo')?.value
          if (!motivo) return
          rechazarDiagnostico(motivo)
        }}
        onCancel={() => setShowReject(false)}
        confirmLabel="Rechazar Diagnostico"
        confirmVariant="danger"
        loading={accion === 'rechazando'}
      >
        <div className="form-group">
          <label className="form-label">Motivo del rechazo</label>
          <textarea id="reject-motivo" className="form-textarea" placeholder="Describa el motivo clinico del rechazo..." />
        </div>
      </ModalConfirmacion>
    </div>
  )
}
