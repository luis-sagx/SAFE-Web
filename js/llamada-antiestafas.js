const profile = window.MICProfile?.load();
const participantBanner = document.getElementById("participantBanner");

if (profile?.displayName) {
  participantBanner.querySelector("span").textContent = `En entrenamiento: ${profile.displayName} · ${window.MICProfile.roleLabel(profile)}`;
}

/* ---------- Trama (mismo caso: premio falso) ---------- */
const STORY = {
  n1:{ kind:"scene",
    caller:[
      "¡Muy buenas tardes! Le llamo de Almacenes La Ganga. ¡Felicidades! Su número resultó ganador de una cocina de inducción en nuestro sorteo."
    ],
    choices:[
      {label:"Escuchar qué más dice.", goto:"n2"},
      {label:"Decir: “yo no participé en ningún sorteo”.", goto:"n2b"}
    ]},

  n2:{ kind:"scene",
    caller:[
      "El sistema la eligió al azar, no se preocupe. Solo debe pagar cuarenta dólares del impuesto de entrega.",
      "Deposítelos a la cuenta personal de mi compañera María y hoy mismo le llevamos su cocina a la casa."
    ],
    choices:[
      {label:"Pagar los cuarenta dólares; es poco por una cocina.", goto:"e_pago"},
      {label:"Preguntar: “¿por qué debo pagar para recibir un premio?”", goto:"n3"},
      {label:"Decir: “voy a colgar y llamar yo al almacén para confirmar”.", goto:"e_verifica"}
    ]},

  n2b:{ kind:"scene",
    caller:[
      "Ah, pero el sorteo es automático con su número de cédula, igual usted ganó.",
      "Solo pague el impuesto de entrega y su cocina llega hoy mismo, señora."
    ],
    choices:[
      {label:"Ceder; suena convincente.", goto:"n3"},
      {label:"Colgar: “si yo no participé, esto no es real”.", goto:"e_instinto"}
    ]},

  n3:{ kind:"scene",
    caller:[
      "Mire, la promoción vence en una hora. Si no paga ahora mismo, pierde la cocina y se la damos a otra persona.",
      "¿Le tomo los datos para el depósito ya?"
    ],
    choices:[
      {label:"Apurarse y pagar antes de perderla.", goto:"e_pago"},
      {label:"No dejarse presionar: colgar y verificar con calma.", goto:"e_verifica"}
    ]},

  /* ---- Finales ---- */
  e_pago:{ kind:"bad",
    verdict:"Caíste en la estafa",
    outcome:"Pagaste los cuarenta dólares a esa cuenta. La cocina nunca llegó y ese número dejó de contestar." },

  e_verifica:{ kind:"good",
    verdict:"No caíste · verificaste por tu cuenta",
    outcome:"Colgaste y llamaste al número real del almacén. Allí no había ningún sorteo. No perdiste ni un centavo." },

  e_instinto:{ kind:"good",
    verdict:"No caíste · seguiste tu instinto",
    outcome:"Colgaste sin dudar. Tenías razón: nadie gana un premio que nunca pidió." },

  e_colgar:{ kind:"good",
    verdict:"No caíste · colgaste la llamada",
    outcome:"Colgaste. Nunca estás obligado a seguir escuchando: colgar es una defensa perfectamente válida." },

  e_reject:{ kind:"good",
    verdict:"No caíste · no contestaste",
    outcome:"Rechazaste una llamada de un número desconocido. Es una decisión válida y segura: no tienes que contestar a quien no conoces." }
};

const SIGNALS=[
  "Un premio que <b>nunca pediste</b>.",
  "Te piden <b>pagar</b> para poder recibirlo.",
  "El dinero va a una <b>cuenta personal</b>, no a la empresa.",
  "Te meten <b>prisa</b>: “solo por hoy”."
];
const RULE="Regla de oro: <b>nunca pagues para recibir un premio</b>. Cuelga y llama tú al número oficial del negocio.";

/* ---------- Voz (solo quien llama) ---------- */
let esVoices=[], speechOK=("speechSynthesis" in window);
function loadVoices(){ if(!speechOK) return; esVoices=speechSynthesis.getVoices().filter(v=>/^es/i.test(v.lang)); }
if(speechOK){ loadVoices(); speechSynthesis.onvoiceschanged=loadVoices; }
const CALLER_CFG={rate:1.0,pitch:.84};

/* ---------- Refs ---------- */
const call=document.getElementById("call");
const incoming=document.getElementById("incoming");
const answerBtn=document.getElementById("answerBtn");
const rejectBtn=document.getElementById("rejectBtn");
const captions=document.getElementById("captions");
const choicesEl=document.getElementById("choices");
const promptEl=document.getElementById("prompt");
const resultEl=document.getElementById("result");
const timerEl=document.getElementById("timer");
const statusText=document.getElementById("statusText");
const repeatBtn=document.getElementById("repeatBtn");
const skipBtn=document.getElementById("skipBtn");
const hangupBtn=document.getElementById("hangupBtn");
const phoneControls=document.getElementById("phoneControls");
const nAudio=document.getElementById("nAudio");

let current=null, speaking=false, timerInt=null, seconds=0;

/* ---------- Cronómetro ---------- */
function startTimer(){ seconds=0; updTimer(); timerInt=setInterval(()=>{seconds++;updTimer();},1000); }
function stopTimer(){ clearInterval(timerInt); timerInt=null; }
function updTimer(){
  const m=String(Math.floor(seconds/60)).padStart(2,"0");
  const s=String(seconds%60).padStart(2,"0");
  timerEl.textContent=m+":"+s;
}

