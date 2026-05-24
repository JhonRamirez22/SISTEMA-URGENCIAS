import { createContext, useState, useCallback } from 'react'

const ToastContext = createContext()

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((mensaje, tipo = 'info', duracion = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensaje, tipo }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duracion)
  }, [])

  const iconos = {
    info: '\u2139\uFE0F',
    critico: '\u{1F534}',
    success: '\u2705',
    warning: '\u26A0\uFE0F',
  }

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.tipo}`}>
            <span className="icono">{iconos[t.tipo] || iconos.info}</span>
            <span>{t.mensaje}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export { ToastContext, ToastProvider }
