'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './historial.module.css'

const PAGE_SIZE = 20

function formatFechaEntrega(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function IconoAtras() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export default function HistorialPage() {
  const router = useRouter()
  const [items,        setItems]        = useState([])
  const [page,         setPage]         = useState(0)
  const [cargando,     setCargando]     = useState(true)
  const [cargandoMas,  setCargandoMas]  = useState(false)
  const [hayMas,       setHayMas]       = useState(true)

  const cargarPagina = useCallback(async (numeroPagina, acumular) => {
    if (numeroPagina === 0) setCargando(true)
    else setCargandoMas(true)

    try {
      const res = await fetch(`/api/historial?page=${numeroPagina}`)
      if (!res.ok) throw new Error('Error al cargar historial')
      const data = await res.json()

      if (acumular) {
        setItems(prev => [...prev, ...data])
      } else {
        setItems(data)
      }

      setHayMas(data.length === PAGE_SIZE)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
      setCargandoMas(false)
    }
  }, [])

  useEffect(() => { cargarPagina(0, false) }, [cargarPagina])

  const handleCargarMas = async () => {
    const siguiente = page + 1
    setPage(siguiente)
    await cargarPagina(siguiente, true)
  }

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <button className={styles.btnAtras} onClick={() => router.push('/kanban')} aria-label="Volver al kanban">
          <IconoAtras />
        </button>
        <span className={styles.titulo}>Historial</span>
        <span className={styles.headerSpacer} />
      </div>

      {cargando && (
        <div className={styles.skeletonList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonItem} />
          ))}
        </div>
      )}

      {!cargando && items.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyTitle}>Sin servicios cerrados todavía</div>
          <div className={styles.emptyDesc}>Los servicios entregados aparecen acá al día siguiente.</div>
        </div>
      )}

      {!cargando && items.length > 0 && (
        <>
          <div className={styles.lista}>
            {items.map(item => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemTop}>
                  <div className={styles.itemCliente}>{item.cliente?.nombre || '—'}</div>
                  <span className={styles.badgeEntregada}>Entregada</span>
                </div>
                <div className={styles.itemModelo}>{item.modelo}</div>
                <div className={styles.itemFecha}>
                  {formatFechaEntrega(item.deliveredAt)}
                </div>
              </div>
            ))}
          </div>

          {hayMas && (
            <div className={styles.cargarMasWrap}>
              <button
                className={styles.btnCargarMas}
                onClick={handleCargarMas}
                disabled={cargandoMas}
              >
                {cargandoMas ? 'Cargando...' : 'Cargar más'}
              </button>
            </div>
          )}

          {!hayMas && items.length > 0 && (
            <div className={styles.finLista}>Todos los servicios cargados</div>
          )}
        </>
      )}

    </div>
  )
}
