'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './kanban.module.css'
import KanbanCard from './KanbanCard'
import DetalleBici from './DetalleBici'

const COLUMNAS = [
  { id: 'ingresada',   label: 'Ingresada',   color: 'bl' },
  { id: 'diagnostico', label: 'Diagnóstico', color: 'ye' },
  { id: 'reparacion',  label: 'Reparación',  color: 'or' },
  { id: 'lista',       label: 'Lista',       color: 'gr' },
  { id: 'entregada',   label: 'Entregada',   color: 're' },
]

function IconoEngranaje() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconoHistorial() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
  const [bicis,       setBicis]       = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [avanzando,   setAvanzando]   = useState(null)
  const [saliendo,    setSaliendo]    = useState(new Set())
  const [biciDetalle, setBiciDetalle] = useState(null)

  // ── Drag & drop ──────────────────────────────────────────────────────────────
  const [dragId,    setDragId]    = useState(null) // biciId being dragged
  const [dragFrom,  setDragFrom]  = useState(null) // source estado
  const [dropCol,   setDropCol]   = useState(null) // highlighted target column
  const kanbanRef = useRef(null)
  const touchRef  = useRef({})     // { biciId, fromEstado, startX, startY, activated, ghost, offsetX, offsetY, cardEl, cardRect }

  const cargarBicis = useCallback(async () => {
    try {
      const res = await fetch('/api/bicis')
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

  const handleVerDetalle = (bici) => setBiciDetalle(bici)
  const handleCerrarDetalle = () => setBiciDetalle(null)

  const handleAvanzarDesdeSheet = async () => {
    await cargarBicis()
    setBiciDetalle(null)
  }

  const handleHallazgoCreado = useCallback((biciId, hallazgo) => {
    setBicis(prev => prev.map(b =>
      b.id === biciId ? { ...b, hallazgos: [...(b.hallazgos || []), hallazgo] } : b
    ))
  }, [])

  // Shared move logic: optimistic update + PATCH + revert on failure
  const moverBici = useCallback(async (biciId, fromEstado, toEstado) => {
    if (fromEstado === toEstado) return
    setBicis(prev => prev.map(b => b.id === biciId ? { ...b, estado: toEstado } : b))
    try {
      const res = await fetch(`/api/bicis/${biciId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: toEstado }),
      })
      if (!res.ok) throw new Error()
      await cargarBicis()
    } catch {
      setBicis(prev => prev.map(b => b.id === biciId ? { ...b, estado: fromEstado } : b))
    }
  }, [cargarBicis])

  // ── Drag start (touch + mouse) ────────────────────────────────────────────
  const handleTouchStart = useCallback((e, biciId, fromEstado) => {
    if (e.target.tagName === 'BUTTON') return
    const touch = e.touches[0]
    const cardEl = e.currentTarget
    const rect = cardEl.getBoundingClientRect()
    touchRef.current = {
      biciId, fromEstado, type: 'touch',
      startX: touch.clientX, startY: touch.clientY,
      offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top,
      activated: false, ghost: null, cardEl, cardRect: rect,
    }
  }, [])

  const handleMouseDown = useCallback((e, biciId, fromEstado) => {
    if (e.button !== 0 || e.target.tagName === 'BUTTON') return
    const cardEl = e.currentTarget
    const rect = cardEl.getBoundingClientRect()
    touchRef.current = {
      biciId, fromEstado, type: 'mouse',
      startX: e.clientX, startY: e.clientY,
      offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
      activated: false, ghost: null, cardEl, cardRect: rect,
    }
  }, [])

  useEffect(() => {
    const GHOST_CSS = (width) => [
      'position:fixed',
      `width:${width}px`,
      'pointer-events:none',
      'z-index:999',
      'opacity:0.88',
      'transform:scale(1.04) rotate(1deg)',
      'box-shadow:0 8px 32px rgba(0,0,0,.6)',
      'border-radius:4px',
      'transition:none',
    ].join(';')

    const onDragMove = (clientX, clientY, isTouch) => {
      const t = touchRef.current
      if (!t.biciId) return
      const dx = clientX - t.startX
      const dy = clientY - t.startY

      if (!t.activated) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        if (isTouch && Math.abs(dy) > Math.abs(dx) * 1.4) { touchRef.current = {}; return }
        t.activated = true
        setDragId(t.biciId)
        setDragFrom(t.fromEstado)
        if (isTouch && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30)
      }

      if (!t.ghost) {
        const g = t.cardEl.cloneNode(true)
        g.style.cssText = GHOST_CSS(t.cardRect.width)
        document.body.appendChild(g)
        t.ghost = g
      }

      t.ghost.style.left = `${clientX - t.offsetX}px`
      t.ghost.style.top  = `${clientY - t.offsetY}px`

      const kb = kanbanRef.current
      if (kb) {
        const r = kb.getBoundingClientRect()
        const ZONE = 80
        if      (clientX < r.left  + ZONE) kb.scrollLeft -= 10
        else if (clientX > r.right - ZONE) kb.scrollLeft += 10
      }

      t.ghost.style.visibility = 'hidden'
      const el = document.elementFromPoint(clientX, clientY)
      t.ghost.style.visibility = ''
      setDropCol(el?.closest('[data-col]')?.dataset?.col ?? null)
    }

    const onDragEnd = (clientX, clientY) => {
      const t = touchRef.current
      touchRef.current = {}
      if (!t.activated) return
      t.ghost?.remove()
      const el = document.elementFromPoint(clientX, clientY)
      const toEstado = el?.closest('[data-col]')?.dataset?.col ?? null
      setDragId(null); setDragFrom(null); setDropCol(null)
      if (toEstado) moverBici(t.biciId, t.fromEstado, toEstado)
    }

    const onTouchMove = (e) => {
      if (touchRef.current.type !== 'touch') return
      e.preventDefault()
      const touch = e.touches[0]
      onDragMove(touch.clientX, touch.clientY, true)
    }

    const onTouchEnd = (e) => {
      if (touchRef.current.type !== 'touch') return
      const touch = e.changedTouches[0]
      onDragEnd(touch.clientX, touch.clientY)
    }

    const onMouseMove = (e) => {
      if (touchRef.current.type !== 'mouse') return
      onDragMove(e.clientX, e.clientY, false)
    }

    const onMouseUp = (e) => {
      if (touchRef.current.type !== 'mouse') return
      onDragEnd(e.clientX, e.clientY)
    }

    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend',  onTouchEnd)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
    return () => {
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend',  onTouchEnd)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }
  }, [moverBici])

  const handleAvanzar = async (biciId, estadoActual) => {
    const orden = ['ingresada', 'diagnostico', 'reparacion', 'lista', 'entregada']
    const idx   = orden.indexOf(estadoActual)
    if (idx < 0 || idx >= orden.length - 1) return

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30)
    }

    const nuevoEstado = orden[idx + 1]

    setSaliendo(prev => new Set(prev).add(biciId))
    setAvanzando(biciId)
    await new Promise(r => setTimeout(r, 280))

    try {
      const res = await fetch(`/api/bicis/${biciId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: nuevoEstado }),
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
            onClick={() => router.push('/historial')}
            title="Historial de servicios"
            aria-label="Historial"
          >
            <IconoHistorial />
          </button>
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

      {cargando && (
        <div className={styles.kanban}>
          <SkeletonColumna count={2} />
          <SkeletonColumna count={2} />
          <SkeletonColumna count={1} />
          <SkeletonColumna count={1} />
        </div>
      )}

      {!cargando && bicis.length === 0 && (
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

      {!cargando && bicis.length > 0 && (
        <div className={styles.kanban} ref={kanbanRef}>
          {COLUMNAS.map(col => {
            const tarjetas   = bicis.filter(b => b.estado === col.id)
            const isDropTarget = dropCol === col.id && dragFrom !== col.id
            return (
              <div
                key={col.id}
                className={styles.columna}
                data-col={col.id}
              >
                <div className={styles.colHeader} data-color={col.color}>
                  <span className={styles.colLabel}>{col.label}</span>
                  <span className={styles.colCount}>{tarjetas.length}</span>
                </div>
                <div className={[styles.colCards, isDropTarget ? styles.colCardsDropTarget : ''].join(' ')}>
                  {tarjetas.length === 0 && (
                    <div className={styles.colEmpty}>—</div>
                  )}
                  {tarjetas.map(bici => (
                    <div
                      key={bici.id}
                      className={[
                        styles.cardWrapper,
                        saliendo.has(bici.id) ? styles.cardSaliendo    : '',
                        dragId === bici.id    ? styles.cardDragging     : '',
                      ].join(' ')}
                      onMouseDown={e => handleMouseDown(e, bici.id, bici.estado)}
                      onTouchStart={e => handleTouchStart(e, bici.id, bici.estado)}
                    >
                      <KanbanCard
                        bici={bici}
                        avanzando={avanzando === bici.id}
                        onAvanzar={() => handleAvanzar(bici.id, bici.estado)}
                        onVerDetalle={() => handleVerDetalle(bici)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {biciDetalle && (
        <DetalleBici
          bici={biciDetalle}
          onClose={handleCerrarDetalle}
          onAvanzar={handleAvanzarDesdeSheet}
          onHallazgoCreado={handleHallazgoCreado}
        />
      )}

    </div>
  )
}
