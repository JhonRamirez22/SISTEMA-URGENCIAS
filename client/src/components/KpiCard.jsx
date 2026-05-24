export default function KpiCard({ label, value, meta, accent }) {
  return (
    <div className={`kpi-card accent-${accent || 'blue'}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {meta && <div className="meta">{meta}</div>}
    </div>
  )
}
