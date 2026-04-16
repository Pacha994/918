'use client'

import styles from './KanbanCard.module.css'

const ESTADOS_LABEL = {
  ingresada:   'Ingresada',
  diagnostico: 'Diagnóstico',
  reparacion:  'Reparación',
  lista:       'Lista',
  entregada:   'Entregada',
}

const ESTADO_SIGUIENTE_LABEL = {
  ingresada:   'Diagnóstico →',
  diagnostico: 'Reparación →',
  reparacion:  'Lista →',
  lista:       'Entregada →',
}

export default function KanbanCard({ bici, onAvanzar, onVerDetalle }) {
  const puedeAvanzar = bici.estado !== 'lista' && bici.estado !== 'entregada'
  const tiempoTranscurrido = getTiempo(bici.creadoEn)
  const fotoPortada = bici.fotos?.[0]?.url || null

  return (
    <div className={styles.card} onClick={() => onVerDetalle(bici)}>
      {/* Foto portada si hay */}
      {fotoPortada && (
        <img src={fotoPortada} alt="" className={styles.fotoPortada} />
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.clienteNombre}>{bici.cliente?.nombre || 'Sin cliente'}</div>
        <div className={styles.tiempo}>{tiempoTranscurrido}</div>
      </div>

      {/* Bici info */}
      <div className={styles.biciInfo}>
        <span className={styles.modelo}>{bici.modelo}</span>
        {bici.color && <span className={styles.color}>{bici.color}</span>}
      </div>

      {/* Notas */}
      {bici.notas && (
        <div className={styles.notas}>{bici.notas}</div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.estadoBadge} data-estado={bici.estado}>
          {ESTADOS_LABEL[bici.estado] || bici.estado}
        </div>

        {puedeAvanzar && (
          <button
            className={styles.btnAvanzar}
            onClick={(e) => {
              e.stopPropagation()
              onAvanzar(bici.id)
            }}
          >
            {ESTADO_SIGUIENTE_LABEL[bici.estado]}
          </button>
        )}
      </div>
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
