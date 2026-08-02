# Justificación técnica de las tecnologías seleccionadas

**Proyecto:** Plataforma de entrenamiento interactivo contra ciberataques dirigida a usuarios finales (administrativos, adultos mayores y niños)

---

## Contexto

La plataforma requiere simular escenarios interactivos de decisión ante distintos tipos de ciberataques (phishing, smishing, vishing, deepfake e ingeniería social física), mantener el progreso del participante de forma anónima, y registrar resultados de evaluación pre y post-test para medir el impacto del entrenamiento. Estas necesidades específicas guiaron la selección tecnológica descrita a continuación.

---

## Frontend: React (Vite)

Dado que la plataforma está compuesta por múltiples escenarios independientes —uno por cada tipo de amenaza (phishing, smishing, vishing, deepfake e ingeniería social física)—, se requiere una arquitectura que permita aislar la lógica de cada caso sin duplicar elementos comunes como el encabezado, el medidor de riesgo o los paneles de retroalimentación.

React resuelve esto mediante su arquitectura basada en componentes reutilizables, permitiendo que cada nuevo escenario de ataque se integre como un módulo independiente sin afectar a los demás. Un estudio comparativo que aplicó la norma ISO 25010 evaluó el desempeño de React, Angular y Vue.js mediante pruebas de tiempo de respuesta y velocidad de transferencia de datos en una aplicación web real, concluyendo que React se caracteriza por su alta flexibilidad y desempeño superior. Adicionalmente, React es el framework de interfaz de usuario más utilizado por desarrolladores profesionales a nivel mundial (46.9% de adopción según el Stack Overflow Developer Survey 2025), lo que garantiza documentación extensa, soporte de la comunidad y continuidad a largo plazo del proyecto.

**Fuentes:**

