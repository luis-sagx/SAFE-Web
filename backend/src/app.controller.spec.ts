import { AppController } from './app.controller';

describe('AppController', () => {
  it('el health check responde ok', () => {
    expect(new AppController().health().status).toBe('ok');
  });
});
