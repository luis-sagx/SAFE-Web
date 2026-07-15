function flashGroup(id, x, y){
  return `<g class="scene-flash" id="${id}" transform="translate(${x},${y})">
    <circle class="flash-pulse" r="15"/>
    <circle class="flash-dot" r="12"/>
    <text class="flash-bolt-text" y="1">⚡</text>
  </g>`;
}

const scenarios = [
  {
    location:"Estacionamiento", time:"7:52 AM",
    object:"Objeto: USB negro con etiqueta manuscrita",
    narrative:`Llegas temprano. Cerca de tu auto, en el suelo, hay un USB negro con una etiqueta escrita a mano: <em>"NÓMINA DICIEMBRE — CONFIDENCIAL"</em>. No hay nadie cerca para preguntar de quién es.`,
    art: `<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="128" fill="#b7c8d6"/>
      <rect y="128" width="400" height="92" fill="#6c7580"/>
      <rect y="124" width="400" height="6" fill="#e7dcae" opacity="0.55"/>
      <rect x="36" y="150" width="7" height="55" fill="#dcd3b8"/>
      <rect x="150" y="150" width="7" height="55" fill="#dcd3b8"/>
      <g transform="translate(190,138)">
        <rect x="0" y="20" width="140" height="34" rx="10" fill="#2c3e50"/>
        <rect x="20" y="0" width="90" height="26" rx="8" fill="#34495e"/>
        <circle cx="25" cy="56" r="12" fill="#1b232c"/>
        <circle cx="115" cy="56" r="12" fill="#1b232c"/>
      </g>
      <rect x="105" y="188" width="20" height="10" rx="2" fill="#1b232c"/>
      <rect x="111" y="182" width="8" height="8" fill="#1b232c"/>
      ${flashGroup('flash-0', 118, 192)}
    </svg>`,
    choices:[
      {label:"Conectarlo a tu laptop un momento, solo para ver de quién es", level:"danger", risk:30,
       feedback:"Un USB desconocido puede ejecutar código automáticamente o simular un teclado para inyectar comandos (ataque tipo HID / 'Rubber Ducky'). La etiqueta 'confidencial' no es un descuido: es el cebo diseñado para que lo abras tú mismo."},
      {label:"Llevarlo directo a Seguridad o IT", level:"safe", risk:0,
       feedback:"Correcto. Ante cualquier dispositivo desconocido, el protocolo es entregarlo al área de Seguridad o IT para que lo analicen en un entorno controlado y aislado — nunca en tu propio equipo."},
      {label:"Dejarlo ahí mismo, no es asunto tuyo", level:"warn", risk:12,
       feedback:"Mejor que conectarlo, pero no reportarlo deja la trampa activa para el siguiente compañero que pase por ahí. Repórtalo, no lo dejes 'para que alguien más decida'."},
      {label:"Conectarlo solo para escanearlo con el antivirus antes de decidir", level:"danger", risk:25,
       feedback:"Escanear con antivirus no te protege de todo: muchos ataques por USB no usan 'archivos maliciosos' que un antivirus detecte, sino que el dispositivo se hace pasar por un teclado y ejecuta comandos apenas se conecta (ataque HID). Para cuando termina el escaneo, el daño ya pudo haberse hecho."}
    ]
  },
  {
    location:"Sala de descanso", time:"10:15 AM",
    object:"Objeto: cable USB conectado al tomacorriente",
    narrative:`Vas a cargar tu celular y notas un cable USB ya conectado al enchufe público, sin nadie cerca reclamándolo. Se ve nuevo y en buen estado.`,
    art: `<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="220" fill="#ece0c4"/>
      <rect y="160" width="400" height="60" fill="#cabb90"/>
      <rect x="30" y="35" width="80" height="90" fill="#cfd6dc" opacity="0.55"/>
      <ellipse cx="300" cy="160" rx="55" ry="16" fill="#a9744a"/>
      <rect x="292" y="160" width="16" height="34" fill="#8a5d38"/>
      <rect x="150" y="128" width="130" height="30" fill="#d8cba0" stroke="#9c8a5e" stroke-width="2"/>
      <rect x="170" y="105" width="26" height="24" fill="#5b4630"/>
      <rect x="228" y="112" width="16" height="12" rx="2" fill="#3a3226"/>
      <path d="M236 124 Q252 148 236 162" stroke="#2b2318" stroke-width="3" fill="none" class="glitch-bar"/>
      ${flashGroup('flash-1', 236, 158)}
    </svg>`,
    choices:[
      {label:"Usarlo para cargar tu celular, se ve nuevo y en buen estado", level:"danger", risk:28,
       feedback:"Un cable 'olvidado' en un punto de carga público puede llevar un chip que roba datos o inyecta comandos apenas se conecta un dispositivo (juice jacking). Regla simple: solo tu propio cable, en tu propio cargador."},
      {label:"Llevártelo a tu escritorio, ahí te sirve más", level:"warn", risk:12,
       feedback:"Sigue siendo el mismo cable comprometido, solo que ahora en tu puesto de trabajo, con acceso potencial a más sistemas. El riesgo no desaparece por cambiar de enchufe."},
      {label:"Avisarle a mantenimiento sobre el cable", level:"safe", risk:0,
       feedback:"Correcto. Cualquier accesorio de carga no identificado en espacios comunes debe reportarse, nunca usarse, sin importar cuán nuevo se vea."},
      {label:"Usarlo solo para cargar el celular, sin pasar archivos", level:"danger", risk:22,
       feedback:"Existen cables modificados (tipo 'O.MG Cable') con un chip que puede inyectar comandos o robar datos alimentándose solo de la corriente del puerto, sin que tú transfieras nada a propósito. La intención de 'solo cargar' no depende de ti, depende del cable."}
    ]
  },
  {
    location:"Tu escritorio", time:"1:40 PM",
    object:"Objeto: USB promocional con logo de feria tecnológica",
    narrative:`Vuelves del almuerzo y encuentras un USB promocional con el logo de una empresa que asistió a una feria tecnológica reciente, dejado sobre tu teclado. No recuerdas haberlo pedido.`,
    art: `<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="220" fill="#eef1f2"/>
      <rect y="55" width="400" height="10" fill="#d7dde1"/>
      <rect x="40" y="130" width="320" height="16" fill="#cfae7c"/>
      <rect x="40" y="112" width="320" height="20" fill="#e6cd9e"/>
      <rect x="160" y="45" width="90" height="60" rx="4" fill="#1b232c"/>
      <rect x="196" y="105" width="18" height="14" fill="#3a4552"/>
      <rect x="150" y="130" width="70" height="14" rx="2" fill="#cfd6dc"/>
      <path d="M300 40 L332 72" stroke="#2b2318" stroke-width="4"/>
      <circle cx="300" cy="40" r="8" fill="#2b2318"/>
      <rect x="238" y="133" width="18" height="9" rx="2" fill="#1b232c"/>
      <rect x="244" y="127" width="6" height="7" fill="#1b232c"/>
      ${flashGroup('flash-2', 247, 138)}
    </svg>`,
    choices:[
      {label:"Conectarlo para ver qué contiene", level:"danger", risk:30,
       feedback:"Los USBs promocionales de eventos son un vector clásico: se regalan o 'olvidan' dispositivos infectados con la marca de una feria para bajar la guardia. Que tenga un logo conocido no lo hace confiable."},
      {label:"Guardarlo para revisarlo luego en tu computador personal", level:"warn", risk:15,
       feedback:"Esto solo traslada el riesgo a tu equipo personal y no resuelve el origen del dispositivo. El problema no es dónde lo conectas, sino que lo conectas sin verificar."},
      {label:"Preguntar en RRHH o IT si alguien dejó ese material", level:"safe", risk:0,
       feedback:"Correcto. Verificar el origen por un canal interno confiable antes de conectar cualquier dispositivo es la respuesta adecuada."},
      {label:"Conectarlo porque venía en el material oficial del evento", level:"danger", risk:26,
       feedback:"Que algo lleve el logo de la feria o de una empresa conocida no garantiza nada: los atacantes imitan el material de marca — o incluso interceptan el material real — para que bajes la guardia. El origen aparente no reemplaza la verificación."}
    ]
  },
  {
    location:"Recepción", time:"4:20 PM",
    object:"Objeto: memoria USB entregada por un visitante",
    narrative:`Un visitante en recepción te pide conectar su USB a tu computador de trabajo para "pasar rápido" una presentación, porque su laptop "no tiene lector". Parece apurado y agradable.`,
    art: `<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="220" fill="#e3ded0"/>
      <rect x="30" y="120" width="140" height="40" rx="4" fill="#cbb98c" stroke="#9c8a5e" stroke-width="2"/>
      <rect x="60" y="102" width="40" height="20" fill="#8a7a58"/>
      <g transform="translate(280,95)">
        <circle cx="0" cy="0" r="16" fill="#d8b48a"/>
        <rect x="-20" y="16" width="40" height="60" rx="10" fill="#3a4552"/>
        <rect x="-30" y="45" width="14" height="8" rx="2" fill="#e6cd9e"/>
      </g>
      <rect x="245" y="140" width="16" height="9" rx="2" fill="#1b232c"/>
      ${flashGroup('flash-3', 253, 145)}
    </svg>`,
    choices:[
      {label:"Conectarlo a tu computador para ayudarlo rápido", level:"danger", risk:35,
       feedback:"Es el escenario de mayor riesgo: tu equipo de trabajo tiene acceso a más sistemas y datos que uno personal. La simpatía y la prisa del visitante son parte de la técnica, no una casualidad."},
      {label:"Decirle que no puedes ayudarlo con eso", level:"warn", risk:6,
       feedback:"Protege el equipo, pero genera fricción innecesaria con un visitante que podría ser legítimo. Hay una forma de decir que no sin dejarlo varado."},
      {label:"Ofrecerle el equipo para visitas o pedirle que lo envíe por el canal oficial de la empresa", level:"safe", risk:0,
       feedback:"Correcto. Las empresas con buenas prácticas tienen equipos aislados para invitados o canales oficiales (correo corporativo, nube aprobada) precisamente para estos casos."},
      {label:"Conectarlo solo un segundo, para copiar el archivo y desconectarlo enseguida", level:"danger", risk:30,
       feedback:"El tiempo de conexión no es lo que te protege: un ataque tipo HID ejecuta sus comandos en los primeros milisegundos, antes de que puedas reaccionar. 'Solo un momento' es tiempo de sobra para comprometer el equipo."}
    ]
  }
];

