import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import { getYouTubeId, type TrainingVideo } from '../data/videosCapacitacion'

function VideoCapacitacion({ video }: Readonly<{ video: TrainingVideo }>) {
  const [playing, setPlaying] = useState(false)
  const id = video.youtubeUrl ? getYouTubeId(video.youtubeUrl) : null
  let player = (
    <p className="flex size-full items-center justify-center px-6 text-center text-sm font-medium text-muted">
      Video próximamente
    </p>
  )

  if (id) {
    player = playing ? (
      <iframe
        title={video.title}
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        className="size-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    ) : (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="flex size-full flex-col items-center justify-center gap-3 text-link transition hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-link"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-on-primary">
          <Play aria-hidden className="size-5 fill-current" />
        </span>
        <span className="font-medium">Reproducir {video.title}</span>
      </button>
    )
  }

  return (
    <article className="overflow-hidden rounded-lg border border-hairline-strong bg-surface">
      <div className="aspect-video bg-canvas-soft">
        {player}
      </div>

      <div className="p-5">
        <h2 className="text-lg font-semibold text-ink">{video.title}</h2>
        <p className="mt-2 text-base leading-relaxed text-body">{video.description}</p>
        {id && (
          <a
            href={`https://www.youtube.com/watch?v=${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 font-medium text-link underline"
          >
            Abrir en YouTube
            <ExternalLink aria-hidden className="size-4" strokeWidth={1.75} />
          </a>
        )}
      </div>
    </article>
  )
}

export default VideoCapacitacion
