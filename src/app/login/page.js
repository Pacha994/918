'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import styles          from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [whatsapp, setWhatsapp] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const handleLogin = async () => {
    if (!whatsapp.trim()) { setError('Ingresá tu WhatsApp'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ whatsapp: whatsapp.trim() }),
      })
      if (res.status === 404) { setError('Número no registrado. ¿Ya hiciste el onboarding?'); return }
      if (!res.ok)            { setError('Error al ingresar. Intentá de nuevo.'); return }
      router.push('/kanban')
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleLogin() }

  return (
    <div className={styles.page}>
      <div className={styles.cuerpo}>
        <div className={styles.logo}>918</div>
        <div className={styles.titulo}>Ingresá al taller</div>
        <div className={styles.subtitulo}>Usá el WhatsApp con el que registraste tu taller.</div>

        {error && <div className={styles.error}>{error}</div>}

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
              onKeyDown={handleKey}
              autoFocus
            />
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.btnPrimario}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Ingresando...' : 'Ingresar →'}
        </button>
        <button
          className={styles.btnLink}
          onClick={() => router.push('/onboarding')}
        >
          ¿Taller nuevo? Configurá acá
        </button>
      </div>
    </div>
  )
}
