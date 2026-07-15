const items = {
  monitor: {
    isRisk:true, label:"Pantalla con el sistema de nómina abierto",
    riskCaption:"Se alcanza a leer el sistema de nómina en pantalla, con datos de empleados visibles.",
    fixedFeedback:"Bien hecho: bloqueaste la pantalla antes de la foto. Ningún dato quedó expuesto.",
    riskFeedback:"La pantalla quedó visible en la foto publicada. Cualquiera que vea el boletín (interno o en redes) pudo ver datos de nómina de fondo."
  },
  sticky: {
    isRisk:true, label:"Nota adhesiva con la contraseña del wifi escrita a mano",
    riskCaption:"Nota con la contraseña del wifi de la oficina, perfectamente legible en la foto.",
    fixedFeedback:"Bien hecho: quitaste la nota antes de la foto.",
    riskFeedback:"La nota con la contraseña \"Of2026*Net!\" quedó visible y legible en la foto publicada — cualquiera que la vea puede usarla."
  },
  folder: {
    isRisk:true, label:"Carpeta con documentos de un cliente sobre el escritorio",
    riskCaption:"Carpeta con el logo y datos de un cliente, visible sobre el escritorio.",
    fixedFeedback:"Bien hecho: guardaste la carpeta antes de la foto.",
    riskFeedback:"La carpeta con datos de un cliente quedó visible en la foto — información que no debería circular fuera de la empresa."
  },
  badge: {
    isRisk:true, label:"Gafete de acceso con el código de empleado visible hacia la cámara",
    riskCaption:"El código \"ID 04521\" del gafete de acceso quedó de frente y legible en la foto.",
    fixedFeedback:"Bien hecho: volteaste el gafete antes de la foto.",
    riskFeedback:"El código \"ID 04521\" de tu gafete de acceso quedó legible en la foto — en teoría, alguien podría intentar clonarlo o usarlo como referencia para un ataque físico."
  },
  phone: {
    isRisk:true, label:"Teléfono con un código de verificación visible en la pantalla de bloqueo",
    riskCaption:"El código \"482913\" de una notificación quedó legible en la pantalla bloqueada del teléfono.",
    fixedFeedback:"Bien hecho: guardaste o bloqueaste el teléfono antes de la foto.",
    riskFeedback:"El código de verificación \"482913\" de la notificación quedó legible en la foto — alguien podría usarlo para entrar a una cuenta tuya o de la empresa."
  },
  notebook: {
    isRisk:true, label:"Libreta abierta con la contraseña del wifi anotada a mano",
    riskCaption:"La libreta quedó abierta en la página con la contraseña \"Ofc-2026*Wpa\" anotada.",
    fixedFeedback:"Bien hecho: cerraste la libreta antes de la foto.",
    riskFeedback:"La contraseña \"Ofc-2026*Wpa\" anotada en la libreta quedó legible en la foto publicada."
  },
  mug: { isRisk:false, label:"Taza de café" },
  plant: { isRisk:false, label:"Planta pequeña" }
};

const LEVELS = [
  {
    label:"Nivel 1 · Tu escritorio", time:20,
    npc:'Valeria, de Comunicaciones: "¡Hola! Estoy armando el boletín interno de este mes, ¿te tomo una foto rápida en tu puesto? Solo será un segundo."',
    slotA:"mug", slotB:"plant"
  },
  {
    label:"Nivel 2 · Cierre de mes", time:16,
    npc:'Valeria: "¡Otra vez yo! Necesitamos una foto para la sección \'un día en la oficina\'. ¿Lista en tu puesto?"',
    slotA:"phone", slotB:"plant"
  },
  {
    label:"Nivel 3 · Antes de la reunión", time:12,
    npc:'Valeria: "Última foto, lo prometo — es para la portada del boletín trimestral. ¿Nos das un segundo?"',
    slotA:"phone", slotB:"notebook"
  }
];

const CORE_KEYS = ['monitor','sticky','folder','badge'];

