import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { RolContext } from '../App'
import { ToastContext } from '../components/ToastNotificacion'
import ProgresoFlujo from '../components/ProgresoFlujo'

const initialForm = {
  nombre: '', edad: '', peso_kg: '', tipo_sangre: 'O+',
  presion_sistolica: '', presion_diastolica: '', frecuencia_cardiaca: '',
  temperatura_c: '36.5', saturacion_o2: '98', glucosa_mgdl: '',
  trigliceridos_mgdl: '', creatinina_mgdl: '', hemoglobina: '', leucocitos: '',
  sintomas: '', antecedentes: '', alergias: ''
}

export default function NuevoPaciente() {
  const { rol } = useContext(RolContext)
  const addToast = useContext(ToastContext)
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.edad || !form.peso_kg) {
      addToast('Complete los campos obligatorios: nombre, edad y peso', 'warning')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          edad: parseInt(form.edad),
          peso_kg: parseFloat(form.peso_kg),
          presion_sistolica: parseInt(form.presion_sistolica) || 120,
          presion_diastolica: parseInt(form.presion_diastolica) || 80,
          frecuencia_cardiaca: parseInt(form.frecuencia_cardiaca) || 72,
          temperatura_c: parseFloat(form.temperatura_c) || 36.5,
          saturacion_o2: parseFloat(form.saturacion_o2) || 98,
          glucosa_mgdl: parseFloat(form.glucosa_mgdl) || 90,
          trigliceridos_mgdl: parseFloat(form.trigliceridos_mgdl) || 150,
          creatinina_mgdl: parseFloat(form.creatinina_mgdl) || 1.0,
          hemoglobina: parseFloat(form.hemoglobina) || 14,
          leucocitos: parseInt(form.leucocitos) || 8000,
          sintomas: form.sintomas.split(',').map(s => s.trim()).filter(Boolean),
          antecedentes: form.antecedentes.split(',').map(s => s.trim()).filter(Boolean),
          alergias: form.alergias.split(',').map(s => s.trim()).filter(Boolean),
        })
      })

      if (res.ok) {
        const data = await res.json()
        addToast(`Paciente ${data.nombre} ingresado correctamente (ID: ${data.id})`, 'success')
        navigate('/')
      }
    } catch (e) {
      addToast('Error al registrar paciente', 'critico')
    }
    setSubmitting(false)
  }

  return (
    <div className="page-content">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <ProgresoFlujo paso={1} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">{'\u{1F3E5}'} Ingreso de Nuevo Paciente a Urgencias</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="section-title">Datos Personales</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input className="form-input" value={form.nombre} onChange={update('nombre')} placeholder="Ej: Carlos Andres Martinez" />
              </div>
              <div className="form-group">
                <label className="form-label">Edad (anos) *</label>
                <input className="form-input" type="number" value={form.edad} onChange={update('edad')} placeholder="58" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Peso (kg) *</label>
                <input className="form-input" type="number" step="0.1" value={form.peso_kg} onChange={update('peso_kg')} placeholder="78.5" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de Sangre</label>
                <select className="form-select" value={form.tipo_sangre} onChange={update('tipo_sangre')}>
                  <option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
            </div>

            <div className="section-title" style={{ marginTop: 16 }}>Signos Vitales</div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Presion Sistolica (mmHg)</label>
                <input className="form-input" type="number" value={form.presion_sistolica} onChange={update('presion_sistolica')} placeholder="120" />
              </div>
              <div className="form-group">
                <label className="form-label">Presion Diastolica (mmHg)</label>
                <input className="form-input" type="number" value={form.presion_diastolica} onChange={update('presion_diastolica')} placeholder="80" />
              </div>
              <div className="form-group">
                <label className="form-label">Frec. Cardiaca (lpm)</label>
                <input className="form-input" type="number" value={form.frecuencia_cardiaca} onChange={update('frecuencia_cardiaca')} placeholder="72" />
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Temperatura (°C)</label>
                <input className="form-input" type="number" step="0.1" value={form.temperatura_c} onChange={update('temperatura_c')} placeholder="36.5" />
              </div>
              <div className="form-group">
                <label className="form-label">Saturacion O2 (%)</label>
                <input className="form-input" type="number" step="0.1" value={form.saturacion_o2} onChange={update('saturacion_o2')} placeholder="98" />
              </div>
              <div className="form-group">
                <label className="form-label">Glucosa (mg/dL)</label>
                <input className="form-input" type="number" value={form.glucosa_mgdl} onChange={update('glucosa_mgdl')} placeholder="90" />
              </div>
            </div>

            <div className="section-title" style={{ marginTop: 16 }}>Examenes de Laboratorio</div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Trigliceridos (mg/dL)</label>
                <input className="form-input" type="number" value={form.trigliceridos_mgdl} onChange={update('trigliceridos_mgdl')} placeholder="150" />
              </div>
              <div className="form-group">
                <label className="form-label">Creatinina (mg/dL)</label>
                <input className="form-input" type="number" step="0.1" value={form.creatinina_mgdl} onChange={update('creatinina_mgdl')} placeholder="1.0" />
              </div>
              <div className="form-group">
                <label className="form-label">Hemoglobina (g/dL)</label>
                <input className="form-input" type="number" step="0.1" value={form.hemoglobina} onChange={update('hemoglobina')} placeholder="14" />
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: '33%' }}>
              <label className="form-label">Leucocitos (/uL)</label>
              <input className="form-input" type="number" value={form.leucocitos} onChange={update('leucocitos')} placeholder="8000" />
            </div>

            <div className="section-title" style={{ marginTop: 16 }}>Datos Clinicos</div>
            <div className="form-group">
              <label className="form-label">Sintomas (separados por coma)</label>
              <textarea className="form-textarea" value={form.sintomas} onChange={update('sintomas')} placeholder="cefalea, mareo, vision borrosa" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Antecedentes (separados por coma)</label>
                <input className="form-input" value={form.antecedentes} onChange={update('antecedentes')} placeholder="hipertension, diabetes tipo 2" />
              </div>
              <div className="form-group">
                <label className="form-label">Alergias (separadas por coma)</label>
                <input className="form-input" value={form.alergias} onChange={update('alergias')} placeholder="penicilina" />
              </div>
            </div>

            <div className="actions-bar">
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? '\u23F3' : '\u{1F4BE}'} {submitting ? 'Registrando...' : 'Registrar Paciente e Ingresar a Cola'}
              </button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate('/')}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
