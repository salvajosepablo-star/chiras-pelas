// =====================================================================
// CHIRAS PELAS — Sonidos, música y narrador
// Todos los sonidos se generan con el navegador (Web Audio), así que no
// dependen de archivos con derechos de autor.
// Narrador: si existe voces/<clave>.mp3 se usa esa grabación; si no, se
// usa la voz del sistema (speechSynthesis) del celular o computador.
// =====================================================================
(function(){
const N = window.ChirasNucleo;
const ac = () => (N.sonidoActivo() ? N.getAudio() : null);
const bus = a => a._efectos || a.destination;

// ---------- piezas básicas ----------
function tono(f, dur, vol, tipo, fFin, retraso){
  const a = ac(); if (!a) return;
  const t = a.currentTime + (retraso || 0), o = a.createOscillator(), g = a.createGain();
  o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t);
  if (fFin) o.frequency.exponentialRampToValueAtTime(fFin, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus(a)); o.start(t); o.stop(t + dur + 0.03);
}
let bufRuido = null;
function ruidoBuffer(a){
  if (bufRuido) return bufRuido;
  bufRuido = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
  const d = bufRuido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return bufRuido;
}
function ruido(dur, vol, filtro, f, fFin, q, retraso, destino){
  const a = ac(); if (!a) return;
  const t = a.currentTime + (retraso || 0);
  const s = a.createBufferSource(); s.buffer = ruidoBuffer(a);
  const fl = a.createBiquadFilter(); fl.type = filtro || 'lowpass'; fl.frequency.setValueAtTime(f, t); fl.Q.value = q || 1;
  if (fFin) fl.frequency.exponentialRampToValueAtTime(fFin, t + dur);
  const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(g).connect(destino || bus(a)); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
const arpegio = (notas, paso, dur, vol, tipo) => notas.forEach((f, i) => tono(f, dur, vol, tipo, null, i * paso));

// ---------- efectos ----------
const sfx = {
  apuntar: () => tono(1200, 0.04, 0.06, 'square'),
  carga: f => tono(260 + f * 900, 0.05, 0.05 + f * 0.05, 'square'),
  maxima: () => { tono(1568, 0.12, 0.12, 'triangle'); tono(2093, 0.18, 0.1, 'triangle', null, 0.06); },
  soltar: f => { ruido(0.18 + f * 0.15, 0.15 + f * 0.25, 'bandpass', 2500, 500, 1.2); tono(500 + f * 400, 0.06, 0.1, 'square'); },
  negado: () => { tono(180, 0.12, 0.15, 'square'); tono(140, 0.15, 0.12, 'square', null, 0.09); },
  hueco: () => N.sfx.hueco(),
  verdad: () => arpegio([523, 659, 784, 1046, 1318], 0.08, 0.25, 0.18, 'triangle'),
  quitar: () => arpegio([880, 660, 440], 0.07, 0.15, 0.16, 'sawtooth'),
  barrera: () => { tono(330, 0.5, 0.18, 'sine', 990); tono(660, 0.4, 0.08, 'triangle', 1320, 0.05); ruido(0.4, 0.08, 'highpass', 4000); },
  barreraGolpe: () => { tono(1800, 0.35, 0.22, 'triangle', 900); tono(2700, 0.25, 0.12, 'sine', 1500); ruido(0.15, 0.2, 'highpass', 3000); },
  barreraRota: () => { ruido(0.5, 0.25, 'highpass', 6000, 1500); arpegio([2400, 1800, 1200], 0.05, 0.12, 0.1, 'triangle'); },
  electrico: () => {
    for (let i = 0; i < 7; i++) tono(90 + Math.random() * 60, 0.06, 0.2, 'sawtooth', 2000 + Math.random() * 2000, i * 0.045);
    ruido(0.45, 0.22, 'bandpass', 3000, 6000, 3);
  },
  teleport: () => { tono(200, 0.35, 0.15, 'sine', 1800); tono(1800, 0.35, 0.1, 'sine', 200, 0.12); ruido(0.3, 0.08, 'bandpass', 1500, 6000, 4); },
  superpotencia: () => { tono(110, 0.6, 0.25, 'sawtooth', 440); arpegio([440, 554, 659, 880], 0.07, 0.2, 0.12, 'square'); },
  congelacion: () => { arpegio([2637, 2349, 2093, 1760, 1568], 0.05, 0.25, 0.08, 'sine'); ruido(0.6, 0.1, 'highpass', 7000, 3000); },
  turbo: () => { tono(150, 0.5, 0.2, 'sawtooth', 900); ruido(0.5, 0.15, 'bandpass', 800, 4000, 2); },
  trueno: () => { ruido(1.4, 0.55, 'lowpass', 900, 60, 0.7); ruido(0.15, 0.4, 'highpass', 2500); tono(55, 0.9, 0.35, 'sine', 35); },
  choqueFuerte: f => { tono(420 - Math.min(f, 10) * 15, 0.15, Math.min(0.3, 0.05 + f * 0.03), 'triangle'); },
  explosion: () => { ruido(1.0, 0.6, 'lowpass', 2500, 80, 0.8); tono(80, 0.6, 0.45, 'sine', 30); ruido(0.08, 0.35, 'highpass', 3000); },
  eliminacion: () => arpegio([784, 622, 523, 392, 311], 0.09, 0.22, 0.14, 'square'),
  victoria: () => {
    arpegio([523, 659, 784, 1046], 0.12, 0.3, 0.16, 'square');
    [1046, 1318, 1568].forEach(f => tono(f, 0.9, 0.09, 'triangle', null, 0.55));
  },
  cuenta: n => tono(n > 0 ? 660 : 1320, n > 0 ? 0.15 : 0.45, 0.2, 'square'),
  inicio: () => arpegio([392, 523, 659, 784], 0.06, 0.18, 0.12, 'triangle')
};

// ---------- sonido de rodar por la arena (un solo ruido continuo) ----------
let rodarNodo = null;
function rodar(nivel){
  const a = ac();
  if (!a){ if (rodarNodo){ try { rodarNodo.s.stop(); } catch (e) {} rodarNodo = null; } return; }
  if (!rodarNodo){
    const s = a.createBufferSource(); s.buffer = ruidoBuffer(a); s.loop = true;
    const fl = a.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 900; fl.Q.value = 0.7;
    const g = a.createGain(); g.gain.value = 0;
    s.connect(fl).connect(g).connect(bus(a)); s.start();
    rodarNodo = {s, fl, g};
  }
  const v = Math.min(0.16, nivel * 0.018);
  rodarNodo.g.gain.setTargetAtTime(v, a.currentTime, 0.06);
  rodarNodo.fl.frequency.setTargetAtTime(500 + Math.min(nivel, 14) * 90, a.currentTime, 0.1);
}
function pararRodar(){ if (rodarNodo){ try { rodarNodo.s.stop(); } catch (e) {} rodarNodo = null; } }

// ---------- música arcade sencilla (se genera, no es una canción grabada) ----------
let musica = null, intensidad = 0;
function ponerIntensidad(n){ intensidad = n; }
function iniciarMusica(){
  const a = N.getAudio(); if (!a || musica) return;
  const paso = 60 / 124 / 4; // semicorcheas a 124 pulsos por minuto
  const bajo = [110, 0, 110, 0, 131, 0, 110, 0, 98, 0, 98, 0, 82, 0, 98, 0];
  const melodia = [440, 0, 523, 0, 659, 0, 523, 0, 392, 0, 494, 0, 587, 0, 494, 0];
  let n = 0, prox = a.currentTime + 0.1;
  const destino = a._musica || a.destination;
  const nota = (f, t, dur, vol, tipo) => {
    const o = a.createOscillator(), g = a.createGain(); o.type = tipo; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(destino); o.start(t); o.stop(t + dur + 0.02);
  };
  const golpe = (t, f0, dur, vol) => {
    const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(40, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(destino); o.start(t); o.stop(t + dur + 0.02);
  };
  const plato = (t, vol, dur) => {
    const s = a.createBufferSource(); s.buffer = ruidoBuffer(a);
    const fl = a.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 7000;
    const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(g).connect(destino); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  };
  const id = setInterval(() => {
    if (!N.sonidoActivo()) { prox = a.currentTime + 0.1; return; }
    while (prox < a.currentTime + 0.15){
      const i = n % 16, compas = Math.floor(n / 16) % 4;
      if (i % 4 === 0) golpe(prox, 150, 0.18, 0.5);
      if (i === 4 || i === 12) plato(prox, 0.25, 0.12);
      if (i % 2 === 1) plato(prox, 0.08, 0.04);
      if (bajo[i]) nota(bajo[i] * (compas === 3 ? 1.122 : 1), prox, paso * 1.8, 0.22, 'triangle');
      if (melodia[i] && (compas % 2 === 1 || intensidad >= 1)) nota(melodia[i] * (compas === 3 ? 1.122 : 1), prox, paso * 1.6, 0.06, 'square');
      // música dinámica: más intensa cuando alguien tiene LA VERDAD o está atacando
      if (intensidad >= 1 && i % 2 === 0) plato(prox, 0.05, 0.03);
      if (intensidad >= 2){ if (i % 4 === 2) golpe(prox, 120, 0.12, 0.3); if (bajo[i]) nota(bajo[i] * 2, prox, paso * 0.9, 0.08, 'sawtooth'); }
      prox += paso; n++;
    }
  }, 30);
  musica = {id};
}
function pararMusica(){ if (musica){ clearInterval(musica.id); musica = null; } }

// ---------- narrador ----------
// Claves de voz y el texto que se dice si no hay grabación.
const FRASES = {
  barrera: '¡Barrera activada!', cero: '¡Poder cero!', descuadris: '¡Descuadris!',
  superpotencia: '¡Superpotencia!', congelacion: '¡Congelación!', turbo: '¡Turbo!', trueno: '¡Golpe trueno!',
  verdad: '¡La verdad!', nochera: '¡Nochera muere!', eliminacion: '¡Eliminación!',
  victoria: '¡Victoria!', rey: '¡Eres el rey de las chiras!', fantasma: '¡Rebote fantasma!', carambola: '¡Carambola muere!',
  me_enchole: '¡Me encholé!', maestro: '¡Tiro maestro!', combo: '¡Combo!', repeticion: '¡Repetición!',
  viento: '¡Cuidado con el viento!', movediza: '¡Arena movediza!', rapido: '¡Terreno rápido!', subio: '¡Subió de nivel!'
};
const grabadas = {};   // clave -> HTMLAudioElement si existe voces/<clave>.mp3
function buscarGrabaciones(){
  if (N.MODO_PRUEBA) return;
  Object.keys(FRASES).forEach(k => {
    fetch('voces/' + k + '.mp3', {method: 'HEAD'}).then(r => { if (r.ok){ const el = new Audio('voces/' + k + '.mp3'); el.preload = 'auto'; grabadas[k] = el; } }).catch(() => {});
  });
}
let vozElegida = null;
function elegirVoz(){
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang));
  if (!vs.length) return null;
  const hombre = /(jorge|diego|pablo|ra[uú]l|juan|carlos|enrique|andr[eé]s|[aá]lvaro|miguel|antonio|jos[eé]|gonzalo|sergio|tom[aá]s|alonso|gerardo|dar[ií]o|male|hombre|masculin)/i;
  const latino = v => /(CO|MX|US|419|AR|CL|PE|VE)/i.test(v.lang);
  return vs.find(v => hombre.test(v.name) && latino(v)) || vs.find(v => hombre.test(v.name))
      || vs.find(v => /CO/i.test(v.lang)) || vs.find(latino) || vs[0];
}
if ('speechSynthesis' in window){
  vozElegida = elegirVoz();
  speechSynthesis.onvoiceschanged = () => { vozElegida = elegirVoz(); };
}
let ultimaVoz = 0;
function voz(clave, texto){
  const t = texto || FRASES[clave] || clave;
  if (N.MODO_PRUEBA){ console.log('[voz] ' + t); return; }
  if (!N.sonidoActivo() || N.volumen.voz <= 0) return;
  const g = grabadas[clave];
  if (g){
    try { g.pause(); g.currentTime = 0; g.volume = N.volumen.voz; g.play().catch(() => {}); } catch (e) {}
    return;
  }
  if (!('speechSynthesis' in window)) return;
  try {
    // si el narrador está hablando hace rato, se corta para anunciar lo nuevo
    const ahora = performance.now();
    if (speechSynthesis.speaking && ahora - ultimaVoz > 700) speechSynthesis.cancel();
    ultimaVoz = ahora;
    const u = new SpeechSynthesisUtterance(t);
    if (vozElegida){ u.voice = vozElegida; u.lang = vozElegida.lang; } else u.lang = 'es-CO';
    u.rate = 1.12; u.pitch = 1.12; u.volume = N.volumen.voz;
    speechSynthesis.speak(u);
  } catch (e) {}
}
function nombreVoz(){ return vozElegida ? `${vozElegida.name} (${vozElegida.lang})` : 'ninguna'; }
buscarGrabaciones();

// Sonidos del espectáculo
Object.assign(sfx, {
  cristal: f => { const v = Math.min(0.12, 0.02 + f * 0.012); [3200, 4700, 6100].forEach((fr, i) => tono(fr * (0.92 + Math.random() * 0.16), 0.18 + i * 0.05, v / (i + 1), 'sine')); },
  cauchera: f => { ruido(0.07, 0.25 + f * 0.25, 'highpass', 1800); tono(140 + f * 60, 0.1, 0.18, 'triangle', 60); },
  transformacion: () => { tono(220, 0.9, 0.18, 'sawtooth', 880); arpegio([784, 988, 1175, 1568, 1976], 0.07, 0.4, 0.1, 'triangle'); ruido(0.8, 0.07, 'highpass', 6000, 9000); },
  corona: () => arpegio([1568, 1976, 2349, 3136], 0.06, 0.5, 0.07, 'sine'),
  maestro: () => { arpegio([659, 880, 1046, 1318, 1760], 0.06, 0.25, 0.14, 'square'); tono(110, 0.5, 0.25, 'sawtooth', 220, 0.05); },
  combo: () => { arpegio([523, 784, 1046], 0.05, 0.2, 0.15, 'sawtooth'); arpegio([1046, 1568, 2093], 0.05, 0.3, 0.08, 'triangle'); },
  aplastar: () => { tono(90, 0.25, 0.4, 'square', 35); ruido(0.25, 0.4, 'lowpass', 1200, 200, 2); ruido(0.12, 0.15, 'highpass', 4000, null, 1, 0.08); },
  estallido: () => { ruido(0.6, 0.45, 'highpass', 5000, 2500); for (let i = 0; i < 9; i++) tono(2500 + Math.random() * 4500, 0.12 + Math.random() * 0.2, 0.05, 'sine', null, Math.random() * 0.35); },
  repeticion: () => { tono(1800, 0.35, 0.1, 'sine', 300); ruido(0.35, 0.08, 'bandpass', 3000, 600, 3); },
  viento: () => ruido(2.2, 0.18, 'bandpass', 400, 1400, 0.8),
  evento: () => arpegio([392, 523, 392, 523], 0.09, 0.15, 0.1, 'square'),
  nivel: () => arpegio([523, 659, 784, 1046, 1318, 1568], 0.08, 0.3, 0.14, 'triangle'),
  // el tiro como un planeta pasando: "shoo" que baja, rugido grave y un silbido que se aleja
  meteoro: f => {
    ruido(0.8 + f * 0.9, 0.2 + f * 0.4, 'bandpass', 3800, 220, 1.4);
    tono(95, 0.9 + f, 0.18 + f * 0.22, 'sawtooth', 32);
    tono(1500, 0.6 + f * 0.4, 0.05 + f * 0.05, 'sine', 260);
    if (f > 0.6) ruido(0.25, 0.3, 'lowpass', 600, 80, 1);
  },
  recoger: () => arpegio([880, 1175, 1568, 2093], 0.05, 0.22, 0.12, 'triangle')
});
window.ChirasAudio = {sfx, rodar, pararRodar, iniciarMusica, pararMusica, voz, FRASES, nombreVoz, ponerIntensidad};
})();
