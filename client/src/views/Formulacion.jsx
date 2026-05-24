import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { RolContext } from '../App'

export default function Formulacion() {
  const { id } = useParams()
  const { rol } = useContext(RolContext)
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState(null)
  const [nuevaDosis, setNuevaDosis] = useState('')
  const [auditoria, setAuditoria] = useState([])
  const [showAuditoria, setShowAuditoria] = useState(false)

  useEffect(() => {
    fetch(`/api/formular/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol })
    })
      .then(r => r.json())
      .then(res => {
        setData(res)
        if (res.formula) setNuevaDosis(String(res.formula.dosis_total_mg))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, rol])

  useEffect(() => {
    fetch(`/api/auditoria?paciente_id=${id}`)
      .then(r => r.json())
      .then(setAuditoria)
      .catch(() => {})
  }, [id, accion])

  const aprobar = async () => {
    setAccion('aprobando')
    try {
      await fetch(`/api/formular/${id}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol })
      })
      setData(prev => ({ ...prev, estado: 'formulacion_aprobada' }))
      setAccion('aprobado')
    } catch (e) {
      setAccion(null)
    }
  }

  const ajustarYAprobar = async () => {
    setAccion('ajustando')
    try {
      await fetch(`/api/formular/${id}/ajustar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol, nuevaDosis: parseFloat(nuevaDosis) })
      })
      setData(prev => ({
        ...prev,
        estado: 'formulacion_aprobada',
        formula: { ...prev.formula, dosis_total_mg: parseFloat(nuevaDosis) }
      }))
      setAccion('ajustado')
    } catch (e) {
      setAccion(null)
    }
  }

  const rechazar = async () => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return
    setAccion('rechazando')
    try {
      await fetch(`/api/formular/${id}/rechazar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol, motivo })
      })
      setData(prev => ({ ...prev, estado: 'formulacion_rechazada' }))
      setAccion('rechazado')
    } catch (e) {
      setAccion(null)
    }
  }

  if (loading) return <div className="loading">Calculando formulacion farmacologica...</div>
  if (!data) return <div className="error-box">Error al obtener la formulacion. Genere un diagnostico primero.</div>
  if (data.mensaje === "No se requiere medicacion para este diagnostico") {
    return (
      <div style={{ paddingTop: 20 }}>
        <div className="breadcrumb">
          <Link to={`/diagnostico/${id}`}>{'\u2190'} Volver al Diagnostico</Link>
          {' | FORMULACION FARMACOLOGICA'}
        </div>
        <div className="error-box" style={{ background: '#EEFFEE', border: '1px solid #33AA55', color: '#33AA55' }}>
          El diagnostico no requiere medicacion. Sin formula pendiente.
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 10 }}>
          Volver al Dashboard
        </button>
      </div>
    )
  }

  const { formula, paciente, calculo, validaciones } = data
  const esPendiente = data.estado === 'formulacion_pendiente'
  const esAprobado = data.estado === 'formulacion_aprobada'
  const esRechazado = data.estado === 'formulacion_rechazada'
  const puedeActuar = rol === 'medico' && esPendiente

  return (
    <div style={{ paddingTop: 20 }}>
      <div className="breadcrumb">
        <Link to={`/diagnostico/${id}`}>{'\u2190'} Volver al Diagnostico</Link>
        {' | FORMULACION FARMACOLOGICA | Paciente: '}{paciente.nombre}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #CCC', marginBottom: 16 }} />

      {paciente.diagnostico && (
        <div className="banner-confirmado" style={{ marginBottom: 20 }}>
          {'\u2705'} DIAGNOSTICO CONFIRMADO: {paciente.diagnostico.enfermedad} | Confianza: {paciente.diagnostico.confianza_IA}% | Confirmado por: Dr. Oscar Osorio | Hora: {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {formula && (
        <>
          <div className="panel" style={{ marginBottom: 20 }}>
            <div className="panel-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 36 }}>{'\u{1F48A}'}</span>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{formula.medicamento}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    Principio activo: {formula.principio_activo} | Presentacion: {formula.presentacion} | Via: {formula.via}
                  </div>
                </div>
              </div>

              <hr className="separator" />

              <div className="section-title" style={{ marginTop: 10 }}>CALCULO DE DOSIS</div>
              <div className="formula-box">
                <div className="formula-text">
                  Formula: {calculo.peso_kg} kg (peso paciente) &times; {calculo.dosis_mg_kg} mg/kg/dia = {Math.round(calculo.peso_kg * calculo.dosis_mg_kg * 100) / 100} mg
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                  {calculo.ajuste_geriatrico ? 'Ajuste geriatrico aplicado (x0.75) | ' : 'Sin ajuste geriatrico necesario | '}
                  {calculo.ajuste_pediatrico ? 'Ajuste pediatrico aplicado (x0.50) | ' : 'Sin ajuste pediatrico | '}
                  {calculo.ajuste_renal ? 'Ajuste renal aplicado (x0.60)' : 'Sin ajuste renal'}
                </div>
              </div>

              <div className="dosis-calculada">
                DOSIS CALCULADA: {formula.dosis_total_mg} mg | Frecuencia: {formula.frecuencia} | Duracion: {formula.duracion}
              </div>

              <hr className="separator" style={{ margin: '10px 0' }} />

              <div className="section-title" style={{ marginBottom: 6 }}>VALIDACIONES DE SEGURIDAD</div>
              {validaciones?.map((v, i) => (
                <div key={i} className={`validacion-item ${v.tipo}`}>
                  <span>{v.tipo === 'ok' ? '\u2705' : v.tipo === 'warning' ? '\u26A0\uFE0F' : '\u274C'}</span>
                  <span>{v.mensaje}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pendiente de aprobacion */}
          {esPendiente && (
            <div className="pendiente-aprobacion" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#997700', marginBottom: 8 }}>
                ESTADO: PENDIENTE DE APROBACION
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                La formula medica requiere aprobacion explicita del medico antes de autorizar la distribucion.
              </div>
              <div style={{ fontSize: 11, fontStyle: 'italic', color: '#888', marginTop: 4 }}>
                Opciones disponibles: Aprobar (distribuye) | Ajustar dosis (modifica) | Rechazar (cancela)
              </div>
            </div>
          )}

          {esAprobado && (
            <div className="banner-confirmado" style={{ marginBottom: 20, background: '#E3F2FD', border: '1px solid #3388CC', color: '#1565C0' }}>
              {'\u2705'} FORMULA APROBADA. Medicamento autorizado para distribucion. Notificacion enviada a enfermeria.
            </div>
          )}

          {esRechazado && (
            <div className="error-box" style={{ marginBottom: 20 }}>
              {'\u274C'} FORMULA RECHAZADA. El diagnostico permanece confirmado pero sin formulacion activa.
            </div>
          )}

          {/* Ajuste de dosis */}
          <div className="section-title">AJUSTE DE DOSIS (opcional)</div>
          <div className="ajuste-box" style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Nueva dosis (mg):</span>
            <input
              type="number"
              className="ajuste-input"
              value={nuevaDosis}
              onChange={e => setNuevaDosis(e.target.value)}
              disabled={!puedeActuar}
            />
            <button
              className="btn btn-warning"
              onClick={ajustarYAprobar}
              disabled={!puedeActuar || accion === 'ajustando'}
            >
              {accion === 'ajustando' ? 'APLICANDO...' : 'APLICAR Y APROBAR'}
            </button>
            <span style={{ fontSize: 12, fontStyle: 'italic', color: '#888' }}>
              Use este campo si necesita modificar la dosis sugerida por la IA antes de aprobar
            </span>
          </div>

          {/* Acciones */}
          <div className="section-title" style={{ marginTop: 10 }}>ACCIONES DISPONIBLES</div>
          <div className="actions-bar">
            <button
              className="btn btn-success btn-lg btn-block"
              onClick={aprobar}
              disabled={!puedeActuar || accion === 'aprobando'}
              style={{ flex: 1 }}
            >
              {'\u2705'} {accion === 'aprobando' ? 'APROBANDO...' : 'APROBAR FORMULA Y AUTORIZAR DISTRIBUCION'}
            </button>
            <button
              className="btn btn-warning btn-lg btn-block"
              onClick={ajustarYAprobar}
              disabled={!puedeActuar || accion === 'ajustando'}
              style={{ flex: 1 }}
            >
              {'\u{1F527}'} AJUSTAR DOSIS Y APROBAR
            </button>
            <button
              className="btn btn-danger btn-lg btn-block"
              onClick={rechazar}
              disabled={!puedeActuar || accion === 'rechazando'}
              style={{ flex: 1 }}
            >
              {'\u274C'} RECHAZAR FORMULACION
            </button>
          </div>

          {!puedeActuar && !esAprobado && !esRechazado && (
            <div style={{ fontSize: 12, fontStyle: 'italic', color: '#888', marginTop: 10 }}>
              {rol !== 'medico'
                ? 'Solo el rol Medico puede aprobar, ajustar o rechazar formulaciones.'
                : 'La formulacion ya fue procesada.'}
            </div>
          )}
        </>
      )}

      {!formula && (
        <div className="error-box" style={{ background: '#EEFFEE', border: '1px solid #33AA55', color: '#33AA55' }}>
          No se encontro medicacion para el diagnostico. Esto puede deberse a que el diagnostico no requiere tratamiento farmacologico.
        </div>
      )}

      {/* Auditoria */}
      {(rol === 'admin' || rol === 'medico') && (
        <div className="panel auditoria-panel" style={{ marginTop: 20 }}>
          <div className="panel-header" onClick={() => setShowAuditoria(!showAuditoria)} style={{ cursor: 'pointer' }}>
            {'\u{1F4CB}'} REGISTRO DE AUDITORIA {showAuditoria ? '\u25B2' : '\u25BC'}
          </div>
          {showAuditoria && (
            <div className="panel-body">
              {auditoria.length === 0 && <p style={{ fontSize: 12, color: '#888' }}>Sin registros de auditoria.</p>}
              {auditoria.map(a => (
                <div key={a.id} className="auditoria-item">
                  <span>
                    <strong>{a.accion}</strong> - {a.detalle}
                  </span>
                  <span style={{ color: '#888', fontSize: 11 }}>
                    {new Date(a.timestamp).toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
