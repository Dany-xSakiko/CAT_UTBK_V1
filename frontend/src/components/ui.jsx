import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import Icon from '../lib/icons'

/* ============================================================ TOAST */
const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const seq = useRef(0)

  const toast = useCallback((msg, type = 'ok', ms = 3200) => {
    const id = ++seq.current
    setItems((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), ms)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-host">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon name={t.type === 'ok' ? 'check' : 'alert'} size={16} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}

/* ============================================================ CONFIRM */
const ConfirmCtx = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback(
    (opts = {}) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setState({
          title: opts.title || 'Yakin lanjut?',
          message: opts.message || 'Tindakan ini tidak bisa dibatalkan.',
          yes: opts.yes || 'Ya, lanjut',
          no: opts.no || 'Batal',
          danger: opts.danger !== false,
        })
      }),
    []
  )

  const tutup = (val) => {
    setState(null)
    resolver.current?.(val)
    resolver.current = null
  }

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-backdrop open" onMouseDown={(e) => e.target === e.currentTarget && tutup(false)}>
          <div className="modal" style={{ maxWidth: 420 }} role="dialog" aria-modal="true">
            <div className="modal-head">
              <h3>{state.title}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => tutup(false)} aria-label="Tutup">
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className={`alert ${state.danger ? 'alert-danger' : 'alert-info'}`} style={{ marginBottom: 0 }}>
                {state.message}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => tutup(false)}>
                {state.no}
              </button>
              <button className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`} data-yes onClick={() => tutup(true)}>
                {state.yes}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmCtx)
}

/* ============================================================ MODAL */
export function Modal({ open, title, subtitle, children, onClose, footer, wide = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={`modal-backdrop open`} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          <button className="x" onClick={onClose} aria-label="Tutup" data-close>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

/* ============================================================ KECIL-KECIL */
export function Tombol({ loading, children, className = 'btn btn-primary', ...rest }) {
  return (
    <button className={className} disabled={loading || rest.disabled} {...rest}>
      {loading ? (
        <>
          <span className="spinner" /> Menyimpan…
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function EmptyState({ pesan = 'Belum ada data', kolom = 1, icon = 'file' }) {
  return (
    <tr>
      <td colSpan={kolom}>
        <div className="empty-state">
          <div className="ico">
            <Icon name={icon} size={30} stroke={1.4} />
          </div>
          <div>{pesan}</div>
        </div>
      </td>
    </tr>
  )
}

export function Memuat({ pesan = 'Memuat…' }) {
  return <div className="muted small">{pesan}</div>
}

export function Badge({ children, warna = 'badge-blue' }) {
  return <span className={`badge ${warna}`}>{children}</span>
}
