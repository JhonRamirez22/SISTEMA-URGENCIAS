import SemaforoBadge from './SemaforoBadge'

export default function PacienteRow({ paciente, selected, onSelect }) {
  const riesgoLabels = {
    CRITICO: { color: '#CC3333', label: 'CRITICO' },
    ALTO: { color: '#FF8C00', label: 'ALTO' },
    MEDIO: { color: '#CCAA00', label: 'MEDIO' },
    BAJO: { color: '#33AA55', label: 'BAJO' }
  }

  const r = riesgoLabels[paciente.riesgo] || riesgoLabels.BAJO

  return (
    <div
      className={`paciente-row ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(paciente)}
    >
      <SemaforoBadge riesgo={paciente.riesgo} />
      <div className="info">
        <div className="nombre">{paciente.nombre}</div>
        <div className="diag-preview">
          {paciente.diagnostico
            ? `${paciente.diagnostico.enfermedad} - ${paciente.diagnostico.confianza_IA}%`
            : 'Sin diagnostico'}
        </div>
      </div>
      <span style={{ color: r.color, fontWeight: 700, fontSize: 11 }}>
        {r.label}
      </span>
    </div>
  )
}
