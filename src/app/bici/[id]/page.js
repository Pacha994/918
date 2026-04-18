'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DetalleBici from '@/app/kanban/DetalleBici'

export default function BiciPage() {
  const { id } = useParams()
  const router  = useRouter()
  const [bici,  setBici]  = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/bicis/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setBici)
      .catch(() => setError(true))
  }, [id])

  if (error) return (
    <div style={{ padding: 24, textAlign: 'center', color: '#fff' }}>
      <p>Bici no encontrada.</p>
      <button
        onClick={() => router.push('/kanban')}
        style={{ marginTop: 16, padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}
      >
        Volver al kanban
      </button>
    </div>
  )

  if (!bici) return (
    <div style={{ padding: 24, color: '#888', textAlign: 'center' }}>
      Cargando...
    </div>
  )

  return (
    <DetalleBici
      bici={bici}
      onClose={() => router.push('/kanban')}
      onAvanzar={async (biciId) => {
        await fetch(`/api/bicis/${biciId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({}),
        })
        router.push('/kanban')
      }}
    />
  )
}
