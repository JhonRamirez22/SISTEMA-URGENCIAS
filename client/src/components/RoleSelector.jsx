export default function RoleSelector({ rol, setRol }) {
  return (
    <div className="role-selector">
      <label>Rol activo:</label>
      <select
        className="role-select"
        value={rol}
        onChange={e => setRol(e.target.value)}
      >
        <option value="medico">Medico</option>
        <option value="enfermera">Enfermera</option>
        <option value="admin">Administrador</option>
      </select>
      <span className={`role-badge ${rol}`}>{rol}</span>
    </div>
  )
}
