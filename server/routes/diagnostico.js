const express = require("express");
const router = express.Router();
const pacientes = require("../data/pacientes");
const { analizarPaciente } = require("../motor_ia");
const { registrarAuditoria } = require("../auditoria");
const { agregarNotificacion } = require("./notificaciones");

router.post("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { rol } = req.body || {};
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

  const resultado = analizarPaciente(paciente);

  if (resultado.diagnosticos.length > 0) {
    paciente.diagnostico = resultado.diagnosticos[0];
    paciente.riesgo = resultado.riesgo;
    if (paciente.estado === "pendiente") {
      paciente.estado = "diagnostico_pendiente";
    }
  }

  resultado.examenes = [
    { nombre: "Presion Sistolica", valor: paciente.presion_sistolica, ref: "90-139", unidad: "mmHg", alterado: paciente.presion_sistolica > 139 || paciente.presion_sistolica < 90 },
    { nombre: "Presion Diastolica", valor: paciente.presion_diastolica, ref: "60-89", unidad: "mmHg", alterado: paciente.presion_diastolica > 89 || paciente.presion_diastolica < 60 },
    { nombre: "Trigliceridos", valor: paciente.trigliceridos_mgdl, ref: "0-150", unidad: "mg/dL", alterado: paciente.trigliceridos_mgdl > 150 },
    { nombre: "Glucosa Ayunas", valor: paciente.glucosa_mgdl, ref: "70-100", unidad: "mg/dL", alterado: paciente.glucosa_mgdl > 100 || paciente.glucosa_mgdl < 70 },
    { nombre: "Creatinina", valor: paciente.creatinina_mgdl, ref: "0.6-1.3", unidad: "mg/dL", alterado: paciente.creatinina_mgdl > 1.3 || paciente.creatinina_mgdl < 0.6 },
    { nombre: "Hemoglobina", valor: paciente.hemoglobina, ref: "12-16", unidad: "g/dL", alterado: paciente.hemoglobina > 16 || paciente.hemoglobina < 12 },
    { nombre: "Leucocitos", valor: paciente.leucocitos, ref: "4000-11000", unidad: "/uL", alterado: paciente.leucocitos > 11000 || paciente.leucocitos < 4000 }
  ];

  resultado.antecedentes = paciente.antecedentes;
  resultado.alergias = paciente.alergias;
  resultado.edad = paciente.edad;
  resultado.peso_kg = paciente.peso_kg;
  resultado.tipo_sangre = paciente.tipo_sangre;
  resultado.sintomas = paciente.sintomas;

  if (rol) {
    registrarAuditoria({
      pacienteId: id,
      accion: "SOLICITUD_DIAGNOSTICO_IA",
      rol,
      detalle: `Diagnostico IA generado para ${paciente.nombre}`
    });
  }

  agregarNotificacion({
    icono: "check",
    mensaje: `Diagnostico IA generado - Paciente #${paciente.id} ${paciente.nombre} (${resultado.diagnosticos[0]?.enfermedad || 'N/A'} - ${resultado.diagnosticos[0]?.confianza_IA || 0}%) requiere confirmacion`,
    paciente_id: id
  });

  res.json(resultado);
});

router.post("/:id/confirmar", (req, res) => {
  const id = parseInt(req.params.id);
  const { rol } = req.body || {};
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

  if (rol !== "medico") {
    return res.status(403).json({ error: "Solo el rol Medico puede confirmar diagnosticos" });
  }

  paciente.estado = "diagnostico_confirmado";

  registrarAuditoria({
    pacienteId: id,
    accion: "CONFIRMAR_DIAGNOSTICO",
    rol,
    detalle: `Diagnostico confirmado: ${paciente.diagnostico?.enfermedad || "N/A"}`
  });

  agregarNotificacion({
    icono: "check",
    mensaje: `Diagnostico CONFIRMADO - Paciente #${paciente.id} ${paciente.nombre}: ${paciente.diagnostico?.enfermedad || 'N/A'} (${paciente.diagnostico?.confianza_IA || 0}%). Proceder a formulacion.`,
    paciente_id: id
  });

  res.json({
    mensaje: "Diagnostico confirmado exitosamente",
    estado: paciente.estado,
    diagnostico: paciente.diagnostico
  });
});

