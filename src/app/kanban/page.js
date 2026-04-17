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

export default function KanbanPage() {
  const router = useRouter()
  const [bicis,     setBicis]     = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [avanzando, setAvanzando] = useState(null) // id de bici en transición

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

    const nuevoEstado = orden[idx + 1]
    setAvanzando(biciId)

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
    }
  }

  if (cargando) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <span>Cargando taller…</span>
      </div>
    )
  }

  const bicisActivas = bicis.filter(b => b.estado !== 'entregada')

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>918</span>
          <span className={styles.headerMeta}>{bicisActivas.length} en taller</span>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.btnConfig}
            onClick={() => router.push('/configuracion')}
            title="Configuración del taller"
            aria-label="Configuración"
          >
            ⚙
          </button>
          <button
            className={styles.btnNuevo}
            onClick={() => router.push('/registro')}
          >
            + Nueva bici
          </button>
        </div>
      </div>

      {/* Empty state */}
      {bicisActivas.length === 0 && (
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
      {bicisActivas.length > 0 && (
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
                      className={avanzando === bici.id ? styles.cardAvanzando : ''}
                    >
                      <KanbanCard
                        bici={bici}
                        onAvanzar={() => handleAvanzar(bici.id, bici.estado)}
                        onDetalle={() => router.push(`/bici/${bici.id}`)}
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
