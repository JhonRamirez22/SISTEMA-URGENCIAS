import { useState, useContext } from 'react'
import { RolContext } from '../App'

const CREDENCIALES = {
  medico: { usuario: 'dr.ramirez', clave: 'urgencias2026' },
  enfermera: { usuario: 'enf.lopez', clave: 'enfermeria2026' },
  admin: { usuario: 'admin', clave: 'admin2026' },
}

export default function Login({ onLogin }) {
  const { setRol } = useContext(RolContext)
  const [rol, setRolLocal] = useState('medico')
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')

  const handlePreset = (r) => {
    setRolLocal(r)
    setUsuario(CREDENCIALES[r].usuario)
    setClave(CREDENCIALES[r].clave)
    setError('')
  }

  const handleLogin = (e) => {
    e.preventDefault()
    const cred = CREDENCIALES[rol]
    if (usuario === cred.usuario && clave === cred.clave) {
      setRol(rol)
      if (onLogin) onLogin()
    } else {
      setError('Credenciales invalidas. Use los accesos predefinidos.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{'\u{1F3E5}'} Sistema IA</h1>
        <div className="sub">Sala de Urgencias — Acceso del Personal</div>

        <div className="login-preset">
          {Object.entries(CREDENCIALES).map(([r, c]) => (
            <button key={r} onClick={() => handlePreset(r)} style={rol === r ? { background: '#d6eaf8', borderColor: '#2980b9' } : {}}>
              <strong>{r === 'medico' ? 'Medico' : r === 'enfermera' ? 'Enfermera' : 'Admin'}</strong>
              <br /><small style={{ fontSize: 10, color: '#666' }}>{c.usuario}</small>
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input className="form-input" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Usuario" />
          </div>
          <div className="form-group">
            <label className="form-label">Clave</label>
            <input className="form-input" type="password" value={clave} onChange={e => setClave(e.target.value)} placeholder="Clave" />
          </div>
          {error && <div className="banner banner-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 8 }}>
            {'\u{1F512}'} Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  )
}