let levelIndex = 0;
let activeItems = [];
let fixedState = {};
let timeLeft = LEVELS[0].time;
let timerInterval = null;
let finished = false;
let sessionResults = [];

const deskWrap = document.getElementById('deskWrap');
const gaugeFill = document.getElementById('gaugeFill');
const riskValue = document.getElementById('riskValue');
const flashOverlay = document.getElementById('flashOverlay');
const reportArea = document.getElementById('reportArea');
const snapBtn = document.getElementById('snapBtn');
const levelTab = document.getElementById('levelTab');
const participantStrip = document.getElementById('participantStrip');

const profile = window.MICProfile?.load();
const participantName = profile?.displayName || 'Usuario de practica';
const participantRole = window.MICProfile?.roleLabel(profile) || 'Rol libre de practica';

participantStrip.textContent = `Participante: ${participantName} · ${participantRole}`;

function slotSVG(key){
  if(key === 'mug'){
    return `
    <g class="clickable" id="obj-mug" transform="translate(410,155)">
      <rect x="0" y="10" width="24" height="22" rx="3" fill="#fff9ec" stroke="#9c8a5e" stroke-width="1.5"/>
      <path d="M24 14 h6 a6 6 0 0 1 0 14 h-6" fill="none" stroke="#9c8a5e" stroke-width="1.5"/>
    </g>`;
  }
  if(key === 'plant'){
    return `
    <g class="clickable" id="obj-plant" transform="translate(60,140)">
      <rect x="8" y="34" width="20" height="16" rx="2" fill="#cbb98c"/>
      <path d="M18 34 Q10 20 18 6 Q26 20 18 34" fill="#5b8a5a"/>
      <path d="M18 34 Q26 22 34 12" stroke="#5b8a5a" stroke-width="4" fill="none" stroke-linecap="round"/>
    </g>`;
  }
  if(key === 'phone'){
    return `
    <g class="clickable" id="obj-phone" transform="translate(408,140)">
      <g id="phone-exposed">
        <rect x="0" y="0" width="26" height="58" rx="4" fill="#1b232c"/>
        <rect x="2" y="4" width="22" height="50" rx="2" fill="#3a4552"/>
        <rect x="3" y="20" width="20" height="20" rx="1.5" fill="#eef1f2"/>
        <text x="13" y="28" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="4" fill="#4a5560">Código:</text>
        <text x="13" y="36" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-weight="600" font-size="5.2" fill="#1b232c">482913</text>
      </g>
      <g id="phone-fixed" style="display:none;">
        <rect x="0" y="0" width="26" height="58" rx="4" fill="#0d1319"/>
      </g>
    </g>`;
  }
  if(key === 'notebook'){
    return `
    <g class="clickable" id="obj-notebook" transform="translate(50,140)">
      <g id="notebook-exposed">
        <rect x="0" y="0" width="80" height="44" rx="2" fill="#f7f3e6" stroke="#b7a97e" stroke-width="1.2"/>
        <line x1="38" y1="3" x2="38" y2="41" stroke="#b7a97e" stroke-width="1"/>
        <path d="M6 12 h24 M6 19 h28 M6 26 h20" stroke="#9c8e6a" stroke-width="1"/>
        <text x="60" y="17" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="5" fill="#5f5238">WiFi oficina:</text>
        <text x="60" y="28" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-weight="600" font-size="5.2" fill="#2b2308">Ofc-2026*Wpa</text>
      </g>
      <g id="notebook-fixed" style="display:none;">
        <rect x="6" y="6" width="68" height="32" rx="2" fill="#cfae7c"/>
        <path d="M18 22 l2 6 h24 l7-14" stroke="#5f4a2a" stroke-width="1" fill="none"/>
      </g>
    </g>`;
  }
  return '';
}

