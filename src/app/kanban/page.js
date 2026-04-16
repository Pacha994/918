'use client'

import { useState, useEffect, useCallback } from 'react'
import KanbanCard    from './KanbanCard'
import RegistroModal from './RegistroModal'
import DetalleBici   from './DetalleBici'
import styles        from './kanban.module.css'

const COLUMNAS = [
  { id: 'ingresada',   label: 'Ingresada',   color: 'bl' },
  { id: 'diagnostico', label: 'Diagnóstico', color: 'ye' },
  { id: 'reparacion',  label: 'Reparación',  color: 'or' },
  { id: 'lista',       label: 'Lista',       color: 'gr' },
]

export default function KanbanPage() {
  const [bicis,          setBicis]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [avanzando,      setAvanzando]      = useState(null)
  const [modalRegistro,  setModalRegistro]  = useState(false)
  const [biciDetalle,    setBiciDetalle]    = useState(null)

  const fetchBicis = useCallback(async () => {
    try {
      const res  = await fetch('/api/bicis')
      const data = await res.json()
      setBicis(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error cargando bicis:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBicis() }, [fetchBicis])

  const handleAvanzar = async (id) => {
    setAvanzando(id)
    try {
      const res = await fetch(`/api/bicis/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Error avanzando')
      const biciActualizada = await res.json()
      setBicis(prev =>
        prev
          .map(b => b.id === id ? biciActualizada : b)
          .filter(b => b.estado !== 'entregada')
      )
      // Si el detalle está abierto, actualizarlo
      if (biciDetalle?.id === id) setBiciDetalle(biciActualizada)
    } catch (err) {
      console.error('Error avanzando bici:', err)
    } finally {
      setAvanzando(null)
    }
  }

  const handleRegistroExitoso = (nuevaBici) => {
    setBicis(prev => [nuevaBici, ...prev])
    setModalRegistro(false)
  }

  const bicisPorEstado = (estado) => bicis.filter(b => b.estado === estado)
  const totalActivas   = bicis.length

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <span>Cargando taller...</span>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>918</div>
          <div className={styles.headerMeta}>
            {totalActivas > 0
              ? `${totalActivas} bici${totalActivas !== 1 ? 's' : ''} activa${totalActivas !== 1 ? 's' : ''}`
              : 'Sin trabajo activo'}
          </div>
        </div>
        <button className={styles.btnNuevo} onClick={() => setModalRegistro(true)}>
          + Nuevo
        </button>
      </header>

      {/* Kanban o empty state */}
      {totalActivas === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🚲</div>
          <div className={styles.emptyTitle}>Sin bicis activas</div>
          <div className={styles.emptyDesc}>Registrá una nueva bici para empezar</div>
          <button className={styles.btnNuevoEmpty} onClick={() => setModalRegistro(true)}>
            + Registrar bici
          </button>
        </div>
      ) : (
        <div className={styles.kanban}>
          {COLUMNAS.map(col => {
            const items = bicisPorEstado(col.id)
            return (
              <div key={col.id} className={styles.columna}>
                <div className={styles.colHeader} data-color={col.color}>
                  <span className={styles.colLabel}>{col.label}</span>
                  {items.length > 0 && (
                    <span className={styles.colCount}>{items.length}</span>
                  )}
                </div>
                <div className={styles.colCards}>
                  {items.length === 0 ? (
                    <div className={styles.colEmpty}>—</div>
                  ) : (
                    items.map(bici => (
                      <div
                        key={bici.id}
                        className={avanzando === bici.id ? styles.cardAvanzando : ''}
                      >
                        <KanbanCard
                          bici={bici}
                          onAvanzar={handleAvanzar}
                          onVerDetalle={setBiciDetalle}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalRegistro && (
        <RegistroModal
          onClose={() => setModalRegistro(false)}
          onExito={handleRegistroExitoso}
        />
      )}

      {biciDetalle && (
        <DetalleBici
          bici={biciDetalle}
          onClose={() => setBiciDetalle(null)}
          onAvanzar={handleAvanzar}
        />
      )}
    </div>
  )
}
