export default function ResumenRapido({ paciente }) {
  if (!paciente) {
    return (
      <div className="panel-body">
        <p className="resumen-item" style={{ color: '#888' }}>Seleccione un paciente para ver el resumen</p>
      </div>
    )
  }

  const alterados = []
  if (paciente.presion_sistolica > 139 || paciente.presion_sistolica < 90) alterados.push('Presion')
  if (paciente.trigliceridos_mgdl > 150) alterados.push('Trigliceridos')
  if (paciente.glucosa_mgdl > 100 || paciente.glucosa_mgdl < 70) alterados.push('Glucosa')

  const normales = []
  if (paciente.creatinina_mgdl >= 0.6 && paciente.creatinina_mgdl <= 1.3) normales.push(`Creatinina (${paciente.creatinina_mgdl})`)
  if (paciente.hemoglobina >= 12 && paciente.hemoglobina <= 16) normales.push(`Hb (${paciente.hemoglobina})`)
  if (paciente.leucocitos >= 4000 && paciente.leucocitos <= 11000) normales.push(`Leucocitos (${paciente.leucocitos})`)

  return (
    <div className="panel-body">
      <div className="resumen-item">
        <strong>Edad: {paciente.edad}</strong> &bull; Peso: {paciente.peso_kg} kg &bull; Tipo: {paciente.tipo_sangre}
      </div>
      <div className="resumen-item">Antecedentes: {paciente.antecedentes.join(', ') || 'Ninguno'}</div>
      <div className="resumen-item" style={{ color: '#CC3333' }}>
        Alergias: {paciente.alergias.join(', ') || 'Ninguna'}
      </div>
      <hr className="separator" style={{ margin: '8px 0' }} />
      <div className="resumen-item" style={{ color: '#CC3333' }}>
        {'\u26A0'} Examenes alterados: {alterados.join(', ') || 'Ninguno'}
      </div>
      <div className="resumen-item" style={{ color: '#33AA55' }}>
        {'\u2713'} Examenes normales: {normales.join(', ') || 'Todos'}
      </div>
    </div>
  )
}
