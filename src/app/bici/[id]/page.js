'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DetalleBici from '@/app/kanban/DetalleBici'

export default function BiciPage() {
  const { id } = useParams()
  const router = useRouter()
  const [bici, setBici] = useState(null)
  const [error, setError] = useState(null)

  const recargar = async () => {
    const res = await fetch(`/api/bicis/${id}`)
    if (!res.ok) { setError(true); return }
    setBici(await res.json())
  }

  useEffect(() => { recargar() }, [id])

  if (error) return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <p>Bici no encontrada.</p>
      <button onClick={() => router.push('/kanban')}>Volver al kanban</button>
    </div>
  )
  if (!bici) return <div style={{ padding: 24 }}>Cargando...</div>

  return (
    <DetalleBici
      bici={bici}
      onClose={() => router.push('/kanban')}
      onAvanzar={async (biciId) => {
        await fetch(`/api/bicis/${biciId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        router.push('/kanban')
      }}
    />
  )
}
