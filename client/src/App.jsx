import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, createContext } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import { ToastProvider } from './components/ToastNotificacion'
import Login from './views/Login'
import Dashboard from './views/Dashboard'
import DiagnosticoIA from './views/DiagnosticoIA'
import Formulacion from './views/Formulacion'
import NuevoPaciente from './views/NuevoPaciente'
import HistorialPaciente from './views/HistorialPaciente'
import Auditoria from './views/Auditoria'
import Notificaciones from './views/Notificaciones'

export const RolContext = createContext()

function AppLayout({ notificacionesCount }) {
  return (
    <>
      <Sidebar notificacionesCount={notificacionesCount} />
      <Header notificacionesCount={notificacionesCount} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/diagnostico/:id" element={<DiagnosticoIA />} />
          <Route path="/formulacion/:id" element={<Formulacion />} />
          <Route path="/paciente/nuevo" element={<NuevoPaciente />} />
          <Route path="/paciente/:id/historial" element={<HistorialPaciente />} />
          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  const [rol, setRol] = useState('medico')
  const [authenticated, setAuthenticated] = useState(false)
  const [notifCount, setNotifCount] = useState(3)

  if (!authenticated) {
    return (
      <RolContext.Provider value={{ rol, setRol }}>
        <ToastProvider>
          <Login onLogin={() => setAuthenticated(true)} />
        </ToastProvider>
      </RolContext.Provider>
    )
  }

  return (
    <RolContext.Provider value={{ rol, setRol }}>
      <ToastProvider>
        <div className="app">
          <AppLayout notificacionesCount={notifCount} />
        </div>
      </ToastProvider>
    </RolContext.Provider>
  )
}
