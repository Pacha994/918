'use client'

import { useState, useRef } from 'react'
import styles from './HallazgoForm.module.css'

export default function HallazgoForm({ bici, onClose, onHallazgoCreado }) {
  const [descripcion, setDescripcion] = useState('')
  const [precio,      setPrecio]      = useState('')
  const [fotoUrl,     setFotoUrl]     = useState(null)
  const [guardando,   setGuardando]   = useState(false)
  const [error,       setError]       = useState(null)
  const fileRef = useRef(null)

  const handleFoto = (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    const reader = new FileReader()
    reader.onload = (ev) => setFotoUrl(ev.target.result)
    reader.readAsDataURL(archivo)
  }

  const handleEnviar = async () => {
    if (!descripcion.trim()) { setError('Describí el hallazgo'); return }
    if (!precio || isNaN(Number(precio)) || Number(precio) <= 0) {
      setError('Ingresá un precio válido'); return
    }
    setError(null)
    setGuardando(true)
    try {
      const res = await fetch('/api/hallazgos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biciId:      bici.id,
          descripcion: descripcion.trim(),
          precio:      Number(precio),
          fotoUrl:     fotoUrl || null,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      const hallazgo = await res.json()
      onHallazgoCreado(hallazgo)
      onClose()
    } catch (err) {
      console.error(err)
      setError('No se pudo enviar. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const precioNum = Number(precio)
  const nombreCliente = bici.cliente?.nombre || 'el cliente'

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} onClick={onClose} />

        <div className={styles.header}>
          <div className={styles.titulo}>Reportar hallazgo</div>
          <div className={styles.subtitulo}>{bici.modelo}</div>
        </div>

        <div className={styles.cuerpo}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Foto */}
          <div className={styles.campo}>
            <label className={styles.label}>Foto del problema</label>
            {fotoUrl ? (
              <div className={styles.fotoPreview}>
                <img src={fotoUrl} alt="hallazgo" className={styles.fotoImg} />
                <button className={styles.btnQuitarFoto} onClick={() => setFotoUrl(null)}>
                  ✕ Sacar otra
                </button>
              </div>
            ) : (
              <button className={styles.btnFoto} onClick={() => fileRef.current?.click()}>
                <span className={styles.btnFotoIcon}>📷</span>
                <span>Sacar foto</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFoto}
              style={{ display: 'none' }}
            />
          </div>

          {/* Descripción */}
          <div className={styles.campo}>
            <label className={styles.label}>Descripción *</label>
            <textarea
              className={styles.textarea}
              placeholder="Ej: Pastillas de freno delantero gastadas, necesitan reemplazo"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              autoFocus
            />
          </div>

          {/* Precio */}
          <div className={styles.campo}>
            <label className={styles.label}>Precio del trabajo *</label>
            <div className={styles.precioWrap}>
              <span className={styles.precioPrefijo}>$</span>
              <input
                className={styles.precioInput}
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={precio}
                onChange={e => {
                  const v = e.target.value
                  setPrecio(Number(v) < 0 ? '0' : v)
                }}
                min="0"
              />
            </div>
          </div>

          {/* Preview WA */}
          {descripcion.trim() && precioNum > 0 && (
            <div className={styles.waPreview}>
              <div className={styles.waLabel}>SE ENVÍA AL CLIENTE AHORA</div>
              <div className={styles.waMensaje}>
                Hola {nombreCliente} 👋{'\n\n'}
                Revisando tu bici encontramos un problema:{'\n'}
                <strong>{descripcion.trim()}</strong>{'\n\n'}
                El costo adicional sería de{' '}
                <span className={styles.waPrecio}>${precioNum.toLocaleString('es-AR')}</span>.{'\n\n'}
                ¿Lo aprobás? Respondé <strong>SÍ</strong> para que sigamos o <strong>NO</strong> si preferís que lo dejemos.
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancelar} onClick={onClose}>Cancelar</button>
          <button
            className={styles.btnEnviar}
            onClick={handleEnviar}
            disabled={guardando}
          >
            {guardando ? 'Enviando...' : 'Enviar al cliente →'}
          </button>
        </div>
      </div>
    </>
  )
}
