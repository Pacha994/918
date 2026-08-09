// Compresión client-side de fotos antes de subirlas como base64. Usa
// canvas + Image, corre solo en el browser ('use client'). Compartida entre
// el registro de bici (paso 2) y el form de hallazgo - antes vivía duplicada
// (bueno, en realidad solo existía acá, hallazgo mandaba la foto cruda sin
// pasar por esto).
export function comprimirFoto(file, maxWidth = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
