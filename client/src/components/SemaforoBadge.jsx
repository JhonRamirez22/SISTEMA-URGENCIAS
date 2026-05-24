export default function SemaforoBadge({ riesgo }) {
  return <span className={`semaforo ${riesgo}`} title={riesgo} />
}
