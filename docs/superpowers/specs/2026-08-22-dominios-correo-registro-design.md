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
Gmail nueva se crea en treinta segundos y pasa esta validación. La defensa real
contra eso sería verificación por enlace o código — evaluada y descartada
(ver `2026-09-03-gamificacion-y-certificado-design.md`): la cédula ya
garantiza una cuenta por persona, y un paso extra en el registro no sumaba
nada frente a ese costo. El certificado se manda al correo que el
participante puso, se haya podido comprobar o no que lo controla.

Este límite se documenta en el código con el mismo formato de `cedula.ts`
("LO QUE ESTO HACE / LO QUE NO HACE"), para que nadie lea la validación como una
garantía que no da.

## Diseño

### Archivo nuevo: `backend/apps/identidad/src/auth/dominios-correo.ts`

Única fuente de verdad de la política. Sigue el patrón ya establecido por
`apps/identidad/src/cedula/cedula.ts`: función pura exportada + decorador de
`class-validator` construido con `registerDecorator`.

Dos mecanismos complementarios:

**1. Sufijo `.ec` (regla, no lista).**

```ts
const SUFIJOS_PERMITIDOS = ['.ec'];
```

Revisión sobre el diseño original: en vez de restringir al de segundo nivel
`.edu.ec`, se acepta el ccTLD `.ec` completo — NIC.EC lo asigna a cualquier
persona o entidad ecuatoriana, no solo instituciones educativas. Un sufijo
cubre `.edu.ec` (ESPE, EPN, PUCE, USFQ, UDLA, UTPL, Yachay…), `.com.ec`,
`.gob.ec`, `.med.ec` y cualquier dominio propio registrado en Ecuador, sin
mantener un catálogo que envejece al primer convenio nuevo. La verificación
por correo (ver más abajo) es lo que sigue evitando que esto se convierta en
"cualquier dominio inventado que termine en .ec sirve": el correo tiene que
responder al link de todos modos.

`endsWith('.ec')` incluye el punto inicial, así que `midominio-ec.com` no pasa
y `mail.usfq.edu.ec` sí, sin registrarlo aparte.

**2. Proveedores libres (lista explícita).**

```ts
const DOMINIOS_PERMITIDOS = new Set([
  // Google, Microsoft, Yahoo, Apple, Proton (con variantes regionales/legadas)
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.es', 'hotmail.co.uk', 'hotmail.com.mx',
  'outlook.com', 'outlook.es', 'live.com', 'live.com.mx', 'msn.com',
  'yahoo.com', 'yahoo.es', 'yahoo.com.mx', 'ymail.com',
  'icloud.com', 'me.com',
  'proton.me', 'protonmail.com', 'protonmail.ch',
  // Otros proveedores internacionales de uso corriente
  'aol.com', 'mail.com', 'gmx.com', 'gmx.net', 'zoho.com', 'yandex.com',
  'fastmail.com',
]);
```

Aquí no hay regla posible; hay que enumerar. Añadir un proveedor = editar este
Set. Es el único lugar.

Revisión sobre la primera versión de este spec: la lista original (12
dominios) se quedaba corta y arriesgaba bloquear a alguien legítimo que no usa
ninguno de los cuatro grandes. Se amplió a ~28 sin volverse una lista negra de
desechables — sigue siendo allowlist pura: todo lo que no está aquí ni termina
en `.ec` queda fuera.

**Predicado:**

```ts
permitido = DOMINIOS_PERMITIDOS.has(dominio)
         || SUFIJOS_PERMITIDOS.some((sufijo) => dominio.endsWith(sufijo));
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
| `ana@miempresa.com.ec` | pasa (`.ec` no se limita a `.edu.ec`) |
| `ana@algo.ec` | pasa |
| `ana@mail.usfq.edu.ec` | pasa (subdominio) |
| `ana@gmail.com` | pasa |
| `  Ana@GMAIL.com ` | pasa (cubre normalización antes de validación) |
| `ana@mailinator.com` | error en `email` |
| `ana@dominioinventado.xyz` | error en `email` |
| `ana@midominio-ec.com` | error en `email` (el sufijo no engaña) |
| `noesuncorreo` | **un solo** error, el de formato |

## Criterios de aceptación del issue

- [x] Registro con dominio no permitido devuelve 400 con mensaje claro.
- [x] Lista documentada y mantenible: un archivo, dos constantes, cero duplicación.
- [x] Tests cubren dominio permitido y no permitido.
