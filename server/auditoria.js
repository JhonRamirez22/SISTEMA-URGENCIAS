let registros = [];
let contador = 1;

function registrarAuditoria({ pacienteId, accion, rol, detalle, dosisFinal, timestamp }) {
  const registro = {
    id: contador++,
    paciente_id: pacienteId,
    accion,
    rol,
    detalle,
    dosis_final: dosisFinal || null,
    timestamp: timestamp || new Date().toISOString()
  };
  registros.push(registro);
  return registro;
}

function obtenerAuditoria(pacienteId) {
  if (pacienteId) {
    return registros.filter(r => r.paciente_id === pacienteId);
  }
  return [...registros].reverse();
}

module.exports = { registrarAuditoria, obtenerAuditoria };
