# Saneamiento de incidencias SonarCloud

## Objetivo

Eliminar las 263 incidencias existentes de la rama `main` de SonarCloud sin
cambiar el comportamiento pedagógico de los escenarios ni ocultar riesgos con
exclusiones amplias.

## Alcance y prioridad

El análisis base registra 27 vulnerabilidades, 8 bugs y 228 code smells. El
trabajo se ejecutará en este orden:

1. **Seguridad de CI y utilidades**: fijar cada acción de GitHub por SHA
   inmutable, sustituir imágenes sin versión/digest y eliminar el script
   local no reproducible que lee un token desde `/tmp`. La síntesis de voz
   validará que cualquier archivo derivado de una entrada quede dentro de su
   directorio permitido; el hash de nombres se declarará explícitamente como
   no criptográfico si la API lo permite, pues su único propósito es un nombre
   determinista de archivo.
2. **Seguridad de aplicación**: centralizar el mezclado de opciones con
   `crypto.getRandomValues`, sin cambiar la distribución ni mutar el arreglo
   recibido. Las URL HTTP que son evidencia deliberada de phishing/smishing
   se conservarán y se documentarán con una supresión puntual de Sonar en la
   línea concreta. Las contraseñas ficticias de pruebas e2e recibirán la misma
   excepción puntual y explicada: nunca se moverán a secretos ni producción.
3. **Correctitud y accesibilidad**: reemplazar contenedores clicables por
   controles nativos o añadir semántica/teclado donde sea indispensable;
   asociar etiquetas a controles, declarar `type="button"`, usar `output`
   para estado y corregir contraste, subtítulos y duplicados CSS.
4. **Mantenibilidad**: desanidar ternarios, volver inmutables los props,
   renombrar componentes JSX a PascalCase, remover fragments/redes de regex
   redundantes y extraer componentes o helpers cuando reduzcan complejidad.
   Las funciones que superen complejidad cognitiva se dividirán por decisiones
   de interfaz, preservando las transiciones de cada escenario.

## Límites de las supresiones

Se permiten exclusivamente comentarios `NOSONAR` en las seis URL HTTP que se
presentan como señal de fraude, las cuatro credenciales no secretas de e2e y,
si Sonar no reconoce la marca `usedforsecurity=False`, el hash de nombres de
audio. Cada comentario deberá explicar el motivo funcional y estar junto a la
línea afectada. No se añadirá una exclusión global de rutas, reglas ni
directorios para reducir el tablero.

## Arquitectura de la corrección

- Crear un helper de frontend para `shuffle` seguro y reutilizarlo en los
  nueve escenarios físicos, reduciendo tanto alertas S2245 como duplicación.
- Mantener los datos de escenarios como datos; cuando el protocolo HTTP sea
  parte del estímulo, señalar explícitamente a Sonar que no se realiza una
  conexión real.
- Separar de los componentes de pantalla las decisiones complejas y las
  vistas internas que hoy se definen durante el render. Sus props serán
  `Readonly` y recibirán sólo los valores necesarios.
- El CI seguirá siendo bloqueante: las acciones se referenciarán por SHA y la
  imagen de Trivy se fijará. La exploración de dependencias y las pruebas no
  pierden permisos ni pasos.

## Pruebas y aceptación

- Cada refactor con lógica obtendrá primero una prueba de regresión que falle
  contra el comportamiento anterior cuando sea viable; los cambios puramente
  de configuración, estilos o supresiones se comprobarán por lint/build y por
  la siguiente ejecución de SonarCloud.
- Se ejecutarán las pruebas y build de frontend, lint/build/pruebas de backend
  y las verificaciones específicas de los módulos modificados.
- El escaneo de SonarCloud de la PR debe dejar sin incidencias abiertas de las
  reglas listadas en el inventario base, salvo cualquier hallazgo nuevo que se
  investigará antes de cerrar la rama.

## No objetivos

- No se cambian los dominios falsos, historias ni respuestas esperadas de los
  escenarios educativos.
- No se actualizan dependencias ni se altera el modelo de datos como parte de
  este saneamiento.
