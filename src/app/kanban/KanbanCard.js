'use client'

import styles from './KanbanCard.module.css'

const ESTADO_SIGUIENTE_LABEL = {
  ingresada:   'Diagnóstico →',
  diagnostico: 'Reparación →',
  reparacion:  'Lista →',
  lista:       'Entregada →',
}

export default function KanbanCard({ bici, avanzando, onAvanzar, onVerDetalle }) {
  const puedeAvanzar       = bici.estado !== 'lista' && bici.estado !== 'entregada'
  const tiempoTranscurrido = getTiempo(bici.creadoEn)
  const fotoPortada        = bici.fotos?.[0]?.url || null

  return (
    <div className={styles.card} onClick={() => onVerDetalle(bici)}>

      {fotoPortada && (
        <img src={fotoPortada} alt="" className={styles.fotoPortada} />
      )}

      <div className={styles.header}>
        <div className={styles.modelo}>{bici.modelo}</div>
        <div className={styles.tiempo}>{tiempoTranscurrido}</div>
      </div>

      <div className={styles.meta}>
        {bici.cliente?.nombre && (
          <span className={styles.clienteNombre}>{bici.cliente.nombre}</span>
        )}
        {bici.color && (
          <span className={styles.color}>{bici.color}</span>
        )}
      </div>

      {puedeAvanzar && (
        <div className={styles.footer}>
          <button
            className={`${styles.btnAvanzar} ${avanzando ? styles.btnAvanzandoActivo : ''}`}
            onClick={(e) => { e.stopPropagation(); if (!avanzando) onAvanzar(bici.id) }}
            disabled={avanzando}
          >
            {avanzando
              ? <span className={styles.btnSpinner} />
              : ESTADO_SIGUIENTE_LABEL[bici.estado]
            }
          </button>
        </div>
      )}

    </div>
  )
}

function getTiempo(fechaStr) {
  if (!fechaStr) return ''
  const diff = Date.now() - new Date(fechaStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(mins / 60)
  const dias = Math.floor(hrs / 24)
  if (dias > 0) return `${dias}d`
  if (hrs  > 0) return `${hrs}h`
  if (mins > 0) return `${mins}m`
  return 'ahora'
}
