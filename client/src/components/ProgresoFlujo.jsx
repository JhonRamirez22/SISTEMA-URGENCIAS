export default function ProgresoFlujo({ paso }) {
  const pasos = [
    { num: 1, label: 'Ingreso', actor: 'Enfermera registra' },
    { num: 2, label: 'Diagnostico IA', actor: 'Motor IA analiza' },
    { num: 3, label: 'Formulacion', actor: 'Medico revisa' },
    { num: 4, label: 'Aprobacion', actor: 'Enfermera administra' },
  ]

  return (
    <div className="progreso-flujo">
      {pasos.map((p, i) => (
        <div key={p.num} style={{ display: 'contents' }}>
          <div className={`progreso-paso ${p.num < paso ? 'completed' : ''} ${p.num === paso ? 'active' : ''}`}>
            <div className="circulo">{p.num < paso ? '\u2713' : p.num}</div>
            <div>
              <span className="label">{p.label}</span>
              <div style={{ fontSize: 10, color: p.num === paso ? 'var(--blue-700)' : 'var(--gray-400)', fontWeight: 400 }}>
                {p.actor}
              </div>
            </div>
          </div>
          {i < pasos.length - 1 && (
            <div className={`progreso-linea ${p.num < paso ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
