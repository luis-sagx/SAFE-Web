import type { JwtPayload } from '@comun';
import { AdminGuard, JwtAuthGuard, ParticipantGuard } from '@comun';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { SusController } from './sus.controller';
import { SusService } from './sus.service';
import type { CreateSusResponseDto } from './create-sus-response.dto';
import { SUS_VERSION } from './sus-survey';

describe('SusController', () => {
  const participant: JwtPayload = {
    sub: 'jwt-participant-id',
    seq: 77,
    role: 'PARTICIPANT',
    typ: 'access',
  };
  const service = {
    status: jest.fn(),
    create: jest.fn(),
    results: jest.fn(),
  };
  const controller = new SusController(service as unknown as SusService);

  beforeEach(() => jest.clearAllMocks());

  it('protege rutas propias y administrativas con sus roles', () => {
    const statusHandler = Object.getOwnPropertyDescriptor(
      SusController.prototype,
      'status',
    )?.value as object;
    const createHandler = Object.getOwnPropertyDescriptor(
      SusController.prototype,
      'create',
    )?.value as object;
    const resultsHandler = Object.getOwnPropertyDescriptor(
      SusController.prototype,
      'results',
    )?.value as object;
    expect(Reflect.getMetadata(GUARDS_METADATA, SusController)).toContain(
      JwtAuthGuard,
    );
    expect(Reflect.getMetadata(GUARDS_METADATA, statusHandler)).toContain(
      ParticipantGuard,
    );
    expect(Reflect.getMetadata(GUARDS_METADATA, createHandler)).toContain(
      ParticipantGuard,
    );
    expect(Reflect.getMetadata(GUARDS_METADATA, resultsHandler)).toContain(
      AdminGuard,
    );
  });

  it('consulta el estado con el id del participante autenticado', async () => {
    const expected = {
      version: SUS_VERSION,
      available: true,
      completed: false,
    };
    service.status.mockResolvedValue(expected);

    await expect(controller.status(participant)).resolves.toEqual(expected);
    expect(service.status).toHaveBeenCalledWith('jwt-participant-id');
  });

  it('envía las respuestas junto con el participante del JWT', async () => {
    const dto = {
      version: SUS_VERSION,
      answers: [3, 2, 4, 1, 5, 1, 4, 2, 5, 1],
    } satisfies CreateSusResponseDto;
    const expected = { version: SUS_VERSION, available: true, completed: true };
    service.create.mockResolvedValue(expected);

    await expect(controller.create(participant, dto)).resolves.toEqual(
      expected,
    );
    expect(service.create).toHaveBeenCalledWith(participant, dto);
  });

  it('delega resultados administrativos al servicio', async () => {
    const expected = [
      { pseudonym: 'P077', version: SUS_VERSION, answers: [3, 2], score: 85 },
    ];
    service.results.mockResolvedValue(expected);

    await expect(controller.results()).resolves.toEqual(expected);
    expect(service.results).toHaveBeenCalledTimes(1);
  });
});
