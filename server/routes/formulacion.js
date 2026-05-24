const express = require("express");
const router = express.Router();
const pacientes = require("../data/pacientes");
const { calcularMedicacion } = require("../motor_ia");
const { registrarAuditoria } = require("../auditoria");
const { agregarNotificacion } = require("./notificaciones");

router.post("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { rol } = req.body || {};
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

  if (!paciente.diagnostico) {
    return res.status(400).json({ error: "Debe generar un diagnostico primero" });
  }

  const medicacion = calcularMedicacion(paciente, [paciente.diagnostico.enfermedad]);

  if (medicacion.length === 0) {
    paciente.estado = "sin_medicacion";
    registrarAuditoria({
      pacienteId: id,
      accion: "FORMULACION_SIN_MEDICACION",
      rol,
      detalle: "No se encontro medicamento para el diagnostico"
    });
    return res.json({
      mensaje: "No se requiere medicacion para este diagnostico",
      medicacion: [],
      estado: paciente.estado
    });
  }

  const formula = medicacion[0];
  paciente.medicacion = formula;
  const estadosAvanzados = ["formulacion_pendiente","formulacion_aprobada","formulacion_rechazada","medicamento_administrado"];
  if (!estadosAvanzados.includes(paciente.estado)) {
    paciente.estado = "formulacion_pendiente";
  }

  const insuficienciaRenal = paciente.creatinina_mgdl > 1.3;
  const esGeriatrico = paciente.edad > 65;
  const esPediatrico = paciente.edad < 12;

  const validaciones = validarContraindicaciones(paciente, formula);

  registrarAuditoria({
    pacienteId: id,
    accion: "FORMULACION_GENERADA",
    rol,
    detalle: `Formula generada: ${formula.medicamento} ${formula.dosis_total_mg} mg`
  });

  res.json({
    formula,
    paciente: {
      id: paciente.id,
      nombre: paciente.nombre,
      edad: paciente.edad,
      peso_kg: paciente.peso_kg,
      creatinina_mgdl: paciente.creatinina_mgdl,
      alergias: paciente.alergias,
      antecedentes: paciente.antecedentes,
      diagnostico: paciente.diagnostico
    },
    calculo: {
      peso_kg: paciente.peso_kg,
      dosis_mg_kg: formula.dosis_mg_kg,
      formula: `${paciente.peso_kg} kg x ${formula.dosis_mg_kg} mg/kg/dia = ${Math.round(paciente.peso_kg * formula.dosis_mg_kg * 100) / 100} mg`,
      ajuste_geriatrico: esGeriatrico,
      ajuste_pediatrico: esPediatrico,
      ajuste_renal: insuficienciaRenal
    },
    validaciones,
    estado: paciente.estado
  });
});

router.post("/:id/aprobar", (req, res) => {
  const id = parseInt(req.params.id);
  const { rol } = req.body || {};
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

  if (rol !== "medico") {
    return res.status(403).json({ error: "Solo el rol Medico puede aprobar formulaciones" });
  }

  paciente.estado = "formulacion_aprobada";

  const registro = registrarAuditoria({
    pacienteId: id,
    accion: "APROBAR_FORMULA",
    rol,
    detalle: `Formula aprobada: ${paciente.medicacion?.medicamento} ${paciente.medicacion?.dosis_total_mg} mg`,
    dosisFinal: paciente.medicacion?.dosis_total_mg
  });

  agregarNotificacion({
    icono: "cloud_upload",
    mensaje: `FORMULA APROBADA - ${paciente.medicacion?.medicamento} ${paciente.medicacion?.dosis_total_mg} mg para #${paciente.id} ${paciente.nombre}. ENFERMERIA: administrar al paciente.`,
    paciente_id: id
  });

  res.json({
    mensaje: "Formula aprobada. Medicamento autorizado para distribucion.",
    estado: paciente.estado,
    auditoria: registro
  });
});

router.post("/:id/ajustar", (req, res) => {
  const id = parseInt(req.params.id);
  const { rol, nuevaDosis } = req.body || {};
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

  if (rol !== "medico") {
    return res.status(403).json({ error: "Solo el rol Medico puede ajustar dosis" });
  }

  if (!nuevaDosis || isNaN(parseFloat(nuevaDosis)) || parseFloat(nuevaDosis) <= 0) {
    return res.status(400).json({ error: "Dosis invalida" });
  }

  if (paciente.medicacion) {
    paciente.medicacion.dosis_total_mg = parseFloat(nuevaDosis);
    paciente.medicacion.nota_seguridad = "DOSIS AJUSTADA MANUALMENTE POR EL MEDICO";
  }
  paciente.estado = "formulacion_aprobada";

  const registro = registrarAuditoria({
    pacienteId: id,
    accion: "AJUSTAR_Y_APROBAR",
    rol,
    detalle: `Dosis ajustada de ${paciente.medicacion?.medicamento} a ${nuevaDosis} mg`,
    dosisFinal: parseFloat(nuevaDosis)
  });

  agregarNotificacion({
    icono: "cloud_upload",
    mensaje: `DOSIS AJUSTADA y APROBADA - ${paciente.medicacion?.medicamento} ${nuevaDosis} mg para #${paciente.id} ${paciente.nombre}. ENFERMERIA: administrar dosis ajustada.`,
    paciente_id: id
  });

  res.json({
    mensaje: "Dosis ajustada y formula aprobada.",
    nuevaDosis: parseFloat(nuevaDosis),
    estado: paciente.estado,
    auditoria: registro
  });
});

