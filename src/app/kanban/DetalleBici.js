'use client'

import { useState } from 'react'
import styles from './DetalleBici.module.css'

const ESTADOS = ['ingresada', 'diagnostico', 'reparacion', 'lista', 'entregada']

const ESTADOS_LABEL = {
  ingresada:   'Ingresada',
  diagnostico: 'Diagnóstico',
  reparacion:  'Reparación',
  lista:       'Lista',
  entregada:   'Entregada',
}

const ESTADO_SIGUIENTE_LABEL = {
  ingresada:   'Pasar a Diagnóstico',
  diagnostico: 'Pasar a Reparación',
  reparacion:  'Marcar como Lista',
  lista:       'Marcar como Entregada',
}

export default function DetalleBici({ bici, onClose, onAvanzar }) {
  const [avanzando,  setAvanzando]  = useState(false)
  const [fotoActiva, setFotoActiva] = useState(null)

  const puedeAvanzar = bici.estado !== 'entregada'
  const indexEstado  = ESTADOS.indexOf(bici.estado)

  const handleAvanzar = async () => {
    setAvanzando(true)
    await onAvanzar(bici.id)
    setAvanzando(false)
    onClose()
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day:    'numeric',
      month:  'long',
      hour:   '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />

      <div className={styles.sheet}>
        {/* Handle */}
        <div className={styles.handle} onClick={onClose} />

        {/* Header */}
        <div className={styles.sheetHeader}>
          <div>
            <div className={styles.clienteNombre}>{bici.cliente?.nombre || 'Sin cliente'}</div>
            {bici.cliente?.whatsapp && (
              <a
                href={`https://wa.me/${bici.cliente.whatsapp.replace(/\D/g,'')}`}
                className={styles.whatsapp}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
              >
                {bici.cliente.whatsapp}
              </a>
            )}
          </div>
          <button className={styles.btnCerrar} onClick={onClose}>✕</button>
        </div>

        {/* Bici info */}
        <div className={styles.biciRow}>
          <div className={styles.biciModelo}>{bici.modelo}</div>
          {bici.color && <span className={styles.biciColor}>{bici.color}</span>}
        </div>

        {/* Timeline de estado */}
        <div className={styles.timeline}>
          {ESTADOS.filter(e => e !== 'entregada').map((estado, i) => (
            <div
              key={estado}
              className={[
                styles.timelineItem,
                i <= indexEstado          ? styles.timelineActivo  : '',
                estado === bici.estado    ? styles.timelineCurrent : '',
              ].join(' ')}
            >
              <div className={styles.timelineDot} />
              <span className={styles.timelineLabel}>{ESTADOS_LABEL[estado]}</span>
            </div>
          ))}
        </div>

        {/* Tipo de servicio */}
        {bici.tipoServicio && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Servicio</div>
            <div className={styles.descripcion}>{bici.tipoServicio}</div>
          </div>
        )}

        {/* Notas */}
        {bici.notas && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Notas</div>
            <div className={styles.descripcion}>{bici.notas}</div>
          </div>
        )}

        {/* Fotos de recepción */}
        {bici.fotos && bici.fotos.length > 0 && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>
              Fotos de recepción ({bici.fotos.length})
            </div>
            <div className={styles.fotosGrid}>
              {bici.fotos.map((foto, i) => (
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

        {/* Fecha */}
        <div className={styles.fecha}>
          Ingresó el {formatFecha(bici.creadoEn)}
        </div>

        {/* Botón avanzar */}
        {puedeAvanzar ? (
          <div className={styles.footer}>
            <button
              className={styles.btnAvanzar}
              onClick={handleAvanzar}
              disabled={avanzando}
            >
              {avanzando ? 'Avanzando...' : ESTADO_SIGUIENTE_LABEL[bici.estado]}
            </button>
          </div>
        ) : (
          <div className={styles.footer}>
            <div className={styles.entregadaMsg}>✓ Bici entregada</div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {fotoActiva && (
        <div className={styles.lightbox} onClick={() => setFotoActiva(null)}>
          <img src={fotoActiva} alt="" className={styles.lightboxImg} />
        </div>
      )}
    </>
  )
}
