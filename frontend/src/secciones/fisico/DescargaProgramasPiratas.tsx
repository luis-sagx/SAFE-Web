import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const GOOGLE_SEARCH: ScreenView = {
  kind: 'web',
  app: 'Google',
  url: 'google.com',
  secure: true,
  brand: 'Google',
  title: 'Búsqueda',
  subtitle: 'google.com',
  opciones: [
    {
      texto: 'Ir a resultados',
      detalle: 'Búsqueda: "descargar Adobe"',
      goto: 'n1',
    },
  ],
  fields: [],
  button: '',
}

const RESULTADOS_BUSQUEDA: ScreenView = {
  kind: 'web',
  app: 'Google',
  url: 'google.com/search?q=descargar+Adobe',
  secure: true,
  brand: 'Google',
  title: 'Resultados para: descargar Adobe',
  subtitle: 'Aproximadamente 2,450,000 resultados (0.45 segundos)',
  opciones: [
    {
      texto: 'Adobe gratis 2024 | Descargar ahora',
      detalle: 'megafiles.net › photoshop',
      goto: 'n_pagina_falsa',
      label: 'Hizo click en resultado pirata',
    },
    {
      texto: 'Adobe: Creative, marketing and document management solutions',
      detalle: 'www.adobe.com',
      goto: 'n_pagina_oficial',
      label: 'Hizo click en resultado oficial',
    },
    {
      texto: 'Download Adobe Creative Cloud | Professional Creative Software',
      detalle: 'www.adobe.com › creativecloud',
      goto: 'n_pagina_oficial',
      label: 'Hizo click en Adobe Creative Cloud',
    },
    {
      texto: 'Adobe Flash gratis - Software libre',
      detalle: 'softwarelibre123.com › downloads',
      goto: 'n_pagina_flash',
      label: 'Hizo click en resultado falso de Flash',
    },
  ],
  fields: [],
  button: '',
}

const PAGINA_PIRATA: ScreenView = {
  kind: 'web',
  app: 'megafiles.net',
  url: 'megafiles.net/adobe-gratis',
  secure: false,
  brand: 'megafiles.net',
  title: 'Descargar Adobe 2024 GRATIS',
  subtitle: 'Sin licencia - Completamente gratis',
  opciones: [
    {
      texto: 'Descargar ahora',
      detalle: 'Adobe Photoshop 2024 Full Version',
      goto: 'e_malware',
      label: 'Descargó desde página pirata',
    },
    {
      texto: 'Volver a Google',
      detalle: 'Buscar de nuevo',
      goto: 'n1',
    },
  ],
  fields: [],
  button: '',
}

const PAGINA_OFICIAL: ScreenView = {
  kind: 'web',
  app: 'adobe.com',
  url: 'adobe.com/products/photoshop',
  secure: true,
  brand: 'Adobe',
  title: 'Photoshop - Adobe Creative Cloud',
  subtitle: 'adobe.com',
  opciones: [
    {
      texto: 'Descargar ahora',
      detalle: 'Photoshop CC 2024 - Versión oficial',
      goto: 'e_descarga_oficial',
      label: 'Descargó desde Adobe oficial',
    },
    {
      texto: 'Ver precios',
      detalle: 'Planes desde $19.99 al mes',
    },
    {
      texto: 'Probar gratis',
      detalle: 'Versión de prueba 30 días',
      goto: 'e_descarga_trial',
    },
    {
      texto: 'Volver',
      detalle: 'Ir a Google',
      goto: 'n1',
    },
  ],
  fields: [],
  button: '',
}

const PAGINA_FLASH: ScreenView = {
  kind: 'web',
  app: 'softwarelibre123.com',
  url: 'softwarelibre123.com/adobe-flash',
  secure: false,
  brand: 'softwarelibre123.com',
  title: 'Descargar Adobe Flash Player',
  subtitle: 'Software libre - Gratis',
  opciones: [
    {
      texto: 'Descargar ahora',
      detalle: 'Adobe Flash Player versión completa',
      goto: 'e_malware_flash',
      label: 'Descargó desde página falsa de Flash',
    },
    {
      texto: 'Volver',
      detalle: 'Google',
      goto: 'n1',
    },
  ],
  fields: [],
  button: '',
}

