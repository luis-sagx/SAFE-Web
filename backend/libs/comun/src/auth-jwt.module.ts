import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JWT_ALGORITHM, readPemKey } from './jwt-keys';

/// Configuración del JWT de sesión (access y refresh) compartida por los dos
/// servicios. Ambos verifican con la clave pública de `identidad`; solo
/// `identidad` recibe la privada (docker-compose.yml), así que
/// `entrenamiento` puede verificar sesiones pero nunca emitirlas. No hay
/// llamadas de red entre ellos.
///
/// La atestación del certificado va al revés y con otro par de claves: la
/// firma `entrenamiento` (runs.service.ts) y la verifica `identidad`
/// (certificados.service.ts), pasando la clave en cada llamada.
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        publicKey: readPemKey(config, 'IDENTIDAD_JWT_PUBLIC_KEY'),
        privateKey: config.get<string>('IDENTIDAD_JWT_PRIVATE_KEY')
          ? readPemKey(config, 'IDENTIDAD_JWT_PRIVATE_KEY')
          : undefined,
        // Expiración corta (OWASP Session Management). La sesión de
        // entrenamiento dura minutos, no días.
        signOptions: {
          algorithm: JWT_ALGORITHM,
          expiresIn: config.get('JWT_EXPIRES_IN', '2h'),
        },
        // Fijar el algoritmo cierra la confusión de algoritmos: un token con
        // `alg: none` o HS256 firmado con la clave pública se rechaza.
        verifyOptions: { algorithms: [JWT_ALGORITHM] },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class AuthJwtModule {}
