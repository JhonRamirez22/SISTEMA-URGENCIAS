import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, createContext } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import RoleSelector from './components/RoleSelector'
import Dashboard from './views/Dashboard'
import DiagnosticoIA from './views/DiagnosticoIA'
import Formulacion from './views/Formulacion'

export const RolContext = createContext()

export default function App() {
  const [rol, setRol] = useState('medico')

  return (
    <RolContext.Provider value={{ rol, setRol }}>
      <div className="app">
        <Header notificacionesCount={3} />
        <RoleSelector rol={rol} setRol={setRol} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/diagnostico/:id" element={<DiagnosticoIA />} />
            <Route path="/formulacion/:id" element={<Formulacion />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </RolContext.Provider>
  )
}