const RESULTADO_MALWARE: ScreenView = {
  kind: 'web',
  app: 'Chrome',
  url: 'descarga-completada',
  secure: false,
  brand: 'ALERTA DE SEGURIDAD',
  title: 'Descarga completada - Malware detectado',
  subtitle: 'Tu computadora está comprometida',
  datos: [
    {
      etiqueta: 'Archivo descargado',
      valor: 'adobe_2024.exe',
      senal: 'malware-detectado',
    },
    {
      etiqueta: 'Amenaza detectada',
      valor: 'Ransomware + Keylogger',
    },
    {
      etiqueta: 'Red corporativa',
      valor: 'Completamente comprometida',
    },
  ],
  aviso:
    'El archivo contiene malware integrado. Tu computadora y toda la red corporativa están en riesgo. Se pueden robar credenciales, documentos confidenciales y acceso a sistemas.',
  fields: [],
  button: '',
}

const RESULTADO_OFICIAL: ScreenView = {
  kind: 'web',
  app: 'Adobe',
  url: 'adobe.com/download-complete',
  secure: true,
  brand: 'Adobe Creative Cloud',
  title: 'Descarga segura completada',
  subtitle: 'Photoshop CC 2024 instalado correctamente',
  datos: [
    {
      etiqueta: 'Archivo descargado',
      valor: 'Photoshop_2024_Official.exe',
      senal: 'descarga-segura',
    },
    {
      etiqueta: 'Origen verificado',
      valor: 'Adobe Systems Inc. - Oficial',
    },
    {
      etiqueta: 'Licencia',
      valor: 'Auténtica y válida',
    },
  ],
  aviso:
    'Descargaste directamente desde adobe.com oficial. El software es auténtico, sin malware, y completamente respaldado. Tu empresa cumple con políticas de seguridad y licenciamiento.',
  fields: [],
  button: '',
}

