import { ForbiddenException, type ExecutionContext } from '@nestjs/common'
import { AdminGuard, ParticipantGuard } from './jwt-auth.guard'

function contextWithRole(role: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ participant: { role } }) }),
  } as unknown as ExecutionContext
}

describe('guards de rol', () => {
  it('permite a ADMIN y rechaza los demás roles para administración', () => {
    const guard = new AdminGuard()

    expect(guard.canActivate(contextWithRole('ADMIN'))).toBe(true)
    expect(() => guard.canActivate(contextWithRole('TRAINER'))).toThrow(ForbiddenException)
    expect(() => guard.canActivate(contextWithRole('PARTICIPANT'))).toThrow(ForbiddenException)
  })

  it('permite solo a PARTICIPANT registrar progreso y certificado', () => {
    const guard = new ParticipantGuard()

    expect(guard.canActivate(contextWithRole('PARTICIPANT'))).toBe(true)
    expect(() => guard.canActivate(contextWithRole('TRAINER'))).toThrow(ForbiddenException)
    expect(() => guard.canActivate(contextWithRole('ADMIN'))).toThrow(ForbiddenException)
  })
})
