const express = require("express");
const router = express.Router();
const pacientes = require("../data/pacientes");

router.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  const lista = pacientes.map(p => ({
    id: p.id,
    nombre: p.nombre,
    edad: p.edad,
    peso_kg: p.peso_kg,
    tipo_sangre: p.tipo_sangre,
    riesgo: p.riesgo,
    diagnostico: p.diagnostico,
    estado: p.estado,
    antecedentes: p.antecedentes,
    alergias: p.alergias,
    sintomas: p.sintomas,
    medicacion: p.medicacion || null,
    creatinina_mgdl: p.creatinina_mgdl,
    hemoglobina: p.hemoglobina,
    leucocitos: p.leucocitos,
    presion_sistolica: p.presion_sistolica,
    presion_diastolica: p.presion_diastolica,
    frecuencia_cardiaca: p.frecuencia_cardiaca,
    temperatura_c: p.temperatura_c,
    saturacion_o2: p.saturacion_o2,
    glucosa_mgdl: p.glucosa_mgdl,
    trigliceridos_mgdl: p.trigliceridos_mgdl
  }));
  res.json(lista);
});

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const p = pacientes.find(pac => pac.id === id);
  if (!p) return res.status(404).json({ error: "Paciente no encontrado" });
  res.json(p);
});

router.post("/", (req, res) => {
  const { nombre, edad, peso_kg, tipo_sangre, presion_sistolica, presion_diastolica,
    frecuencia_cardiaca, temperatura_c, saturacion_o2, glucosa_mgdl,
    trigliceridos_mgdl, creatinina_mgdl, hemoglobina, leucocitos,
    sintomas, antecedentes, alergias } = req.body;

  if (!nombre || !edad || !peso_kg) {
    return res.status(400).json({ error: "Nombre, edad y peso son obligatorios" });
  }

  const maxId = pacientes.reduce((max, p) => Math.max(max, p.id), 1000);
  const nuevo = {
    id: maxId + 1,
    nombre,
    edad: parseInt(edad),
    peso_kg: parseFloat(peso_kg),
    tipo_sangre: tipo_sangre || "O+",
    presion_sistolica: parseInt(presion_sistolica) || 120,
    presion_diastolica: parseInt(presion_diastolica) || 80,
    frecuencia_cardiaca: parseInt(frecuencia_cardiaca) || 72,
    temperatura_c: parseFloat(temperatura_c) || 36.5,
    saturacion_o2: parseFloat(saturacion_o2) || 98,
    glucosa_mgdl: parseFloat(glucosa_mgdl) || 90,
    trigliceridos_mgdl: parseFloat(trigliceridos_mgdl) || 150,
    creatinina_mgdl: parseFloat(creatinina_mgdl) || 1.0,
    hemoglobina: parseFloat(hemoglobina) || 14,
    leucocitos: parseInt(leucocitos) || 8000,
    sintomas: Array.isArray(sintomas) ? sintomas : [],
    antecedentes: Array.isArray(antecedentes) ? antecedentes : [],
    alergias: Array.isArray(alergias) ? alergias : [],
    diagnostico: null,
    estado: "pendiente",
    riesgo: "MEDIO"
  };

  pacientes.push(nuevo);
  res.status(201).json(nuevo);
});

module.exports = router;
