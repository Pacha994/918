'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './kanban.module.css'
import KanbanCard from './KanbanCard'

const TALLER_ID = 'cmo1pymo80000v58afkeey7so'

const COLUMNAS = [
  { id: 'ingresada',   label: 'Ingresada',   color: 'bl' },
  { id: 'diagnostico', label: 'Diagnóstico', color: 'ye' },
  { id: 'reparacion',  label: 'Reparación',  color: 'or' },
  { id: 'lista',       label: 'Lista',       color: 'gr' },
]

function IconoEngranaje() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function SkeletonCard() {
  return <div className={styles.skeletonCard} />
}

function SkeletonColumna({ count = 2 }) {
  return (
    <div className={styles.columna}>
      <div className={styles.colHeader}>
        <div className={styles.skeletonLabel} />
        <div className={styles.skeletonCount} />
      </div>
      <div className={styles.colCards}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const router = useRouter()
  const [bicis,    setBicis]    = useState([])
  const [cargando, setCargando] = useState(true)
  const [avanzando, setAvanzando] = useState(null)
  const [saliendo,  setSaliendo]  = useState(new Set())

  const cargarBicis = useCallback(async () => {
    try {
      const res = await fetch(`/api/bicis?tallerId=${TALLER_ID}`)
      if (!res.ok) throw new Error('Error al cargar bicis')
      const data = await res.json()
      setBicis(data)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarBicis() }, [cargarBicis])

  const handleAvanzar = async (biciId, estadoActual) => {
    const orden = ['ingresada', 'diagnostico', 'reparacion', 'lista', 'entregada']
    const idx   = orden.indexOf(estadoActual)
    if (idx < 0 || idx >= orden.length - 1) return

    // Háptico
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30)
    }

    const nuevoEstado = orden[idx + 1]

    // Trigger animación exit
    setSaliendo(prev => new Set(prev).add(biciId))
    setAvanzando(biciId)

    // Esperar que termine la animación antes del PATCH
    await new Promise(r => setTimeout(r, 280))

    try {
      const res = await fetch(`/api/bicis/${biciId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ estado: nuevoEstado }),
      })
      if (!res.ok) throw new Error('Error al avanzar estado')
      await cargarBicis()
    } catch (err) {
      console.error(err)
    } finally {
      setAvanzando(null)
      setSaliendo(prev => {
        const next = new Set(prev)
        next.delete(biciId)
        return next
      })
    }
  }

  const bicisActivas = bicis.filter(b => b.estado !== 'entregada')

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>918</span>
          {!cargando && (
            <span className={styles.headerMeta}>{bicisActivas.length} en taller</span>
          )}
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.btnConfig}
            onClick={() => router.push('/configuracion')}
            title="Configuración del taller"
            aria-label="Configuración"
          >
            <IconoEngranaje />
          </button>
          <button
            className={styles.btnNuevo}
            onClick={() => router.push('/registro')}
          >
            + Nueva bici
          </button>
        </div>
      </div>

      {/* Skeleton loading */}
      {cargando && (
        <div className={styles.kanban}>
          <SkeletonColumna count={2} />
          <SkeletonColumna count={2} />
          <SkeletonColumna count={1} />
          <SkeletonColumna count={1} />
        </div>
      )}

      {/* Empty state */}
      {!cargando && bicisActivas.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🚲</div>
          <div className={styles.emptyTitle}>Sin bicis en el taller</div>
          <div className={styles.emptyDesc}>Registrá la primera para arrancar.</div>
          <button
            className={styles.btnNuevoEmpty}
            onClick={() => router.push('/registro')}
          >
            + Registrar bici
          </button>
        </div>
      )}

      {/* Kanban */}
      {!cargando && bicisActivas.length > 0 && (
        <div className={styles.kanban}>
          {COLUMNAS.map(col => {
            const tarjetas = bicisActivas.filter(b => b.estado === col.id)
            return (
              <div key={col.id} className={styles.columna}>
                <div className={styles.colHeader} data-color={col.color}>
                  <span className={styles.colLabel}>{col.label}</span>
                  <span className={styles.colCount}>{tarjetas.length}</span>
                </div>
                <div className={styles.colCards}>
                  {tarjetas.length === 0 && (
                    <div className={styles.colEmpty}>—</div>
                  )}
                  {tarjetas.map(bici => (
                    <div
                      key={bici.id}
                      className={[
                        styles.cardWrapper,
                        saliendo.has(bici.id) ? styles.cardSaliendo : '',
                      ].join(' ')}
                    >
                      <KanbanCard
                        bici={bici}
                        avanzando={avanzando === bici.id}
                        onAvanzar={() => handleAvanzar(bici.id, bici.estado)}
                        onVerDetalle={() => router.push(`/bici/${bici.id}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
