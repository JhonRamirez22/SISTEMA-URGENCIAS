const express = require("express");
const router = express.Router();
const pacientes = require("../data/pacientes");

let notificaciones = [
  {
    id: 1,
    icono: "warning",
    mensaje: "Resultados de laboratorio listos - Paciente #1001 Carlos Martinez (Presion, Trigliceridos, Glucosa, Creatinina, Hb, Leucocitos)",
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    paciente_id: 1001
  },
  {
    id: 2,
    icono: "check",
    mensaje: "Diagnostico IA generado - Paciente #1003 Miguel Soto (DM2 - 100%) requiere confirmacion",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    paciente_id: 1003
  },
  {
    id: 3,
    icono: "cloud_upload",
    mensaje: "Formula medica aprobada - Paciente #1004 Laura Diaz (Sin medicacion necesaria)",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    paciente_id: 1004
  }
];

let nextId = 4;

function agregarNotificacion({ icono, mensaje, paciente_id, timestamp }) {
  const notif = {
    id: nextId++,
    icono: icono || "info",
    mensaje,
    paciente_id: paciente_id || null,
    timestamp: timestamp || new Date().toISOString()
  };
  notificaciones.unshift(notif);
  return notif;
}

router.get("/", (req, res) => {
  res.json(notificaciones);
});

module.exports = { router, agregarNotificacion };
