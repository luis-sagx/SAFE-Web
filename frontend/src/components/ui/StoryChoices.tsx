import type { StoryChoice } from '../../hooks/useStoryEngine'

interface StoryChoicesProps {
  choices: StoryChoice[]
  onChoose: (goto: string, label: string) => void
}

/**
 * Decidir no es parte de la ficción: estas opciones viven fuera del marco del
 * dispositivo y usan los tokens del sistema de diseño, no la paleta de la app
 * simulada.
 */
function StoryChoices({ choices, onChoose }: StoryChoicesProps) {
  return (
    <div className="grid gap-2">
      {choices.map((choice, index) => (
        <button
          key={choice.label}
          type="button"
          className="flex min-h-12 w-full items-start gap-3 rounded-lg border border-hairline-strong bg-surface px-4 py-4 text-left text-lg leading-relaxed text-ink transition hover:border-link/50 hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          onClick={() => onChoose(choice.goto, choice.label)}
        >
          <span className="mt-px flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-strong text-base font-semibold text-body">
            {index + 1}
          </span>
          <span>{choice.label}</span>
        </button>
      ))}
    </div>
  )
}

export default StoryChoices
