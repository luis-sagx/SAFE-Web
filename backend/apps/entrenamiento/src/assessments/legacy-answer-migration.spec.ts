import {
  expandLegacyAnswers,
  findParticipantsMissingBaseline,
} from '../../../../prisma/normalized-training-data';

describe('expandLegacyAnswers', () => {
  const questionIdsByVersion = new Map([[1, [1, 2, 3]]]);

  it('convierte el arreglo en respuestas con el ID de pregunta de su versión', () => {
    expect(
      expandLegacyAnswers(1, [2, 0, 3], questionIdsByVersion, 0, 3),
    ).toEqual([
      { questionId: 1, answer: 2 },
      { questionId: 2, answer: 0 },
      { questionId: 3, answer: 3 },
    ]);
  });

  it('rechaza una versión de cuestionario sin mapeo histórico', () => {
    expect(() =>
      expandLegacyAnswers(2, [1], questionIdsByVersion, 0, 3),
    ).toThrow('No existe el mapeo de preguntas para la versión 2.');
  });

  it('rechaza arreglos incompletos o con respuestas fuera de rango', () => {
    expect(() =>
      expandLegacyAnswers(1, [1], questionIdsByVersion, 0, 3),
    ).toThrow('La versión 1 espera 3 respuestas y recibió 1.');
    expect(() =>
      expandLegacyAnswers(1, [1, 5, 0], questionIdsByVersion, 0, 3),
    ).toThrow('La respuesta 2 no es válida para la versión 1.');
  });
});

describe('findParticipantsMissingBaseline', () => {
  it('señala POST o corridas sin PRE aunque la persona tuviera una exención archivada', () => {
    expect(
      findParticipantsMissingBaseline(
        [
          { participantId: 'pre', version: 1, phase: 'PRE' },
          { participantId: 'post', version: 1, phase: 'POST' },
        ],
        ['pre', 'missing-run', 'archived-exemption'],
      ),
    ).toEqual(['archived-exemption', 'missing-run', 'post']);
  });
});
