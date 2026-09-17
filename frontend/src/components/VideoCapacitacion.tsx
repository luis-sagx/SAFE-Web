import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import Ticket, { Notches, Sello } from './Boleto'
import { getYouTubeId, type TrainingVideo } from '../data/videosCapacitacion'

interface VideoTicketProps {
  video: TrainingVideo
  /** Folio impreso en el talón: GEN-00 para el general, MOD-01…MOD-07. */
  folio: string
  /** Dónde ocurre la amenaza del módulo, tal como lo dice el catálogo. */
  etiqueta?: string
  /** La fila lleva muescas en su perforación salvo la primera de la tira. */
  conMuescas?: boolean
  /** 'boleto': un boleto entero con su ventana de reproductor, para el video
   *  general. 'fila': un talón dentro de la tira de módulos, siete boletos
   *  sueltos del mismo alto volvían a ser el muro de tarjetas. */
  variante?: 'boleto' | 'fila'
}

/** Sello de lo que todavía no se ha grabado. Ningún video existe aún. */
function PendingStamp() {
  return <Sello>Sin grabar</Sello>
}

function YouTubeLink({ id }: Readonly<{ id: string }>) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-1.5 text-base font-medium text-link underline"
    >
      Abrir en YouTube
      <ExternalLink aria-hidden className="size-4" strokeWidth={1.75} />
    </a>
  )
}

function VideoTicket({
  video,
  folio,
  etiqueta: label,
  conMuescas: notched = false,
  variante: variant = 'boleto',
}: Readonly<VideoTicketProps>) {
  const [playing, setPlaying] = useState(false)
  const id = video.youtubeUrl ? getYouTubeId(video.youtubeUrl) : null

  const player = id && (
    <iframe
      title={video.title}
      src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
      className="size-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  )

  const close = (
    <button
      type="button"
      onClick={() => setPlaying(false)}
      aria-label={`Cerrar ${video.title}`}
      className="min-h-11 rounded-md px-3 text-base font-medium text-link underline transition hover:bg-ticket-edge/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
    >
      Cerrar
    </button>
  )

  const play = (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      // El nombre visible dice solo "Reproducir": en una página con ocho
      // videos, el lector de pantalla necesita saber cuál.
      aria-label={`Reproducir ${video.title}`}
      className="group inline-flex min-h-11 items-center gap-3 text-base font-medium text-ink transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition group-hover:bg-primary-active">
        <Play aria-hidden className="size-5 fill-current" />
      </span>
      <span className="underline-offset-4 group-hover:underline">Reproducir</span>
    </button>
  )

  const heading = (
    <>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-sm uppercase tracking-[0.14em] text-muted">
        <span className="text-ink">{folio}</span>
        {label && <span>{label}</span>}
      </p>
      <h3 className="mt-2 font-display text-2xl uppercase tracking-[0.02em] text-ink sm:text-3xl">
        {video.title}
      </h3>
      <p className="mt-2 max-w-prose text-base leading-relaxed text-body">{video.description}</p>
    </>
  )

  if (variant === 'fila') {
    return (
      <li className={`relative ${notched ? 'border-t border-dashed border-ticket-edge' : ''}`}>
        {notched && <Notches className="-top-2.5" />}
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0">{heading}</div>
          <div className="shrink-0">
            {!id && <PendingStamp />}
            {id && (playing ? close : play)}
          </div>
        </div>

        {/* Dentro de la tira el reproductor va con margen: a sangre tapaba el
            filete impreso del boleto y la fila dejaba de parecer papel. */}
        {playing && (
          <div className="mx-6 mb-6 aspect-video overflow-hidden rounded-md border border-ticket-edge bg-canvas-soft">
            {player}
          </div>
        )}
      </li>
    )
  }

  return (
    <Ticket
      className="overflow-hidden"
      talon={
        <div className="p-6 sm:p-8">
          {heading}
          {id && (
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              {playing && close}
              <YouTubeLink id={id} />
            </div>
          )}
        </div>
      }
    >
      {/* Con video, el cuerpo del boleto es su ventana. La portada del video
          la dibuja el propio boleto,trama de seguridad y botón, en vez de
          pedirle la miniatura a YouTube: así nadie contacta a Google hasta
          que la persona decide reproducir. */}
      {id && playing && <div className="aspect-video w-full bg-canvas-soft">{player}</div>}

      {id && !playing && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Reproducir ${video.title}`}
          className="group relative flex aspect-video w-full items-center justify-center overflow-hidden bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-link"
        >
          {/* Trama de seguridad debajo: es lo que se ve si la miniatura no
              llega (red caída, CSP de otro despliegue), en vez de un hueco. */}
          <span aria-hidden className="trama-boleto absolute inset-0 opacity-40" />
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-primary text-on-primary transition group-hover:bg-primary-active">
            <Play aria-hidden className="size-7 fill-current" />
          </span>
        </button>
      )}

      {!id && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <PendingStamp />
          <span className="text-base text-body">Este video se publica pronto.</span>
        </div>
      )}

    </Ticket>
  )
}

export default VideoTicket
