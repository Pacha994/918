'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './configuracion.module.css'

const SERVICIOS_DEFAULT = [
  {
    id:     'basico',
    nombre: 'Service básico',
    precio: 8000,
    items: [
      { label: 'Limpieza general',       activo: true },
      { label: 'Lubricación de cadena',  activo: true },
      { label: 'Ajuste de frenos',       activo: true },
      { label: 'Inflado de cubiertas',   activo: true },
      { label: 'Ajuste de cambios',      activo: true },
    ],
  },
  {
    id:     'completo',
    nombre: 'Service completo',
    precio: 18000,
    items: [
      { label: 'Todo el service básico',           activo: true },
      { label: 'Revisión de rodamientos',          activo: true },
      { label: 'Centrado de ruedas',               activo: true },
      { label: 'Revisión de dirección',            activo: true },
      { label: 'Limpieza profunda de transmisión', activo: true },
    ],
  },
  {
    id:     'premium',
    nombre: 'Service premium',
    precio: 35000,
    items: [
      { label: 'Todo el service completo',       activo: true },
      { label: 'Desarmado completo',             activo: true },
      { label: 'Cambio de cables y fundas',      activo: true },
      { label: 'Revisión y ajuste de horquilla', activo: true },
      { label: 'Pulido de aros',                 activo: true },
    ],
  },
  {
    id:     'diagnostico',
    nombre: 'Solo diagnóstico',
    precio: 3500,
    items: [
      { label: 'Inspección visual completa', activo: true },
      { label: 'Informe de estado',          activo: true },
      { label: 'Presupuesto detallado',      activo: true },
    ],
  },
]

