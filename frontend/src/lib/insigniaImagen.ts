// Convierte un <svg> ya montado en el DOM a un PNG descargable. Sin librería
// nueva: el propio navegador sabe rasterizar un SVG a través de <canvas>
// (serializar → Blob → Image → drawImage → toBlob). Solo sirve para el SVG de
// InsigniaCertificado.tsx, que es puro vector sin referencias externas, así
// que no hay problema de "canvas contaminado" por una imagen de otro origen.
export function svgAPng(svg: SVGSVGElement, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgString = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('El navegador no puede dibujar en canvas.'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)

      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('No se pudo generar la imagen.'))
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo cargar el SVG de la insignia.'))
    }
    img.src = url
  })
}
