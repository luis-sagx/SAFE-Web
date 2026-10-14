export const SUS_VERSION = 1;

export function scoreSus(answers: number[]): number {
  const adjusted = answers.reduce((total, answer, index) => {
    return total + (index % 2 === 0 ? answer - 1 : 5 - answer);
  }, 0);
  return adjusted * 2.5;
}
