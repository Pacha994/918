'use client'

import { useState, useRef } from 'react'
import styles from './RegistroModal.module.css'

const PASOS = ['Cliente', 'Bici', 'Fotos', 'Confirmar']

const INICIAL_CLIENTE = { nombre: '', whatsapp: '' }
const INICIAL_BICI    = { modelo: '', color: '', tipoServicio: '', notas: '' }

export default function RegistroModal({ onClose, onExito }) {
  const [paso,     setPaso]     = useState(0)
  const [cliente,  setCliente]  = useState(INICIAL_CLIENTE)
  const [bici,     setBici]     = useState(INICIAL_BICI)
  // fotos: [{ url: base64, angulo: string }]
  const [fotos,    setFotos]    = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error,    setError]    = useState(null)
  const fileRef = useRef(null)

  const irA = (n) => { setError(null); setPaso(n) }

  const avanzar = () => {
    if (paso === 0 && !cliente.nombre.trim()) {
      setError('El nombre del cliente es requerido'); return
    }
    if (paso === 1 && !bici.modelo.trim()) {
      setError('El modelo de la bici es requerido'); return
    }
    setError(null)
    setPaso(p => p + 1)
  }

  const retroceder = () => setPaso(p => p - 1)

  // Fotos — guardamos base64 como url por ahora
  // (en producción habría que subir a un storage y guardar la URL real)
  const handleFotos = (e) => {
    const archivos = Array.from(e.target.files)
    archivos.forEach(archivo => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setFotos(prev => [...prev, { url: ev.target.result, angulo: 'general' }])
      }
      reader.readAsDataURL(archivo)
    })
  }

  const quitarFoto = (i) => setFotos(prev => prev.filter((_, idx) => idx !== i))

  const handleGuardar = async () => {
    setGuardando(true)
    setError(null)
    try {
      const res = await fetch('/api/bicis', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            nombre:   cliente.nombre.trim(),
            whatsapp: cliente.whatsapp.trim() || '',
          },
          bici: {
            modelo:       bici.modelo.trim(),
            color:        bici.color.trim()        || null,
            tipoServicio: bici.tipoServicio.trim() || null,
            notas:        bici.notas.trim()        || null,
            problemas:    [],
          },
          fotos,
        })
      })
      if (!res.ok) throw new Error('Error al guardar')
      const nuevaBici = await res.json()
      onExito(nuevaBici)
    } catch (err) {
      console.error(err)
      setError('No se pudo registrar la bici. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <button className={styles.btnCerrar} onClick={onClose}>✕</button>
          <div className={styles.modalTitulo}>Nueva bici</div>
          <div className={styles.pasoIndicador}>{paso + 1} / {PASOS.length}</div>
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          {PASOS.map((label, i) => (
            <div
              key={i}
              className={`${styles.stepItem} ${i === paso ? styles.stepActivo : ''} ${i < paso ? styles.stepHecho : ''}`}
              onClick={() => i < paso && irA(i)}
            >
              <div className={styles.stepDot} />
              <span className={styles.stepLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* Contenido */}
        <div className={styles.contenido}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Paso 0: Cliente */}
          {paso === 0 && (
            <div className={styles.paso}>
              <div className={styles.campo}>
                <label className={styles.label}>Nombre *</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Juan García"
                  value={cliente.nombre}
                  onChange={e => setCliente(p => ({ ...p, nombre: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className={styles.campo}>
                <label className={styles.label}>WhatsApp</label>
                <input
                  className={styles.input}
                  type="tel"
                  placeholder="11 1234-5678"
                  value={cliente.whatsapp}
                  onChange={e => setCliente(p => ({ ...p, whatsapp: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Paso 1: Bici */}
          {paso === 1 && (
            <div className={styles.paso}>
              <div className={styles.campo}>
                <label className={styles.label}>Modelo *</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Trek Marlin 5, Giant Talon..."
                  value={bici.modelo}
                  onChange={e => setBici(p => ({ ...p, modelo: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className={styles.campo}>
                <label className={styles.label}>Color</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Rojo, negro mate..."
                  value={bici.color}
                  onChange={e => setBici(p => ({ ...p, color: e.target.value }))}
                />
              </div>
              <div className={styles.campo}>
                <label className={styles.label}>Tipo de servicio</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Service completo, cambio pastillas..."
                  value={bici.tipoServicio}
                  onChange={e => setBici(p => ({ ...p, tipoServicio: e.target.value }))}
                />
              </div>
              <div className={styles.campo}>
                <label className={styles.label}>Notas</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="Observaciones al ingresar..."
                  value={bici.notas}
                  onChange={e => setBici(p => ({ ...p, notas: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Paso 2: Fotos */}
          {paso === 2 && (
            <div className={styles.paso}>
              <div className={styles.fotosHeader}>
                <span className={styles.label}>Fotos de recepción</span>
                <span className={styles.fotosOpcional}>opcional</span>
              </div>
              <div className={styles.fotosGrid}>
                {fotos.map((foto, i) => (
                  <div key={i} className={styles.fotoItem}>
                    <img src={foto.url} alt={foto.angulo} className={styles.fotoImg} />
                    <button className={styles.btnQuitarFoto} onClick={() => quitarFoto(i)}>✕</button>
                  </div>
                ))}
                <button className={styles.btnAgregarFoto} onClick={() => fileRef.current?.click()}>
                  <span className={styles.btnFotoIcon}>+</span>
                  <span>Foto</span>
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleFotos}
                style={{ display: 'none' }}
              />
              {fotos.length === 0 && (
                <div className={styles.fotosTip}>
                  Fotografiá el estado de la bici al recibirla
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Confirmación */}
          {paso === 3 && (
            <div className={styles.paso}>
              <div className={styles.resumen}>
                <div className={styles.resumenSeccion}>
                  <div className={styles.resumenLabel}>Cliente</div>
                  <div className={styles.resumenValor}>{cliente.nombre}</div>
                  {cliente.whatsapp && (
                    <div className={styles.resumenSub}>{cliente.whatsapp}</div>
                  )}
                </div>
                <div className={styles.resumenSep} />
                <div className={styles.resumenSeccion}>
                  <div className={styles.resumenLabel}>Bici</div>
                  <div className={styles.resumenValor}>{bici.modelo}</div>
                  {bici.color && <div className={styles.resumenSub}>{bici.color}</div>}
                  {bici.tipoServicio && <div className={styles.resumenDesc}>{bici.tipoServicio}</div>}
                  {bici.notas && <div className={styles.resumenDesc}>{bici.notas}</div>}
                </div>
                {fotos.length > 0 && (
                  <>
                    <div className={styles.resumenSep} />
                    <div className={styles.resumenSeccion}>
                      <div className={styles.resumenLabel}>Fotos ({fotos.length})</div>
                      <div className={styles.fotosResumen}>
                        {fotos.slice(0, 3).map((f, i) => (
                          <img key={i} src={f.url} alt="" className={styles.fotoMini} />
                        ))}
                        {fotos.length > 3 && (
                          <div className={styles.fotosExtra}>+{fotos.length - 3}</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {paso > 0 && (
            <button className={styles.btnVolver} onClick={retroceder}>← Volver</button>
          )}
          {paso < PASOS.length - 1 ? (
            <button className={styles.btnSiguiente} onClick={avanzar}>Siguiente →</button>
          ) : (
            <button className={styles.btnGuardar} onClick={handleGuardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Registrar bici'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
