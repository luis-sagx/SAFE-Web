// El "documento fuente" del que el participante puede copiar y pegar (issue
// #184): una ventana con pinta de bloc de notas de escritorio, siempre
// visible junto al celular. El texto es texto real del DOM,nunca
// `dangerouslySetInnerHTML`, porque el Ctrl+C del participante tiene que
// funcionar de verdad: si fuera una imagen o HTML simulado no habría nada
// que copiar.
interface BlocNotasProps {
  texto: string
  titulo?: string
}

function BlocNotas({ texto, titulo = 'Notas.txt, Bloc de notas' }: BlocNotasProps) {
  return (
    <div className="overflow-hidden rounded-md border border-hairline-strong bg-surface shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-hairline-strong bg-canvas-soft px-3 py-1.5">
        <span className="size-2.5 rounded-full bg-danger/70" aria-hidden />
        <span className="size-2.5 rounded-full bg-warning/70" aria-hidden />
        <span className="size-2.5 rounded-full bg-success/70" aria-hidden />
        <span className="ml-1.5 truncate text-xs font-medium text-muted">{titulo}</span>
      </div>
      <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap px-3 py-2.5 font-mono text-sm leading-relaxed text-ink select-text">
        {texto}
      </pre>
    </div>
  )
}

export default BlocNotas