function deskSVG(level){
  return `
  <svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="500" height="300" fill="#eef1f2"/>
    <rect y="60" width="500" height="10" fill="#d7dde1"/>
    <rect x="20" y="190" width="460" height="20" fill="#cfae7c"/>
    <rect x="20" y="170" width="460" height="20" fill="#e6cd9e"/>

    <!-- Monitor -->
    <g class="clickable" id="obj-monitor">
      <rect x="150" y="60" width="120" height="80" rx="4" fill="#1b232c"/>
      <rect x="205" y="140" width="20" height="16" fill="#3a4552"/>
      <g id="monitor-exposed">
        <rect x="160" y="70" width="100" height="10" fill="#c0453a" opacity="0.75"/>
        <rect x="160" y="86" width="80" height="8" fill="#8fa0b0" opacity="0.6"/>
        <rect x="160" y="100" width="90" height="8" fill="#8fa0b0" opacity="0.6"/>
        <rect x="160" y="114" width="70" height="8" fill="#8fa0b0" opacity="0.6"/>
        <text x="210" y="132" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="7" fill="#e8b9b3">NÓMINA_2026.xlsx</text>
      </g>
      <g id="monitor-fixed" style="display:none;">
        <rect x="160" y="70" width="100" height="60" fill="#05080b"/>
        <circle cx="210" cy="100" r="10" fill="none" stroke="#8fa0b0" stroke-width="2.5"/>
        <rect x="205" y="100" width="10" height="8" fill="#8fa0b0"/>
      </g>
    </g>

    <!-- Sticky note -->
    <g class="clickable" id="obj-sticky">
      <g id="sticky-exposed">
        <rect x="256" y="60" width="48" height="36" fill="#f4d94a" stroke="#c9ad1f" stroke-width="1" transform="rotate(6 280 78)"/>
        <text x="280" y="72" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="6" fill="#4a3d0d" transform="rotate(6 280 78)">Clave wifi:</text>
        <text x="280" y="83" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-weight="600" font-size="6.5" fill="#2b2308" transform="rotate(6 280 78)">Of2026*Net!</text>
      </g>
      <g id="sticky-fixed" style="display:none;"></g>
    </g>

    <!-- Folder -->
    <g class="clickable" id="obj-folder">
      <g id="folder-exposed">
        <rect x="330" y="150" width="60" height="42" rx="2" fill="#e0d4b0" stroke="#9c8a5e" stroke-width="1.5"/>
        <rect x="330" y="150" width="60" height="10" fill="#c0453a" opacity="0.7"/>
        <text x="360" y="172" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="7" fill="#5f5238">Cliente XYZ</text>
      </g>
      <g id="folder-fixed" style="display:none;">
        <rect x="330" y="176" width="60" height="16" rx="2" fill="#cfae7c"/>
        <text x="360" y="187" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="7" fill="#5f4a2a">guardado</text>
      </g>
    </g>

    <!-- Badge -->
    <g class="clickable" id="obj-badge" transform="translate(120,185)">
      <g id="badge-exposed">
        <rect x="0" y="0" width="26" height="36" rx="3" fill="#fff9ec" stroke="#9c8a5e" stroke-width="1.5"/>
        <rect x="5" y="5" width="16" height="10" fill="#2c3e50"/>
        <text x="13" y="22" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="4.4" fill="#1b232c">ID 04521</text>
        <rect x="5" y="26" width="16" height="3" fill="#1b232c"/>
        <rect x="5" y="31" width="16" height="3" fill="#1b232c"/>
      </g>
      <g id="badge-fixed" style="display:none;">
        <rect x="0" y="0" width="26" height="36" rx="3" fill="#c7bda1" stroke="#9c8a5e" stroke-width="1.5"/>
      </g>
    </g>

    <!-- Slot A (mug / phone) -->
    ${slotSVG(level.slotA)}

    <!-- Slot B (plant / notebook) -->
    ${slotSVG(level.slotB)}

    <g id="tooltipLayer"></g>
  </svg>`;
}

