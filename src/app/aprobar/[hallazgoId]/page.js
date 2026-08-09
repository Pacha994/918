import { Suspense } from 'react'
import AprobarClient from './AprobarClient'

export default function AprobarPage() {
  return (
    <Suspense fallback={null}>
      <AprobarClient />
    </Suspense>
  )
}
