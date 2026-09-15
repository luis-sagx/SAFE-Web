import { TrainersController } from './trainers.controller';

describe('TrainersController', () => {
  const admin = {
    createTrainer: jest.fn(),
    listTrainers: jest.fn(),
    changeTrainerStatus: jest.fn(),
  };
  const controller = new TrainersController(admin as never);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('delegates trainer creation to the administration service', async () => {
    const dto = { nombre: 'Ana', apellido: 'López', email: 'ana@espe.edu.ec' };

    await controller.create(dto);

    expect(admin.createTrainer).toHaveBeenCalledWith(dto);
  });

  it('delegates trainer listing to the administration service', async () => {
    await controller.list();

    expect(admin.listTrainers).toHaveBeenCalledTimes(1);
  });

  it('delegates the trainer status change with the requested value', async () => {
    await controller.changeStatus('trainer-1', { activo: false });

    expect(admin.changeTrainerStatus).toHaveBeenCalledWith('trainer-1', false);
  });
});
