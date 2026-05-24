const express = require("express");
const router = express.Router();
const pacientes = require("../data/pacientes");

router.get("/", (req, res) => {
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
    sintomas: p.sintomas
  }));
  res.json(lista);
});

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const p = pacientes.find(pac => pac.id === id);
  if (!p) return res.status(404).json({ error: "Paciente no encontrado" });
  res.json(p);
});

module.exports = router;
