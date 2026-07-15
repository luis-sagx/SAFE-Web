/* ---------- Trama: "cambié de número" / deepvoice ---------- */
const profile = window.MICProfile?.load();
const participantBanner = document.getElementById("participantBanner");

if (profile?.displayName) {
  participantBanner.textContent = `En entrenamiento: ${profile.displayName} · ${window.MICProfile.roleLabel(profile)}`;
}

const STORY = {
  n1:{ kind:"scene",
    msgs:[
      {type:"text", text:"Papi buenas, disculpa la hora 🙏 se me dañó el celular, este es un contacto nuevo, soy yo, Andrés."}
    ],
    choices:[
      {label:"Contestar: “¿qué pasó hijo? cuéntame”.", goto:"n2"},
      {label:"No responder aquí; llamar de una vez al número de siempre de mi hijo.", goto:"e_verifica"}
    ]},

  n2:{ kind:"scene",
    msgs:[
      {type:"voice", dur:"0:11",
       text:"Papi, tuve un problema, choqué el carro que me prestó un amigo y necesito depositar trescientos cincuenta dólares ahorita para no meterme en un lío legal. No puedo hablar mucho, estoy usando el celular de alguien."}
    ],
    choices:[
      {label:"Transferir el dinero de inmediato.", goto:"e_pago"},
      {label:"Pedir que me llame para escuchar bien su voz.", goto:"n3"},
      {label:"Preguntar algo que solo mi hijo real sabría.", goto:"n3b"}
    ]},

  n3:{ kind:"scene",
    msgs:[
      {type:"text", text:"No puedo llamar, este celular no tiene saldo ni datos, solo puedo escribirte y mandarte audios 😔"}
    ],
    choices:[
      {label:"Aceptar la excusa y transferir el dinero.", goto:"e_pago"},
      {label:"Insistir: “dime el nombre de nuestro perro”.", goto:"n3b"}
    ]},

  n3b:{ kind:"scene",
    msgs:[
      {type:"typing"},
      {type:"text", text:"Eh… ahorita no me acuerdo bien, estoy nervioso con todo esto. Mejor solo ayúdame con la plata porfa 🙏"}
    ],
    choices:[
      {label:"Transferir igual; no quiero arriesgar a mi hijo.", goto:"e_pago"},
      {label:"No logra responder bien; salir del chat y llamar a mi hijo real.", goto:"e_instinto"}
    ]},

  /* ---- Finales ---- */
  e_pago:{ kind:"bad",
    verdict:"Caíste en la estafa",
    outcome:"Transferiste el dinero a la cuenta que te dieron. Cuando lograste hablar con tu hijo real, él no sabía nada de ningún choque ni de ese número." },

  e_verifica:{ kind:"good",
    verdict:"No caíste · verificaste por tu cuenta",
    outcome:"Llamaste directamente al número de siempre de tu hijo. Él contestó normal, sin ningún problema, y confirmaron juntos que era un intento de estafa." },

  e_instinto:{ kind:"good",
    verdict:"No caíste · notaste que algo no cuadraba",
    outcome:"La persona no pudo responder algo que tu hijo real sabría. Saliste del chat y lo llamaste: todo estaba bien, no había pasado nada." }
};

const SIGNALS=[
  "Escribe desde un <b>número nuevo</b>, sin llamar.",
  "Usa una <b>excusa</b> para no poder hablar por voz o videollamada.",
  "Pide <b>dinero urgente</b> a una cuenta que no reconoces.",
  "No logra responder una <b>pregunta de verificación</b> sencilla."
];
const RULE="Regla de oro: si un familiar te escribe pidiendo dinero desde un número nuevo, <b>llámalo tú al número de siempre</b> o pregúntale algo que solo esa persona sabría, antes de enviar nada.";

/* ---------- Voz para la nota de audio (deepvoice) ---------- */
let esVoices=[], speechOK=("speechSynthesis" in window);
function loadVoices(){ if(!speechOK) return; esVoices=speechSynthesis.getVoices().filter(v=>/^es/i.test(v.lang)); }
if(speechOK){ loadVoices(); speechSynthesis.onvoiceschanged=loadVoices; }

/* ---------- Refs ---------- */
const thread=document.getElementById("thread");
const choicesEl=document.getElementById("choices");
const promptEl=document.getElementById("prompt");
const resultEl=document.getElementById("result");
const composer=document.getElementById("composer");
const nAudio=document.getElementById("nAudio");

let current=null;

function scrollDown(){ thread.scrollTop=thread.scrollHeight; }

