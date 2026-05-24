import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { RolContext } from '../App'

export default function DiagnosticoIA() {
  const { id } = useParams()
  const { rol } = useContext(RolContext)
  const navigate = useNavigate()
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState(null)

  useEffect(() => {
    fetch(`/api/diagnosticar/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol })
    })
      .then(r => r.json())
      .then(data => {
        setResultado(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, rol])

  const confirmarDiagnostico = async () => {
    setAccion('confirmando')
    try {
      await fetch(`/api/diagnosticar/${id}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol })
      })
      navigate(`/formulacion/${id}`)
    } catch (e) {
      setAccion(null)
    }
  }

  const rechazarDiagnostico = async () => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return
    setAccion('rechazando')
    try {
      await fetch(`/api/diagnosticar/${id}/rechazar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol, motivo })
      })
      navigate('/')
    } catch (e) {
      setAccion(null)
    }
  }

  if (loading) return <div className="loading">Ejecutando motor IA... analizando examenes y contrastando con base de conocimiento...</div>
  if (!resultado) return <div className="error-box">Error al obtener el diagnostico</div>

  const diagPrincipal = resultado.diagnosticos?.[0]
  const estaConfirmado = resultado.estado === 'diagnostico_confirmado'

  const puedeConfirmar = rol === 'medico' && !estaConfirmado

  return (
    <div style={{ paddingTop: 20 }}>
      <div className="breadcrumb">
        <Link to="/">{'\u2190'} Volver al Dashboard</Link>
        {' | DIAGNOSTICO IA | Paciente: '}{resultado.nombre} (ID: {id})
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #CCC', marginBottom: 16 }} />

      <div className="grid-3">
        <div className="panel">
          <div className="panel-header">DATOS DEL PACIENTE</div>
          <div className="panel-body">
            <div className="section-title" style={{ fontSize: 13, marginBottom: 8 }}>Informacion general</div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              Nombre: {resultado.nombre} | Edad: {resultado.edad} anos | Peso: {resultado.peso_kg} kg | Tipo sangre: {resultado.tipo_sangre}
            </div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              Antecedentes: {resultado.antecedentes?.join(', ') || 'Ninguno'}
            </div>
            <div style={{ fontSize: 12, color: '#CC3333' }}>
              Alergias: {resultado.alergias?.join(', ') || 'Ninguna'}
            </div>

            <hr className="separator" style={{ margin: '10px 0' }} />

            <div className="section-title" style={{ fontSize: 13, marginBottom: 8 }}>
              Examenes de laboratorio registrados ({resultado.examenes?.length || 0})
            </div>
            {resultado.examenes?.map((ex, i) => (
              <div key={i} className="examen-item">
                <span className={`examen-dot ${ex.alterado ? 'alterado' : 'normal'}`} />
                <span className={ex.alterado ? 'examen-alterado' : 'examen-normal'}>
                  {ex.alterado ? '\u26A0' : '\u2713'} {ex.nombre}: {ex.valor} {ex.unidad} (Ref: {ex.ref}) &rarr; {ex.alterado ? 'ALTERADO' : 'Normal'}
                </span>
              </div>
            ))}

            <hr className="separator" style={{ margin: '10px 0' }} />

            <div style={{ fontSize: 12, fontWeight: 700 }}>
              Resumen: {resultado.examenes_alterados} examenes alterados de {resultado.total_examenes}
              {resultado.antecedentes?.length > 0 && ` | ${resultado.antecedentes.length} antecedente(s) coincidente(s)`}
            </div>
            <div style={{ fontSize: 11, fontStyle: 'italic', color: '#666', marginTop: 4 }}>
              Historial clinico usado en analisis: {resultado.antecedentes?.length > 0 ? 'Si' : 'No'}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">RESULTADO DEL ANALISIS IA</div>
          <div className="panel-body">
            <div className="diagnostico-card">
              <div style={{ fontSize: 16, fontWeight: 700, color: '#CC3333' }}>
                {'\u{1F534}'} RIESGO: {resultado.riesgo}
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>Nivel de prioridad calculado por el motor IA</div>
            </div>

            <div className="section-title" style={{ fontSize: 14 }}>DIAGNOSTICO PRINCIPAL</div>
            <div className="diagnostico-principal">{diagPrincipal?.enfermedad || 'Sin diagnostico'}</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
              {diagPrincipal?.descripcion || ''}
            </div>

            <hr className="separator" style={{ margin: '8px 0' }} />

            <div className="confianza-badge">
              CONFIANZA DEL DIAGNOSTICO: {diagPrincipal?.confianza_IA || 0}%
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
              Calculo: condiciones cumplidas + sintomas coincidentes + antecedentes en historial
            </div>

            <hr className="separator" style={{ margin: '8px 0' }} />

            <div style={{ fontSize: 12, color: '#666' }}>
              Sintomas reportados asociados: {resultado.sintomas?.join(', ') || 'Ninguno'}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              Examenes confirmatorios: valores fuera de rango normal detectados
            </div>

            <div className="estado-pendiente" style={{ marginTop: 14 }}>
              ESTADO: {estaConfirmado ? 'DIAGNOSTICO CONFIRMADO' : 'PENDIENTE DE CONFIRMACION MEDICA'}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">ENFERMEDADES DESCARTADAS</div>
          <div className="panel-body">
            <div style={{ fontSize: 12, fontStyle: 'italic', color: '#888', marginBottom: 10 }}>
              Patologias analizadas y descartadas por el motor IA
            </div>
            {resultado.descartados?.map((d, i) => (
              <div key={i} className={`descartada-card ${d.enfermedad?.includes('CRITICA') ? 'warn' : 'info'}`}>
                <div className="nombre" style={{ color: d.enfermedad?.includes('CRITICA') ? '#CC3333' : '#333' }}>
                  {'\u274C'} {d.enfermedad}
                </div>
                <div className="motivo">Descartada por: {d.motivo}</div>
              </div>
            ))}
            <div style={{ fontSize: 11, fontStyle: 'italic', color: '#888', marginTop: 6 }}>
              + patologias adicionales descartadas (ver reporte completo)
            </div>
          </div>
        </div>
      </div>

      <div className="actions-bar" style={{ marginTop: 20 }}>
        {puedeConfirmar && (
          <>
            <button
              className="btn btn-success btn-lg"
              onClick={confirmarDiagnostico}
              disabled={accion === 'confirmando'}
            >
              {'\u2705'} {accion === 'confirmando' ? 'CONFIRMANDO...' : 'CONFIRMAR DIAGNOSTICO'}
            </button>
            <button
              className="btn btn-danger btn-lg"
              onClick={rechazarDiagnostico}
              disabled={accion === 'rechazando'}
            >
              {'\u274C'} RECHAZAR DIAGNOSTICO
            </button>
          </>
        )}
        {!puedeConfirmar && (
          <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>
            {rol !== 'medico'
              ? 'Solo el rol Medico puede confirmar o rechazar diagnosticos.'
              : 'Al confirmar: se habilitara la formulacion farmacologica. Al rechazar: se registrara en auditoria.'}
          </div>
        )}
      </div>
    </div>
  )
}
