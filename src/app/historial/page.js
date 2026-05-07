'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './historial.module.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrecio(precio) {
  if (precio == null) return null
  return '$' + new Intl.NumberFormat('es-AR').format(precio)
}

function formatFechaCorta(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

function claveYMes(fecha) {
  if (!fecha) return { clave: 'sin-fecha', label: 'Sin fecha' }
  const d = new Date(fecha)
  const clave = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return { clave, label }
}

function agruparPorMes(items) {
  const mapa = new Map()
  for (const item of items) {
    const { clave, label } = claveYMes(item.deliveredAt)
    if (!mapa.has(clave)) mapa.set(clave, { label, items: [] })
    mapa.get(clave).items.push(item)
  }
  return Array.from(mapa.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, grupo]) => grupo)
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────

const TOOLTIPS = {
  servicios: 'Cantidad de servicios cerrados este mes',
  tiempo:    'Promedio de días entre ingreso y entrega',
  ingresos:  'Suma de precios de servicios cerrados este mes',
}

// ─── Iconos ───────────────────────────────────────────────────────────────────

function IconoAtras() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

// ─── Componentes ──────────────────────────────────────────────────────────────

function MetricCard({ valor, label, tooltipKey, tooltipActivo, onToggleTooltip, loading }) {
  const activo = tooltipActivo === tooltipKey
  return (
    <div className={`${styles.metricCard} ${activo ? styles.metricCardActivo : ''}`}>
      <button
        className={styles.metricInfoBtn}
        onClick={() => onToggleTooltip(tooltipKey)}
        aria-label="Información"
      >
        ⓘ
      </button>
      {loading
        ? <div className={styles.metricSkeleton} />
        : <div className={styles.metricValor}>{valor ?? '—'}</div>
      }
      <div className={styles.metricLabel}>{label}</div>
    </div>
  )
}

function SkeletonItems({ n = 5 }) {
  return Array.from({ length: n }).map((_, i) => (
    <div key={i} className={styles.skeletonItem} />
  ))
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function HistorialPage() {
  const router   = useRouter()
  const [items,    setItems]    = useState([])
  const [resumen,  setResumen]  = useState(null)
  const [cargando, setCargando] = useState(true)
  const [tooltipActivo, setTooltipActivo] = useState(null)

  useEffect(() => {
    async function cargar() {
      try {
        const [resItems, resResumen] = await Promise.all([
          fetch('/api/historial'),
          fetch('/api/historial/resumen'),
        ])
        const [dataItems, dataResumen] = await Promise.all([
          resItems.json(),
          resResumen.json(),
        ])
        setItems(Array.isArray(dataItems) ? dataItems : [])
        setResumen(dataResumen)
      } catch (err) {
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const grupos = agruparPorMes(items)

  const mesActual = new Date().toLocaleDateString('es-AR', {
    month: 'long', year: 'numeric',
  })

  const handleToggleTooltip = (key) => {
    setTooltipActivo(prev => prev === key ? null : key)
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.btnAtras} onClick={() => router.push('/kanban')} aria-label="Volver">
          <IconoAtras />
        </button>
        <span className={styles.titulo}>Historial</span>
        <span className={styles.headerSpacer} />
      </div>

      {/* Métricas del mes actual */}
      <div className={styles.seccionMetricas}>
        <div className={styles.seccionMesLabel}>Este mes · {mesActual}</div>
        <div className={styles.metricsGrid}>
          <MetricCard
            valor={resumen ? String(resumen.count) : null}
            label="Servicios"
            tooltipKey="servicios"
            tooltipActivo={tooltipActivo}
            onToggleTooltip={handleToggleTooltip}
            loading={cargando}
          />
          <MetricCard
            valor={resumen ? `${resumen.avgDias} días` : null}
            label="Tiempo prom. en taller"
            tooltipKey="tiempo"
            tooltipActivo={tooltipActivo}
            onToggleTooltip={handleToggleTooltip}
            loading={cargando}
          />
          <MetricCard
            valor={resumen ? formatPrecio(resumen.revenue) : null}
            label="Ingresos"
            tooltipKey="ingresos"
            tooltipActivo={tooltipActivo}
            onToggleTooltip={handleToggleTooltip}
            loading={cargando}
          />
        </div>
        {tooltipActivo && (
          <div className={styles.tooltipGlobal}>{TOOLTIPS[tooltipActivo]}</div>
        )}
      </div>

      {/* Lista */}
      {cargando && (
        <div className={styles.lista}>
          <SkeletonItems n={6} />
        </div>
      )}

      {!cargando && items.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyTitle}>Sin servicios cerrados todavía</div>
          <div className={styles.emptyDesc}>Los servicios entregados aparecen acá al día siguiente.</div>
        </div>
      )}

      {!cargando && grupos.length > 0 && (
        <div className={styles.lista}>
          {grupos.map((grupo, gi) => (
            <div key={grupo.label} className={`${styles.mesGrupo} ${gi > 0 ? styles.mesGrupoNoFirst : ''}`}>
              <div className={styles.mesHeader}>
                <span className={styles.mesLabel}>{grupo.label}</span>
                <span className={styles.mesCount}>{grupo.items.length}</span>
              </div>
              {grupo.items.map((item, ii) => (
                <div key={item.id} className={`${styles.item} ${ii === 0 ? styles.itemFirst : ''}`}>
                  <div className={styles.itemTop}>
                    <span className={styles.itemCliente}>{item.cliente?.nombre || '—'}</span>
                    <span className={styles.itemFecha}>{formatFechaCorta(item.deliveredAt)}</span>
                  </div>
                  <div className={styles.itemModelo}>{item.modelo}</div>
                  {(item.tipoServicio || item.precio != null) && (
                    <div className={styles.itemMeta}>
                      {item.tipoServicio && (
                        <span className={styles.itemTipo}>{item.tipoServicio}</span>
                      )}
                      {item.tipoServicio && item.precio != null && (
                        <span className={styles.itemMetaSep}>·</span>
                      )}
                      {item.precio != null && (
                        <span className={styles.itemPrecio}>{formatPrecio(item.precio)}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
