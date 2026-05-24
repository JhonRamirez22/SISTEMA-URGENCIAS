const { basePatologias, baseMedicamentos } = require("./data/conocimiento");

function evaluarDiagnostico(paciente, regla) {
  let condicionesCumplidas = 0;
  const totalCondiciones = Object.keys(regla.condiciones).length;

  const datosPaciente = {
    presion_sistolica: paciente.presion_sistolica,
    presion_diastolica: paciente.presion_diastolica,
    frecuencia_cardiaca: paciente.frecuencia_cardiaca,
    temperatura_c: paciente.temperatura_c,
    saturacion_o2: paciente.saturacion_o2,
    glucosa_mgdl: paciente.glucosa_mgdl,
    trigliceridos_mgdl: paciente.trigliceridos_mgdl,
    creatinina_mgdl: paciente.creatinina_mgdl,
    hemoglobina: paciente.hemoglobina,
    leucocitos: paciente.leucocitos
  };

  for (const [param, [minVal, maxVal]] of Object.entries(regla.condiciones)) {
    const valor = datosPaciente[param];
    if (valor !== undefined && valor >= minVal && valor <= maxVal) {
      condicionesCumplidas++;
    }
  }

  const coincidenciaSintomas = regla.sintomas_clave.filter(s =>
    paciente.sintomas.some(ps => ps.toLowerCase().includes(s.toLowerCase()))
  ).length;

  const antecedenteMatch = (paciente.antecedentes || []).some(a =>
    regla.enfermedad.toLowerCase().includes(a.toLowerCase()) ||
    a.toLowerCase().includes(regla.enfermedad.toLowerCase())
  );
  const antecedenteRelacionado = (paciente.antecedentes || []).some(a => {
    const mapRel = {
      hipertension: ["Crisis Hipertensiva", "Hipertension Arterial"],
      diabetes: ["Cetoacidosis Diabetica", "Diabetes Mellitus Tipo 2"],
      dislipidemia: ["Hipertrigliceridemia Severa"],
      coronario: ["Sindrome Coronario Agudo"],
      renal: ["Insuficiencia Renal Aguda"]
    };
    for (const [key, diseases] of Object.entries(mapRel)) {
      if (a.toLowerCase().includes(key) && diseases.includes(regla.enfermedad)) return true;
    }
    return false;
  });

  if (condicionesCumplidas === 0 && coincidenciaSintomas === 0 && !antecedenteRelacionado) {
    return { coincide: false, confianza: 0 };
  }

  let confianza = (condicionesCumplidas / Math.max(totalCondiciones, 1)) * 60;
  confianza += (coincidenciaSintomas / Math.max(regla.sintomas_clave.length, 1)) * 25;
  if (antecedenteMatch || antecedenteRelacionado) {
    confianza += 15;
  }

  return {
    coincide: confianza >= 25,
    confianza: Math.min(Math.round(confianza * 10) / 10, 100)
  };
}

function descartarDiagnostico(paciente, regla) {
  const datosPaciente = {
    presion_sistolica: paciente.presion_sistolica,
    presion_diastolica: paciente.presion_diastolica,
    frecuencia_cardiaca: paciente.frecuencia_cardiaca,
    temperatura_c: paciente.temperatura_c,
    saturacion_o2: paciente.saturacion_o2,
    glucosa_mgdl: paciente.glucosa_mgdl,
    trigliceridos_mgdl: paciente.trigliceridos_mgdl,
    creatinina_mgdl: paciente.creatinina_mgdl,
    hemoglobina: paciente.hemoglobina,
    leucocitos: paciente.leucocitos
  };

  for (const [param, [minVal, maxVal]] of Object.entries(regla.descartar_por)) {
    const valor = datosPaciente[param];
    if (valor !== undefined && valor >= minVal && valor <= maxVal) {
      return {
        enfermedad: regla.enfermedad,
        motivo: `${param} en rango normal (${valor})`
      };
    }
  }
  return null;
}

