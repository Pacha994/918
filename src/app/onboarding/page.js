'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './onboarding.module.css'

const SERVICIOS_DEFAULT = [
  {
    id:     'basico',
    nombre: 'Service básico',
    precio: 8000,
    items: [
      { label: 'Limpieza general',    activo: true },
      { label: 'Lubricación de cadena', activo: true },
      { label: 'Ajuste de frenos',    activo: true },
      { label: 'Inflado de cubiertas', activo: true },
      { label: 'Ajuste de cambios',   activo: true },
    ],
  },
  {
    id:     'completo',
    nombre: 'Service completo',
    precio: 18000,
    items: [
      { label: 'Todo el service básico',        activo: true },
      { label: 'Revisión de rodamientos',       activo: true },
      { label: 'Centrado de ruedas',            activo: true },
      { label: 'Revisión de dirección',         activo: true },
      { label: 'Limpieza profunda de transmisión', activo: true },
    ],
  },
  {
    id:     'premium',
    nombre: 'Service premium',
    precio: 35000,
    items: [
      { label: 'Todo el service completo', activo: true },
      { label: 'Desarmado completo',       activo: true },
      { label: 'Cambio de cables y fundas', activo: true },
      { label: 'Revisión y ajuste de horquilla', activo: true },
      { label: 'Pulido de aros',           activo: true },
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

export default function OnboardingPage() {
  const router = useRouter()
  const [paso,      setPaso]      = useState(0)
  const [nombre,    setNombre]    = useState('')
  const [whatsapp,  setWhatsapp]  = useState('')
  const [codigo,    setCodigo]    = useState(['', '', '', ''])
  const [servicios, setServicios] = useState(SERVICIOS_DEFAULT)
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState(null)
  const [tallerNombre, setTallerNombre] = useState('')

  // Paso 4-7: índice del servicio actual (0-3)
  const servicioIdx = paso - 3

  const avanzar = () => { setError(null); setPaso(p => p + 1) }
  const retroceder = () => { setError(null); setPaso(p => p - 1) }

  const handleCodigoChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const nuevo = [...codigo]
    nuevo[i] = val
    setCodigo(nuevo)
    if (val && i < 3) {
      document.getElementById(`cod-${i + 1}`)?.focus()
    }
  }

  const handleContinuarDatos = () => {
    if (!nombre.trim()) { setError('El nombre del taller es requerido'); return }
    if (!whatsapp.trim()) { setError('El WhatsApp es requerido'); return }
    setTallerNombre(nombre.trim())
    avanzar()
  }

  const handleVerificar = () => {
    // Simulación: cualquier código de 4 dígitos pasa
    if (codigo.some(c => c === '')) { setError('Ingresá el código completo'); return }
    avanzar()
  }

  const handlePrecioChange = (idx, val) => {
    const nuevo = [...servicios]
    nuevo[idx] = { ...nuevo[idx], precio: Math.max(0, Number(val) || 0) }
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
    const label = prompt('Nombre del ítem:')
    if (!label?.trim()) return
    const nuevo = [...servicios]
    nuevo[sIdx] = {
      ...nuevo[sIdx],
      items: [...nuevo[sIdx].items, { label: label.trim(), activo: true }]
    }
    setServicios(nuevo)
  }

  const handleGuardar = async () => {
    setGuardando(true)
    setError(null)
    try {
      // 1. Guardar taller
      const res = await fetch('/api/taller', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:    nombre.trim(),
          whatsapp:  whatsapp.trim(),
          servicios: servicios.map(s => ({
            id:     s.id,
            nombre: s.nombre,
            precio: s.precio,
            items:  s.items,
          })),
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')

      // 2. Setear cookie de sesión
      await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: whatsapp.trim() }),
      })

      avanzar()
    } catch (err) {
      console.error(err)
      setError('No se pudo guardar. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={styles.page}>

      {/* ── P1: Bienvenida ── */}
      {paso === 0 && (
        <div className={styles.pantalla}>
          <div className={styles.bienvenidaCuerpo}>
            <div className={styles.logo918}>918</div>
            <div className={styles.bienvenidaTitulo}>El taller en tu bolsillo</div>
            <div className={styles.bienvenidaDesc}>
              Registrá bicis, mandá presupuestos y notificá a tus clientes desde el celular.
            </div>
          </div>
          <div className={styles.footer}>
            <button className={styles.btnPrimario} onClick={avanzar}>Empezar</button>
          </div>
        </div>
      )}

      {/* ── P2: Datos del taller ── */}
      {paso === 1 && (
        <div className={styles.pantalla}>
          <div className={styles.cuerpo}>
            <div className={styles.stepTag}>1 DE 7</div>
            <div className={styles.titulo}>Tu taller</div>
            <div className={styles.subtitulo}>Cómo se llama y cómo te contactan los clientes.</div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.campo}>
              <label className={styles.label}>Nombre del taller</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Taller El Rodado"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.campo}>
              <label className={styles.label}>WhatsApp del negocio</label>
              <div className={styles.waWrap}>
                <span className={styles.waPrefijo}>+54</span>
                <input
                  className={styles.waInput}
                  type="tel"
                  inputMode="numeric"
                  placeholder="11 5823 4480"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                />
              </div>
              <div className={styles.hint}>Es el número que los clientes usan para contactarte.</div>
            </div>
          </div>
          <div className={styles.footer}>
            <button className={styles.btnPrimario} onClick={handleContinuarDatos}>Continuar →</button>
          </div>
        </div>
      )}

      {/* ── P3: Verificación WhatsApp ── */}
      {paso === 2 && (
        <div className={styles.pantalla}>
          <div className={styles.cuerpo}>
            <div className={styles.stepTag}>2 DE 7</div>
            <div className={styles.titulo}>Verificá tu WhatsApp</div>
            <div className={styles.subtitulo}>
              Te mandamos un código al +54 {whatsapp}.
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.codigoWrap}>
              {codigo.map((c, i) => (
                <input
                  key={i}
                  id={`cod-${i}`}
                  className={styles.codigoInput}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={c}
                  onChange={e => handleCodigoChange(i, e.target.value)}
                />
              ))}
            </div>
            <div className={styles.hint}>¿No llegó? Reenviá en 0:42</div>
            <div className={styles.verificarNota}>
              El agente va a responder en nombre de tu taller. Tenemos que confirmar que el número es tuyo.
            </div>
          </div>
          <div className={styles.footer}>
            <button className={styles.btnSecundario} onClick={retroceder}>← Volver</button>
            <button className={styles.btnPrimario} onClick={handleVerificar}>Verificar</button>
          </div>
        </div>
      )}

      {/* ── P4-P7: Configuración de servicios ── */}
      {paso >= 3 && paso <= 6 && (
        <div className={styles.pantalla}>
          <div className={styles.cuerpo}>
            <div className={styles.stepTag}>SERVICIO {servicioIdx + 1} DE 4</div>
            <div className={styles.titulo}>{servicios[servicioIdx].nombre}</div>
            <div className={styles.subtitulo}>Destildá lo que no ofrecés, ajustá el precio.</div>

            <div className={styles.campo}>
              <label className={styles.label}>Precio</label>
              <div className={styles.precioWrap}>
                <span className={styles.precioPrefijo}>$</span>
                <input
                  className={styles.precioInput}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={servicios[servicioIdx].precio}
                  onChange={e => handlePrecioChange(servicioIdx, e.target.value)}
                />
              </div>
            </div>

            <div className={styles.campo}>
              <label className={styles.label}>Qué incluye</label>
              <div className={styles.itemsList}>
                {servicios[servicioIdx].items.map((item, iIdx) => (
                  <label key={iIdx} className={styles.itemRow}>
                    <input
                      type="checkbox"
                      className={styles.itemCheck}
                      checked={item.activo}
                      onChange={() => handleItemToggle(servicioIdx, iIdx)}
                    />
                    <span className={`${styles.itemLabel} ${!item.activo ? styles.itemDesactivo : ''}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
                <button
                  className={styles.btnAgregarItem}
                  onClick={() => handleAgregarItem(servicioIdx)}
                >
                  + Agregar ítem propio
                </button>
              </div>
            </div>
          </div>
          <div className={styles.footer}>
            <button className={styles.btnSecundario} onClick={retroceder}>← Volver</button>
            {paso < 6 ? (
              <button className={styles.btnPrimario} onClick={avanzar}>Continuar →</button>
            ) : (
              <button className={styles.btnPrimario} onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Finalizar configuración'}
              </button>
            )}
          </div>
          {error && <div className={styles.errorFooter}>{error}</div>}
        </div>
      )}

      {/* ── P8: Listo ── */}
      {paso === 7 && (
        <div className={styles.pantalla}>
          <div className={styles.listoCuerpo}>
            <div className={styles.listoCheck}>✓</div>
            <div className={styles.listoTitulo}>{tallerNombre} está listo</div>
            <div className={styles.listoDesc}>
              El agente ya puede responder consultas por WhatsApp. Registrá tu primera bici para arrancar.
            </div>
            <div className={styles.listoStats}>
              <div className={styles.listoStat}>
                <div className={styles.listoStatNum}>4</div>
                <div className={styles.listoStatLabel}>servicios</div>
              </div>
              <div className={styles.listoStatSep}>·</div>
              <div className={styles.listoStat}>
                <div className={styles.listoStatNum}>✓</div>
                <div className={styles.listoStatLabel}>WA activo</div>
              </div>
            </div>
          </div>
          <div className={styles.footer}>
            <button
              className={styles.btnRegistrar}
              onClick={() => router.push('/kanban')}
            >
              Registrar primera bici →
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
