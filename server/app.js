const express = require("express");
const cors = require("cors");
const pacientesRouter = require("./routes/pacientes");
const diagnosticoRouter = require("./routes/diagnostico");
const formulacionRouter = require("./routes/formulacion");
const { router: notificacionesRouter, agregarNotificacion } = require("./routes/notificaciones");
const { obtenerAuditoria } = require("./auditoria");

const app = express();

app.use(cors());
app.use(express.json());

const auditoriaRouter = express.Router();

auditoriaRouter.get("/", (req, res) => {
  const { paciente_id } = req.query;
  const registros = obtenerAuditoria(paciente_id ? parseInt(paciente_id) : null);
  res.json(registros);
});

app.use("/api/pacientes", pacientesRouter);
app.use("/api/diagnosticar", diagnosticoRouter);
app.use("/api/formular", formulacionRouter);
app.use("/api/notificaciones", notificacionesRouter);
app.use("/api/auditoria", auditoriaRouter);

module.exports = { app, agregarNotificacion };
