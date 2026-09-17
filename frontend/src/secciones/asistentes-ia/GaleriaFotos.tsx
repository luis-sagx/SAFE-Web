import type { LucideIcon } from 'lucide-react'

export interface GalleryPhoto {
  id: string
  nombre: string
  /** Lo que se ve en la foto. Nunca hay una imagen real: la tarjeta la describe. */
  detalle: string
  Icono: LucideIcon
}

// Panel lateral con las fotos del celular. Cada tarjeta se arrastra al chat
// (dataTransfer 'text/plain' = id, lo lee DeviceScreen al soltar); quien no
// pueda arrastrar usa el clip del chat, que ofrece los mismos archivos.
function PhotoGallery({ fotos }: { fotos: GalleryPhoto[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-hairline-strong bg-surface shadow-sm">
      <div className="border-b border-hairline-strong bg-canvas-soft px-3 py-1.5 text-xs font-medium text-muted">
        Galería · Fotos
      </div>
      <ul className="grid gap-2 p-2.5">
        {fotos.map(({ id, nombre, detalle, Icono }) => (
          <li
            key={id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', id)
              event.dataTransfer.effectAllowed = 'copy'
            }}
            className="flex cursor-grab items-center gap-3 rounded-md border border-hairline-strong bg-canvas-soft p-2.5 active:cursor-grabbing"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded bg-hairline-strong/40 text-muted" aria-hidden>
              <Icono className="size-7" strokeWidth={1.5} />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-mono text-sm text-ink">{nombre}</span>
              <span className="block text-sm leading-snug text-muted">{detalle}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PhotoGallery