function render(id){
  current=id;
  const node=STORY[id];
  choicesEl.innerHTML=""; promptEl.hidden=true; resultEl.hidden=true;

  if(node.kind==="scene"){
    playSequence(node.msgs.slice(), 0, ()=>{
      promptEl.hidden=false;
      node.choices.forEach((c,i)=>{
        const b=document.createElement("button");
        b.className="choice";
        b.innerHTML='<span class="n">'+(i+1)+'</span><span>'+c.label+'</span>';
        b.addEventListener("click",()=>render(c.goto));
        choicesEl.appendChild(b);
      });
      scrollDown();
    });
  } else {
    endChat(node);
  }
}

function playSequence(list, i, done){
  if(i>=list.length){ done(); return; }
  const item=list[i];

  if(item.type==="typing"){
    const t=document.createElement("div");
    t.className="typing"; t.innerHTML="<i></i><i></i><i></i>";
    thread.appendChild(t); scrollDown();
    setTimeout(()=>{ t.remove(); playSequence(list,i+1,done); }, 900);
    return;
  }

  const row=document.createElement("div");
  row.className="row in";

  if(item.type==="text"){
    row.innerHTML='<div class="bubble">'+item.text+'<span class="time">'+nowTime()+'</span></div>';
    thread.appendChild(row); scrollDown();
    setTimeout(()=>playSequence(list,i+1,done), 550);
  } else if(item.type==="voice"){
    const vb=document.createElement("div");
    vb.className="bubble voicewrap";
    vb.innerHTML=
      '<div class="voicebubble">'+
        '<button class="play" aria-label="Reproducir nota de voz">▶</button>'+
        '<div class="wave">'+Array.from({length:14}).map(()=> "<i></i>").join("")+'</div>'+
        '<span class="dur">'+item.dur+'</span>'+
      '</div>'+
      '<div class="transcript">'+
        '<div class="tlabel">📝 Transcripción</div>'+
        '“'+item.text+'”'+
      '</div>';
    row.appendChild(vb);
    thread.appendChild(row); scrollDown();

    const btn=vb.querySelector(".play");
    const wave=vb.querySelector(".voicebubble");
    btn.addEventListener("click",()=>toggleVoice(btn, wave, item.text));
    setTimeout(()=>playSequence(list,i+1,done), 400);
  }
}

function nowTime(){
  const d=new Date();
  return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
}

let activeUtterance=null;
function toggleVoice(btn, vb, text){
  if(!speechOK || !esVoices.length){
    nAudio.textContent="Tu navegador no reproduce voz; puedes leer el mensaje en el texto de la conversación.";
    return;
  }
  if(vb.classList.contains("playing")){
    speechSynthesis.cancel();
    vb.classList.remove("playing"); btn.textContent="▶";
    return;
  }
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang="es-ES"; if(esVoices[0]) u.voice=esVoices[0];
  u.rate=1.0; u.pitch=1.05;
  u.onstart=()=>{ vb.classList.add("playing"); btn.textContent="❚❚"; };
  u.onend=()=>{ vb.classList.remove("playing"); btn.textContent="▶"; };
  u.onerror=()=>{ vb.classList.remove("playing"); btn.textContent="▶"; };
  activeUtterance=u;
  speechSynthesis.speak(u);
}

function endChat(node){
  speechSynthesis && speechSynthesis.cancel();
  composer.style.display="none";
  promptEl.hidden=true; choicesEl.innerHTML="";

  const sig=SIGNALS.map(s=>'<li><span class="b">•</span><span>'+s+'</span></li>').join("");
  resultEl.className="result "+(node.kind==="good"?"good":"bad");
  resultEl.hidden=false;
  resultEl.innerHTML=
    '<p class="verdict"><span class="badge">'+(node.kind==="good"?"✓":"✕")+'</span>'+node.verdict+'</p>'+
    '<p class="outcome">'+node.outcome+'</p>'+
    '<div class="panel"><h4>Las señales de esta conversación</h4><ul class="signals">'+sig+'</ul>'+
    '<div class="rule">'+RULE+'</div></div>'+
    '<button class="again" id="againBtn">↻ Repetir la conversación</button>';
  document.getElementById("againBtn").addEventListener("click",restart);
}

function restart(){
  thread.innerHTML='<div class="daychip">Hoy · 21:14</div>';
  composer.style.display="";
  resultEl.hidden=true;
  render("n1");
}

window.addEventListener("load",()=>{
  render("n1");
  setTimeout(()=>{
    if(!speechOK) nAudio.textContent="Tu navegador no reproduce voz; puedes leer los mensajes igual.";
    else if(!esVoices.length) nAudio.textContent="Para escuchar la nota de voz, usa Chrome o Edge con el sonido activado.";
  },500);
});
