export default function ModalConfirmacion({ open, title, children, onConfirm, onCancel, confirmLabel, confirmVariant, loading }) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">{title || 'Confirmar accion'}</div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button
            className={`btn ${confirmVariant === 'danger' ? 'btn-danger' : confirmVariant === 'success' ? 'btn-success' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando...' : (confirmLabel || 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  )
}