const consequenceArt = {
  danger: `<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="220" fill="#1b232c"/>
    <rect x="90" y="35" width="220" height="130" rx="6" fill="#0d1319"/>
    <rect x="105" y="47" width="190" height="100" fill="#3d0f0f"/>
    <rect class="glitch-bar" x="105" y="66" width="190" height="7" fill="#c0453a" opacity="0.65"/>
    <rect class="glitch-bar" x="105" y="96" width="140" height="7" fill="#e2574a" opacity="0.5"/>
    <rect class="glitch-bar" x="140" y="118" width="150" height="7" fill="#c0453a" opacity="0.65"/>
    <text x="200" y="105" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="12" fill="#f4d9d6" class="glitch-text">⚠ ARCHIVO_MALICIOSO.EXE</text>
    <text x="200" y="128" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="10" fill="#e8b9b3">acceso no autorizado detectado...</text>
    <rect x="70" y="165" width="260" height="16" rx="4" fill="#05080b"/>
  </svg>`,
  warn: `<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="220" fill="#f6efdd"/>
    <rect x="150" y="35" width="100" height="140" rx="8" fill="#fff9ec" stroke="#9c8a5e" stroke-width="3"/>
    <rect x="172" y="25" width="56" height="16" rx="4" fill="#9c8a5e"/>
    <rect x="196" y="80" width="8" height="46" rx="4" fill="#d99b34"/>
    <circle cx="200" cy="140" r="6" fill="#d99b34"/>
  </svg>`,
  safe: `<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="220" fill="#f6efdd"/>
    <rect x="150" y="35" width="100" height="140" rx="8" fill="#fff9ec" stroke="#9c8a5e" stroke-width="3"/>
    <rect x="172" y="25" width="56" height="16" rx="4" fill="#9c8a5e"/>
    <path d="M175 105 L198 128 L228 82" stroke="#3f8f74" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
};

let totalRisk = 0;
const resolved = {};

const gaugeFill = document.getElementById('gaugeFill');
const riskValue = document.getElementById('riskValue');
const mapView = document.getElementById('mapView');
const sceneView = document.getElementById('sceneView');
const flashOverlay = document.getElementById('flashOverlay');
const stampOverlay = document.getElementById('stampOverlay');
const stampText = document.getElementById('stampText');
const progressText = document.getElementById('progressText');
const reportBtn = document.getElementById('reportBtn');
const reportArea = document.getElementById('reportArea');
const participantStrip = document.getElementById('participantStrip');

const profile = window.MICProfile?.load();
const participantName = profile?.displayName || 'Usuario de practica';
const participantRole = window.MICProfile?.roleLabel(profile) || 'Rol libre de practica';

participantStrip.textContent = `Participante: ${participantName} · ${participantRole}`;

function updateGauge(){
  const pct = Math.min(totalRisk, 100);
  gaugeFill.style.width = pct + '%';
  riskValue.textContent = pct + '%';
  gaugeFill.style.background = pct <= 20 ? 'var(--safe)' : (pct <= 55 ? 'var(--amber)' : 'var(--danger)');
}
function verdictLabel(level){ return level === 'safe' ? 'Decisión segura' : (level === 'warn' ? 'Observación' : 'Riesgo detectado'); }
function stampWord(level){ return level === 'safe' ? 'APROBADO' : (level === 'warn' ? 'OBSERVACIÓN' : 'RIESGO'); }
function pinSymbol(level){ return level === 'safe' ? '✓' : (level === 'warn' ? '!' : '✕'); }
function updateProgress(){
  const count = Object.keys(resolved).length;
  progressText.textContent = `Casos revisados: ${count}/${scenarios.length}`;
  reportBtn.disabled = count < scenarios.length;
}
function updatePinVisual(idx, level){
  const g = document.querySelector(`.pinwrap[data-idx="${idx}"]`);
  if(!g) return;
  const pulse = g.querySelector('.pulse');
  const pin = g.querySelector('.pin');
  const text = g.querySelector('.pin text');
  if(pulse) pulse.style.display = 'none';
  pin.classList.add(level);
  text.textContent = pinSymbol(level);
}
function flashTransition(cb){
  flashOverlay.classList.remove('active');
  void flashOverlay.offsetWidth;
  flashOverlay.classList.add('active');
  setTimeout(cb, 190);
}
function enterScene(idx){ flashTransition(() => showScene(idx)); }

function showScene(idx){
  const s = scenarios[idx];
  const already = resolved[idx];
  mapView.classList.add('hidden');
  sceneView.classList.remove('hidden');

  const artHTML = already ? consequenceArt[already.level] : s.art;

  sceneView.innerHTML = `
    <button class="back-btn" id="backToMapBtn">← Volver al mapa</button>
    <div class="scene-meta"><span>${s.location.toUpperCase()}</span><span>${s.time}</span></div>
    <h3 class="scene-location">${s.location}</h3>
    <div class="scene-canvas" id="sceneCanvas">${artHTML}</div>
    <p class="scene-narrative">${s.narrative}</p>
    ${already ? '' : '<span class="flash-hint">Toca el destello ⚡ sobre la escena para inspeccionar</span>'}
    <div id="sceneBody"></div>
  `;
  document.getElementById('backToMapBtn').addEventListener('click', backToMap);

  if(already){
    document.getElementById('sceneBody').innerHTML = `
      <p class="scene-object">${s.object}</p>
      <div class="feedback-panel">
        <div class="verdict-row"><span class="badge ${already.level}">${verdictLabel(already.level)}</span></div>
        <p class="feedback-text">${already.feedback}</p>
        <button class="next-btn" id="closeBtn">Volver al mapa</button>
      </div>`;
    document.getElementById('closeBtn').addEventListener('click', backToMap);
  } else {
    const flashEl = document.querySelector(`#sceneCanvas .scene-flash`);
    if(flashEl){ flashEl.addEventListener('click', () => revealChoices(idx)); }
  }
}

