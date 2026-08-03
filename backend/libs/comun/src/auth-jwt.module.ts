import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

/// Configuración del JWT compartida por los dos servicios: `identidad` la usa
/// para firmar, `entrenamiento` solo para verificar. El secreto es el mismo, y
/// es lo único que los acopla — no hay llamadas de red entre ellos.
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // Expiración corta (OWASP Session Management). La sesión de
        // entrenamiento dura minutos, no días.
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '2h') },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class AuthJwtModule {}