const RESULTADO_TRIAL: ScreenView = {
  kind: 'web',
  app: 'Adobe',
  url: 'adobe.com/trial-activated',
  secure: true,
  brand: 'Adobe Creative Cloud',
  title: 'Versión de prueba activada',
  subtitle: 'Photoshop 2024 - 30 días gratis',
  datos: [
    {
      etiqueta: 'Estado',
      valor: 'Prueba legal - 30 días',
      senal: 'trial-activado',
    },
    {
      etiqueta: 'Acceso completo',
      valor: 'Todas las características disponibles',
    },
    {
      etiqueta: 'Próximo paso',
      valor: 'Solicitar licencia permanente a IT',
    },
  ],
  aviso:
    'Activaste la versión legal de prueba. Completamente segura y sin riesgos. Después de 30 días puedes solicitar la licencia permanente a IT o renovar la suscripción.',
  fields: [],
  button: '',
}

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: RESULTADOS_BUSQUEDA },
  n_google: { kind: 'scene', view: GOOGLE_SEARCH },
  n_pagina_falsa: { kind: 'scene', view: PAGINA_PIRATA },
  n_pagina_oficial: { kind: 'scene', view: PAGINA_OFICIAL },
  n_pagina_flash: { kind: 'scene', view: PAGINA_FLASH },

  e_malware: {
    kind: 'bad',
    view: RESULTADO_MALWARE,
    verdict: 'Caíste en la trampa - Resultado pirata',
    outcome:
      'El sitio pirata ofrecía software gratis pero el archivo contiene malware integrado (ransomware + keylogger). Tu computadora y toda la red corporativa están comprometidas. Se pueden robar credenciales, datos financieros y documentos confidenciales. La empresa corre riesgo legal grave.',
  },

  e_malware_flash: {
    kind: 'bad',
    view: RESULTADO_MALWARE,
    verdict: 'Caíste en la trampa - Sitio falso',
    outcome:
      'El sitio fake de Flash también distribuye malware. La descarga comprometió tu computadora y toda la red corporativa. Se pueden acceder a credenciales, sistemas y datos sensibles. Esto pone en riesgo legal a la empresa.',
  },

  e_descarga_oficial: {
    kind: 'good',
    view: RESULTADO_OFICIAL,
    verdict: 'No caíste - Descargaste del sitio oficial',
    outcome:
      'Descargaste desde adobe.com verificado. El software es auténtico, sin malware, y la licencia cumple con todas las políticas corporativas y legales. Tu empresa está completamente protegida.',
  },

  e_descarga_trial: {
    kind: 'good',
    view: RESULTADO_TRIAL,
    verdict: 'Decisión segura - Versión de prueba legal',
    outcome:
      'Activaste la versión legal de prueba desde Adobe oficial. Completamente segura y sin riesgos. Después de 30 días puedes solicitar la licencia permanente a IT o renovar la suscripción. Sin compromisos.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'malware-detectado',
    pantalla: 'e_malware',
    texto:
      'El archivo contiene malware integrado. Esto es lo normal en todas las descargas piratas desde sitios falsos.',
  },
  {
    id: 's2',
    targetId: 'descarga-segura',
    pantalla: 'e_descarga_oficial',
    texto:
      'Descarga verificada desde adobe.com oficial. Archivo auténtico, sin malware, con licencia válida.',
  },
  {
    id: 's3',
    targetId: 'trial-activado',
    pantalla: 'e_descarga_trial',
    texto:
      'Versión legal de prueba activada. 30 días de acceso completo desde Adobe oficial, completamente segura.',
  },
]

const RULE =
  'Regla de oro: En búsquedas, los resultados pirata frecuentemente aparecen primero porque pagan para posicionarse. Siempre verifica que estés en el sitio OFICIAL (adobe.com, microsoft.com, etc.). Si el dominio no es exacto, es falso.'

const RESUMEN = 'Búsqueda de software - Identifica sitios oficiales vs. falsos'

const CONTEXTO: Contexto = {
  antes:
    'Los atacantes crean sitios falsos que parecen legales y los posicionan en los primeros resultados de búsqueda. Si descargas desde un sitio pirata, tu computadora se infecta con malware. En una empresa, esto compromete toda la red corporativa.',
  ahora: (
    <>
      <strong>Necesitas descargar Adobe Photoshop</strong> para un proyecto urgente. Abres Google y buscas "descargar Adobe".
      Aparecen varios resultados. <strong>¿En cuál haces click?</strong>
    </>
  ),
}

function DescargaProgramasPiratas() {
  return (
    <StoryEscenario
      escenarioId="fisico/descarga-programas-piratas"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="Repetir el escenario"
      instruccion={
        <>
          <p className="text-lg leading-relaxed text-body">
            Busca "descargar Adobe" en Google. En los resultados aparecerán varios sitios. Haz click en uno de ellos y
            luego decide si descargar o no. El dominio del sitio es la clave: verifica que sea el oficial.
          </p>
          <details className="text-base leading-relaxed text-body">
            <summary className="cursor-pointer list-none font-medium text-link underline decoration-dotted underline-offset-4">
              ¿Cuándo termina el escenario?
            </summary>
            <p className="mt-2">
              Cuando llegues a una descarga: desde el sitio pirata, el sitio falso de Flash, o
              adobe.com oficial. Volver a los resultados de búsqueda no cuenta como una decisión.
            </p>
          </details>
        </>
      }
      pista={
        <p>
          Los primeros resultados no siempre son los correctos. Busca siempre adobe.com oficial en la URL. Los sitios
          falsos tienen dominios como megafiles.net, softwarelibre123.com, etc.
        </p>
      }
    />
  )
}

export default DescargaProgramasPiratas
