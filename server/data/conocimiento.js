const basePatologias = [
  {
    enfermedad: "Sindrome Coronario Agudo",
    condiciones: { presion_sistolica: [140, 250], frecuencia_cardiaca: [100, 200] },
    sintomas_clave: ["dolor toracico", "dificultad respiratoria", "mareo"],
    descartar_por: { saturacion_o2: [96, 100] },
    riesgo: "CRITICO",
    descripcion: "Obstruccion del flujo sanguineo al corazon por trombosis coronaria."
  },
  {
    enfermedad: "Sepsis",
    condiciones: { temperatura_c: [38.0, 42.0], frecuencia_cardiaca: [90, 200] },
    sintomas_clave: ["fiebre", "confusion", "escalofrios"],
    descartar_por: { saturacion_o2: [98, 100], temperatura_c: [36.0, 37.0] },
    riesgo: "CRITICO",
    descripcion: "Respuesta inflamatoria sistemica a infeccion grave."
  },
  {
    enfermedad: "Crisis Hipertensiva",
    condiciones: { presion_sistolica: [180, 300], presion_diastolica: [120, 200] },
    sintomas_clave: ["cefalea intensa", "vision borrosa", "dolor toracico"],
    descartar_por: { presion_sistolica: [0, 139], presion_diastolica: [0, 89] },
    riesgo: "ALTO",
    descripcion: "Elevacion severa de la presion arterial con riesgo de dano a organos."
  },
  {
    enfermedad: "Hipertension Arterial",
    condiciones: { presion_sistolica: [140, 200], presion_diastolica: [90, 120] },
    sintomas_clave: ["cefalea", "mareo", "vision borrosa", "epistaxis"],
    descartar_por: { presion_sistolica: [0, 120], presion_diastolica: [0, 80] },
    riesgo: "ALTO",
    descripcion: "Presion arterial sistolica persistentemente elevada (>140/90 mmHg)."
  },
  {
    enfermedad: "Hipertrigliceridemia Severa",
    condiciones: { trigliceridos_mgdl: [500, 9999] },
    sintomas_clave: ["dolor abdominal", "nauseas"],
    descartar_por: { trigliceridos_mgdl: [0, 149] },
    riesgo: "MEDIO",
    descripcion: "Niveles extremadamente elevados de trigliceridos en sangre."
  },
  {
    enfermedad: "Cetoacidosis Diabetica",
    condiciones: { glucosa_mgdl: [250, 9999] },
    sintomas_clave: ["poliuria", "sed intensa", "aliento afrutado"],
    descartar_por: { glucosa_mgdl: [0, 125], saturacion_o2: [98, 100] },
    riesgo: "CRITICO",
    descripcion: "Complicacion metabolica grave de la diabetes mellitus."
  },
  {
    enfermedad: "Diabetes Mellitus Tipo 2",
    condiciones: { glucosa_mgdl: [126, 300] },
    sintomas_clave: ["poliuria", "sed intensa", "vision borrosa", "cansancio"],
    descartar_por: { glucosa_mgdl: [0, 100] },
    riesgo: "MEDIO",
    descripcion: "Trastorno metabolico con hiperglucemia cronica."
  },
  {
    enfermedad: "Insuficiencia Renal Aguda",
    condiciones: { creatinina_mgdl: [1.5, 10.0] },
    sintomas_clave: ["oliguria", "edema", "nauseas"],
    descartar_por: { creatinina_mgdl: [0.0, 1.2] },
    riesgo: "CRITICO",
    descripcion: "Perdida subita de la funcion renal."
  },
  {
    enfermedad: "Anemia Ferropenica",
    condiciones: { hemoglobina: [6, 12] },
    sintomas_clave: ["cansancio", "palidez", "mareo"],
    descartar_por: { hemoglobina: [13, 20] },
    riesgo: "BAJO",
    descripcion: "Deficiencia de hierro que reduce la produccion de globulos rojos."
  }
];

const baseMedicamentos = [
  {
    nombre: "Enoxaparina",
    dosis_mg_por_kg: 1.0,
    ajuste_renal: true,
    contraindicaciones: ["sangrado activo", "trombocitopenia"],
    principio_activo: "Enoxaparina sodica",
    presentacion: "Jeringa prellenada 40 mg",
    via: "Subcutanea",
    frecuencia: "Cada 12 horas",
    duracion: "7 dias",
    mapeo_patologia: "Sindrome Coronario Agudo"
  },
  {
    nombre: "Insulina Rapida",
    dosis_mg_por_kg: 0.1,
    ajuste_renal: false,
    contraindicaciones: ["hipoglucemia"],
    principio_activo: "Insulina humana regular",
    presentacion: "Vial 100 UI/mL",
    via: "Subcutanea",
    frecuencia: "Antes de comidas",
    duracion: "Segun glucometria",
    mapeo_patologia: "Cetoacidosis Diabetica"
  },
  {
    nombre: "Ceftriaxona",
    dosis_mg_por_kg: 50.0,
    ajuste_renal: false,
    contraindicaciones: ["alergia a penicilinas"],
    principio_activo: "Ceftriaxona sodica",
    presentacion: "Vial 1 g",
    via: "Intravenosa",
    frecuencia: "Cada 24 horas",
    duracion: "7 dias",
    mapeo_patologia: "Sepsis"
  },
  {
    nombre: "Captopril",
    dosis_mg_por_kg: 0.3,
    ajuste_renal: true,
    contraindicaciones: ["hipotension", "embarazo"],
    principio_activo: "Captopril",
    presentacion: "Tableta 25 mg",
    via: "Oral",
    frecuencia: "Cada 8 horas",
    duracion: "30 dias",
    mapeo_patologia: "Crisis Hipertensiva"
  },
  {
    nombre: "Losartan",
    dosis_mg_por_kg: 1.4,
    ajuste_renal: false,
    contraindicaciones: ["hipotension severa", "embarazo"],
    principio_activo: "Losartan potasico",
    presentacion: "Tableta 50 mg",
    via: "Oral",
    frecuencia: "Cada 24 horas",
    duracion: "30 dias",
    mapeo_patologia: "Hipertension Arterial"
  },
  {
    nombre: "Metformina",
    dosis_mg_por_kg: 10.0,
    ajuste_renal: true,
    contraindicaciones: ["insuficiencia renal", "acidosis metabolica"],
    principio_activo: "Metformina clorhidrato",
    presentacion: "Tableta 850 mg",
    via: "Oral",
    frecuencia: "Cada 12 horas",
    duracion: "Continuo",
    mapeo_patologia: "Diabetes Mellitus Tipo 2"
  },
  {
    nombre: "Fibratos",
    dosis_mg_por_kg: 5.0,
    ajuste_renal: true,
    contraindicaciones: ["insuficiencia hepatica grave"],
    principio_activo: "Fenofibrato",
    presentacion: "Capsula 200 mg",
    via: "Oral",
    frecuencia: "Cada 24 horas",
    duracion: "30 dias",
    mapeo_patologia: "Hipertrigliceridemia Severa"
  }
];

module.exports = { basePatologias, baseMedicamentos };
