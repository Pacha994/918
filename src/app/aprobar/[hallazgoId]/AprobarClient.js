'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import styles from './aprobar.module.css'

function formatFecha(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AprobarClient() {
  const { hallazgoId } = useParams()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null)

  const cargar = async () => {
    try {
      const res = await fetch(`/api/aprobar/${hallazgoId}?token=${encodeURIComponent(token || '')}`)
      const json = await res.json()
      setData(json)
    } catch (_) {
      setData({ estado: 'invalido' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hallazgoId, token])

  const handleDecision = async (decision) => {
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const res = await fetch(`/api/aprobar/${hallazgoId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, decision }),
      })
      await res.json()
      // Tanto si se aplicó como si no (alguien más lo resolvió primero,
      // o venció justo en el medio) recargamos el estado real - la
      // respuesta del PATCH no es la fuente de verdad, lo es el GET.
      await cargar()
    } catch (_) {
      setErrorEnvio('No se pudo enviar. Probá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.marca}>918</div>
      <div className={styles.card}>

        {cargando && (
          <div className={styles.estado}>Cargando…</div>
        )}

        {!cargando && data?.estado === 'invalido' && (
          <div className={styles.estado}>
            <div className={styles.estadoTitulo}>Este link no es válido</div>
          </div>
        )}

        {!cargando && data?.estado === 'vencido' && (
          <div className={styles.estado}>
            <div className={styles.estadoTitulo}>Este link venció</div>
            Pedile al taller que te mande uno nuevo.
          </div>
        )}

        {!cargando && data?.estado === 'resuelto' && (
          <div className={styles.estado}>
            <span className={`${styles.badgeResuelto} ${data.decision === 'aprobado' ? styles.badgeAprobado : styles.badgeRechazado}`}>
              {data.decision === 'aprobado' ? 'Aprobado' : 'Rechazado'}
            </span>
            <div className={styles.estadoTitulo}>{data.descripcion}</div>
            Resuelto el {formatFecha(data.fecha)}.
          </div>
        )}

        {!cargando && data?.estado === 'pendiente' && (
          <>
            <div className={styles.seccionLabel}>Hallazgo encontrado en tu bici</div>
            {data.fotoUrl && (
              <img src={data.fotoUrl} alt="" className={styles.foto} />
            )}
            <div className={styles.descripcion}>{data.descripcion}</div>
            <div className={styles.precioWrap}>
              <span className={styles.precioLabel}>Costo estimado</span>
              <span className={styles.precioVal}>${data.precio}</span>
            </div>
            <div className={styles.acciones}>
              <button
                className={styles.btnRechazar}
                onClick={() => handleDecision('rechazado')}
                disabled={enviando}
              >
                Rechazar
              </button>
              <button
                className={styles.btnAprobar}
                onClick={() => handleDecision('aprobado')}
                disabled={enviando}
              >
                {enviando ? 'Enviando…' : 'Aprobar'}
              </button>
            </div>
            {errorEnvio && <div className={styles.error}>{errorEnvio}</div>}
          </>
        )}

      </div>
    </div>
  )
}
