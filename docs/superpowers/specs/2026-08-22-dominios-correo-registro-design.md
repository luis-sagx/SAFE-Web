# Restringir dominios de correo en el registro

Fecha: 2026-08-22
Issue: `RegisterDto` solo valida formato con `@IsEmail`; cualquier dominio pasa.
Archivo afectado: `backend/apps/identidad/src/auth/dto/register.dto.ts`

## Problema

`@IsEmail` acepta `ana@dominioinventado.xyz` y `ana@mailinator.com`. Eso permite
registros falsos y contamina los datos del estudio.

## Alcance: qué resuelve y qué no

**Resuelve:** dominios inventados y proveedores desechables conocidos.

**No resuelve:** que la casilla exista ni que la persona la controle. Una cuenta
Gmail nueva se crea en treinta segundos y pasa esta validación. La única defensa
real contra eso es verificación por enlace (token, mailer, endpoint de
confirmación), que hoy no existe en `identidad` y queda como issue aparte.

Este límite se documenta en el código con el mismo formato de `cedula.ts`
("LO QUE ESTO HACE / LO QUE NO HACE"), para que nadie lea la validación como una
garantía que no da.

## Diseño

### Archivo nuevo: `backend/apps/identidad/src/auth/dominios-correo.ts`

Única fuente de verdad de la política. Sigue el patrón ya establecido por
`apps/identidad/src/cedula/cedula.ts`: función pura exportada + decorador de
`class-validator` construido con `registerDecorator`.

Dos mecanismos complementarios:

**1. Sufijos institucionales (regla, no lista).**

```ts
const SUFIJOS_INSTITUCIONALES = ['.edu.ec'];
```

`.edu.ec` es un dominio de segundo nivel restringido: NIC.EC solo lo asigna a
instituciones educativas registradas. Un sufijo cubre ESPE, EPN, PUCE, USFQ,
UDLA, UTPL, Yachay y cualquier institución futura, sin mantener un catálogo de
sesenta universidades que envejece al primer convenio nuevo.

`endsWith('.edu.ec')` incluye el punto inicial, así que `midominio-edu.ec` y
`edu.ec.atacante.com` no pasan. `mail.usfq.edu.ec` sí pasa, sin registrarlo.

**2. Proveedores libres (lista explícita).**

```ts
const DOMINIOS_PERMITIDOS = new Set([
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es', 'live.com',
  'yahoo.com', 'yahoo.es',
  'icloud.com', 'proton.me', 'protonmail.com',
]);
```

Aquí no hay regla posible; hay que enumerar. Añadir un proveedor = editar este
Set. Es el único lugar.

**Predicado:**

```ts
permitido = DOMINIOS_PERMITIDOS.has(dominio)
         || SUFIJOS_INSTITUCIONALES.some((sufijo) => dominio.endsWith(sufijo));
```

### `register.dto.ts`

```ts
@IsEmail({}, { message: 'El correo no tiene un formato válido.' })
@EsDominioPermitido({
  message: 'Ese proveedor de correo no está permitido para el registro.',
})
@MaxLength(120)
@NormalizarEmail()
email: string;
```

### Dos detalles no obvios

**No se normaliza dos veces.** `@NormalizarEmail()` (`libs/comun/src/transform.ts`)
ya aplica `trim().toLowerCase()` antes de que corran los validadores, porque
`plainToInstance` precede a `validate`. El validador compara el dominio directo
contra el Set, sin volver a normalizar.

**Guarda contra el doble mensaje.** Si el valor no es string o no contiene `@`,
`dominioPermitido` devuelve `true` y deja que hable solo `@IsEmail`. Sin esa
guarda, `"noesuncorreo"` produce dos errores de validación para un mismo
problema.

## Mensaje de error

400 con texto genérico, sin enumerar la allowlist:

```json
{
  "statusCode": 400,
  "message": ["Ese proveedor de correo no está permitido para el registro."]
}
```

`frontend/src/pages/Registro.tsx:130` ya pinta el error del backend tal cual, así
que no requiere cambios.

**Consecuencia conocida:** con mensaje genérico y el `placeholder="tu@correo.com"`
actual, el participante rechazado no sabe con qué reintentar. Un hint estático
bajo el campo lo arreglaría sin revelar la lista completa. Es cambio de frontend
y queda fuera de este alcance.

## Tests

`backend/apps/identidad/src/auth/dto/register.dto.spec.ts`, con el molde de
`apps/entrenamiento/src/runs/dto/create-run.dto.spec.ts`: `plainToInstance` +
`validateSync`, sin inyección de dependencias.

| Caso | Espera |
|---|---|
| `ana@espe.edu.ec` | pasa |
| `ana@epn.edu.ec` | pasa (sufijo, no está listado) |
| `ana@mail.usfq.edu.ec` | pasa (subdominio) |
| `ana@gmail.com` | pasa |
| `  Ana@GMAIL.com ` | pasa (cubre normalización antes de validación) |
| `ana@mailinator.com` | error en `email` |
| `ana@dominioinventado.xyz` | error en `email` |
| `ana@midominio-edu.ec` | error en `email` (el sufijo no engaña) |
| `noesuncorreo` | **un solo** error, el de formato |

## Criterios de aceptación del issue

- [x] Registro con dominio no permitido devuelve 400 con mensaje claro.
- [x] Lista documentada y mantenible: un archivo, dos constantes, cero duplicación.
- [x] Tests cubren dominio permitido y no permitido.
