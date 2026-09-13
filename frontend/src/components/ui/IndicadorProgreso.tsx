interface ProgressIndicatorProps {
  posicion: number;
  total: number;
  titulo: string;
}

export default function ProgressIndicator({
  posicion: position,
  total,
  titulo: title,
}: ProgressIndicatorProps) {
  if (position <= 0 || total <= 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-body">
          {title}
        </p>
        <p className="text-sm font-semibold text-ink tabular-nums">
          {position} de {total}
        </p>
      </div>
      <progress
        className="h-2 w-full overflow-hidden rounded-full bg-muted-soft [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted-soft [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-300"
        value={position}
        max={total}
        aria-label={`Progreso: ${position} de ${total} escenarios completados`}
      />
    </div>
  );
}
