'use client'

import { useState } from 'react'
import styles      from './DetalleBici.module.css'
import HallazgoForm from './HallazgoForm'

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

const ESTADO_ANTERIOR_LABEL = {
  diagnostico: 'Volver a Ingresada',
  reparacion:  'Volver a Diagnóstico',
  lista:       'Volver a Reparación',
}

const TIPO_SERVICIO_LABEL = {
  basico:      'Service básico',
  completo:    'Service completo',
  premium:     'Service premium',
  diagnostico: 'Solo diagnóstico',
}

export default function DetalleBici({ bici, onClose, onAvanzar, onHallazgoCreado }) {
  const [avanzando,       setAvanzando]       = useState(false)
  const [retrocediendo,   setRetrocediendo]   = useState(false)
  const [cerrandoServicio, setCerrandoServicio] = useState(false)
  const [fotoActiva,      setFotoActiva]      = useState(null)
  const [mostrarForm,     setMostrarForm]     = useState(false)
  const [hallazgos,       setHallazgos]       = useState(bici.hallazgos || [])
  const [resolviendoId,   setResolviendoId]   = useState(null)

  const indexEstado    = ESTADOS.indexOf(bici.estado)
  const hayPendiente   = hallazgos.some(h => h.estado === 'pendiente')
  const puedeRetroceder = indexEstado > 0 && bici.estado !== 'entregada' && ESTADO_ANTERIOR_LABEL[bici.estado]

  const handleAvanzar = async () => {
    setAvanzando(true)
    try {
      await fetch(`/api/bicis/${bici.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: ESTADOS[indexEstado + 1] }),
      })
      await onAvanzar()
    } catch (err) {
      console.error('Error avanzando estado:', err)
    } finally {
      setAvanzando(false)
    }
  }

  const handleRetroceder = async () => {
    setRetrocediendo(true)
    try {
      await fetch(`/api/bicis/${bici.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: ESTADOS[indexEstado - 1] }),
      })
      await onAvanzar()
    } catch (err) {
      console.error('Error retrocediendo estado:', err)
    } finally {
      setRetrocediendo(false)
    }
  }

  const handleCerrarServicio = async () => {
    setCerrandoServicio(true)
    try {
      await fetch(`/api/bicis/${bici.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'entregada', archivarAhora: true }),
      })
      await onAvanzar()
    } catch (err) {
      console.error('Error cerrando servicio:', err)
    } finally {
      setCerrandoServicio(false)
    }
  }

  const handleHallazgoCreado = (hallazgo) => {
    setHallazgos(prev => [...prev, hallazgo])
    onHallazgoCreado?.(bici.id, hallazgo)
  }

  const handleResolver = async (hallazgoId, estado) => {
    setResolviendoId(hallazgoId)
    try {
      const res = await fetch(`/api/hallazgos/${hallazgoId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ estado }),
      })
      if (!res.ok) throw new Error()
      const actualizado = await res.json()
      setHallazgos(prev => prev.map(h => h.id === hallazgoId ? actualizado : h))
    } catch (err) {
      console.error('Error resolviendo hallazgo:', err)
    } finally {
      setResolviendoId(null)
    }
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />

      <div className={styles.sheet}>
        <div className={styles.handle} onClick={onClose} />

        {/* Header */}
        <div className={styles.sheetHeader}>
          <div>
            <div className={styles.clienteNombre}>{bici.cliente?.nombre || 'Sin cliente'}</div>
            {bici.cliente?.whatsapp && (
              <a
                href={`https://wa.me/${bici.cliente.whatsapp.replace(/\D/g,'')}`}
                className={styles.whatsapp}
                target="_blank" rel="noreferrer"
                onClick={e => e.stopPropagation()}
              >
                {bici.cliente.whatsapp}
              </a>
            )}
          </div>
          <button className={styles.btnCerrar} onClick={onClose}>✕</button>
        </div>

        {/* Bici info + badge de estado */}
        <div className={styles.biciRow}>
          <div className={styles.biciModelo}>{bici.modelo}</div>
          {bici.color && <span className={styles.biciColor}>{bici.color}</span>}
          <span className={`${styles.estadoBadge} ${styles['estadoBadge_' + bici.estado]}`}>
            {ESTADOS_LABEL[bici.estado]}
          </span>
        </div>

        {/* Timeline */}
        <div className={styles.timeline}>
          {ESTADOS.filter(e => e !== 'entregada').map((estado, i) => (
            <div
              key={estado}
              className={[
                styles.timelineItem,
                i <= indexEstado       ? styles.timelineActivo  : '',
                estado === bici.estado ? styles.timelineCurrent : '',
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
            <div className={styles.descripcion}>
              {TIPO_SERVICIO_LABEL[bici.tipoServicio] || bici.tipoServicio}
            </div>
          </div>
        )}

        {/* Notas */}
        {bici.notas && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Notas</div>
            <div className={styles.descripcion}>{bici.notas}</div>
          </div>
        )}

        {/* Hallazgos */}
        <div className={styles.seccion}>
          <div className={styles.hallazgosHeader}>
            <div className={styles.seccionLabel}>
              Hallazgos {hallazgos.length > 0 && `(${hallazgos.length})`}
            </div>
          </div>

          {bici.estado !== 'entregada' && (
            <button className={styles.btnReportar} onClick={() => setMostrarForm(true)}>
              + Reportar hallazgo
            </button>
          )}

          {hallazgos.length === 0 ? (
            <div className={styles.hallazgosVacio}>Sin hallazgos registrados</div>
          ) : (
            <div className={styles.hallazgosList}>
              {hallazgos.map(h => (
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
                      <div className={styles.hallazgoPrecio}>
                        ${Number(h.precio).toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div className={`${styles.hallazgoBadge} ${styles['badge_' + h.estado]}`}>
                      {h.estado === 'pendiente'  && 'Esperando'}
                      {h.estado === 'aprobado'   && 'Aprobado'}
                      {h.estado === 'rechazado'  && 'Rechazado'}
                    </div>
                  </div>

                  {h.estado === 'pendiente' && (
                    <div className={styles.hallazgoSimular}>
                      <span className={styles.simularLabel}>Simular respuesta del cliente:</span>
                      <div className={styles.simularBtns}>
                        <button
                          className={styles.btnAprobar}
                          disabled={resolviendoId === h.id}
                          onClick={() => handleResolver(h.id, 'aprobado')}
                        >
                          ✓ Aprobó
                        </button>
                        <button
                          className={styles.btnRechazar}
                          disabled={resolviendoId === h.id}
                          onClick={() => handleResolver(h.id, 'rechazado')}
                        >
                          ✕ Rechazó
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fotos de recepción */}
        {bici.fotos && bici.fotos.length > 0 && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Fotos de recepción ({bici.fotos.length})</div>
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

        {/* Fechas */}
        <div className={styles.fechas}>
          <span>Ingresó el {formatFecha(bici.creadoEn)}</span>
          {bici.deliveredAt && (
            <span className={styles.fechaEntrega}>Entregada el {formatFecha(bici.deliveredAt)}</span>
          )}
        </div>

        {/* Footer */}
        {bici.estado !== 'entregada' ? (
          <div className={styles.footer}>
            {puedeRetroceder && (
              <button
                className={styles.btnRetroceder}
                onClick={handleRetroceder}
                disabled={retrocediendo || avanzando}
              >
                {retrocediendo ? '...' : '← ' + ESTADO_ANTERIOR_LABEL[bici.estado]}
              </button>
            )}
            {hayPendiente ? (
              <button className={styles.btnAvanzar} disabled>
                {ESTADO_SIGUIENTE_LABEL[bici.estado]} · presupuesto pendiente
              </button>
            ) : (
              <button
                className={styles.btnAvanzar}
                onClick={handleAvanzar}
                disabled={avanzando || retrocediendo}
              >
                {avanzando ? 'Avanzando...' : ESTADO_SIGUIENTE_LABEL[bici.estado]}
              </button>
            )}
          </div>
        ) : (
          <div className={styles.footer}>
            <div className={styles.entregadaMsg}>✓ Bici entregada</div>
            <button
              className={styles.btnCerrarServicio}
              onClick={handleCerrarServicio}
              disabled={cerrandoServicio}
            >
              {cerrandoServicio ? 'Archivando...' : 'Cerrar servicio'}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {fotoActiva && (
        <div className={styles.lightbox} onClick={() => setFotoActiva(null)}>
          <img src={fotoActiva} alt="" className={styles.lightboxImg} />
        </div>
      )}

      {/* HallazgoForm */}
      {mostrarForm && (
        <HallazgoForm
          bici={bici}
          onClose={() => setMostrarForm(false)}
          onHallazgoCreado={handleHallazgoCreado}
        />
      )}
    </>
  )
}
