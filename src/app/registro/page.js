'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './registro.module.css'

const SERVICIOS = [
  { id: 'basico',      label: 'Service básico' },
  { id: 'completo',    label: 'Service completo' },
  { id: 'premium',     label: 'Service premium' },
  { id: 'diagnostico', label: 'Solo diagnóstico' },
]

const PROBLEMAS_TAGS = ['frenos', 'cambios', 'cadena', 'rueda pinchada', 'horquilla']

const WA_PREVIEW = {
  lista:     (modelo) => `Hola! Tu ${modelo} ya está lista para retirar. Pasá cuando quieras 🚲`,
  entregada: (modelo) => `Acá tenés el historial completo de todo lo que le hicimos a tu bici: [link]`,
}

export default function RegistroPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)

  // ── Paso 1: Cliente ──
  const [clienteNombre,    setClienteNombre]    = useState('')
  const [clienteWhatsapp,  setClienteWhatsapp]  = useState('')
  const [clienteExistente, setClienteExistente] = useState(null)

  // ── Paso 2: Bici y fotos ──
  const [modelo, setModelo] = useState('')
  const [color,  setColor]  = useState('')
  const [fotos, setFotos] = useState([]) // array de base64
  const fotoRef = useRef(null)

  // ── Paso 3: Motivo ──
  const [tipoServicio,     setTipoServicio]     = useState('')
  const [problemasActivos, setProblemasActivos] = useState([])
  const [notaLibre,        setNotaLibre]        = useState('')

  // ── Global ──
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState(null)

  // ────────────────────────────────────────
  // PASO 1
  // ────────────────────────────────────────
  const handleWhatsappBlur = async () => {
    const wa = clienteWhatsapp.trim()
    if (wa.length < 6) return
    try {
      const res = await fetch(`/api/clientes?whatsapp=${encodeURIComponent(wa)}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.id) {
          setClienteExistente(data)
          setClienteNombre(data.nombre)
        }
      }
    } catch (_) {}
  }

  const handleContinuarP1 = () => {
    if (!clienteNombre.trim())   { setError('El nombre es requerido'); return }
    if (!clienteWhatsapp.trim()) { setError('El WhatsApp es requerido'); return }
    setError(null)
    setPaso(2)
  }

  // ────────────────────────────────────────
  // PASO 2
  // ────────────────────────────────────────
  const handleFoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setFotos(prev => [...prev, ev.target.result])
    }
    reader.readAsDataURL(file)
  }

  const fotosCount = fotos.length

  const handleContinuarP2 = () => {
    if (!modelo.trim()) { setError('El modelo es requerido'); return }
    setError(null)
    setPaso(3)
  }

  // ────────────────────────────────────────
  // PASO 3
  // ────────────────────────────────────────
  const toggleProblema = (tag) => {
    setProblemasActivos(prev =>
      prev.includes(tag) ? prev.filter(p => p !== tag) : [...prev, tag]
    )
  }

  const handleContinuarP3 = () => {
    if (!tipoServicio) { setError('Seleccioná un tipo de servicio'); return }
    setError(null)
    setPaso(4)
  }

  // ────────────────────────────────────────
  // PASO 4: Guardar
  // ────────────────────────────────────────
  const handleRegistrar = async () => {
    setGuardando(true)
    setError(null)
    try {
      const fotosArray = fotos.map((url, i) => ({ angulo: `foto-${i + 1}`, url }))

      const res = await fetch('/api/bicis', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            nombre:   clienteNombre.trim(),
            whatsapp: clienteWhatsapp.trim(),
          },
          bici: {
            modelo:       modelo.trim(),
            color:        color.trim() || null,
            tipoServicio: tipoServicio || null,
            problemas:    problemasActivos,
            notas:        notaLibre.trim() || null,
          },
          fotos: fotosArray,
        }),
      })

      if (!res.ok) throw new Error('Error al registrar')
      router.push('/kanban')
    } catch (err) {
      console.error(err)
      setError('No se pudo registrar. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  // ────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.btnBack}
          onClick={() => paso > 1 ? (setError(null), setPaso(p => p - 1)) : router.push('/kanban')}
        >
          ←
        </button>
        <span className={styles.headerTitle}>Nueva bici</span>
        <span className={styles.headerStep}>{paso} / 4</span>
      </div>

      <div className={styles.body}>

        {error && <div className={styles.banner}>{error}</div>}

        {/* ── PASO 1: Cliente ── */}
        {paso === 1 && (
          <div className={styles.paso}>
            <div className={styles.seccionLabel}>Datos del cliente</div>

            <div className={styles.campo}>
              <label className={styles.campoLabel}>WhatsApp</label>
              <div className={styles.waWrap}>
                <span className={styles.waPrefijo}>+54</span>
                <input
                  className={styles.waInput}
                  type="tel"
                  inputMode="numeric"
                  placeholder="11 5823 4480"
                  value={clienteWhatsapp}
                  onChange={e => { setClienteWhatsapp(e.target.value); setClienteExistente(null) }}
                  onBlur={handleWhatsappBlur}
                />
              </div>
              <div className={styles.hint}>Se usa para notificaciones automáticas.</div>
            </div>

            {clienteExistente && (
              <div className={styles.clienteEncontrado}>
                <span className={styles.clienteEncontradoDot} />
                <div className={styles.clienteEncontradoInfo}>
                  <div className={styles.clienteEncontradoNombre}>{clienteExistente.nombre}</div>
                  <div className={styles.clienteEncontradoMeta}>Cliente encontrado · sus datos ya están cargados.</div>
                </div>
                <span className={styles.badgeRecurrente}>recurrente</span>
              </div>
            )}

            <div className={styles.campo}>
              <label className={styles.campoLabel}>Nombre</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Nombre del cliente"
                value={clienteNombre}
                onChange={e => setClienteNombre(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── PASO 2: Bici y fotos ── */}
        {paso === 2 && (
          <div className={styles.paso}>

            <div className={styles.seccionLabel}>Fotos de recepción</div>
            <input
              ref={fotoRef}
              type="file"
              accept="image/*"
              capture="environment"
              className={styles.fotoInputHidden}
              onChange={handleFoto}
            />
            <div className={styles.fotosWrap}>
              {fotos.map((src, i) => (
                <img key={i} src={src} alt="" className={styles.fotoThumb} />
              ))}
              <button
                className={styles.fotoBtnSacar}
                onClick={() => fotoRef.current?.click()}
              >
                <span className={styles.fotoCamara}>📷</span>
                <span className={styles.fotoLabel}>
                  {fotosCount === 0 ? 'Sacar foto' : '+ Otra'}
                </span>
              </button>
            </div>
            {fotosCount > 0 && (
              <div className={styles.hint}>{fotosCount} foto{fotosCount > 1 ? 's' : ''} tomada{fotosCount > 1 ? 's' : ''}.</div>
            )}

            <div className={styles.seccionLabel} style={{ marginTop: 24 }}>Modelo</div>
            <div className={styles.campo}>
              <input
                className={styles.input}
                type="text"
                placeholder="Trek Marlin 7, Specialized Rockhopper…"
                value={modelo}
                onChange={e => setModelo(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className={styles.campo}>
              <label className={styles.campoLabel}>Color</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Negro, Azul mate…"
                value={color}
                onChange={e => setColor(e.target.value)}
              />
            </div>

          </div>
        )}

        {/* ── PASO 3: Motivo ── */}
        {paso === 3 && (
          <div className={styles.paso}>

            <div className={styles.seccionLabel}>Tipo de servicio</div>
            <div className={styles.serviciosGrid}>
              {SERVICIOS.map(s => (
                <button
                  key={s.id}
                  className={`${styles.servicioBtn} ${tipoServicio === s.id ? styles.servicioBtnActivo : ''}`}
                  onClick={() => setTipoServicio(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className={styles.seccionLabel} style={{ marginTop: 24 }}>Problema puntual</div>
            <div className={styles.tagsWrap}>
              {PROBLEMAS_TAGS.map(tag => (
                <button
                  key={tag}
                  className={`${styles.tag} ${problemasActivos.includes(tag) ? styles.tagActivo : ''}`}
                  onClick={() => toggleProblema(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className={styles.campo} style={{ marginTop: 20 }}>
              <label className={styles.campoLabel}>— o describilo con tus palabras —</label>
              <textarea
                className={styles.textarea}
                placeholder="Ej: el freno trasero no agarra bien…"
                value={notaLibre}
                onChange={e => setNotaLibre(e.target.value)}
                rows={3}
              />
            </div>

          </div>
        )}

        {/* ── PASO 4: Confirmación ── */}
        {paso === 4 && (
          <div className={styles.paso}>

            <div className={styles.seccionLabel}>Resumen</div>
            <div className={styles.resumenCard}>
              <div className={styles.resumenFila}>
                <span className={styles.resumenKey}>Cliente</span>
                <div className={styles.resumenValWrap}>
                  <span className={styles.resumenVal}>{clienteNombre}</span>
                  {clienteExistente && <span className={styles.badgeRecurrente}>recurrente</span>}
                </div>
              </div>
              <div className={styles.resumenFila}>
                <span className={styles.resumenKey}>WhatsApp</span>
                <span className={styles.resumenVal}>+54 {clienteWhatsapp}</span>
              </div>
              <div className={styles.resumenFila}>
                <span className={styles.resumenKey}>Bici</span>
                <span className={styles.resumenVal}>{modelo}{color ? ` · ${color}` : ''}</span>
              </div>
              <div className={styles.resumenFila}>
                <span className={styles.resumenKey}>Servicio</span>
                <span className={styles.resumenVal}>
                  {SERVICIOS.find(s => s.id === tipoServicio)?.label || '—'}
                  {problemasActivos.length > 0 && ` · ${problemasActivos.join(', ')}`}
                </span>
              </div>
              {fotosCount > 0 && (
                <div className={styles.resumenFila}>
                  <span className={styles.resumenKey}>Fotos</span>
                  <span className={styles.resumenVal}>{fotosCount} tomadas</span>
                </div>
              )}
            </div>

            <div className={styles.seccionLabel} style={{ marginTop: 24 }}>WhatsApp automáticos</div>
            <div className={styles.waPreviewCard}>
              <div className={styles.waPreviewLabel}>Al mover a "Lista"</div>
              <div className={styles.waPreviewMsg}>{WA_PREVIEW.lista(modelo)}</div>
            </div>
            <div className={styles.waPreviewCard} style={{ marginTop: 8 }}>
              <div className={styles.waPreviewLabel}>Al entregar</div>
              <div className={styles.waPreviewMsg}>{WA_PREVIEW.entregada(modelo)}</div>
            </div>

          </div>
        )}

      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {paso === 1 && (
          <button className={styles.btnPrimario} onClick={handleContinuarP1}>
            Continuar →
          </button>
        )}
        {paso === 2 && (
          <>
            <button className={styles.btnSecundario} onClick={() => { setError(null); setPaso(3) }}>
              Saltar
            </button>
            <button className={styles.btnPrimario} onClick={handleContinuarP2}>
              Continuar →
            </button>
          </>
        )}
        {paso === 3 && (
          <>
            <button className={styles.btnSecundario} onClick={() => { setError(null); setPaso(4) }}>
              Omitir
            </button>
            <button className={styles.btnPrimario} onClick={handleContinuarP3}>
              Continuar →
            </button>
          </>
        )}
        {paso === 4 && (
          <>
            <button className={styles.btnSecundario} onClick={() => { setError(null); setPaso(3) }}>
              Editar
            </button>
            <button
              className={styles.btnPrimario}
              onClick={handleRegistrar}
              disabled={guardando}
            >
              {guardando ? 'Registrando…' : 'Registrar bici ✓'}
            </button>
          </>
        )}
      </div>

    </div>
  )
}