function shuffled(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function revealChoices(idx){
  const s = scenarios[idx];
  const flashEl = document.querySelector('#sceneCanvas .scene-flash');
  if(flashEl) flashEl.remove();
  const hint = document.querySelector('.flash-hint');
  if(hint) hint.remove();
  const body = document.getElementById('sceneBody');
  body.innerHTML = `<p class="scene-object">${s.object}</p><div class="choices" id="choicesBox"></div>`;
  const box = document.getElementById('choicesBox');
  shuffled(s.choices).forEach((c) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c.label;
    btn.addEventListener('click', () => handleChoice(idx, c));
    box.appendChild(btn);
  });
}

function handleChoice(idx, c){
  const s = scenarios[idx];
  document.querySelectorAll('#choicesBox .choice-btn').forEach(b => b.disabled = true);

  totalRisk += c.risk;
  updateGauge();
  resolved[idx] = { level: c.level, feedback: c.feedback };
  updateProgress();
  updatePinVisual(idx, c.level);

  stampText.textContent = stampWord(c.level);
  stampText.className = 'stamp ' + c.level;
  stampOverlay.classList.remove('hidden');
  requestAnimationFrame(() => stampOverlay.classList.add('show'));

  setTimeout(() => {
    stampOverlay.classList.remove('show');
    stampOverlay.classList.add('hidden');
    document.getElementById('sceneCanvas').innerHTML = consequenceArt[c.level];
    const hint = document.querySelector('.flash-hint');
    if(hint) hint.remove();
    document.getElementById('sceneBody').innerHTML = `
      <p class="scene-object">${s.object}</p>
      <div class="feedback-panel">
        <div class="verdict-row"><span class="badge ${c.level}">${verdictLabel(c.level)}</span></div>
        <p class="feedback-text">${c.feedback}</p>
        <button class="next-btn" id="closeBtn">Volver al mapa</button>
      </div>`;
    document.getElementById('closeBtn').addEventListener('click', backToMap);
  }, 750);
}