function renderDesk(){
  const level = LEVELS[levelIndex];
  deskWrap.innerHTML = deskSVG(level);

  activeItems.forEach(key => {
    const el = document.getElementById('obj-'+key);
    if(!el) return;
    if(items[key].isRisk){
      el.addEventListener('click', () => toggleItem(key));
    } else {
      el.addEventListener('click', () => {
        const p = TOOLTIP_POS[key];
        showTooltip(p.x, p.y, "No hace falta ocultar esto");
      });
    }
  });

  applyStates();
}

const TOOLTIP_POS = {
  mug:{x:410+12, y:150},
  plant:{x:60+18, y:135}
};

function toggleItem(key){
  if(finished) return;
  fixedState[key] = !fixedState[key];
  applyStates();
}

function applyStates(){
  Object.keys(fixedState).forEach(key => {
    const exposedEl = document.getElementById(key+'-exposed');
    const fixedEl = document.getElementById(key+'-fixed');
    if(!exposedEl || !fixedEl) return;
    if(fixedState[key]){
      exposedEl.style.display = 'none';
      fixedEl.style.display = '';
    } else {
      exposedEl.style.display = '';
      fixedEl.style.display = 'none';
    }
  });
}

function showTooltip(x,y,text){
  const layer = document.getElementById('tooltipLayer');
  if(!layer) return;
  layer.innerHTML = `
    <rect class="tooltip-bg" x="${x-70}" y="${y-34}" width="140" height="24" rx="5"/>
    <text class="tooltip-hint" x="${x}" y="${y-17}">${text}</text>
  `;
  setTimeout(() => { if(layer) layer.innerHTML = ''; }, 1400);
}

function startTimer(){
  const levelTime = LEVELS[levelIndex].time;
  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    if(timeLeft <= 0){
      timeLeft = 0;
      clearInterval(timerInterval);
      takePhoto();
    }
    gaugeFill.style.width = (timeLeft/levelTime*100) + '%';
    riskValue.textContent = Math.ceil(timeLeft) + 's';
    gaugeFill.style.background = timeLeft > levelTime/2 ? 'var(--safe)' : (timeLeft > levelTime/4 ? 'var(--amber)' : 'var(--danger)');
  }, 100);
}

snapBtn.addEventListener('click', () => { if(!finished) takePhoto(); });

function takePhoto(){
  if(finished) return;
  finished = true;
  clearInterval(timerInterval);
  flashOverlay.classList.remove('active');
  void flashOverlay.offsetWidth;
  flashOverlay.classList.add('active');
  setTimeout(showResult, 250);
}

const POSITIONS = {
  monitor:{x:'30%', y:'20%', w:'26%', h:'27%'},
  sticky:{x:'51%', y:'20%', w:'10%', h:'12%'},
  folder:{x:'65%', y:'48%', w:'13%', h:'16%'},
  badge:{x:'23%', y:'60%', w:'6%', h:'14%'},
  phone:{x:'80%', y:'46%', w:'6%', h:'20%'},
  notebook:{x:'10%', y:'47%', w:'16%', h:'15%'}
};

