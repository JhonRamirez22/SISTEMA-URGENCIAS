export default function ProgresoFlujo({ paso }) {
  const pasos = [
    { num: 1, label: 'Ingreso' },
    { num: 2, label: 'Diagnostico IA' },
    { num: 3, label: 'Formulacion' },
    { num: 4, label: 'Aprobacion' },
  ]

  return (
    <div className="progreso-flujo">
      {pasos.map((p, i) => (
        <div key={p.num} style={{ display: 'contents' }}>
          <div className={`progreso-paso ${p.num < paso ? 'completed' : ''} ${p.num === paso ? 'active' : ''}`}>
            <div className="circulo">{p.num < paso ? '\u2713' : p.num}</div>
            <span className="label">{p.label}</span>
          </div>
          {i < pasos.length - 1 && (
            <div className={`progreso-linea ${p.num < paso ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
