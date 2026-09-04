interface IndicadorProgresoProps {
  posicion: number;
  total: number;
  titulo: string;
}

export default function IndicadorProgreso({
  posicion,
  total,
  titulo,
}: IndicadorProgresoProps) {
  if (posicion <= 0 || total <= 0) return null;

  const porcentaje = (posicion / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-body">
          {titulo}
        </p>
        <p className="text-sm font-semibold text-ink tabular-nums">
          {posicion} de {total}
        </p>
      </div>
      <div className="h-2 w-full rounded-full bg-muted-soft overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${porcentaje}%` }}
          role="progressbar"
          aria-valuenow={posicion}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Progreso: ${posicion} de ${total} escenarios completados`}
        />
      </div>
    </div>
  );
}