/* ---------- Flujo ---------- */
answerBtn.addEventListener("click",()=>{
  incoming.setAttribute("hidden","");
  call.classList.remove("ringing");
  if(speechOK && !esVoices.length) loadVoices();
  startTimer();
  render("n1");
});
rejectBtn.addEventListener("click",()=>{
  incoming.setAttribute("hidden","");
  call.classList.remove("ringing");
  statusText.textContent="Llamada rechazada";
  call.classList.add("ended");
  render("e_reject");
});
repeatBtn.addEventListener("click",()=>{ if(current && STORY[current].kind==="scene") render(current,true); });
skipBtn.addEventListener("click",stopVoice);
hangupBtn.addEventListener("click",hangup);
hangupBtn.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();hangup();} });

function hangup(){
  if(!current || STORY[current].kind!=="scene") return;
  render("e_colgar");
}

function render(id){
  current=id;
  const node=STORY[id];
  stopVoice();
  choicesEl.innerHTML="";
  promptEl.hidden=true;
  resultEl.hidden=true;
  repeatBtn.hidden=true;

  if(node.kind==="scene"){
    // pintar subtítulos
    captions.innerHTML='<span class="cap-tag">Quien llama</span>';
    node.caller.forEach((t,i)=>{
      const d=document.createElement("div");
      d.className="cap-line"; d.dataset.idx=i; d.textContent=t;
      captions.appendChild(d);
    });
    speakNode(node);
  } else {
    endCall(node);
  }
}

function revealChoices(node){
  call.classList.remove("playing");
  speaking=false; skipBtn.hidden=true;
  repeatBtn.hidden=false;
  captions.querySelectorAll(".cap-line").forEach(l=>l.classList.add("active"));
  promptEl.hidden=false;
  node.choices.forEach((c,i)=>{
    const b=document.createElement("button");
    b.className="choice";
    b.innerHTML='<span class="n">'+(i+1)+'</span><span>'+c.label+'</span>';
    b.addEventListener("click",()=>render(c.goto));
    choicesEl.appendChild(b);
  });
}

function endCall(node){
  stopVoice(); stopTimer();
  call.classList.add("ended");
  statusText.textContent="Llamada finalizada";
  phoneControls.style.display="none";
  repeatBtn.hidden=true; skipBtn.hidden=true; promptEl.hidden=true;
  captions.innerHTML='<span class="cap-tag">Llamada finalizada</span>'+
    '<div class="cap-line active" style="opacity:.55;font-size:15px;">Duración: '+timerEl.textContent+'</div>';

  const sig=SIGNALS.map(s=>'<li><span class="b">•</span><span>'+s+'</span></li>').join("");
  resultEl.className="result "+(node.kind==="good"?"good":"bad");
  resultEl.hidden=false;
  resultEl.innerHTML=
    '<p class="verdict"><span class="badge">'+(node.kind==="good"?"✓":"✕")+'</span>'+node.verdict+'</p>'+
    '<p class="outcome">'+node.outcome+'</p>'+
    '<div class="panel"><h4>Las 4 señales de esta llamada</h4><ul class="signals">'+sig+'</ul>'+
    '<div class="rule">'+RULE+'</div></div>'+
    '<button class="again" id="againBtn">↻ Recibir la llamada otra vez</button>';
  document.getElementById("againBtn").addEventListener("click",restart);
}

function restart(){
  call.classList.remove("ended");
  call.classList.add("ringing");
  statusText.textContent="En llamada";
  phoneControls.style.display="";
  resultEl.hidden=true;
  choicesEl.innerHTML="";
  promptEl.hidden=true;
  captions.innerHTML='<span class="cap-tag">Quien llama</span>';
  timerEl.textContent="00:00";
  incoming.removeAttribute("hidden");
  current=null;
}

/* ---------- Voz ---------- */
let queue=[], qi=0;
function speakNode(node){
  if(!speechOK || !esVoices.length){
    call.classList.remove("playing");
    setTimeout(()=>revealChoices(node),400);
    return;
  }
  speaking=true; call.classList.add("playing"); skipBtn.hidden=false;
  queue=node.caller.slice(); qi=0; speakNext(node);
}
function speakNext(node){
  if(!speaking) return;
  if(qi>=queue.length){ revealChoices(node); return; }
  const u=new SpeechSynthesisUtterance(queue[qi]);
  u.lang="es-ES"; if(esVoices[0]) u.voice=esVoices[0];
  u.rate=CALLER_CFG.rate; u.pitch=CALLER_CFG.pitch;
  u.onstart=()=>{
    captions.querySelectorAll(".cap-line").forEach(l=>l.classList.remove("active"));
    const el=captions.querySelector('.cap-line[data-idx="'+qi+'"]'); if(el) el.classList.add("active");
  };
  u.onend=()=>{ qi++; speakNext(node); };
  u.onerror=()=>{ qi++; speakNext(node); };
  speechSynthesis.speak(u);
}
function stopVoice(){
  if(speechOK) speechSynthesis.cancel();
  if(speaking && current && STORY[current].kind==="scene"){ speaking=false; revealChoices(STORY[current]); }
}

window.addEventListener("load",()=>{
  setTimeout(()=>{
    if(!speechOK) nAudio.textContent="Tu navegador no reproduce voz; puedes leer la llamada igual.";
    else if(!esVoices.length) nAudio.textContent="Para escuchar la voz, usa Chrome o Edge con el sonido activado.";
  },500);
});