router.post("/:id/rechazar", (req, res) => {
  const id = parseInt(req.params.id);
  const { rol, motivo } = req.body || {};
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

  if (rol !== "medico") {
    return res.status(403).json({ error: "Solo el rol Medico puede rechazar formulaciones" });
  }

  paciente.estado = "formulacion_rechazada";
  paciente.medicacion = null;

  const registro = registrarAuditoria({
    pacienteId: id,
    accion: "RECHAZAR_FORMULA",
    rol,
    detalle: motivo || "Sin motivo especificado"
  });

  agregarNotificacion({
    icono: "warning",
    mensaje: `FORMULA RECHAZADA - Paciente #${paciente.id} ${paciente.nombre}. Motivo: ${motivo || 'No especificado'}.`,
    paciente_id: id
  });

  res.json({
    mensaje: "Formulacion rechazada.",
    estado: paciente.estado,
    auditoria: registro
  });
});

router.post("/:id/administrar", (req, res) => {
  const id = parseInt(req.params.id);
  const { rol } = req.body || {};
  const paciente = pacientes.find(p => p.id === id);
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

  if (paciente.estado !== "formulacion_aprobada" && paciente.estado !== "medicamento_administrado") {
    return res.status(400).json({ error: "Solo se puede administrar formulas aprobadas" });
  }

  paciente.estado = "medicamento_administrado";

  registrarAuditoria({
    pacienteId: id,
    accion: "MEDICAMENTO_ADMINISTRADO",
    rol: rol || "enfermera",
    detalle: `${paciente.medicacion?.medicamento} ${paciente.medicacion?.dosis_total_mg} mg administrado a ${paciente.nombre}`,
    dosisFinal: paciente.medicacion?.dosis_total_mg
  });

  agregarNotificacion({
    icono: "check",
    mensaje: `MEDICAMENTO ADMINISTRADO - ${paciente.medicacion?.medicamento} ${paciente.medicacion?.dosis_total_mg} mg a #${paciente.id} ${paciente.nombre}. Tratamiento completado.`,
    paciente_id: id
  });

  res.json({
    mensaje: "Medicamento administrado exitosamente.",
    estado: paciente.estado
  });
});

function validarContraindicaciones(paciente, formula) {
  const validaciones = [];

  const tieneContraindicacion = formula.contraindicaciones.some(contra =>
    paciente.antecedentes.some(a => a.toLowerCase().includes(contra.toLowerCase()) || contra.toLowerCase().includes(a.toLowerCase()))
  );

  if (tieneContraindicacion) {
    validaciones.push({
      tipo: "error",
      icono: "cancel",
      mensaje: "CONTRAINDICACION DETECTADA: El paciente tiene antecedente incompatible con este medicamento"
    });
  } else {
    validaciones.push({
      tipo: "ok",
      icono: "check",
      mensaje: "Sin contraindicaciones con el historial del paciente"
    });
  }

  const tieneAlergia = paciente.alergias.some(alergia => {
    const al = alergia.toLowerCase();
    if (al.includes("penicilina") && formula.medicamento === "Ceftriaxona") return true;
    return formula.contraindicaciones.some(c => c.toLowerCase().includes(al));
  });

  if (tieneAlergia) {
    validaciones.push({
      tipo: "error",
      icono: "cancel",
      mensaje: `ALERGIA DETECTADA: Paciente alergico a ${paciente.alergias.join(", ")}`
    });
  } else if (paciente.alergias.length > 0) {
    validaciones.push({
      tipo: "warning",
      icono: "warning",
      mensaje: `Alergia a ${paciente.alergias.join(", ")} (NO afecta a este medicamento - diferente familia farmacologica)`
    });
  } else {
    validaciones.push({
      tipo: "ok",
      icono: "check",
      mensaje: "Sin alergias reportadas que afecten este medicamento"
    });
  }

  validaciones.push({
    tipo: "ok",
    icono: "check",
    mensaje: "Sin interacciones con medicamentos actuales del paciente"
  });

  return validaciones;
}

module.exports = router;
