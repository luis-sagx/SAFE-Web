import type { StoryChoice } from '../../hooks/useStoryEngine'

interface StoryChoicesProps {
  choices: StoryChoice[]
  onChoose: (goto: string, label: string) => void
  // CSS module del escenario que lo usa: cada uno tiene su propia paleta.
  styles: Record<string, string>
}

function StoryChoices({ choices, onChoose, styles }: StoryChoicesProps) {
  return (
    <div className={styles.choices}>
      {choices.map((choice, index) => (
        <button
          key={choice.label}
          type="button"
          className={styles.choice}
          onClick={() => onChoose(choice.goto, choice.label)}
        >
          <span className={styles.n}>{index + 1}</span>
          <span>{choice.label}</span>
        </button>
      ))}
    </div>
  )
}

export default StoryChoices
