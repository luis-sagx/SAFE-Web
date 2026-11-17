# Despliegue del modelo normalizado

SAFE-Web separa las migraciones de expansión de las migraciones destructivas
de corte. El arranque de cada API aplica sus cambios compatibles, copia y
verifica los datos con su propia URL de base y solo intenta retirar columnas o
tablas legacy cuando el migrador informa que el corte es seguro. Identidad y
entrenamiento siguen usando bases y roles separados.

## Base nueva o vacía

Con las variables de entorno configuradas en `.env`, ejecutar:

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 identidad entrenamiento
```

El arranque aplica expansión, backfill vacío y corte en ese orden. En reinicios
posteriores detecta la migración de corte aplicada y omite los migradores que
leen tablas legacy.

## Base expandida con una migración de corte fallida

No ejecutar repetidamente `docker compose up` mientras Prisma registre una
migración fallida. El orquestador se detiene antes de modificarla y nunca
resuelve automáticamente su estado.

1. Detener solo las APIs, manteniendo Postgres arriba:

   ```sh
   docker compose stop identidad entrenamiento
   ```

2. Verificar que los dos dumps previos existen, tienen permisos privados y
   pasan `pg_restore --list`. En la máquina donde se hizo el respaldo inicial
   quedaron en `/home/luissagnay/.local/state/safe-web/backups/`; comparar sus
   SHA-256 con los registrados en `odd/tasks/normalize-database-model.md`.
   Restaurar ambos dumps en PostgreSQL aislado y comparar los conteos de
   `Participant`, `Certificate`, `Assessment`, `AssessmentBaselineExemption`,
   `SusResponse` y `ScenarioRun` con el origen antes de continuar.

3. En la base activa, confirmar que ambos `migration_name` fallidos tienen
   `finished_at IS NULL` y `rolled_back_at IS NULL`, y que siguen presentes las
   tablas/columnas legacy. Las migraciones de corte contienen `BEGIN` y solo
   eliminan datos/columnas tras superar sus guardas; si el estado no coincide,
   detenerse y restaurar/diagnosticar desde el dump, sin marcar la migración.

4. Solo después de confirmar el rollback transaccional y validar la copia,
   marcar explícitamente cada intento fallido como revertido para permitir el
   reintento. Ejecutar con la configuración de cutover del servicio:

   ```sh
   docker compose run --rm --no-deps --entrypoint node_modules/.bin/prisma identidad \
     migrate resolve --rolled-back 20261116210000_normalized_identity_retire_legacy \
     --config prisma.identidad.cutover.config.ts
   docker compose run --rm --no-deps --entrypoint node_modules/.bin/prisma entrenamiento \
     migrate resolve --rolled-back 20261116211000_normalized_training_retire_legacy \
     --config prisma.entrenamiento.cutover.config.ts
   ```

   Ejecutar solo el comando correspondiente a una migración que realmente esté
   fallida. `resolve` cambia metadata de Prisma; no sustituye la comprobación de
   datos ni vuelve a ejecutar SQL.

5. Reanudar y observar los servicios:

   ```sh
   docker compose up -d --build
   docker compose ps
   docker compose logs --tail=100 identidad entrenamiento
   ```

   Si entrenamiento informa que no puede retirar legacy porque hay un faltante
   PRE sin exención legacy coincidente, las respuestas copiadas quedan aplicadas
   y cotejadas, la tabla de exenciones y sus filas permanecen intactas, y la API
   puede iniciar sobre el esquema expandido. No se inventan evaluaciones PRE ni
   se descartan exenciones. Corregir esos datos según la política del estudio
   antes de pedir un corte posterior. Las exenciones coincidentes se renombran
   y conservan en `AssessmentBaselineExemptionArchive`; solo justifican la
   validación de migración histórica y el runtime nunca las consulta.

## Base que ya completó el corte

Usar el mismo `docker compose up -d --build`. El arranque aplica cualquier
migración compatible nueva, detecta el corte confirmado en
`_prisma_migrations` y arranca la API sin consultar `Participant`, arreglos
legacy ni tablas retiradas.

## Fallos y recuperación

Si el diagnóstico, backfill o guardas falla, el proceso de inicio termina y el
healthcheck permanece fallido. No se resuelve el estado de Prisma ni se
restauran o eliminan filas automáticamente. Revisar el mensaje, el estado de
migración y los conteos; restaurar un dump en entorno aislado para cualquier
comparación. Mantener las APIs detenidas hasta identificar una salida segura.