function showResult(){
  const level = LEVELS[levelIndex];
  const isLastLevel = levelIndex === LEVELS.length - 1;

  document.querySelector('.npc-line').textContent = 'Valeria: "¡Listo, gracias! Ya la subo al boletín."';
  snapBtn.classList.add('hidden');
  document.querySelector('.hint-text').classList.add('hidden');

  const riskKeysThisLevel = activeItems.filter(k => items[k].isRisk);
  const exposedRisks = riskKeysThisLevel.filter(k => !fixedState[k]);
  const fixedRisks = riskKeysThisLevel.filter(k => fixedState[k]);

  const callouts = exposedRisks.map(k => {
    const p = POSITIONS[k];
    return `<div class="callout" style="left:${p.x}; top:${p.y}; width:${p.w}; height:${p.h};"></div>`;
  }).join('');

  deskWrap.classList.add('result-frame');
  deskWrap.style.position = 'relative';
  deskWrap.insertAdjacentHTML('beforeend', `<span class="result-badge">PUBLICADO EN EL BOLETÍN</span>${callouts}`);

  let title, resLevel, summary;
  if(exposedRisks.length === 0){ title = 'Escritorio impecable'; resLevel='safe'; summary = 'Acomodaste todo antes de la foto. Ningún dato sensible quedó expuesto en la publicación.'; }
  else if(exposedRisks.length <= 2){ title = 'Buen intento, pero algo se coló'; resLevel='danger'; summary = 'La mayoría del escritorio quedó bien, pero uno o dos elementos sensibles se colaron en la foto publicada.'; }
  else { title = 'La foto reveló más de lo que crees'; resLevel='danger'; summary = 'Varios elementos sensibles quedaron perfectamente visibles en una foto que ahora circula en el boletín interno o en redes de la empresa.'; }

  sessionResults.push({ label: level.label, exposed: exposedRisks.length, total: riskKeysThisLevel.length });

  const nextControls = isLastLevel
    ? `<div class="report" style="margin-top:14px;">
        <h2 style="font-size:1.15rem;">Resumen de la sesión</h2>
        <div class="recap-list">
          ${sessionResults.map(r => `
            <div class="recap-item">
              <span>${r.label}</span>
              <span class="recap-tag ${r.exposed === 0 ? 'safe' : 'danger'}">${r.exposed}/${r.total} expuestos</span>
            </div>
          `).join('')}
        </div>
        <button class="restart-btn" id="restartBtn">Repetir desde el nivel 1</button>
      </div>`
    : `<button class="restart-btn" id="nextLevelBtn">Siguiente nivel →</button>`;

  reportArea.innerHTML = `
    <div class="report" style="margin-top:18px;">
      <span class="report-stamp ${resLevel}">FOTO PUBLICADA — ${level.label.toUpperCase()}</span>
      <h2>${title}</h2>
      <p class="summary">${summary}</p>
      <div class="recap-list">
        ${riskKeysThisLevel.map(k => `
          <div class="recap-item">
            <span>${items[k].label}</span>
            <span class="recap-tag ${fixedState[k] ? 'safe' : 'danger'}">${fixedState[k] ? 'OCULTO' : 'EXPUESTO'}</span>
          </div>
        `).join('')}
      </div>
      ${exposedRisks.length ? `
        <div class="report" style="margin-top:8px; padding:0;">
          ${exposedRisks.map(k => `<p class="summary" style="margin-bottom:8px;"><strong>${items[k].label}:</strong> ${items[k].riskFeedback}</p>`).join('')}
        </div>` : ''}
      ${fixedRisks.length ? `
        <div class="report" style="margin-top:4px; padding:0;">
          ${fixedRisks.map(k => `<p class="summary" style="margin-bottom:8px; color:#2f6b52;"><strong>${items[k].label}:</strong> ${items[k].fixedFeedback}</p>`).join('')}
        </div>` : ''}
      ${nextControls}
    </div>
  `;

  if(isLastLevel){
    document.getElementById('restartBtn').addEventListener('click', () => startLevel(0, true));
  } else {
    document.getElementById('nextLevelBtn').addEventListener('click', () => startLevel(levelIndex + 1));
  }
}

function startLevel(idx, resetSession){
  levelIndex = idx;
  if(resetSession) sessionResults = [];

  const level = LEVELS[levelIndex];
  activeItems = [...CORE_KEYS, level.slotA, level.slotB];
  fixedState = {};
  activeItems.forEach(key => { if(items[key].isRisk) fixedState[key] = false; });

  timeLeft = level.time;
  finished = false;

  levelTab.textContent = `NIVEL ${levelIndex + 1}/${LEVELS.length}`;
  document.querySelector('.npc-line').textContent = level.npc;
  snapBtn.classList.remove('hidden');
  document.querySelector('.hint-text').classList.remove('hidden');
  reportArea.innerHTML = '';
  deskWrap.classList.remove('result-frame');

  gaugeFill.style.background = 'var(--safe)';
  gaugeFill.style.width = '100%';
  riskValue.textContent = Math.ceil(timeLeft) + 's';

  renderDesk();
  startTimer();
}

startLevel(0, true);