function backToMap(){
  flashTransition(() => {
    sceneView.classList.add('hidden');
    mapView.classList.remove('hidden');
  });
}

document.querySelectorAll('.room-zone').forEach(z => {
  z.addEventListener('click', () => enterScene(parseInt(z.dataset.idx, 10)));
  z.addEventListener('keydown', (e) => { if(e.key === 'Enter') enterScene(parseInt(z.dataset.idx, 10)); });
});

reportBtn.addEventListener('click', renderReport);

function renderReport(){
  const pct = Math.min(totalRisk, 100);
  const anyDanger = Object.values(resolved).some(r => r.level === 'danger');
  let level, title, summary;
  if(anyDanger){ level='danger'; title='Incidente de seguridad registrado'; summary='Al menos una decisión habría dado a un atacante acceso a tus sistemas. El común denominador del baiting es la curiosidad o la prisa — verificar antes de conectar es la única defensa real.'; }
  else if(pct <= 15){ level='safe'; title='Protocolo ejemplar'; summary='Identificaste cada intento de baiting y seguiste el protocolo correcto: nunca conectar un dispositivo desconocido, siempre reportarlo por el canal adecuado.'; }
  else { level='warn'; title='Aprobado con observaciones'; summary='Evitaste conectar cualquier dispositivo desconocido, pero algunas decisiones dejaron el riesgo circulando en lugar de eliminarlo. Reportar siempre es mejor que ignorar o reubicar el problema.'; }

  reportArea.innerHTML = `
    <div class="report" style="margin-top:20px; border-top:1px dashed var(--paper-edge); padding-top:18px;">
      <span class="report-stamp ${level}">CASO CERRADO</span>
      <h2>${title}</h2>
      <p class="summary">Nivel de riesgo final: <strong>${pct}%</strong>. ${summary}</p>
      <div class="recap-list">
        ${scenarios.map((s, i) => `
          <div class="recap-item">
            <span class="recap-loc">${s.location}</span>
            <span class="recap-tag ${resolved[i].level}">${stampWord(resolved[i].level)}</span>
          </div>
        `).join('')}
      </div>
      <button class="restart-btn" id="restartBtn">Reiniciar simulación</button>
    </div>
  `;
  document.getElementById('restartBtn').addEventListener('click', () => location.reload());
  reportArea.scrollIntoView({behavior:'smooth', block:'start'});
}

updateGauge();
updateProgress();