function calcularMedicacion(paciente, diagnosticosNombres) {
  const formulaciones = [];
  const insuficienciaRenal = paciente.creatinina_mgdl > 1.3;
  const esPediatrico = paciente.edad < 12;
  const esGeriatrico = paciente.edad > 65;

  for (const diag of diagnosticosNombres) {
    const med = baseMedicamentos.find(m => m.mapeo_patologia === diag);
    if (!med) continue;

    let dosisBase = med.dosis_mg_por_kg * paciente.peso_kg;

    if (esGeriatrico) {
      dosisBase *= 0.75;
    } else if (esPediatrico) {
      dosisBase *= 0.50;
    }

    let dosisFinal = dosisBase;
    let nota = "Dosis estandar calculada por peso";

    if (med.ajuste_renal && insuficienciaRenal) {
      dosisFinal = Math.round(dosisBase * 0.6 * 100) / 100;
      nota = "DOSIS REDUCIDA al 60% por insuficiencia renal (creatinina > 1.3 mg/dL)";
    } else if (esGeriatrico) {
      dosisFinal = Math.round(dosisBase * 100) / 100;
      nota = "Dosis ajustada para paciente geriatrico (x0.75)";
    } else if (esPediatrico) {
      dosisFinal = Math.round(dosisBase * 100) / 100;
      nota = "Dosis ajustada para paciente pediatrico (x0.50)";
    } else {
      dosisFinal = Math.round(dosisBase * 100) / 100;
    }

    formulaciones.push({
      medicamento: med.nombre,
      principio_activo: med.principio_activo,
      presentacion: med.presentacion,
      via: med.via,
      dosis_total_mg: dosisFinal,
      dosis_mg_kg: med.dosis_mg_por_kg,
      frecuencia: med.frecuencia,
      duracion: med.duracion,
      requiere_aprobacion: true,
      nota_seguridad: nota,
      contraindicaciones: med.contraindicaciones
    });
  }

  return formulaciones;
}

function analizarPaciente(paciente) {
  const diagnosticos = [];
  const descartados = [];

  for (const regla of basePatologias) {
    const { coincide, confianza } = evaluarDiagnostico(paciente, regla);

    if (coincide) {
      diagnosticos.push({
        enfermedad: regla.enfermedad,
        confianza_IA: confianza,
        riesgo: regla.riesgo,
        descripcion: regla.descripcion,
        condiciones_evaluadas: Object.keys(regla.condiciones).length,
        condiciones_cumplidas: Object.entries(regla.condiciones).filter(([param, [minVal, maxVal]]) => {
          const v = paciente[param];
          return v !== undefined && v >= minVal && v <= maxVal;
        }).length
      });
    }

    const motivoDescarte = descartarDiagnostico(paciente, regla);
    if (motivoDescarte && (!coincide || diagnosticos.find(d => d.enfermedad === regla.enfermedad) === undefined)) {
      descartados.push(motivoDescarte);
    }
  }

  diagnosticos.sort((a, b) => b.confianza_IA - a.confianza_IA);

  const diagnosticosNombres = diagnosticos.map(d => d.enfermedad);
  const medicacion = calcularMedicacion(paciente, diagnosticosNombres);

  let riesgoGeneral = "BAJO";
  if (diagnosticos.some(d => d.riesgo === "CRITICO")) riesgoGeneral = "CRITICO";
  else if (diagnosticos.some(d => d.riesgo === "ALTO")) riesgoGeneral = "ALTO";
  else if (diagnosticos.some(d => d.riesgo === "MEDIO")) riesgoGeneral = "MEDIO";

  return {
    paciente_id: paciente.id,
    nombre: paciente.nombre,
    diagnosticos,
    descartados,
    medicacion,
    riesgo: riesgoGeneral,
    examenes_alterados: contarAlterados(paciente),
    total_examenes: 7,
    estado: paciente.estado || "pendiente"
  };
}

function contarAlterados(paciente) {
  let count = 0;
  if (paciente.presion_sistolica > 139 || paciente.presion_sistolica < 90) count++;
  if (paciente.presion_diastolica > 89 || paciente.presion_diastolica < 60) count++;
  if (paciente.glucosa_mgdl > 100 || paciente.glucosa_mgdl < 70) count++;
  if (paciente.trigliceridos_mgdl > 150) count++;
  if (paciente.creatinina_mgdl > 1.3 || paciente.creatinina_mgdl < 0.6) count++;
  if (paciente.hemoglobina > 16 || paciente.hemoglobina < 12) count++;
  if (paciente.leucocitos > 11000 || paciente.leucocitos < 4000) count++;
  return count;
}

module.exports = { analizarPaciente, evaluarDiagnostico, descartarDiagnostico, calcularMedicacion };
