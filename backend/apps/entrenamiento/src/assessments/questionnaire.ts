import questionnaire from './questionnaire.v1.json';

export const ASSESSMENT_VERSION = questionnaire.version;
export const CONSENT_VERSION = questionnaire.consentVersion;
export const AGE_RANGES = questionnaire.ageRanges;
export const GENDERS = questionnaire.genders;

export const QUESTIONNAIRE = {
  version: ASSESSMENT_VERSION,
  ageRanges: AGE_RANGES,
  genders: GENDERS,
  questions: questionnaire.items.map((item, index) => ({
    id: index + 1,
    prompt: item.prompt,
    options: item.options,
  })),
};

export function scoreAssessment(answers: number[]): number {
  return answers.reduce(
    (score, answer, index) =>
      score + Number(answer === questionnaire.answerKey[index]),
    0,
  );
}
