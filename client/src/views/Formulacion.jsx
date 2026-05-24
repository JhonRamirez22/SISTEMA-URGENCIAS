import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { RolContext } from '../App'
import { ToastContext } from '../components/ToastNotificacion'
import ProgresoFlujo from '../components/ProgresoFlujo'
import ModalConfirmacion from '../components/ModalConfirmacion'

export default function Formulacion() {
  const { id } = useParams()
  const { rol } = useContext(RolContext)
  const addToast = useContext(ToastContext)
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState(null)
  const [nuevaDosis, setNuevaDosis] = useState('')
  const [auditoria, setAuditoria] = useState([])
  const [showAuditoria, setShowAuditoria] = useState(false)
  const [showAprobar, setShowAprobar] = useState(false)
  const [showRechazar, setShowRechazar] = useState(false)

  useEffect(() => {
    fetch(`/api/formular/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rol }) })
      .then(r => r.json())
      .then(res => {
        setData(res)
        if (res.formula) setNuevaDosis(String(res.formula.dosis_total_mg))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, rol])

  useEffect(() => {
    fetch(`/api/auditoria?paciente_id=${id}`).then(r => r.json()).then(setAuditoria).catch(() => {})
  }, [id, accion])

  const aprobar = async () => {
    setAccion('aprobando')
    try {
      await fetch(`/api/formular/${id}/aprobar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rol }) })
      setData(prev => ({ ...prev, estado: 'formulacion_aprobada' }))
      addToast('Formula aprobada. Medicamento autorizado para distribucion.', 'success')
      setShowAprobar(false)
    } catch (e) { addToast('Error al aprobar', 'critico') }
    setAccion(null)
  }

  const ajustarYAprobar = async () => {
    setAccion('ajustando')
    try {
      await fetch(`/api/formular/${id}/ajustar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rol, nuevaDosis: parseFloat(nuevaDosis) }) })
      setData(prev => ({ ...prev, estado: 'formulacion_aprobada', formula: { ...prev.formula, dosis_total_mg: parseFloat(nuevaDosis) } }))
      addToast(`Dosis ajustada a ${nuevaDosis} mg y aprobada.`, 'success')
    } catch (e) { addToast('Error al ajustar dosis', 'critico') }
    setAccion(null)
  }

  const rechazar = async (motivo) => {
    setAccion('rechazando')
    try {
      await fetch(`/api/formular/${id}/rechazar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rol, motivo }) })
      setData(prev => ({ ...prev, estado: 'formulacion_rechazada' }))
      addToast('Formulacion rechazada.', 'warning')
      setShowRechazar(false)
    } catch (e) { addToast('Error al rechazar', 'critico') }
    setAccion(null)
  }

  const administrar = async () => {
    setAccion('administrando')
    try {
      const res = await fetch(`/api/formular/${id}/administrar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rol }) })
      if (res.ok) {
        setData(prev => ({ ...prev, estado: 'medicamento_administrado' }))
        addToast(`Medicamento administrado a ${paciente.nombre}`, 'success', 5000)
      }
    } catch (e) { addToast('Error al registrar administracion', 'critico') }
    setAccion(null)
  }

  if (loading) return (
    <div className="page-content">
      <div className="loading"><div className="spinner" /><p>Calculando formulacion farmacologica...</p></div>
    </div>
  )

  if (!data || data.mensaje === 'No se requiere medicacion para este diagnostico' || !data.formula) return (
    <div className="page-content">
      <div className="banner banner-info">El diagnostico no requiere medicacion farmacologica. </div>
      <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 10 }}>Volver al Panel</button>
    </div>
  )

  const { formula, paciente, calculo, validaciones } = data
  const esPendiente = data.estado === 'formulacion_pendiente'
  const esAprobado = data.estado === 'formulacion_aprobada'
  const esRechazado = data.estado === 'formulacion_rechazada'
  const puedeActuar = rol === 'medico' && esPendiente

  return (
    <div className="page-content">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-600)', marginBottom: 12 }}>
            <span><Link to={`/diagnostico/${id}`} style={{ color: 'var(--blue-600)', textDecoration: 'none' }}>{'\u2190'} Volver al Diagnostico</Link> | Formulacion | Paciente: {paciente.nombre}</span>
          </div>
          <ProgresoFlujo paso={3} />
        </div>
      </div>

      {paciente.diagnostico && (
        <div className="banner banner-success">
          {'\u2705'} Diagnostico confirmado: {paciente.diagnostico.enfermedad} | Confianza: {paciente.diagnostico.confianza_IA}% | Por: Dr. Ramirez
        </div>
      )}

      {formula && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">{'\u{1F48A}'} Medicamento Sugerido por IA</div>
            <div className="card-body">
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{formula.medicamento}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 12 }}>
                Principio activo: {formula.principio_activo} | {formula.presentacion} | Via: {formula.via}
              </div>

              <div className="section-title">Calculo de Dosis</div>
              <div className="prescripcion-box">
                <div className="rx">Rx</div>
                <div className="line"><strong>{formula.medicamento}</strong> {formula.dosis_total_mg} mg</div>
                <div className="line">Paciente: {paciente.nombre} — {paciente.peso_kg} kg — {paciente.edad} anos</div>
                <div className="line">Formula: {paciente.peso_kg} kg x {formula.dosis_mg_kg} mg/kg = {formula.dosis_total_mg} mg</div>
                <div className="line">Frecuencia: {formula.frecuencia} | Duracion: {formula.duracion} | Via: {formula.via}</div>
                {formula.nota_seguridad && <div className="line" style={{ marginTop: 8, fontSize: 11, color: 'var(--orange-600)' }}>{'\u26A0'} {formula.nota_seguridad}</div>}
                <div className="firma">
                  Dr. Ramirez — Sistema IA Urgencias v2.0<br />
                  {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">Validaciones de Seguridad</div>
              <div className="card-body">
                {validaciones?.map((v, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: v.tipo === 'ok' ? 'var(--green-600)' : v.tipo === 'warning' ? 'var(--yellow-600)' : 'var(--red-600)' }}>
                    <span>{v.tipo === 'ok' ? '\u2705' : v.tipo === 'warning' ? '\u26A0\uFE0F' : '\u274C'}</span>
                    <span>{v.mensaje}</span>
                  </div>
                ))}
              </div>
            </div>

            {esPendiente && (
              <div className="estado-pendiente" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>PENDIENTE DE APROBACION</div>
                <div style={{ fontSize: 12, fontWeight: 400 }}>Requiere aprobacion explicita del medico</div>
              </div>
            )}

            {esAprobado && (
              <>
                <div className="banner banner-success">
                  {'\u2705'} FORMULA APROBADA. Medicamento listo para administrar.
                </div>
                {rol === 'enfermera' && (
                  <button className="btn btn-success btn-lg btn-block" style={{ marginBottom: 16 }} onClick={administrar} disabled={accion === 'administrando'}>
                    {'\u{1F48A}'} {accion === 'administrando' ? 'Registrando...' : `Administrar ${formula.medicamento} ${formula.dosis_total_mg} mg a ${paciente.nombre}`}
                  </button>
                )}
              </>
            )}

            {esRechazado && (
              <div className="banner banner-error">
                {'\u274C'} FORMULA RECHAZADA.
              </div>
            )}

            {data.estado === 'medicamento_administrado' && (
              <div className="banner banner-info">
                {'\u2705'} MEDICAMENTO ADMINISTRADO. Tratamiento completado y registrado en auditoria.
              </div>
            )}

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">Ajuste de Dosis (opcional)</div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Nueva dosis (mg):</span>
                  <input type="number" className="form-input" style={{ width: 120 }} value={nuevaDosis} onChange={e => setNuevaDosis(e.target.value)} disabled={!puedeActuar} />
                  <button className="btn btn-warning" onClick={ajustarYAprobar} disabled={!puedeActuar || accion === 'ajustando'}>
                    {accion === 'ajustando' ? 'Aplicando...' : 'Aplicar y Aprobar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="section-title" style={{ marginTop: 16 }}>Acciones Disponibles</div>
      <div className="actions-bar">
        <button className="btn btn-success btn-lg btn-block" style={{ flex: 1 }} onClick={() => setShowAprobar(true)} disabled={!puedeActuar}>
          {'\u2705'} Aprobar Formula y Autorizar Distribucion
        </button>
        <button className="btn btn-warning btn-lg btn-block" style={{ flex: 1 }} onClick={ajustarYAprobar} disabled={!puedeActuar || accion === 'ajustando'}>
          {'\u{1F527}'} Ajustar Dosis y Aprobar
        </button>
        <button className="btn btn-danger btn-lg btn-block" style={{ flex: 1 }} onClick={() => setShowRechazar(true)} disabled={!puedeActuar}>
          {'\u274C'} Rechazar Formulacion
        </button>
      </div>

      {!puedeActuar && !esAprobado && !esRechazado && (
        <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--gray-500)', marginTop: 10 }}>{rol !== 'medico' ? 'Solo el rol Medico puede actuar sobre formulaciones.' : 'Formulacion ya procesada.'}</div>
      )}

      {(rol === 'admin' || rol === 'medico') && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header" onClick={() => setShowAuditoria(!showAuditoria)} style={{ cursor: 'pointer' }}>
            {'\u{1F4CB}'} Registro de Auditoria {showAuditoria ? '\u25B2' : '\u25BC'}
          </div>
          {showAuditoria && (
            <div className="card-body">
              {auditoria.length === 0 && <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Sin registros.</p>}
              {auditoria.map(a => (
                <div key={a.id} className="auditoria-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 12 }}>
                  <span><strong>{a.accion}</strong> — {a.detalle}</span>
                  <span style={{ color: 'var(--gray-500)', fontSize: 11 }}>{new Date(a.timestamp).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ModalConfirmacion
        open={showAprobar}
        title="Aprobar Formula y Autorizar Distribucion"
        onConfirm={aprobar}
        onCancel={() => setShowAprobar(false)}
        confirmLabel="Aprobar y Distribuir"
        confirmVariant="success"
        loading={accion === 'aprobando'}
      >
        <p style={{ fontSize: 14, marginBottom: 8 }}>Esta por autorizar la distribucion de:</p>
        <div style={{ background: 'var(--green-50)', padding: 12, borderRadius: 8 }}>
          <strong>{formula?.medicamento}</strong> — {formula?.dosis_total_mg} mg<br />
          <span style={{ fontSize: 12 }}>Paciente: {paciente?.nombre} | Frecuencia: {formula?.frecuencia}</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 8 }}>Se registrara en auditoria y se notificara a enfermeria.</p>
      </ModalConfirmacion>

      <ModalConfirmacion
        open={showRechazar}
        title="Rechazar Formulacion"
        onConfirm={() => {
          const motivo = document.getElementById('reject-formula-motivo')?.value
          if (!motivo) return
          rechazar(motivo)
        }}
        onCancel={() => setShowRechazar(false)}
        confirmLabel="Rechazar Formula"
        confirmVariant="danger"
        loading={accion === 'rechazando'}
      >
        <div className="form-group">
          <label className="form-label">Motivo del rechazo</label>
          <textarea id="reject-formula-motivo" className="form-textarea" placeholder="Describa el motivo clinico del rechazo..." />
        </div>
      </ModalConfirmacion>
    </div>
  )
}