export default function ConfiguracionPage() {
  const router = useRouter()

  const [cargando,  setCargando]  = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState(null)
  const [exito,     setExito]     = useState(false)

  const [nombre,    setNombre]    = useState('')
  const [servicios, setServicios] = useState([])

  // Servicio expandido actualmente (índice o null)
  const [expandido, setExpandido] = useState(null)

  // ── Cargar taller ──
  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch('/api/taller')
        if (!res.ok) throw new Error('No se pudo cargar el taller')
        const data = await res.json()
        setNombre(data.nombre || '')
        setServicios(Array.isArray(data.servicios) ? data.servicios : [])
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar la configuración.')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  // ── Servicios helpers ──
  const handlePrecioChange = (idx, val) => {
    const nuevo = [...servicios]
    nuevo[idx] = { ...nuevo[idx], precio: Number(val) || 0 }
    setServicios(nuevo)
  }

  const handleItemToggle = (sIdx, iIdx) => {
    const nuevo = [...servicios]
    const items = [...nuevo[sIdx].items]
    items[iIdx] = { ...items[iIdx], activo: !items[iIdx].activo }
    nuevo[sIdx] = { ...nuevo[sIdx], items }
    setServicios(nuevo)
  }

  const handleAgregarItem = (sIdx) => {
    const label = window.prompt('Nombre del ítem:')
    if (!label?.trim()) return
    const nuevo = [...servicios]
    nuevo[sIdx] = {
      ...nuevo[sIdx],
      items: [...nuevo[sIdx].items, { label: label.trim(), activo: true }],
    }
    setServicios(nuevo)
  }

  const handleEliminarItem = (sIdx, iIdx) => {
    const nuevo = [...servicios]
    const items = nuevo[sIdx].items.filter((_, i) => i !== iIdx)
    nuevo[sIdx] = { ...nuevo[sIdx], items }
    setServicios(nuevo)
  }

  // ── Guardar ──
  const handleGuardar = async () => {
    if (!nombre.trim()) { setError('El nombre no puede estar vacío'); return }
    setGuardando(true)
    setError(null)
    setExito(false)
    try {
      const res = await fetch('/api/taller', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre: nombre.trim(), servicios }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setExito(true)
      setTimeout(() => setExito(false), 2500)
    } catch (err) {
      console.error(err)
      setError('No se pudo guardar. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  // ── Loading ──
  if (cargando) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Cargando configuración…</span>
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.btnBack} onClick={() => router.push('/kanban')}>
          ←
        </button>
        <span className={styles.headerTitle}>Configuración</span>
        <button
          className={styles.btnGuardar}
          onClick={handleGuardar}
          disabled={guardando}
        >
          {guardando ? '…' : exito ? '✓' : 'Guardar'}
        </button>
      </div>

      <div className={styles.body}>

        {/* Feedback */}
        {error  && <div className={styles.banner + ' ' + styles.bannerError}>{error}</div>}
        {exito  && <div className={styles.banner + ' ' + styles.bannerExito}>Cambios guardados</div>}

        {/* Sección: Taller */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>Taller</div>
          <div className={styles.campo}>
            <label className={styles.campoLabel}>Nombre</label>
            <input
              className={styles.input}
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del taller"
            />
          </div>
        </div>

        {/* Sección: Servicios */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>Servicios</div>

          {servicios.length === 0 && (
            <div className={styles.emptyServicios}>
              <div className={styles.emptyServiciosTexto}>
                No hay servicios cargados todavía.
              </div>
              <button
                className={styles.btnCargarDefaults}
                onClick={() => setServicios(SERVICIOS_DEFAULT)}
              >
                Cargar servicios por defecto
              </button>
              <div className={styles.emptyServiciosHint}>
                Básico · Completo · Premium · Diagnóstico — podés editar precios e ítems antes de guardar.
              </div>
            </div>
          )}

          {servicios.map((srv, sIdx) => (
            <div key={srv.id || sIdx} className={styles.servicioCard}>

              {/* Cabecera del servicio */}
              <button
                className={styles.servicioCabecera}
                onClick={() => setExpandido(expandido === sIdx ? null : sIdx)}
              >
                <div className={styles.servicioInfo}>
                  <span className={styles.servicioNombre}>{srv.nombre}</span>
                  <span className={styles.servicioPrecio}>
                    ${srv.precio?.toLocaleString('es-AR') ?? 0}
                  </span>
                </div>
                <span className={`${styles.chevron} ${expandido === sIdx ? styles.chevronOpen : ''}`}>
                  ›
                </span>
              </button>

              {/* Panel expandido */}
              {expandido === sIdx && (
                <div className={styles.servicioPanel}>

                  {/* Precio */}
                  <div className={styles.campo}>
                    <label className={styles.campoLabel}>Precio</label>
                    <div className={styles.precioWrap}>
                      <span className={styles.precioPrefijo}>$</span>
                      <input
                        className={styles.precioInput}
                        type="number"
                        inputMode="numeric"
                        value={srv.precio ?? 0}
                        onChange={e => handlePrecioChange(sIdx, e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div className={styles.campo}>
                    <label className={styles.campoLabel}>Qué incluye</label>
                    <div className={styles.itemsList}>
                      {(srv.items || []).map((item, iIdx) => (
                        <div key={iIdx} className={styles.itemRow}>
                          <label className={styles.itemCheck}>
                            <input
                              type="checkbox"
                              checked={item.activo}
                              onChange={() => handleItemToggle(sIdx, iIdx)}
                            />
                            <span className={`${styles.itemLabel} ${!item.activo ? styles.itemDesactivo : ''}`}>
                              {item.label}
                            </span>
                          </label>
                          <button
                            className={styles.btnEliminar}
                            onClick={() => handleEliminarItem(sIdx, iIdx)}
                            title="Eliminar ítem"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        className={styles.btnAgregar}
                        onClick={() => handleAgregarItem(sIdx)}
                      >
                        + Agregar ítem
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>

        {/* Guardar bottom */}
        <div className={styles.footerGuardar}>
          <button
            className={styles.btnGuardarFull}
            onClick={handleGuardar}
            disabled={guardando}
          >
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  )
}