- Estudio con metodología ISO 25010: ["Comprehensive Performance and Scalability Assessment of Front-End Frameworks: React, Angular, and Vue.js"](https://www.researchgate.net/publication/384307903_Comprehensive_Performance_and_Scalability_Assessment_of_Front-End_Frameworks_React_Angular_and_Vuejs) (ResearchGate)
- Artículo académico: ["Análisis de frameworks frontend para aplicar UX/UI en el desarrollo web"](https://ciencialatina.org/index.php/cienciala/article/download/11290/16544) (Revista Ciencia Latina)
- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology/)

---

## Enrutamiento: React Router

La experiencia del usuario dentro de la plataforma requiere una navegación fluida entre la pantalla de acceso, el panel de secciones por tipo de amenaza y cada escenario individual, sin recargar el navegador en cada transición (lo cual rompería la inmersión del entrenamiento simulado).

React Router es la librería oficial recomendada por el equipo de React para resolver el enrutamiento del lado del cliente en aplicaciones de una sola página (SPA), permitiendo estructurar la navegación de forma declarativa y anidada.

**Nota metodológica:** no se encontró literatura académica revisada por pares sobre React Router, ya que se trata de una librería de implementación (no un objeto de estudio científico independiente). La justificación se sustenta en su documentación oficial y en su posición como estándar de facto del ecosistema React.

**Fuente:** [reactrouter.com](https://reactrouter.com/)

---

## Manejo de estado: Context API

Dado que el código de participante, su progreso y su puntuación por escenario deben estar disponibles en todas las pantallas de la aplicación, se utiliza la Context API nativa de React para compartir este estado entre componentes sin necesidad de pasarlo manualmente de un nivel a otro.

**Nota metodológica:** al igual que con React Router, no existe literatura académica formal sobre la Context API, al ser una característica nativa de una librería y no un tema de investigación independiente. La justificación se basa en su documentación oficial.

**Fuente:** [react.dev/reference/react/useContext](https://react.dev/reference/react/useContext)

---

## Autenticación: login con código de participante + JWT

La plataforma requiere identificar a cada participante para asociar su progreso y sus puntuaciones por escenario, y para poder cruzar esos resultados con el pre-test y post-test aplicados por separado (Google Forms). Esto exige un sistema de autenticación real, no solo estado de cliente.

Para preservar el anonimato exigido por el diseño de la investigación, el login no usa datos personales: cada participante recibe un **código pseudónimo** (ej. `P07`) que actúa como usuario. La sesión se maneja con JWT (JSON Web Token) siguiendo las prácticas descritas en el OWASP Authentication y Session Management Cheat Sheet: contraseñas con hash (bcrypt/argon2, nunca texto plano), transporte exclusivo sobre TLS, expiración corta del token e invalidación en logout. La tabla que vincula el código pseudónimo con la identidad real del participante se mantiene separada y se elimina al cerrar la recolección de datos, siguiendo la técnica de pseudonimización descrita en NIST SP 800-188 — reversible y controlada durante la recolección, pero convertible en anonimización real en el momento del análisis.

**Fuentes:**

- [Authentication Cheat Sheet — OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Session Management Cheat Sheet — OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [NIST SP 800-188, De-Identifying Government Datasets — NIST CSRC](https://csrc.nist.gov/pubs/sp/800/188/final)

---

## Backend: NestJS

Cada tipo de amenaza simulada puede tratarse como un dominio independiente del sistema. NestJS ofrece una arquitectura modular nativa que permite mapear cada categoría de ataque a un módulo de backend separado, facilitando la organización del código a medida que la plataforma crece en número de escenarios.

Adicionalmente, su sistema de validación mediante DTOs (Data Transfer Objects) y la librería `class-validator` permite garantizar que los resultados de las evaluaciones enviados desde el frontend —puntaje, tiempo de respuesta, código de sesión— lleguen con el formato correcto antes de almacenarse, lo cual es indispensable para no comprometer la integridad de los datos usados en el análisis estadístico pre/post-test.

**Fuentes:**

- Documentación oficial: [docs.nestjs.com/pipes](https://docs.nestjs.com/pipes)
- Trabajo académico ecuatoriano: ["NestJS: Desarrollo de Aplicaciones Backend Escalables con TypeScript"](https://www.academia.edu/145356877/NestJS_Desarrollo_de_Aplicaciones_Backend_Escalables_con_TypeScript), Escuela Politécnica Nacional

---

## ORM: Prisma

Prisma se seleccionó por su seguridad de tipos de extremo a extremo (_type-safety_), que reduce errores durante el desarrollo colaborativo del proyecto, y por su sistema de migraciones versionadas, que permite documentar la evolución del modelo de datos de la plataforma a lo largo del desarrollo del MIC.

**Fuente:** [Comparación oficial Prisma vs. TypeORM](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-typeorm)

---

## Base de datos: PostgreSQL

Cada escenario de ataque genera una estructura de respuesta distinta (opción múltiple simple, flujo de decisiones secuenciales, selección de zonas en un mapa, etc.). PostgreSQL resuelve esta heterogeneidad mediante su soporte nativo de tipos JSON y JSONB, que permite almacenar las respuestas de cada escenario de forma flexible dentro de una estructura relacional, sin necesidad de una tabla rígida distinta por cada tipo de caso.

Es además la base de datos relacional más utilizada por desarrolladores profesionales a nivel mundial (58.2% según el Stack Overflow Developer Survey 2025), y su soporte SQL estándar permite calcular directamente funciones de agregación (promedios, conteos, percentiles) necesarias para comparar los resultados del pre-test y post-test sin depender de herramientas externas de análisis.

Esta elección se refuerza con evidencia académica: un estudio publicado en la revista _GeoInformatica_ (Springer) comparó el desempeño de PostgreSQL y MongoDB, encontrando que PostgreSQL ofrece un rendimiento competitivo para consultas con datos semiestructurados de tipo JSON. Un artículo publicado en Redalyc evaluó específicamente las capacidades no relacionales de PostgreSQL frente a MongoDB, concluyendo que la incorporación del tipo de dato JSONB representó una mejora considerable en el rendimiento del gestor para el manejo de datos semiestructurados. Un tercer trabajo académico (Universidad de Málaga, España) comparó PostgreSQL, MongoDB y Kaleido en términos de rendimiento, reforzando la viabilidad de PostgreSQL para escenarios con datos de estructura variable.

**Fuentes:**

- Documentación oficial: [postgresql.org/docs/current/datatype-json.html](https://www.postgresql.org/docs/current/datatype-json.html)
- Artículo revisado por pares: ["MongoDB Vs PostgreSQL: A comparative study on performance aspects"](https://link.springer.com/article/10.1007/s10707-020-00407-w), _GeoInformatica_, Springer Nature
- Artículo académico: ["Características no relacionales de PostgreSQL"](https://www.redalyc.org/pdf/3783/378346333006.pdf), Redalyc
- Tesis universitaria: ["Comparación de rendimiento entre bases de datos: PostgreSQL, MongoDB y Kaleido"](https://riuma.uma.es/xmlui/bitstream/handle/10630/19413/P%C3%A9rez%20Rom%C3%A1n%20Alberto%20Memoria.pdf?sequence=1&isAllowed=y), Universidad de Málaga
- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology/)

---

## Síntesis de voz: Web Speech API

Para el módulo de suplantación de identidad mediante inteligencia artificial (voz clonada), se requiere generar audio sintético que simule el concepto pedagógico de un ataque de este tipo, sin incurrir en el problema ético de clonar literalmente la voz de una persona real.

La Web Speech API, disponible de forma nativa en navegadores basados en Chromium sin necesidad de servicios de pago, cumple este propósito. Cabe precisar que esta especificación es mantenida por el **Web Platform Incubator Community Group (WICG)** y **no constituye un estándar formal del W3C**, aunque cuenta con soporte estable en los principales navegadores modernos. Su viabilidad para el desarrollo de aplicaciones web reales está respaldada por un trabajo académico de la Universitat Politècnica de València (España), centrado específicamente en el desarrollo de una aplicación web utilizando esta tecnología.

**Fuentes:**

- Documentación técnica: [developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- Trabajo académico: ["Desarrollo de una aplicación para la Web utilizando el Web Speech API"](https://riunet.upv.es/entities/publication/fa56d001-f701-4940-a898-4523318ee033), Universitat Politècnica de València (repositorio RiuNet)

---

## Contenerización: Docker

El despliegue se realiza en un servidor propio, no en una plataforma cloud gestionada. El stack combina tres piezas con runtimes distintos —build estático de React, API NestJS sobre Node.js y PostgreSQL— que deben instalarse y configurarse de forma idéntica en el entorno de desarrollo y en el servidor de producción. Reproducir esto manualmente es la causa más común de fallos de despliegue por diferencias de entorno.

Docker empaqueta cada servicio (frontend/Nginx, backend/NestJS, PostgreSQL) en una imagen con sus dependencias, garantizando que el contenedor se comporte igual en cualquier máquina donde se ejecute. Docker Compose orquesta los tres servicios como una sola unidad desplegable en el servidor propio, evitando instalación manual de Node, Postgres y sus versiones específicas en el host.

Dado que la plataforma maneja datos de participantes (aunque pseudonimizados), la configuración de los contenedores sigue las recomendaciones del OWASP Docker Security Cheat Sheet: no ejecutar contenedores con `--privileged`, no exponer el daemon de Docker sin autenticación/TLS, limitar recursos por contenedor (memoria, CPU) y aplicar el principio de mínimo privilegio sobre las capabilities del kernel.

**Fuentes:**

- [Docker Security — OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- Documentación oficial: [docs.docker.com](https://docs.docker.com/)

---

## CI/CD: integración y despliegue continuo

Con varios escenarios interactivos, backend y base de datos evolucionando en paralelo, el riesgo de que un cambio en un módulo rompa otro sin ser detectado antes del despliegue crece con el tamaño del proyecto. Martin Fowler define la Integración Continua como la práctica de fusionar cambios en la rama principal frecuentemente, verificando cada integración con un build automatizado que incluye pruebas, para detectar errores de integración lo antes posible — en vez de descubrirlos manualmente al desplegar en el servidor propio.

El pipeline aplicado a este proyecto: build del frontend, build y pruebas del backend, construcción de las imágenes Docker y despliegue automatizado al servidor propio en cada push a la rama principal. Esto reemplaza el despliegue manual (copiar archivos, reinstalar dependencias, reiniciar servicios a mano) por un proceso repetible y verificado, reduciendo el riesgo de desplegar una versión con errores durante la fase de evaluación con usuarios.

**Fuentes:**

- [Continuous Integration — Martin Fowler](https://martinfowler.com/articles/continuousIntegration.html)
- Documentación oficial: [docs.github.com/actions](https://docs.github.com/en/actions)

---
