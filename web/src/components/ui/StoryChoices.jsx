/**
 * Lista de opciones de un nodo STORY. `styles` es el CSS module del
 * escenario que lo usa (CambioNumero o LlamadaAntiestafas): cada uno tiene
 * su propia paleta, así que este componente solo aporta la estructura.
 */
function StoryChoices({ choices, onChoose, styles }) {
  return (
    <div className={styles.choices}>
      {choices.map((choice, index) => (
        <button
          key={choice.label}
          type="button"
          className={styles.choice}
          onClick={() => onChoose(choice.goto)}
        >
          <span className={styles.n}>{index + 1}</span>
          <span>{choice.label}</span>
        </button>
      ))}
    </div>
  )
}

export default StoryChoices
