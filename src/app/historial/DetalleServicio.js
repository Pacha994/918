'use client'

import { useState, useEffect } from 'react'
import styles from './DetalleServicio.module.css'

const TIPO_LABEL = {
  basico:      'Service básico',
  completo:    'Service completo',
  premium:     'Service premium',
  diagnostico: 'Solo diagnóstico',
}

function formatPrecio(precio) {
  if (precio == null) return null
  return '$' + new Intl.NumberFormat('es-AR').format(precio)
}

function formatFechaLarga(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

function diasEnTaller(desde, hasta) {
  if (!desde || !hasta) return null
  const dias = Math.round((new Date(hasta) - new Date(desde)) / 86400000)
  return dias === 1 ? '1 día' : `${dias} días`
}

export default function DetalleServicio({ itemId, onClose }) {
  const [detalle,    setDetalle]    = useState(null)
  const [cargando,   setCargando]   = useState(true)
  const [fotoActiva, setFotoActiva] = useState(null)

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`/api/historial/${itemId}`)
        if (!res.ok) throw new Error()
        setDetalle(await res.json())
      } catch {
        // noop — sheet shows error message
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [itemId])

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />

      <div className={styles.sheet}>
        <div className={styles.handle} onClick={onClose} />

        {cargando ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : !detalle ? (
          <div className={styles.loading}>No se pudo cargar el detalle.</div>
        ) : (
          <>
            {/* Header: cliente */}
            <div className={styles.sheetHeader}>
              <div>
                <div className={styles.clienteNombre}>{detalle.cliente?.nombre || 'Sin cliente'}</div>
                {detalle.cliente?.whatsapp && (
                  <a
                    href={`https://wa.me/${detalle.cliente.whatsapp.replace(/\D/g, '')}`}
                    className={styles.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                  >
                    {detalle.cliente.whatsapp}
                  </a>
                )}
              </div>
              <button className={styles.btnCerrar} onClick={onClose}>✕</button>
            </div>

            {/* Bici */}
            <div className={styles.biciRow}>
              <span className={styles.biciModelo}>{detalle.modelo}</span>
              {detalle.color && <span className={styles.biciColor}>{detalle.color}</span>}
            </div>

            {/* Servicio + precio */}
            {(detalle.tipoServicio || detalle.precio != null) && (
              <div className={styles.seccion}>
                <div className={styles.seccionLabel}>Servicio</div>
                <div className={styles.servicioRow}>
                  <span className={styles.servicioTipo}>
                    {TIPO_LABEL[detalle.tipoServicio] || detalle.tipoServicio || '—'}
                  </span>
                  {detalle.precio != null && (
                    <span className={styles.servicioPrecio}>{formatPrecio(detalle.precio)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className={styles.seccion}>
              <div className={styles.seccionLabel}>Fechas</div>
              <div className={styles.fechasFila}>
                <div className={styles.fechaItem}>
                  <span className={styles.fechaKey}>Ingresó</span>
                  <span className={styles.fechaVal}>{formatFechaLarga(detalle.creadoEn)}</span>
                </div>
                <div className={styles.fechaItem}>
                  <span className={styles.fechaKey}>Entregada</span>
                  <span className={styles.fechaVal}>
                    {formatFechaLarga(detalle.deliveredAt)}
                    {diasEnTaller(detalle.creadoEn, detalle.deliveredAt) && (
                      <span className={styles.duracion}>
                        {' · '}{diasEnTaller(detalle.creadoEn, detalle.deliveredAt)}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Notas */}
            {detalle.notas && (
              <div className={styles.seccion}>
                <div className={styles.seccionLabel}>Notas</div>
                <div className={styles.descripcion}>{detalle.notas}</div>
              </div>
            )}

            {/* Hallazgos */}
            {detalle.hallazgos?.length > 0 && (
              <div className={styles.seccion}>
                <div className={styles.seccionLabel}>Hallazgos ({detalle.hallazgos.length})</div>
                <div className={styles.hallazgosList}>
                  {detalle.hallazgos.map(h => (
                    <div key={h.id} className={`${styles.hallazgoItem} ${styles['hallazgo_' + h.estado]}`}>
                      <div className={styles.hallazgoTop}>
                        {h.fotoUrl && (
                          <img
                            src={h.fotoUrl}
                            alt=""
                            className={styles.hallazgoFoto}
                            onClick={() => setFotoActiva(h.fotoUrl)}
                          />
                        )}
                        <div className={styles.hallazgoInfo}>
                          <div className={styles.hallazgoDesc}>{h.descripcion}</div>
                          <div className={styles.hallazgoPrecio}>{formatPrecio(h.precio)}</div>
                        </div>
                        <div className={`${styles.hallazgoBadge} ${styles['badge_' + h.estado]}`}>
                          {h.estado === 'pendiente'  && 'Esperando'}
                          {h.estado === 'aprobado'   && 'Aprobado'}
                          {h.estado === 'rechazado'  && 'Rechazado'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fotos de recepción */}
            {detalle.fotos?.length > 0 && (
              <div className={styles.seccion}>
                <div className={styles.seccionLabel}>Fotos de recepción ({detalle.fotos.length})</div>
                <div className={styles.fotosGrid}>
                  {detalle.fotos.map((foto, i) => (
                    <img
                      key={i}
                      src={foto.url}
                      alt={foto.angulo || ''}
                      className={styles.foto}
                      onClick={() => setFotoActiva(foto.url)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {fotoActiva && (
        <div className={styles.lightbox} onClick={() => setFotoActiva(null)}>
          <img src={fotoActiva} alt="" className={styles.lightboxImg} />
        </div>
      )}
    </>
  )
}
