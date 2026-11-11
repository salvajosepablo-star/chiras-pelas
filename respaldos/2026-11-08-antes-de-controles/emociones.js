// =====================================================================
// CHIRAS PELAS — Emociones, rivalidades y acción (solo presentación)
// No cambia reglas, turnos, poderes, controles, mapas, modos ni resultados.
// Escucha lo que pasa en el Clásico, la Batalla y la Supervivencia y agrega:
//  1. Venganza cumplida       2. Tensión cuando está en peligro
//  3. Golpes con chispas, onda, vibración y sonido según la fuerza
//  4. Narrador con frases variadas para jugadas difíciles
//  5. Rivalidades (quién ha eliminado más a quién)
//  6. Repetición corta en el Clásico para eliminaciones extraordinarias
//  7. Celebración de victoria (confeti, luces, música, campeón)
//  8. Guardar y compartir jugadas (imagen) — WhatsApp desde el celular
//  9. Títulos: El Cazador, El Intocable, Rey de la Precisión, La Leyenda de las Chiras
// =====================================================================
(function(){
const N = window.ChirasNucleo, A = window.ChirasAudio;
if (!N || !A){ console.error('Emociones: faltan módulos'); return; }
const {THREE, scene, camera, renderer, R, HOLE} = N;
const V3 = THREE.Vector3;
const $ = s => document.querySelector(s);
const G = () => window.ChirasGraficos, B = window.ChirasBatalla;
const PRUEBA = N.MODO_PRUEBA;
const log = t => { if (PRUEBA) console.log('[emo] ' + t); };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const stats = {venganzas: 0, felicitaciones: 0, golpes: 0, repeticiones: 0, celebraciones: 0, momentos: 0, titulos: 0, peligro: 0};

// ---------------------------------------------------------------------
// Datos guardados (rivalidades, venganzas pendientes, títulos)
// ---------------------------------------------------------------------
const CLAVE = 'chiras-emociones';
let datos = {rival: {}, pendiente: {}, perfiles: {}};
try { if (!PRUEBA){ const d = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (d && d.rival) datos = Object.assign({pendiente: {}, perfiles: {}}, d); } } catch (e) {}
const guardar = () => { if (PRUEBA) return; try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {} };
const perfil = n => datos.perfiles[n] = datos.perfiles[n] || {elim: 0, dificiles: 0, victorias: 0, titulos: []};

// ---------------------------------------------------------------------
// Interfaz: estilos, aviso grande, viñeta de peligro, confeti, galería
// ---------------------------------------------------------------------
const css = document.createElement('style');
css.textContent = `
.emo-grande{--c:#ff3355;position:fixed;left:50%;top:44%;transform:translate(-50%,-50%) scale(.6);z-index:40;text-align:center;font-family:var(--display);font-size:clamp(30px,10vw,58px);color:#fff;text-shadow:0 4px 0 var(--c),0 0 30px var(--c),0 0 60px var(--c);opacity:0;transition:opacity .2s,transform .25s cubic-bezier(.2,1.6,.4,1);pointer-events:none;width:94vw;line-height:1}
.emo-grande small{display:block;font-size:.38em;color:var(--amarillo);margin-top:6px;text-shadow:0 2px 0 #000}
.emo-grande.ver{opacity:1;transform:translate(-50%,-50%) scale(1)}
.emo-peligro{position:fixed;inset:0;pointer-events:none;z-index:3;box-shadow:inset 0 0 90px 30px rgba(220,20,40,.55);opacity:0;transition:opacity .4s}
.emo-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 170px);z-index:41;background:rgba(20,12,6,.88);border:2px solid var(--amarillo);border-radius:12px;padding:6px 14px;font-family:var(--display);font-size:15px;color:var(--crema);pointer-events:none;opacity:0;transition:opacity .25s;max-width:92vw;text-align:center}
.emo-toast.ver{opacity:1}
.emo-confeti{position:fixed;inset:0;z-index:45;pointer-events:none}
.emo-luces{position:fixed;inset:-50%;z-index:44;pointer-events:none;background:repeating-conic-gradient(from 0deg,rgba(255,225,74,.18) 0 10deg,transparent 10deg 30deg);animation:emoGiro 6s linear infinite;opacity:0;transition:opacity .5s}
.emo-luces.ver{opacity:1}
@keyframes emoGiro{to{transform:rotate(360deg)}}
.emo-rep{position:fixed;border:3px solid var(--amarillo);border-radius:12px;pointer-events:none;z-index:5;box-shadow:0 0 0 2px #000,0 6px 18px rgba(0,0,0,.5)}
.emo-rep span{position:absolute;left:8px;top:-12px;background:var(--rojo);color:#fff;font-family:var(--display);font-size:13px;padding:1px 8px;border-radius:6px}
.emo-btn{font-family:var(--display);font-size:18px;padding:10px;border-radius:14px;border:2px solid #ff7b2e;background:transparent;color:#ff9d5c}
.emo-rivales{display:flex;flex-direction:column;gap:6px}
.emo-rivales div{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;background:var(--tierra-2);border-radius:10px;padding:8px 10px;font-size:14px}
.emo-rivales b{font-family:var(--display);font-weight:400;font-size:20px;color:var(--amarillo);text-align:center;white-space:nowrap}
.emo-rivales span:last-child{text-align:right}
.emo-rivales .gana{color:#5cff8a;font-weight:700}
.emo-titulos{display:flex;flex-wrap:wrap;gap:6px}
.emo-titulos span{background:rgba(255,215,74,.15);border:1px solid var(--amarillo);border-radius:8px;padding:2px 8px;font-size:13px}
.emo-galeria{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.emo-galeria button{padding:0;border:2px solid rgba(247,234,208,.25);border-radius:10px;overflow:hidden;background:#000;aspect-ratio:4/3}
.emo-galeria img{width:100%;height:100%;object-fit:cover;display:block}
.emo-ver img{width:100%;border-radius:12px;border:2px solid var(--amarillo)}
.emo-ver .acciones{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.emo-ver .acciones button{font-family:var(--display);font-size:17px;padding:11px;border-radius:12px;border:0;color:#fff}
.emo-fin-riv{font-size:14px;line-height:1.5;opacity:.95}
@media (prefers-reduced-motion:reduce){.emo-luces{animation:none}.emo-grande{transition:opacity .2s}}
`;
document.head.appendChild(css);
const ui = document.createElement('div');
ui.innerHTML = `
<div class="emo-peligro" id="emoPeligro"></div>
<div class="emo-grande" id="emoGrande" role="status" aria-live="polite"></div>
<div class="emo-toast" id="emoToast" role="status"></div>
<div class="emo-luces" id="emoLuces"></div>
<canvas class="emo-confeti" id="emoConfeti" hidden></canvas>
<div class="emo-rep" id="emoRep" hidden><span>⟲ REPETICIÓN</span></div>
<div class="capa" id="emoCapa" hidden style="z-index:60"><div class="tarjeta">
  <h1 class="chico">Rivalidades</h1>
  <p class="sub">Quién ha eliminado más a quién (se guarda en este celular).</p>
  <div class="emo-rivales" id="emoRivales"></div>
  <h2>Títulos</h2>
  <p class="nota">El Cazador (10 eliminaciones) · El Intocable (ganar sin que le peguen) · Rey de la Precisión (5 tiros difíciles) · La Leyenda de las Chiras (15 victorias). Solo son reconocimientos: no dan ventaja.</p>
  <div id="emoTitulos" class="grupo"></div>
  <h2>📸 Mis jugadas</h2>
  <p class="nota" id="emoGalNota">Las mejores jugadas se guardan solas. Toque una para compartirla.</p>
  <div class="emo-galeria" id="emoGaleria"></div>
  <button class="jugar" id="emoCerrar" type="button">Volver</button>
</div></div>
<div class="capa" id="emoVer" hidden style="z-index:61"><div class="tarjeta emo-ver">
  <h1 class="chico" id="emoVerTit"></h1>
  <img id="emoVerImg" alt="">
  <div class="acciones">
    <button type="button" id="emoCompartir" style="background:#25d366">Compartir</button>
    <button type="button" id="emoBajar" style="background:var(--azul)">Descargar</button>
    <button type="button" id="emoBorrar" style="background:#7a2a2a">Borrar</button>
    <button type="button" id="emoVolver" style="background:var(--tierra-2)">Volver</button>
  </div>
  <p class="nota" id="emoVerNota"></p>
</div></div>`;
while (ui.firstElementChild) document.body.appendChild(ui.firstElementChild);

let grandeT = 0, toastT = 0;
function grande(t, sub, color){
  const el = $('#emoGrande'); el.textContent = ''; el.appendChild(document.createTextNode(t));
  if (sub){ const s = document.createElement('small'); s.textContent = sub; el.appendChild(s); }
  el.style.setProperty('--c', typeof color === 'number' ? N.hex(color) : (color || '#ff3355'));
  el.classList.add('ver'); grandeT = 2.2;
  log('pantalla: ' + t + (sub ? ' — ' + sub : ''));
}
function toast(t){ const el = $('#emoToast'); el.textContent = t; el.classList.add('ver'); toastT = 2.6; log('toast: ' + t); }
function vibrar(ms){ try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
function sacudir(v){ if (window.ChirasClasicoExtra && N.getEstado() !== 'batalla' && N.getEstado() !== 'supervivencia') window.ChirasClasicoExtra.sacudir(v); }

// ---------------------------------------------------------------------
// 4. Narrador: frases variadas (no repite las últimas)
// ---------------------------------------------------------------------
const FRASES = ['¡Qué tiro!', '¡Jugada maestra!', '¡Eso es precisión!', '¡Increíble!', '¡Qué eliminación!', '¡Tremendo pulso!', '¡De otro planeta!', '¡Así se juega!', '¡Qué puntería!', '¡Espectacular!'];
let recientes = [];
function felicitar(preferida, quienes){
  if (quienes && N.meToca && !N.meToca(quienes)) return null;
  let f = preferida && !recientes.includes(preferida) ? preferida : null;
  if (!f){ const libres = FRASES.filter(x => !recientes.includes(x)); f = libres[Math.floor(Math.random() * libres.length)]; }
  recientes.push(f); if (recientes.length > 4) recientes.shift();
  stats.felicitaciones++;
  A.voz('felicitar', f); A.sfx.maestro();
  log('narrador: ' + f);
  return f;
}

// ---------------------------------------------------------------------
// 5 y 1. Rivalidades y venganza
// ---------------------------------------------------------------------
function registrarEliminacion(asesino, victima, pos, color, modo){
  if (!asesino || !victima || asesino === victima) return false;
  datos.rival[asesino] = datos.rival[asesino] || {};
  datos.rival[asesino][victima] = (datos.rival[asesino][victima] || 0) + 1;
  perfil(asesino).elim++;
  let venganza = false;
  if (datos.pendiente[asesino] === victima){ venganza = true; delete datos.pendiente[asesino]; }
  datos.pendiente[victima] = asesino;   // la víctima recuerda quién la eliminó
  guardar();
  const a = datos.rival[asesino][victima], b = (datos.rival[victima] || {})[asesino] || 0;
  if (venganza){
    stats.venganzas++;
    setTimeout(() => {
      grande('¡VENGANZA CUMPLIDA!', `${asesino} se desquitó de ${victima}`, '#ff3355');
      A.voz('venganza', '¡Venganza cumplida!', [asesino, victima]); A.sfx.epico(); A.sfx.trueno();
      vibrar([80, 40, 120]); sacudir(0.35);
      if (G() && pos){ G().explosionVistosa(pos, 0xff3355, 1.8); G().onda(pos, 0xffd84a, 6); }
      pedirMomento('¡Venganza cumplida!', `${asesino} se desquitó de ${victima}`);
    }, 1400);
  }
  setTimeout(() => toast(`⚔️ ${asesino} ${a} – ${b} ${victima}`), venganza ? 3600 : 1600);
  revisarTitulos(asesino);
  log(`eliminación: ${asesino} → ${victima} (${a}-${b})${venganza ? ' VENGANZA' : ''}`);
  return venganza;
}

// ---------------------------------------------------------------------
// 9. Títulos
// ---------------------------------------------------------------------
const TITULOS = {
  cazador:   {nombre: 'El Cazador', icono: '🏹', cumple: p => p.elim >= 10},
  intocable: {nombre: 'El Intocable', icono: '🛡️', cumple: () => false},     // se da al ganar sin que le peguen
  precision: {nombre: 'Rey de la Precisión', icono: '🎯', cumple: p => p.dificiles >= 5},
  leyenda:   {nombre: 'La Leyenda de las Chiras', icono: '👑', cumple: p => p.victorias >= 15}
};
function darTitulo(n, id){
  const p = perfil(n); if (p.titulos.includes(id)) return;
  p.titulos.push(id); guardar(); stats.titulos++;
  setTimeout(() => { grande(`${TITULOS[id].icono} ${TITULOS[id].nombre.toUpperCase()}`, `¡Nuevo título para ${n}!`, '#f5c518'); A.voz('titulo', `¡Nuevo título! ${TITULOS[id].nombre}`, [n]); A.sfx.nivel(); }, 2600);
  log(`título ${id} para ${n}`);
}
function revisarTitulos(n){ const p = perfil(n); Object.keys(TITULOS).forEach(id => { if (TITULOS[id].cumple(p)) darTitulo(n, id); }); }

// ---------------------------------------------------------------------
// 2. Tensión: música de suspenso, latido y viñeta roja cuando está en peligro
// ---------------------------------------------------------------------
let tension = null, enPeligro = false;
function sonarTension(on){
  const a = N.getAudio();
  if (!a || !N.sonidoActivo()){ if (tension){ pararTension(); } return; }
  if (on && !tension){
    const d = a._musica || a.destination;
    const g = a.createGain(); g.gain.value = 0; g.connect(d);
    const o1 = a.createOscillator(), o2 = a.createOscillator(); o1.frequency.value = 55; o2.frequency.value = 58.3; o1.type = o2.type = 'sawtooth';
    const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 180;
    o1.connect(fl); o2.connect(fl); fl.connect(g); o1.start(); o2.start();
    g.gain.setTargetAtTime(0.09, a.currentTime, 0.6);
    const latido = () => {
      const t = a.currentTime;
      [0, 0.22].forEach((dt, k) => { const o = a.createOscillator(), gg = a.createGain(); o.frequency.setValueAtTime(70, t + dt); o.frequency.exponentialRampToValueAtTime(40, t + dt + 0.15);
        gg.gain.setValueAtTime(k ? 0.35 : 0.5, t + dt); gg.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.18); o.connect(gg).connect(d); o.start(t + dt); o.stop(t + dt + 0.2); });
    };
    latido(); const id = setInterval(latido, 820);
    tension = {g, o1, o2, id};
  } else if (!on && tension) pararTension();
}
function pararTension(){
  if (!tension) return;
  const a = N.getAudio(); clearInterval(tension.id);
  try { tension.g.gain.setTargetAtTime(0, a.currentTime, 0.3); const t = tension; setTimeout(() => { try { t.o1.stop(); t.o2.stop(); } catch (e) {} }, 1200); } catch (e) {}
  tension = null;
}
function calcularPeligro(){
  const e = N.getEstado();
  if (e === 'supervivencia' && window.ChirasSupervivencia){
    const js = window.ChirasSupervivencia.jugadores(), h = js.find(j => j.humano && j.vivo);
    return !!(h && js.some(o => o !== h && o.vivo && o.sup && !h.sup && Math.hypot(o.p.x - h.p.x, o.p.z - h.p.z) < 4.5));
  }
  if (e === 'batalla' && B){
    const js = B.jugadores(), hs = js.filter(j => !j.ia && j.vivo);
    return hs.some(h => h.pendiente || (!h.verdad && js.some(o => o !== h && o.vivo && o.verdad && N.distH(o.bola.p, h.bola.p) < 10 && ((o.apunta.mostrar && o.apunta.fuerza > 0.15) || (o.tiro && !o.tiro.fin)))));
  }
  if (e === 'apuntar' || e === 'rodando'){
    const js = N.getJugadores(), t = N.getTirador(); if (!t || !t.poder || (t.humano && !t.ia)) return false;
    const otros = js.filter(o => o !== t && o.vivo && o.bola.activa).sort((a, b) => N.distH(a.bola.p, t.bola.p) - N.distH(b.bola.p, t.bola.p));
    return !!(otros[0] && otros[0].humano && !otros[0].ia);
  }
  return false;
}

// ---------------------------------------------------------------------
// 3. Golpes: chispas, onda, destello, vibración y sonido según la fuerza
// ---------------------------------------------------------------------
let ultGolpe = 0;
N.ganchos.alChocarFx = (a, b, f) => {
  const ahora = performance.now();
  if (f < 0.8 || ahora - ultGolpe < 60) return;
  ultGolpe = ahora; stats.golpes++;
  const p = new V3((a.p.x + b.p.x) / 2, Math.max(R, (a.p.y + b.p.y) / 2), (a.p.z + b.p.z) / 2);
  const g = G();
  if (g){
    const n = Math.min(18, Math.round(f * 3));
    for (let i = 0; i < n; i++){ const th = Math.random() * Math.PI * 2, ve = 1 + Math.random() * f * 0.6; g.polvo(p.clone(), new V3(Math.cos(th) * ve, 0.5 + Math.random() * 1.5, Math.sin(th) * ve), i % 2 ? 0xffffff : 0xffe08a, 0.4 + Math.random() * 0.3); }
    if (f > 2) g.onda(p, 0xffffff, Math.min(2.5, f * 0.3));
    if (f > 3.5) g.destello(p, 0xfff1c0, Math.min(1.2, f * 0.12));
  }
  if (f > 3) A.sfx.choqueFuerte(f);
  const humano = [a, b].some(x => x.dueno && (x.dueno.humano || x.dueno.ia === false) && !(x.dueno.ia));
  if (humano) vibrar(Math.min(70, Math.round(f * 9)));
  sacudir(Math.min(0.22, f * 0.025));
};

// ---------------------------------------------------------------------
// 6. Repetición corta en el Clásico (la Batalla ya tiene la suya)
// ---------------------------------------------------------------------
const HIST = 120; let hist = [], histN = 0, rep = null, histJs = null;
const camRep = new THREE.PerspectiveCamera(48, 4 / 3, 0.05, 300);
function grabarClasico(){
  const js = N.getJugadores();
  if (js !== histJs || hist.length !== js.length){ histJs = js; hist = js.map(() => new Float32Array(HIST * 8)); histN = 0; }
  const i = histN % HIST;
  js.forEach((j, k) => { const m = j.bola.mesh, q = m.quaternion; hist[k].set([m.position.x, m.position.y, m.position.z, q.x, q.y, q.z, q.w, m.visible ? 1 : 0], i * 8); });
  histN++;
}
function repeticionClasico(victima, atacante){
  if (histN < 20 || !histJs) return;
  const js = histJs, n = Math.min(HIST, histN, 90), cuadros = [];
  for (let c = n; c > 0; c--){ const i = (histN - c) % HIST; cuadros.push(js.map((j, k) => Array.from(hist[k].subarray(i * 8, i * 8 + 8)))); }
  // la víctima se ve en toda la repetición (aunque ya haya desaparecido)
  const iv = js.indexOf(victima); if (iv >= 0) cuadros.forEach(f => { f[iv][7] = 1; });
  rep = {cuadros, t: 0, dur: 2.2, foco: iv, otro: js.indexOf(atacante), ang: Math.random() * 6.3, js};
  stats.repeticiones++; A.sfx.repeticion(); log('repetición en el clásico');
}
function dibujarRepeticion(dt){
  const marco = $('#emoRep');
  if (!rep){ marco.hidden = true; return; }
  rep.t += dt; if (rep.t >= rep.dur || N.getEstado() === 'menu'){ rep = null; marco.hidden = true; return; }
  const js = rep.js, f = rep.cuadros[Math.min(rep.cuadros.length - 1, Math.floor(rep.t / rep.dur * rep.cuadros.length))];
  const guard = js.map(j => ({p: j.bola.mesh.position.clone(), q: j.bola.mesh.quaternion.clone(), v: j.bola.mesh.visible}));
  js.forEach((j, k) => { const d = f[k]; if (!d) return; j.bola.mesh.position.set(d[0], d[1], d[2]); j.bola.mesh.quaternion.set(d[3], d[4], d[5], d[6]); j.bola.mesh.visible = d[7] > 0; });
  const fc = f[rep.foco >= 0 ? rep.foco : 0], fo = f[rep.otro >= 0 ? rep.otro : 0] || fc;
  const foco = new V3((fc[0] * 2 + fo[0]) / 3, 0.05, (fc[2] * 2 + fo[2]) / 3), sep = Math.max(1.2, Math.hypot(fc[0] - fo[0], fc[2] - fo[2]) * 0.8);
  const a = rep.ang + rep.t * 0.6;
  camRep.position.set(foco.x + Math.sin(a) * sep, 0.35 + sep * 0.35, foco.z + Math.cos(a) * sep); camRep.lookAt(foco);
  const w = Math.min(innerWidth * 0.46, 240), h = w * 0.72, x = 10, y = innerHeight * 0.42 - h;
  camRep.aspect = w / h; camRep.updateProjectionMatrix();
  renderer.setScissorTest(true); renderer.setScissor(x, innerHeight - y - h, w, h); renderer.setViewport(x, innerHeight - y - h, w, h);
  renderer.render(scene, camRep);
  renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight);
  js.forEach((j, k) => { j.bola.mesh.position.copy(guard[k].p); j.bola.mesh.quaternion.copy(guard[k].q); j.bola.mesh.visible = guard[k].v; });
  Object.assign(marco.style, {left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px'}); marco.hidden = false;
}

// ---------------------------------------------------------------------
// 8. Guardar y compartir jugadas (foto del momento con su título)
// ---------------------------------------------------------------------
const CLAVE_M = 'chiras-momentos';
let momentos = [];
try { if (!PRUEBA) momentos = JSON.parse(localStorage.getItem(CLAVE_M) || '[]'); } catch (e) { momentos = []; }
let pedido = null;
function pedirMomento(titulo, sub){ pedido = {titulo, sub, cuando: Date.now()}; }
function tomarMomento(){
  if (!pedido) return;
  const p = pedido; pedido = null;
  try {
    const src = renderer.domElement, W = 720, H = Math.round(W * src.height / src.width);
    const c = document.createElement('canvas'); c.width = W; c.height = H + 120; const g = c.getContext('2d');
    g.drawImage(src, 0, 0, W, H);
    g.fillStyle = '#1c120a'; g.fillRect(0, H, W, 120);
    g.fillStyle = '#f5c518'; g.font = 'bold 40px "Lilita One", sans-serif'; g.fillText(p.titulo, 24, H + 52);
    g.fillStyle = '#f7ead0'; g.font = '24px sans-serif'; g.fillText(p.sub || '', 24, H + 90);
    g.fillStyle = '#d7263d'; g.font = 'bold 22px "Lilita One", sans-serif'; g.textAlign = 'right'; g.fillText('CHIRAS PELAS', W - 20, H + 90);
    const url = c.toDataURL('image/jpeg', 0.72);
    momentos.unshift({url, titulo: p.titulo, sub: p.sub || '', fecha: new Date().toLocaleString('es-CO')});
    momentos = momentos.slice(0, 12);
    try { if (!PRUEBA) localStorage.setItem(CLAVE_M, JSON.stringify(momentos)); } catch (e) { momentos = momentos.slice(0, 6); try { localStorage.setItem(CLAVE_M, JSON.stringify(momentos)); } catch (er) {} }
    stats.momentos++; toast('📸 Jugada guardada'); log('momento guardado: ' + p.titulo);
  } catch (e) { log('no se pudo guardar el momento: ' + e.message); }
}
async function compartir(m){
  const texto = `${m.titulo} — ${m.sub}\n¡Juguemos CHIRAS PELAS! 🎯`;
  try {
    const blob = await (await fetch(m.url)).blob();
    const archivo = new File([blob], 'chiras-pelas.jpg', {type: 'image/jpeg'});
    if (navigator.canShare && navigator.canShare({files: [archivo]})){ await navigator.share({files: [archivo], text: texto, title: 'CHIRAS PELAS'}); return 'compartido'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancelado'; }
  // sin "compartir" del celular (por ejemplo, abierto por http): se descarga la imagen y se abre WhatsApp con el texto
  bajar(m);
  window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
  return 'whatsapp';
}
function bajar(m){ const a = document.createElement('a'); a.href = m.url; a.download = 'chiras-pelas-' + Date.now() + '.jpg'; document.body.appendChild(a); a.click(); a.remove(); }

// ---------------------------------------------------------------------
// 7. Celebración de victoria: confeti, luces, música y anuncio del campeón
// ---------------------------------------------------------------------
let confeti = null;
function celebrar(nombre, color){
  stats.celebraciones++;
  const cv = $('#emoConfeti'); cv.hidden = false; cv.width = innerWidth; cv.height = innerHeight;
  const colores = ['#f5c518', '#d7263d', '#1f6fd1', '#20a65a', '#ff7b2e', '#b05cff', '#ffffff'];
  const piezas = Array.from({length: G() && G().esMovil ? 110 : 180}, () => ({x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6, vx: (Math.random() - .5) * 120, vy: 120 + Math.random() * 220, r: Math.random() * 6.3, vr: (Math.random() - .5) * 10, w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, c: colores[Math.floor(Math.random() * colores.length)]}));
  confeti = {piezas, t: 0, dur: 4.5};
  $('#emoLuces').classList.add('ver'); setTimeout(() => $('#emoLuces').classList.remove('ver'), 4200);
  setTimeout(() => { grande(`🏆 ¡${String(nombre).toUpperCase()} CAMPEÓN!`, '¡El rey de las chiras!', color || '#f5c518'); A.voz('campeon', `¡${nombre} es el campeón!`); }, 2600);
  vibrar([60, 60, 60, 60, 200]);
  pedirMomento(`🏆 ¡${nombre} ganó!`, 'Campeón de CHIRAS PELAS');
  log('celebración para ' + nombre);
}
function pasoConfeti(dt){
  if (!confeti) return;
  const cv = $('#emoConfeti'), g = cv.getContext('2d');
  confeti.t += dt; g.clearRect(0, 0, cv.width, cv.height);
  confeti.piezas.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.vx *= 0.99;
    g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.globalAlpha = Math.min(1, (confeti.dur - confeti.t)); g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); g.restore(); });
  if (confeti.t >= confeti.dur){ confeti = null; g.clearRect(0, 0, cv.width, cv.height); cv.hidden = true; }
}

// ---------------------------------------------------------------------
// Escuchar el CLÁSICO
// ---------------------------------------------------------------------
let inicioTiro = null, tocadosRonda = new Set();
const antesTiro = N.ganchos.alTiro;
N.ganchos.alTiro = (b, f, t) => { if (antesTiro) antesTiro(b, f, t); inicioTiro = {p: b.p.clone(), quien: t}; };
const antesRonda = N.ganchos.alIniciarRonda;
N.ganchos.alIniciarRonda = () => { if (antesRonda) antesRonda(); tocadosRonda = new Set(); };
const antesResolver = N.ganchos.alResolver;
N.ganchos.alResolver = e => {
  if (antesResolver) antesResolver(e);
  const s = e.tirador, vict = e.victimas || [];
  vict.forEach(v => tocadosRonda.add(v.nombre));
  if (e.castigo && !s.vivo) registrarEliminacion(e.castigo.nombre, s.nombre, s.bola.p.clone(), s.color);
  let venganza = false;
  const muertos = vict.filter(v => !v.vivo);
  muertos.forEach(v => { if (registrarEliminacion(s.nombre, v.nombre, v.bola.p.clone(), v.color)) venganza = true; });
  // jugadas difíciles
  const desde = inicioTiro && inicioTiro.quien === s ? inicioTiro.p : null;
  const lejos = desde && vict.length ? Math.max(...vict.map(v => N.distH(desde, v.bola.p))) : 0;
  const lejosHueco = desde ? N.distH(desde, HOLE) : 0;
  let frase = null, extra = false;
  if (muertos.length >= 2){ frase = '¡Jugada maestra!'; extra = true; }
  else if (muertos.length && lejos >= 8){ frase = '¡Qué eliminación!'; extra = true; }
  else if (vict.length && lejos >= 10) frase = '¡Qué tiro!';
  else if (e.encholo && !e.castigo && lejosHueco >= 12) frase = '¡Eso es precisión!';
  if (frase){
    perfil(s.nombre).dificiles++; guardar(); revisarTitulos(s.nombre);
    setTimeout(() => { felicitar(frase, [s]); grande(frase.toUpperCase(), s.nombre, s.color); }, 1300);
    if (!venganza) pedirMomento(frase, `${s.nombre}${muertos.length ? ' eliminó a ' + muertos.map(v => v.nombre).join(' y ') : ''}`);
  }
  if (muertos.length && (extra || venganza)) repeticionClasico(muertos[0], s);
  if (muertos.length && !frase && !venganza) pedirMomento('¡Eliminación!', `${s.nombre} eliminó a ${muertos.map(v => v.nombre).join(' y ')}`);
};
const antesTerminar = N.ganchos.alTerminar;
N.ganchos.alTerminar = g => {
  if (antesTerminar) antesTerminar(g);
  if (!g) return;
  perfil(g.nombre).victorias++;
  if (!tocadosRonda.has(g.nombre)) darTitulo(g.nombre, 'intocable');
  guardar(); revisarTitulos(g.nombre);
  celebrar(g.nombre, g.color);
  setTimeout(() => agregarRivalidadesAlFin('#fin .tarjeta', '#btnOtra'), 50);
};

// ---------------------------------------------------------------------
// Escuchar la BATALLA
// ---------------------------------------------------------------------
if (B){
  let tocados = new Set();
  B.on('inicio', () => { tocados = new Set(); });
  ['golpe-valido', 'verdad-quitada', 'barrera-aguanto'].forEach(t => B.on(t, e => tocados.add(e.victima || e.a || e.defensor)));
  B.on('eliminado', e => {
    const j = B.jugadores().find(x => x.nombre === e.jugador);
    const por = e.por || (/hueco/.test(e.motivo || '') ? null : null);
    if (por && j){
      const venganza = registrarEliminacion(por, e.jugador, j.bola.p.clone(), j.color);
      if (venganza && window.ChirasEspectaculo){ const k = B.jugadores().find(x => x.nombre === por); window.ChirasEspectaculo.iniciarRepeticion(j, k); }
      if (!venganza) pedirMomento('¡Eliminación!', `${por} eliminó a ${e.jugador}`);
    }
  });
  if (window.ChirasEspectaculo) window.ChirasEspectaculo.on('maestro', e => { const p = perfil(e.jugador); p.dificiles++; guardar(); revisarTitulos(e.jugador); pedirMomento('¡Tiro maestro!', `${e.jugador}: ${e.detalle}`); });
  B.on('fin', e => {
    if (!e.ganador) return;
    const o = B.opciones(); if (o.solo || o.blanco) return;
    perfil(e.ganador).victorias++;
    if (!tocados.has(e.ganador)) darTitulo(e.ganador, 'intocable');
    guardar(); revisarTitulos(e.ganador);
    const g = B.jugadores().find(x => x.nombre === e.ganador);
    celebrar(e.ganador, g ? g.color : 0xf5c518);
    setTimeout(() => agregarRivalidadesAlFin('#btFin .tarjeta', '#btRevancha'), 50);
  });
}

// ---------------------------------------------------------------------
// Escuchar la SUPERVIVENCIA (mirando su registro)
// ---------------------------------------------------------------------
let svVisto = 0;
function revisarSupervivencia(){
  const S = window.ChirasSupervivencia; if (!S || N.getEstado() !== 'supervivencia'){ svVisto = 0; return; }
  const reg = S.registro(); if (reg.length < svVisto) svVisto = 0;
  for (; svVisto < reg.length; svVisto++){
    const e = reg[svVisto], js = S.jugadores();
    if (e.tipo === 'eliminado' && e.por){ const j = js.find(x => x.nombre === e.jugador); registrarEliminacion(e.por, e.jugador, j ? new V3(j.p.x, j.r, j.p.z) : null, j ? j.color : 0xffffff); }
    if (e.tipo === 'duelo' && e.vGana - e.vPierde > 3){ setTimeout(() => felicitar('¡Qué choque!'), 900); }
    if (e.tipo === 'fin' && e.ganador){ perfil(e.ganador).victorias++; guardar(); revisarTitulos(e.ganador); const g = js.find(x => x.nombre === e.ganador); celebrar(e.ganador, g ? g.color : 0xf5c518); setTimeout(() => agregarRivalidadesAlFin('#svFin .tarjeta', '#svRevancha'), 50); }
  }
}

// ---------------------------------------------------------------------
// Rivalidades en la pantalla de fin y en el menú
// ---------------------------------------------------------------------
function lineasRivalidad(nombres){
  const pares = [], vistos = new Set();
  Object.keys(datos.rival).forEach(a => Object.keys(datos.rival[a]).forEach(b => {
    const k = [a, b].sort().join('|'); if (vistos.has(k)) return; vistos.add(k);
    if (nombres && !(nombres.includes(a) && nombres.includes(b))) return;
    const x = datos.rival[a][b] || 0, y = (datos.rival[b] || {})[a] || 0;
    pares.push({a, b, x, y, total: x + y});
  }));
  return pares.sort((p, q) => q.total - p.total);
}
function agregarRivalidadesAlFin(sel, antes){
  const t = $(sel); if (!t) return;
  const viejo = t.querySelector('.emo-fin-riv'); if (viejo) viejo.remove();
  const ps = lineasRivalidad().slice(0, 3); if (!ps.length) return;
  const d = document.createElement('div'); d.className = 'emo-fin-riv';
  d.innerHTML = '<b>⚔️ Rivalidades</b><br>' + ps.map(p => `${esc(p.a)} ${p.x} – ${p.y} ${esc(p.b)}`).join('<br>');
  t.insertBefore(d, $(antes));
}
const btnRiv = document.createElement('button'); btnRiv.type = 'button'; btnRiv.className = 'emo-btn'; btnRiv.textContent = '⚔️ Rivalidades, títulos y 📸 mis jugadas';
const despuesDe = document.querySelector('#menu .prog-btn') || $('#modos');
despuesDe.insertAdjacentElement('afterend', btnRiv);
btnRiv.addEventListener('click', abrirRivalidades);
$('#emoCerrar').addEventListener('click', () => { $('#emoCapa').hidden = true; });
function abrirRivalidades(){
  const ps = lineasRivalidad();
  $('#emoRivales').innerHTML = ps.length ? ps.map(p => `<div><span class="${p.x > p.y ? 'gana' : ''}">${esc(p.a)}</span><b>${p.x} – ${p.y}</b><span class="${p.y > p.x ? 'gana' : ''}">${esc(p.b)}</span></div>`).join('')
    : '<p class="nota">Todavía no hay eliminaciones. ¡A jugar!</p>';
  const tit = $('#emoTitulos'); tit.innerHTML = '';
  Object.keys(datos.perfiles).forEach(n => {
    const p = datos.perfiles[n]; if (!p.titulos.length && !p.elim) return;
    const d = document.createElement('div');
    d.innerHTML = `<b>${esc(n)}</b> <span class="nota">· ${p.elim} eliminaciones · ${p.dificiles} tiros difíciles · ${p.victorias} victorias</span><div class="emo-titulos">${p.titulos.map(id => `<span>${TITULOS[id].icono} ${TITULOS[id].nombre}</span>`).join('') || '<span>Sin títulos todavía</span>'}</div>`;
    tit.appendChild(d);
  });
  if (!tit.children.length) tit.innerHTML = '<p class="nota">Todavía no hay títulos.</p>';
  const gal = $('#emoGaleria'); gal.innerHTML = '';
  momentos.forEach((m, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', m.titulo); b.innerHTML = `<img alt="" src="${m.url}">`; b.addEventListener('click', () => verMomento(i)); gal.appendChild(b); });
  $('#emoGalNota').textContent = momentos.length ? 'Toque una jugada para compartirla (por WhatsApp desde el celular) o descargarla.' : 'Las mejores jugadas (eliminaciones, tiros difíciles, venganzas y victorias) se guardan solas aquí.';
  $('#emoCapa').hidden = false;
}
let viendo = -1;
function verMomento(i){
  viendo = i; const m = momentos[i];
  $('#emoVerTit').textContent = m.titulo; $('#emoVerImg').src = m.url; $('#emoVerNota').textContent = `${m.sub} · ${m.fecha}`;
  $('#emoVer').hidden = false;
}
$('#emoVolver').addEventListener('click', () => { $('#emoVer').hidden = true; });
$('#emoBajar').addEventListener('click', () => { if (momentos[viendo]) bajar(momentos[viendo]); });
$('#emoCompartir').addEventListener('click', async () => { if (momentos[viendo]){ const r = await compartir(momentos[viendo]); if (r === 'whatsapp') $('#emoVerNota').textContent = 'Se descargó la imagen y se abrió WhatsApp con el texto: adjunte la imagen desde la galería.'; } });
$('#emoBorrar').addEventListener('click', () => { momentos.splice(viendo, 1); try { localStorage.setItem(CLAVE_M, JSON.stringify(momentos)); } catch (e) {} $('#emoVer').hidden = true; abrirRivalidades(); });

// botón de foto rápida durante el juego (clásico)
const btnFoto = document.createElement('button'); btnFoto.type = 'button'; btnFoto.textContent = '📸'; btnFoto.setAttribute('aria-label', 'Guardar esta jugada');
btnFoto.addEventListener('click', () => pedirMomento('📸 Mi jugada', new Date().toLocaleTimeString('es-CO')));
const bots = $('#botones'); if (bots) bots.insertBefore(btnFoto, bots.firstChild);

// ---------------------------------------------------------------------
// Cada cuadro dibujado
// ---------------------------------------------------------------------
N.ganchos.despuesDeDibujar.push(dt => {
  const e = N.getEstado();
  if (e !== 'menu' && e !== 'batalla' && e !== 'supervivencia') grabarClasico();
  dibujarRepeticion(dt);
  tomarMomento();
});
let antes = performance.now(), peligroT = 0;
function cuadro(ahora){
  const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora;
  revisarSupervivencia();
  // tensión (se revisa unas veces por segundo)
  peligroT -= dt;
  if (peligroT <= 0){
    peligroT = 0.25;
    const p = N.getEstado() !== 'menu' && calcularPeligro();
    if (p !== enPeligro){ enPeligro = p; if (p) stats.peligro++; $('#emoPeligro').style.opacity = p ? '1' : '0'; sonarTension(p); if (p) vibrar(40); }
  }
  if (enPeligro) $('#emoPeligro').style.opacity = String(0.55 + Math.sin(ahora / 140) * 0.45);
  if (grandeT > 0){ grandeT -= dt; if (grandeT <= 0) $('#emoGrande').classList.remove('ver'); }
  if (toastT > 0){ toastT -= dt; if (toastT <= 0) $('#emoToast').classList.remove('ver'); }
  pasoConfeti(dt);
  if (N.MODO_PRUEBA) setTimeout(() => cuadro(performance.now()), 50); else requestAnimationFrame(cuadro);
}
if (N.MODO_PRUEBA) setTimeout(() => cuadro(performance.now()), 50); else requestAnimationFrame(cuadro);

window.ChirasEmociones = {stats, felicitar, registrarEliminacion, celebrar, pedirMomento, momentos: () => momentos, datos: () => datos, calcularPeligro, enPeligro: () => enPeligro, compartir, lineasRivalidad, TITULOS};
})();
