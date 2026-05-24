export default function BuscadorPacientes({ value, onChange, placeholder }) {
  return (
    <div className="buscador">
      <span className="buscador-icon">{'\u{1F50D}'}</span>
      <input
        className="buscador-input"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Buscar paciente por nombre o ID...'}
      />
    </div>
  )
}
