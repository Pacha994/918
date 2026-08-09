'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './registro.module.css'
import { comprimirFoto } from '@/lib/comprimirFoto'

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

// Compartido entre paso 1 y paso 2 - mismo estado/handler en los dos
// lugares. Vive en paso 1 (al lado de nombre/whatsapp) y sigue disponible
// en paso 2 por si el mecánico se lo salteó al principio.
function CampoIdTag({ value, onChange, onBlur, estado, metaTexto }) {
  return (
    <>
      <div className={styles.seccionLabel}>IDtag 918TAG (opcional)</div>
      <div className={styles.campo}>
        <input
          className={styles.input}
          type="text"
          placeholder="T3-0994-5T"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete="off"
        />
      </div>
      {estado === 'buscando' && (
        <div className={styles.hint}>Buscando en 918TAG…</div>
      )}
      {estado === 'encontrado' && (
        <div className={styles.clienteEncontrado}>
          <span className={styles.clienteEncontradoDot} />
          <div className={styles.clienteEncontradoInfo}>
            <div className={styles.clienteEncontradoNombre}>Bici encontrada</div>
            <div className={styles.clienteEncontradoMeta}>{metaTexto}</div>
          </div>
        </div>
      )}
      {estado === 'no-encontrado' && (
        <div className={styles.hint}>No encontrado en 918TAG · cargá los datos manualmente.</div>
      )}
    </>
  )
}

export default function RegistroPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)

  // ── Paso 1: Cliente ──
  const [clienteNombre,    setClienteNombre]    = useState('')
  const [clienteWhatsapp,  setClienteWhatsapp]  = useState('')
  const [clienteExistente, setClienteExistente] = useState(null)

  // IDtag 918TAG (opcional) — vive principalmente en el paso 1, pero el
  // campo también se renderiza en el paso 2 por si se lo saltearon acá.
  // Comparte este mismo estado en los dos lugares: autocompleta
  // marca/modelo/año/color/fotos (estado del paso 2) apenas resuelve,
  // esté el mecánico en el paso que esté.
  const [idTag918,    setIdTag918]    = useState('')
  const [idTagEstado, setIdTagEstado] = useState('idle') // idle | buscando | encontrado | no-encontrado

  // ── Paso 2: Bici y fotos ──
  const [marca,  setMarca]  = useState('')
  const [modelo, setModelo] = useState('')
  const [anio,   setAnio]   = useState('')
  const [color,  setColor]  = useState('')
  const [fotos, setFotos] = useState([]) // array de base64 comprimidos
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
  const handleFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await comprimirFoto(file)
      setFotos(prev => [...prev, dataUrl])
    } catch (err) {
      console.error('Error comprimiendo foto:', err)
    }
    // reset input para poder sacar otra del mismo archivo
    e.target.value = ''
  }

  const handleQuitarFoto = (idx) => {
    setFotos(prev => prev.filter((_, i) => i !== idx))
  }

  const fotosCount = fotos.length

  // Mismo patrón que handleWhatsappBlur del paso 1: fetch en el onBlur.
  // Este pasa por descarga+recompresión de fotos del lado del proxy, tarda
  // más que el de WhatsApp (de ahí el estado "buscando" con indicador propio).
  const handleIdTagBlur = async () => {
    const tag = idTag918.trim().toUpperCase()
    if (!tag) { setIdTagEstado('idle'); return }
    setIdTagEstado('buscando')
    try {
      const res = await fetch(`/api/tagmaker/${encodeURIComponent(tag)}`)
      if (!res.ok) { setIdTagEstado('no-encontrado'); return }
      const data = await res.json()

      setMarca(data.brand || '')
      setModelo(data.model || '')
      setAnio(data.year != null ? String(data.year) : '')
      setColor(data.color || '')
      if (Array.isArray(data.photos) && data.photos.length > 0) {
        setFotos(prev => [...prev, ...data.photos])
      }
      setIdTagEstado('encontrado')
    } catch (_) {
      setIdTagEstado('no-encontrado')
    }
  }

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
            marca:        marca.trim() || null,
            anio:         anio.trim() ? Number(anio.trim()) : null,
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

            <div style={{ marginTop: 24 }}>
              <CampoIdTag
                value={idTag918}
                onChange={e => { setIdTag918(e.target.value); setIdTagEstado('idle') }}
                onBlur={handleIdTagBlur}
                estado={idTagEstado}
                metaTexto="Bici encontrada · datos precargados."
              />
            </div>
          </div>
        )}

        {/* ── PASO 2: Bici y fotos ── */}
        {paso === 2 && (
          <div className={styles.paso}>

            <CampoIdTag
              value={idTag918}
              onChange={e => { setIdTag918(e.target.value); setIdTagEstado('idle') }}
              onBlur={handleIdTagBlur}
              estado={idTagEstado}
              metaTexto="Datos precargados · revisalos y corregí lo que haga falta."
            />

            <div className={styles.seccionLabel} style={{ marginTop: 24 }}>Fotos de recepción</div>
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
                <div key={i} className={styles.fotoItem}>
                  <img src={src} alt="" className={styles.fotoThumb} />
                  <button
                    type="button"
                    className={styles.fotoBtnQuitar}
                    onClick={() => handleQuitarFoto(i)}
                    aria-label="Quitar foto"
                  >
                    ×
                  </button>
                </div>
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
              <div className={styles.hint}>{fotosCount} foto{fotosCount > 1 ? 's' : ''} cargada{fotosCount > 1 ? 's' : ''}.</div>
            )}

            <div className={styles.seccionLabel} style={{ marginTop: 24 }}>Marca</div>
            <div className={styles.campo}>
              <input
                className={styles.input}
                type="text"
                placeholder="Trek, Specialized, Teknial…"
                value={marca}
                onChange={e => setMarca(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className={styles.seccionLabel}>Modelo</div>
            <div className={styles.campo}>
              <input
                className={styles.input}
                type="text"
                placeholder="Marlin 7, Rockhopper, Tarpan 400ER…"
                value={modelo}
                onChange={e => setModelo(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className={styles.campo}>
              <label className={styles.campoLabel}>Año</label>
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                placeholder="2022"
                value={anio}
                onChange={e => setAnio(e.target.value.replace(/\D/g, '').slice(0, 4))}
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
                <span className={styles.resumenVal}>
                  {[marca, modelo].filter(Boolean).join(' ')}
                  {anio ? ` (${anio})` : ''}
                  {color ? ` · ${color}` : ''}
                </span>
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

            <div className={styles.seccionLabel} style={{ marginTop: 24 }}>
              WhatsApp automáticos
              <span className={styles.previewBadge}>(preview, no se envían aún)</span>
            </div>
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
            <button className={styles.btnSecundario} onClick={() => { setError(null); setPaso(1) }}>
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