router.post("/:id/rechazar", (req, res) => {
  const id = parseInt(req.params.id);
  const { rol, motivo } = req.body || {};
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

  if (rol !== "medico") {
    return res.status(403).json({ error: "Solo el rol Medico puede rechazar diagnosticos" });
  }

  paciente.estado = "diagnostico_rechazado";
  paciente.diagnostico = null;

  registrarAuditoria({
    pacienteId: id,
    accion: "RECHAZAR_DIAGNOSTICO",
    rol,
    detalle: motivo || "Sin motivo especificado"
  });

  agregarNotificacion({
    icono: "warning",
    mensaje: `Diagnostico RECHAZADO - Paciente #${paciente.id} ${paciente.nombre}. Motivo: ${motivo || 'No especificado'}. Se requiere diagnostico manual.`,
    paciente_id: id
  });

  res.json({
    mensaje: "Diagnostico rechazado",
    estado: paciente.estado
  });
});

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

  if (!paciente.diagnostico) {
    return res.json({
      nombre: paciente.nombre,
      edad: paciente.edad,
      peso_kg: paciente.peso_kg,
      tipo_sangre: paciente.tipo_sangre,
      estado: paciente.estado,
      antecedentes: paciente.antecedentes,
      alergias: paciente.alergias,
      sintomas: paciente.sintomas,
      riesgo: paciente.riesgo,
      diagnostico: null,
      descartados: [],
      examenes: [],
      mensaje: "Aun no se ha generado un diagnostico IA para este paciente"
    });
  }

  const resultado = analizarPaciente(paciente);

  resultado.examenes = [
    { nombre: "Presion Sistolica", valor: paciente.presion_sistolica, ref: "90-139", unidad: "mmHg", alterado: paciente.presion_sistolica > 139 || paciente.presion_sistolica < 90 },
    { nombre: "Presion Diastolica", valor: paciente.presion_diastolica, ref: "60-89", unidad: "mmHg", alterado: paciente.presion_diastolica > 89 || paciente.presion_diastolica < 60 },
    { nombre: "Trigliceridos", valor: paciente.trigliceridos_mgdl, ref: "0-150", unidad: "mg/dL", alterado: paciente.trigliceridos_mgdl > 150 },
    { nombre: "Glucosa Ayunas", valor: paciente.glucosa_mgdl, ref: "70-100", unidad: "mg/dL", alterado: paciente.glucosa_mgdl > 100 || paciente.glucosa_mgdl < 70 },
    { nombre: "Creatinina", valor: paciente.creatinina_mgdl, ref: "0.6-1.3", unidad: "mg/dL", alterado: paciente.creatinina_mgdl > 1.3 || paciente.creatinina_mgdl < 0.6 },
    { nombre: "Hemoglobina", valor: paciente.hemoglobina, ref: "12-16", unidad: "g/dL", alterado: paciente.hemoglobina > 16 || paciente.hemoglobina < 12 },
    { nombre: "Leucocitos", valor: paciente.leucocitos, ref: "4000-11000", unidad: "/uL", alterado: paciente.leucocitos > 11000 || paciente.leucocitos < 4000 }
  ];

  resultado.antecedentes = paciente.antecedentes;
  resultado.alergias = paciente.alergias;
  resultado.edad = paciente.edad;
  resultado.peso_kg = paciente.peso_kg;
  resultado.tipo_sangre = paciente.tipo_sangre;
  resultado.sintomas = paciente.sintomas;
  resultado.estado = paciente.estado;

  res.json(resultado);
});

module.exports = router;
