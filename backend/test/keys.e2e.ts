/// Clave PEM de una variable de entorno (guardadas en base64, como en el
/// .env). Las pruebas tienen las cuatro claves; cada servicio desplegado, solo
/// las suyas (docker-compose.yml).
export function envPem(name: string): string {
  return Buffer.from(process.env[name] ?? '', 'base64').toString('utf8');
}
