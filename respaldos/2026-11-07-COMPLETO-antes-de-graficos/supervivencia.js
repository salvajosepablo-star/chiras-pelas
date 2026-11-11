// =====================================================================
// CHIRAS PELAS — Batalla de SUPERVIVENCIA (variante dentro del modo Batalla)
//  - Cada uno conduce su canica con un joystick táctil (sin cauchera).
//  - Todos empiezan pequeños y sin poder. La FUENTE SUPREMA da el poder.
//  - Con poder se devoran las canicas sin poder y se crece.
//  - Entre dos con poder: gana la que llega más rápido hacia la otra;
//    si las velocidades son parecidas o el choque es suave, rebotan.
//  - Turbo, freno y derrapes. Gana la última canica en la arena.
// Usa el mismo escenario (cancha, hueco, árboles). La Batalla de LA VERDAD
// sigue igual: se escoge en el menú de Batalla.
// =====================================================================
(function(){
const N = window.ChirasNucleo, A = window.ChirasAudio;
if (!N || !A){ console.error('Supervivencia: faltan módulos'); return; }
const {THREE, scene, camera, R, HOLE} = N;
const V3 = THREE.Vector3;
const $ = s => document.querySelector(s);
const PRUEBA = location.hash === '#prueba-super';
const log = t => { if (N.MODO_PRUEBA) console.log('[sv] ' + t); };

// ---------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------
const CFG = {
  arena: {x: HOLE.x, z: HOLE.z + 2, radio: 20},   // arena circular sobre la cancha de siempre
  radioInicial: 0.16,       // todos empiezan pequeños
  radioMax: 1.1,
  crecer: 0.7,              // parte del tamaño (área) de la devorada que se suma
  acel: 9, vmax: 6.5,       // aceleración y velocidad máxima normales
  turboVmax: 11, turboAcel: 1.9, turboDur: 1.4, turboRecarga: 4,
  arrastre: 0.45, freno: 5,
  giro: 6.5,                // qué tan rápido gira (radianes por segundo)
  agarre: 8, agarreDerrape: 2,  // agarre normal y agarre en derrape (más bajo = más derrape)
  lentitudTamano: 0.22,     // las grandes van un poco más lentas
  impactoMin: 1.2,          // velocidad mínima hacia el rival para que un choque entre poderosos mate
  empate: 0.8,              // si la diferencia de velocidades es menor que esto, rebotan los dos
  rebote: 0.85,
  fuente: {radio: 0.9, reaparece: 5, distMin: 6},
  ia: {error: 0.25, turboCerca: 3.5, huirDe: 9}
};
const COLORES = [0xd7263d, 0x1f6fd1, 0xf2b705, 0x20a65a, 0xff7b2e, 0xb05cff, 0x2ee6d6, 0xff4fa3];
const NOMBRES_IA = ['El Mono', 'La Flaca', 'Juancho', 'La Mona', 'El Tigre', 'Pecas'];

// ---------------------------------------------------------------------
// Interfaz
// ---------------------------------------------------------------------
const css = document.createElement('style');
css.textContent = `
.sv{position:fixed;inset:0;pointer-events:none;z-index:4;font-family:var(--body)}
.sv-top{position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 6px);display:flex;flex-direction:column;align-items:center;gap:2px}
.sv.partida .sv-top{top:50%;transform:translate(-50%,-50%)}
.sv-tit{font-family:var(--display);font-size:17px;letter-spacing:1px;color:var(--amarillo);text-shadow:0 2px 0 var(--rojo),0 4px 0 var(--azul)}
.sv-quedan{background:rgba(20,12,6,.75);border-radius:10px;padding:2px 10px;font-size:13px;font-weight:700}
.sv-zona{position:absolute;left:0;right:0;display:flex;align-items:flex-end;justify-content:space-between;gap:8px;padding:10px 12px}
.sv-zona.abajo{bottom:0;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 10px)}
.sv-zona.arriba{top:0;transform:rotate(180deg)}
.sv-info{--c:#fff;background:rgba(20,12,6,.75);border:2px solid var(--c);border-radius:12px;padding:5px 9px;font-size:12px;min-width:120px;display:flex;flex-direction:column;gap:3px}
.sv-info b{font-family:var(--display);font-weight:400;font-size:15px}
.sv-sup{display:inline-block;background:var(--amarillo);color:var(--tierra);border-radius:6px;padding:0 6px;font-family:var(--display);font-size:11px;margin-left:4px}
.sv-turbo{height:6px;border-radius:3px;background:rgba(247,234,208,.15);overflow:hidden}
.sv-turbo div{height:100%;background:linear-gradient(90deg,#5cff8a,#2ee6d6)}
.sv-btns{display:flex;gap:10px;pointer-events:auto}
.sv-btns button{width:66px;height:66px;border-radius:50%;border:3px solid rgba(255,255,255,.6);font-family:var(--display);font-size:13px;color:#1a0f07;box-shadow:0 4px 0 rgba(0,0,0,.35);touch-action:none;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}
.sv-btns button span{font-size:24px}
.sv-btns .turbo{background:#5cff8a}
.sv-btns .turbo.off{filter:grayscale(1) brightness(.6)}
.sv-btns .freno{background:#ff8a8a}
.sv-joy{position:fixed;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:3px solid rgba(255,255,255,.55);background:rgba(20,12,6,.25);pointer-events:none;z-index:5}
.sv-joy i{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:rgba(255,255,255,.75);box-shadow:0 2px 8px rgba(0,0,0,.4)}
.sv-lado{position:absolute;right:max(8px,env(safe-area-inset-right,0px));top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:8px;pointer-events:auto}
.sv-lado button{width:42px;height:42px;border-radius:12px;border:2px solid rgba(247,234,208,.35);background:rgba(20,12,6,.74);color:var(--crema);font-size:18px;padding:0}
.sv-flash{--c:#d7263d;position:absolute;left:50%;top:38%;transform:translate(-50%,-50%) scale(.85);text-align:center;font-family:var(--display);font-size:clamp(24px,7.5vw,42px);color:#fff;text-shadow:0 3px 0 var(--c),0 0 20px var(--c);opacity:0;transition:opacity .15s,transform .15s;width:min(92vw,560px);line-height:1.05}
.sv-flash small{display:block;font-size:.45em;color:var(--amarillo);text-shadow:0 2px 0 #000;margin-top:4px}
.sv-flash.ver{opacity:1;transform:translate(-50%,-50%) scale(1)}
.sv-cuenta{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:var(--display);font-size:90px;color:var(--amarillo);text-shadow:0 5px 0 var(--rojo),0 9px 0 var(--azul)}
`;
document.head.appendChild(css);
const raiz = document.createElement('div');
raiz.innerHTML = `
<div class="sv" id="sv" hidden>
  <div class="sv-top"><div class="sv-tit">SUPERVIVENCIA</div><div class="sv-quedan" id="svQuedan"></div></div>
  <div class="sv-zona arriba" id="svZona2"></div>
  <div class="sv-zona abajo" id="svZona1"></div>
  <div class="sv-lado"><button type="button" id="svSalir" aria-label="Volver al menú">✕</button></div>
  <div class="sv-flash" id="svFlash" role="status" aria-live="polite"></div>
  <div class="sv-cuenta" id="svCuenta"></div>
</div>
<div class="sv-joy" id="svJoy1" hidden><i></i></div>
<div class="sv-joy" id="svJoy2" hidden><i></i></div>
<div class="capa" id="svFin" hidden><div class="tarjeta">
  <h1 id="svFinTit"></h1><p class="sub" id="svFinTxt"></p>
  <button class="jugar" id="svRevancha" type="button">Revancha</button>
  <button class="jugar" id="svMenu" type="button" style="background:var(--azul);box-shadow:0 5px 0 #0d2f6b">Menú</button>
</div></div>`;
while (raiz.firstElementChild) document.body.appendChild(raiz.firstElementChild);

// ---------------------------------------------------------------------
// Menú: "Tipo de batalla" dentro del modo Batalla
// ---------------------------------------------------------------------
const opc = $('#opcBatalla');
const bloqueTipo = document.createElement('div'); bloqueTipo.className = 'grupo';
bloqueTipo.innerHTML = `
  <h2>Tipo de batalla</h2>
  <div class="rivales" id="svTipo">
    <button type="button" data-t="verdad" aria-pressed="true">La Verdad</button>
    <button type="button" data-t="super" aria-pressed="false">Supervivencia</button>
  </div>`;
const bloqueSuper = document.createElement('div'); bloqueSuper.className = 'grupo'; bloqueSuper.hidden = true;
bloqueSuper.innerHTML = `
  <ol>
    <li><b>Joystick:</b> ponga el dedo en su lado de la pantalla y muévalo para manejar su canica. Botones: 🚀 Turbo y 🛑 Freno.</li>
    <li><b>Fuente Suprema:</b> todos empiezan pequeños y sin poder. Pase por la columna de luz para ganar el poder de devorar.</li>
    <li><b>Devorar:</b> con poder, toque a una canica sin poder y se la come. Cada vez crece más.</li>
    <li><b>Entre poderosos:</b> gana la que llegue más rápido hacia la otra, sin importar el tamaño. Si van parecido o el choque es suave, rebotan.</li>
    <li>Gana la última canica en la arena.</li>
  </ol>
  <h2>Canicas de la máquina</h2>
  <div class="rivales" id="svBots">
    <button type="button" data-n="0" aria-pressed="false">0</button>
    <button type="button" data-n="2" aria-pressed="false">2</button>
    <button type="button" data-n="3" aria-pressed="true">3</button>
    <button type="button" data-n="5" aria-pressed="false">5</button>
  </div>
  <p class="nota">En computador: flechas o W A S D para manejar, espacio para turbo y Shift para frenar.</p>`;
const primeraNota = opc.querySelector('.nota');
primeraNota.insertAdjacentElement('afterend', bloqueTipo);
bloqueTipo.insertAdjacentElement('afterend', bloqueSuper);
// lo que solo aplica a La Verdad se esconde en Supervivencia
const soloVerdad = [...opc.children].filter(el => el !== primeraNota && el !== bloqueTipo && el !== bloqueSuper &&
  !el.matches('.nombres') && el.id !== 'btContra' && !(el.tagName === 'H2' && el.nextElementSibling && el.nextElementSibling.id === 'btContra'));
let tipo = 'verdad', nBots = 3;
function pintarTipo(){
  document.querySelectorAll('#svTipo button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === tipo ? 'true' : 'false'));
  document.querySelectorAll('#svBots button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.n === nBots ? 'true' : 'false'));
  bloqueSuper.hidden = tipo !== 'super';
  soloVerdad.forEach(el => { el.hidden = tipo === 'super'; });
  const contraIA = ($('#btContra button[aria-pressed="true"]') || {dataset: {}}).dataset.c === 'ia';
  // contra la máquina hace falta al menos una canica de la máquina
  const b0 = $('#svBots button[data-n="0"]'); b0.disabled = contraIA;
  if (contraIA && nBots === 0){ nBots = 3; pintarTipo(); }
}
try { const g = JSON.parse(localStorage.getItem('chiras-super') || 'null'); if (g){ tipo = g.tipo === 'super' ? 'super' : 'verdad'; nBots = [0, 2, 3, 5].includes(g.nBots) ? g.nBots : 3; } } catch (e) {}
const guardarTipo = () => { try { localStorage.setItem('chiras-super', JSON.stringify({tipo, nBots})); } catch (e) {} };
$('#svTipo').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; tipo = b.dataset.t; pintarTipo(); guardarTipo(); });
$('#svBots').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; nBots = +b.dataset.n; pintarTipo(); guardarTipo(); });
$('#btContra').addEventListener('click', () => setTimeout(pintarTipo, 0));
pintarTipo();

// ---------------------------------------------------------------------
// Escena propia: arena, fuente, partículas
// ---------------------------------------------------------------------
const borde = new THREE.Mesh(new THREE.RingGeometry(CFG.arena.radio - 0.12, CFG.arena.radio + 0.12, 128),
  new THREE.MeshBasicMaterial({color: 0xffe14a, transparent: true, opacity: .75, depthWrite: false}));
borde.rotation.x = -Math.PI / 2; borde.position.set(CFG.arena.x, 0.012, CFG.arena.z); borde.visible = false; scene.add(borde);

const texSuave = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
const texColumna = (() => {
  const c = document.createElement('canvas'); c.width = 8; c.height = 128; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.6, 'rgba(255,240,170,.55)'); gr.addColorStop(1, 'rgba(255,220,90,.95)');
  g.fillStyle = gr; g.fillRect(0, 0, 8, 128); return new THREE.CanvasTexture(c);
})();
const fuente = {grupo: new THREE.Group(), p: new V3(), activa: false, espera: 0, t: 0};
(() => {
  const col = new THREE.Mesh(new THREE.CylinderGeometry(CFG.fuente.radio, CFG.fuente.radio * 1.1, 5, 32, 1, true),
    new THREE.MeshBasicMaterial({map: texColumna, color: 0xffe68a, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending}));
  col.position.y = 2.5; fuente.grupo.add(col); fuente.col = col;
  const piso = new THREE.Mesh(new THREE.CircleGeometry(CFG.fuente.radio * 1.3, 40), new THREE.MeshBasicMaterial({map: texSuave, color: 0xffd84a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  piso.rotation.x = -Math.PI / 2; piso.position.y = 0.02; fuente.grupo.add(piso); fuente.piso = piso;
  const aro = new THREE.Mesh(new THREE.RingGeometry(CFG.fuente.radio - 0.06, CFG.fuente.radio, 48), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: .9, side: THREE.DoubleSide}));
  aro.rotation.x = -Math.PI / 2; aro.position.y = 0.025; fuente.grupo.add(aro); fuente.aro = aro;
  fuente.grupo.visible = false; scene.add(fuente.grupo);
})();

// Partículas (chispas, polvo de derrape, cristales)
const NP = 500;
const geoP = new THREE.BufferGeometry(), posP = new Float32Array(NP * 3), colP = new Float32Array(NP * 3);
geoP.setAttribute('position', new THREE.BufferAttribute(posP, 3)); geoP.setAttribute('color', new THREE.BufferAttribute(colP, 3));
const puntos = new THREE.Points(geoP, new THREE.PointsMaterial({size: 0.14, map: texSuave, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
puntos.frustumCulled = false; puntos.visible = false; scene.add(puntos);
const parts = Array.from({length: NP}, () => ({vida: 0, dur: 1, v: new V3(), c: new THREE.Color(), g: 6}));
let sigP = 0;
for (let i = 0; i < NP; i++) posP[i * 3 + 1] = -50;
function chispa(p, v, dur, color, g){
  const k = sigP; sigP = (sigP + 1) % NP; const q = parts[k];
  q.vida = q.dur = dur; q.v.copy(v); q.c.set(color); q.g = g === undefined ? 6 : g;
  posP[k*3] = p.x; posP[k*3+1] = p.y; posP[k*3+2] = p.z;
}
const geoTri = new THREE.BufferGeometry();
geoTri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0.06, 0, -0.04, -0.035, 0, 0.05, -0.03, 0]), 3));
const vidrios = Array.from({length: 48}, () => { const m = new THREE.Mesh(geoTri, new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, side: THREE.DoubleSide})); m.visible = false; scene.add(m); return {m, v: new V3(), w: new V3(), vida: 0}; });
let sigV = 0;
function estallar(p, color, tam){
  const s = Math.max(1, tam / 0.2);
  for (let i = 0; i < 90; i++){
    const th = Math.random() * Math.PI * 2, ve = (1.5 + Math.random() * 5) * Math.sqrt(s);
    chispa(new V3(p.x, p.y, p.z), new V3(Math.cos(th) * ve, 1 + Math.random() * 5, Math.sin(th) * ve), 0.8 + Math.random() * 0.8, [color, 0xffffff, 0xffd84a, 0x9fe8ff][i % 4]);
  }
  for (let i = 0; i < 16; i++){
    const f = vidrios[sigV]; sigV = (sigV + 1) % vidrios.length;
    f.vida = 1.6; f.m.visible = true; f.m.position.set(p.x, p.y, p.z); f.m.scale.setScalar(s * (0.7 + Math.random() * 0.8));
    f.m.material.color.set(i % 2 ? color : 0xdff6ff); f.m.material.opacity = 1;
    const th = Math.random() * Math.PI * 2, ve = (2 + Math.random() * 3) * Math.sqrt(s);
    f.v.set(Math.cos(th) * ve, (2.5 + Math.random() * 3) * Math.sqrt(s), Math.sin(th) * ve); f.w.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
  }
}
function pasoParticulas(dt){
  for (let i = 0; i < NP; i++){
    const q = parts[i];
    if (q.vida <= 0){ colP[i*3] = colP[i*3+1] = colP[i*3+2] = 0; continue; }
    q.vida -= dt; const k = Math.max(0, q.vida / q.dur);
    q.v.y -= q.g * dt;
    posP[i*3] += q.v.x * dt; posP[i*3+1] = Math.max(0.02, posP[i*3+1] + q.v.y * dt); posP[i*3+2] += q.v.z * dt;
    colP[i*3] = q.c.r * k; colP[i*3+1] = q.c.g * k; colP[i*3+2] = q.c.b * k;
  }
  geoP.attributes.position.needsUpdate = geoP.attributes.color.needsUpdate = true;
  vidrios.forEach(f => {
    if (f.vida <= 0) return;
    f.vida -= dt; f.v.y -= 9.8 * dt; f.m.position.addScaledVector(f.v, dt);
    if (f.m.position.y < 0.02){ f.m.position.y = 0.02; f.v.multiplyScalar(0.35); f.v.y = Math.abs(f.v.y); f.w.multiplyScalar(0.5); }
    f.m.rotation.x += f.w.x * dt; f.m.rotation.y += f.w.y * dt; f.m.rotation.z += f.w.z * dt;
    f.m.material.opacity = Math.min(1, f.vida); if (f.vida <= 0) f.m.visible = false;
  });
}

// ---------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------
let activa = false, fin = false, finT = 0, tiempo = 0, cuenta = 0, cuentaPrev = 0, opciones = {}, js = [], frente = false, registro = [], seq = 0, flashT = 0, partidas = 0;
const geoAnillo = new THREE.RingGeometry(0.9, 1.15, 32);
const vivos = () => js.filter(j => j.vivo);
function registrar(t, d){ const e = Object.assign({seq: ++seq, t: +tiempo.toFixed(2), tipo: t}, d || {}); registro.push(e); log(JSON.stringify(e)); return e; }
function flash(t, sub, color){
  const el = $('#svFlash'); el.textContent = ''; el.appendChild(document.createTextNode(t));
  if (sub){ const s = document.createElement('small'); s.textContent = sub; el.appendChild(s); }
  el.style.setProperty('--c', N.hex(color || 0xd7263d)); el.classList.add('ver'); flashT = 1.3;
}
function crear(i, nombre, ia, humano){
  const color = COLORES[i % COLORES.length];
  const estilos = N.ESTILOS.map(e => e.id);
  const mesh = N.hacerBola(estilos[(i * 5 + Math.floor(Math.random() * estilos.length)) % estilos.length]);
  const anillo = new THREE.Mesh(geoAnillo, new THREE.MeshBasicMaterial({color, transparent: true, opacity: .9, side: THREE.DoubleSide}));
  anillo.rotation.x = -Math.PI / 2; scene.add(anillo);
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({map: texSuave, color: 0xffd860, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  aura.visible = false; scene.add(aura);
  const a = i / 8 * Math.PI * 2 + 0.3, d = CFG.arena.radio * 0.6;
  const p = new V3(CFG.arena.x + Math.cos(a) * d, 0, CFG.arena.z + Math.sin(a) * d);
  return {i, nombre, color, ia, humano, mesh, anillo, aura, p, v: new V3(), h: Math.atan2(CFG.arena.x - p.x, -(CFG.arena.z - p.z)),
    r: CFG.radioInicial, rObj: CFG.radioInicial, pulso: 0, sup: false, vivo: true, devoradas: 0,
    turbo: 0, recarga: 0, derrape: false, input: {x: 0, z: 0, turbo: false, freno: false}, ultDerrape: 0,
    iaE: {t: 0, dir: new V3(), ruido: Math.random() * 10}, cam: null, ui: null, puesto: 0};
}
function limpiar(){
  js.forEach(j => scene.remove(j.mesh, j.anillo, j.aura));
  js = []; fuente.grupo.visible = false; borde.visible = false; puntos.visible = false;
  vidrios.forEach(f => { f.vida = 0; f.m.visible = false; });
}
function iniciar(o){
  limpiar();
  opciones = Object.assign({humanos: 1, nombres: [], bots: 3, sinCuenta: false}, o || {});
  frente = opciones.humanos >= 2;
  let i = 0;
  for (let k = 0; k < opciones.humanos; k++, i++) js.push(crear(i, (opciones.nombres[k] || '').trim() || `Jugador ${k + 1}`, false, true));
  for (let k = 0; k < opciones.bots; k++, i++) js.push(crear(i, NOMBRES_IA[k % NOMBRES_IA.length], true, false));
  js.forEach(j => { j.cam = {pos: new V3(j.p.x, 9, j.p.z + 5), mira: j.p.clone(), cam: new THREE.PerspectiveCamera(55, 1, 0.05, 500)}; });
  activa = true; fin = false; finT = 0; tiempo = 0; registro = []; seq = 0;
  cuenta = opciones.sinCuenta ? 0 : 3; cuentaPrev = 4;
  fuente.activa = false; fuente.espera = opciones.sinCuenta ? 0 : 1.5;
  borde.visible = true; puntos.visible = true;
  N.ocultarClasico(); N.setTirador(null); N.setJugadores([]);
  if (window.ChirasBatalla && N.getEstado() === 'batalla') window.ChirasBatalla.salir();
  ['#menu', '#btFin', '#bt'].forEach(s => { if ($(s)) $(s).hidden = true; });
  $('#svFin').hidden = true; $('#sv').hidden = false; $('#svCuenta').textContent = '';
  $('#sv').classList.toggle('partida', frente);
  construirZonas();
  N.setEstado('supervivencia');
  A.ponerIntensidad(0);
  registrar('inicio', {jugadores: js.map(j => j.nombre)});
}
function iniciarDesdeMenu(){
  const contraIA = ($('#btContra button[aria-pressed="true"]') || {dataset: {}}).dataset.c === 'ia';
  N.initAudio(); A.iniciarMusica();
  iniciar({humanos: contraIA ? 1 : 2, nombres: [$('#btNom1').value, $('#btNom2').value], bots: contraIA ? Math.max(1, nBots) : nBots});
}
function salir(){
  activa = false; limpiar(); ocultarJoys();
  $('#sv').hidden = true; $('#svFin').hidden = true;
  A.rodar(0); A.pararRodar(); A.pararMusica();
  camera.fov = 55; camera.updateProjectionMatrix();
  N.verMenu();
}

// ---------------------------------------------------------------------
// Paneles de cada persona (info + turbo + freno)
// ---------------------------------------------------------------------
function construirZonas(){
  [$('#svZona1'), $('#svZona2')].forEach(z => { z.innerHTML = ''; z.hidden = true; });
  js.filter(j => j.humano).forEach((j, k) => {
    const z = k === 0 ? $('#svZona1') : $('#svZona2'); z.hidden = false;
    z.innerHTML = `<div class="sv-info" style="--c:${N.hex(j.color)}"><div><b></b><span class="sv-sup" hidden>⚡ PODER</span></div><div class="est"></div><div class="sv-turbo"><div></div></div></div>
      <div class="sv-btns"><button type="button" class="freno" aria-label="Frenar"><span>🛑</span>Freno</button><button type="button" class="turbo" aria-label="Turbo"><span>🚀</span>Turbo</button></div>`;
    z.querySelector('b').textContent = j.nombre;
    const bt = z.querySelector('.turbo'), bf = z.querySelector('.freno');
    bt.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); j.input.turbo = true; });
    bt.addEventListener('pointerup', () => { j.input.turbo = false; });
    bf.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); j.input.frenoBoton = true; try { bf.setPointerCapture(e.pointerId); } catch (er) {} });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => bf.addEventListener(t, () => { j.input.frenoBoton = false; }));
    j.ui = {sup: z.querySelector('.sv-sup'), est: z.querySelector('.est'), turbo: z.querySelector('.sv-turbo div'), bt, cache: {}};
  });
}
function pintarZonas(){
  $('#svQuedan').textContent = `Quedan ${vivos().length} de ${js.length}`;
  js.forEach(j => {
    const u = j.ui; if (!u) return;
    const est = !j.vivo ? 'Eliminada' : `Tamaño x${(j.r / CFG.radioInicial).toFixed(1)} · ${j.devoradas} devoradas` + (j.derrape ? ' · ¡derrape!' : '');
    if (u.cache.est !== est){ u.cache.est = est; u.est.textContent = est; }
    if (u.cache.sup !== j.sup){ u.cache.sup = j.sup; u.sup.hidden = !j.sup; }
    const t = j.turbo > 0 ? j.turbo / CFG.turboDur : 1 - j.recarga / CFG.turboRecarga;
    u.turbo.style.width = (Math.max(0, Math.min(1, t)) * 100).toFixed(0) + '%';
    const off = j.recarga > 0 && j.turbo <= 0;
    if (u.cache.off !== off){ u.cache.off = off; u.bt.classList.toggle('off', off); }
  });
}

// ---------------------------------------------------------------------
// Joystick táctil
// ---------------------------------------------------------------------
const lienzo = N.lienzo;
const toques = {};   // pointerId -> {j, x0, y0, joy}
function humanoDeToque(y){
  const hs = js.filter(j => j.humano);
  if (frente) return y < innerHeight / 2 ? hs[1] : hs[0];
  return hs[0];
}
function joyDe(j){ return js.filter(x => x.humano).indexOf(j) === 1 ? $('#svJoy2') : $('#svJoy1'); }
function ocultarJoys(){ $('#svJoy1').hidden = true; $('#svJoy2').hidden = true; Object.keys(toques).forEach(k => delete toques[k]); }
const RADIO_JOY = 55;
function moverJoy(t, x, y){
  let dx = x - t.x0, dy = y - t.y0; const l = Math.hypot(dx, dy);
  if (l > RADIO_JOY){ dx *= RADIO_JOY / l; dy *= RADIO_JOY / l; }
  t.joy.firstElementChild.style.transform = `translate(${dx}px,${dy}px)`;
  const s = Math.min(1, l / RADIO_JOY), girado = frente && js.filter(q => q.humano).indexOf(t.j) === 1 ? -1 : 1;
  // pantalla -> cancha: derecha = +x, abajo = +z (y al revés para el que está al frente)
  const m = l > 4 ? s / l : 0;
  t.j.input.x = dx * m * girado; t.j.input.z = dy * m * girado;
}
lienzo.addEventListener('pointerdown', e => {
  if (N.getEstado() !== 'supervivencia' || !activa || fin) return;
  const j = humanoDeToque(e.clientY); if (!j || !j.vivo) return;
  if (Object.values(toques).some(t => t.j === j)) return;
  const joy = joyDe(j);
  toques[e.pointerId] = {j, x0: e.clientX, y0: e.clientY, joy};
  joy.style.left = e.clientX + 'px'; joy.style.top = e.clientY + 'px'; joy.hidden = false; joy.firstElementChild.style.transform = '';
  try { lienzo.setPointerCapture(e.pointerId); } catch (er) {}
});
lienzo.addEventListener('pointermove', e => { const t = toques[e.pointerId]; if (t) moverJoy(t, e.clientX, e.clientY); });
const soltar = e => { const t = toques[e.pointerId]; if (!t) return; t.j.input.x = t.j.input.z = 0; t.joy.hidden = true; delete toques[e.pointerId]; };
lienzo.addEventListener('pointerup', soltar); lienzo.addEventListener('pointercancel', soltar);
// teclado (para jugar en computador)
const teclas = {};
addEventListener('keydown', e => { teclas[e.code] = true; if (N.getEstado() === 'supervivencia' && /Arrow|Space/.test(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { teclas[e.code] = false; });
function leerTeclado(){
  const j = js.find(x => x.humano); if (!j || Object.values(toques).some(t => t.j === j)) return;
  const x = (teclas.ArrowRight || teclas.KeyD ? 1 : 0) - (teclas.ArrowLeft || teclas.KeyA ? 1 : 0);
  const z = (teclas.ArrowDown || teclas.KeyS ? 1 : 0) - (teclas.ArrowUp || teclas.KeyW ? 1 : 0);
  if (x || z || j.teclado){ const l = Math.hypot(x, z) || 1; j.input.x = x / l; j.input.z = z / l; j.teclado = !!(x || z); }
  j.input.turboTecla = !!teclas.Space;
  j.input.freno = !!(teclas.ShiftLeft || teclas.ShiftRight);
}

// ---------------------------------------------------------------------
// Conducción: aceleración, turbo, freno y derrape
// ---------------------------------------------------------------------
const dirDe = a => new V3(Math.sin(a), 0, -Math.cos(a));
function conducir(j, dt){
  const inp = j.input;
  if ((inp.turbo || inp.turboTecla) && j.turbo <= 0 && j.recarga <= 0){
    j.turbo = CFG.turboDur; j.recarga = CFG.turboRecarga + CFG.turboDur;
    A.sfx.turbo(); registrar('turbo', {jugador: j.nombre});
    for (let i = 0; i < 20; i++) chispa(new V3(j.p.x, j.r, j.p.z), new V3((Math.random() - .5) * 3, Math.random() * 2, (Math.random() - .5) * 3), 0.5, 0x5cff8a, 0);
  }
  if (j.turbo > 0) j.turbo -= dt; else if (j.recarga > 0) j.recarga -= dt;
  const enTurbo = j.turbo > 0;
  const s = Math.min(1, Math.hypot(inp.x, inp.z));
  if (s > 0.08){
    // girar hacia donde apunta el joystick
    const objetivo = Math.atan2(inp.x, -inp.z);
    let d = objetivo - j.h; d = Math.atan2(Math.sin(d), Math.cos(d));
    const giro = CFG.giro * dt * (enTurbo ? 0.75 : 1);
    j.h += Math.max(-giro, Math.min(giro, d));
    const f = dirDe(j.h);
    const acel = CFG.acel * s * (enTurbo ? CFG.turboAcel : 1);
    j.v.x += f.x * acel * dt; j.v.z += f.z * acel * dt;
  } else if (enTurbo){
    const f = dirDe(j.h); j.v.x += f.x * CFG.acel * CFG.turboAcel * dt; j.v.z += f.z * CFG.acel * CFG.turboAcel * dt;
  }
  // agarre lateral: si va rápido y gira fuerte (o con turbo), la canica derrapa
  const f = dirDe(j.h), adelante = j.v.x * f.x + j.v.z * f.z;
  const latX = j.v.x - f.x * adelante, latZ = j.v.z - f.z * adelante, lat = Math.hypot(latX, latZ);
  const vel = Math.hypot(j.v.x, j.v.z);
  j.derrape = lat > 1.6 && vel > 3;
  const agarre = (j.derrape || enTurbo) ? CFG.agarreDerrape : CFG.agarre;
  const k = 1 - Math.exp(-agarre * dt);
  j.v.x -= latX * k; j.v.z -= latZ * k;
  // arrastre y freno
  const arr = Math.exp(-(CFG.arrastre + ((inp.freno || inp.frenoBoton) ? CFG.freno : 0)) * dt);
  j.v.x *= arr; j.v.z *= arr;
  // velocidad máxima (las grandes un poquito más lentas)
  const tam = j.r / CFG.radioInicial;
  const vmax = (enTurbo ? CFG.turboVmax : CFG.vmax) / (1 + CFG.lentitudTamano * (tam - 1) / 4);
  const v2 = Math.hypot(j.v.x, j.v.z);
  if (v2 > vmax){ j.v.x *= vmax / v2; j.v.z *= vmax / v2; }
  j.p.x += j.v.x * dt; j.p.z += j.v.z * dt;
  // borde de la arena: rebota hacia adentro
  const dx = j.p.x - CFG.arena.x, dz = j.p.z - CFG.arena.z, d = Math.hypot(dx, dz), lim = CFG.arena.radio - j.r;
  if (d > lim){
    const nx = dx / d, nz = dz / d; j.p.x = CFG.arena.x + nx * lim; j.p.z = CFG.arena.z + nz * lim;
    const vn = j.v.x * nx + j.v.z * nz; if (vn > 0){ j.v.x -= 1.5 * vn * nx; j.v.z -= 1.5 * vn * nz; }
  }
}

// ---------------------------------------------------------------------
// Fuente Suprema
// ---------------------------------------------------------------------
function ponerFuente(){
  const vs = vivos();
  for (let i = 0; i < 40; i++){
    const a = Math.random() * Math.PI * 2, d = Math.random() * (CFG.arena.radio - 3);
    const p = new V3(CFG.arena.x + Math.cos(a) * d, 0, CFG.arena.z + Math.sin(a) * d);
    if (i < 30 && vs.some(j => j.p.distanceTo(p) < CFG.fuente.distMin)) continue;
    fuente.p.copy(p); break;
  }
  fuente.grupo.position.copy(fuente.p); fuente.grupo.visible = true; fuente.activa = true; fuente.t = 0;
  registrar('fuente', {x: +fuente.p.x.toFixed(1), z: +fuente.p.z.toFixed(1)});
}
function pasoFuente(dt){
  if (!fuente.activa){
    if (fuente.espera > 0){ fuente.espera -= dt; return; }
    if (vivos().some(j => !j.sup) && cuenta <= 0) ponerFuente();
    return;
  }
  fuente.t += dt;
  fuente.col.material.opacity = 0.65 + Math.sin(fuente.t * 4) * 0.2;
  fuente.aro.scale.setScalar(1 + Math.sin(fuente.t * 5) * 0.08);
  if (Math.random() < 0.7) chispa(new V3(fuente.p.x + (Math.random() - .5) * 1.4, 0.1, fuente.p.z + (Math.random() - .5) * 1.4), new V3(0, 2 + Math.random() * 2, 0), 1.4, 0xffe68a, -0.5);
  for (const j of vivos()){
    if (j.sup) continue;
    if (Math.hypot(j.p.x - fuente.p.x, j.p.z - fuente.p.z) < CFG.fuente.radio + j.r * 0.5){
      j.sup = true; j.pulso = 1;
      fuente.activa = false; fuente.grupo.visible = false; fuente.espera = CFG.fuente.reaparece;
      flash('¡FUENTE SUPREMA!', `${j.nombre} ahora puede devorar`, j.color);
      A.sfx.transformacion(); A.voz('fuente', '¡Fuente suprema!');
      estallar(new V3(j.p.x, 0.4, j.p.z), 0xffd84a, 0.3);
      registrar('poder', {jugador: j.nombre});
      break;
    }
  }
}

// ---------------------------------------------------------------------
// Choques: devorar, duelo entre poderosos por velocidad, rebotes
// ---------------------------------------------------------------------
const contactos = new Set();
function eliminar(v, motivo, por){
  if (!v.vivo) return;
  v.vivo = false; v.mesh.visible = false; v.anillo.visible = false; v.aura.visible = false;
  v.puesto = vivos().length + 1;
  estallar(new V3(v.p.x, v.r, v.p.z), v.color, v.r);
  A.sfx.explosion(); A.sfx.estallido();
  registrar('eliminado', {jugador: v.nombre, motivo, por: por ? por.nombre : null});
  ocultarJoyDe(v);
  if (vivos().length <= 1 && !fin){ fin = true; finT = 1.8; }
  else if (v.humano && !js.some(x => x.humano && x.vivo) && !fin){ fin = true; finT = 1.8; }
}
function ocultarJoyDe(j){ Object.keys(toques).forEach(k => { if (toques[k].j === j){ toques[k].joy.hidden = true; delete toques[k]; } }); }
function crecer(j, v){
  const area = j.rObj * j.rObj + v.r * v.r * CFG.crecer;
  j.rObj = Math.min(CFG.radioMax, Math.sqrt(area)); j.pulso = 1; j.devoradas++;
}
function rebotar(a, b, n, d){
  const ma = a.r * a.r, mb = b.r * b.r, solape = a.r + b.r - d;
  a.p.x -= n.x * solape * mb / (ma + mb); a.p.z -= n.z * solape * mb / (ma + mb);
  b.p.x += n.x * solape * ma / (ma + mb); b.p.z += n.z * solape * ma / (ma + mb);
  const vr = (b.v.x - a.v.x) * n.x + (b.v.z - a.v.z) * n.z;
  if (vr >= 0) return 0;
  const jimp = -(1 + CFG.rebote) * vr / (1 / ma + 1 / mb);
  a.v.x -= jimp / ma * n.x; a.v.z -= jimp / ma * n.z;
  b.v.x += jimp / mb * n.x; b.v.z += jimp / mb * n.z;
  return -vr;
}
function choques(){
  const vs = vivos();
  for (let x = 0; x < vs.length; x++) for (let y = x + 1; y < vs.length; y++){
    const a = vs[x], b = vs[y];
    if (!a.vivo || !b.vivo) continue;
    const dx = b.p.x - a.p.x, dz = b.p.z - a.p.z, d = Math.hypot(dx, dz), clave = a.i + '-' + b.i;
    if (d >= a.r + b.r || d < 1e-6){ contactos.delete(clave); continue; }
    const n = {x: dx / d, z: dz / d};
    const nuevo = !contactos.has(clave); contactos.add(clave);
    if (nuevo){
      // velocidad de cada una HACIA la otra en el momento del choque
      const va = a.v.x * n.x + a.v.z * n.z, vb = -(b.v.x * n.x + b.v.z * n.z);
      if (a.sup && !b.sup){ devorar(a, b); continue; }
      if (b.sup && !a.sup){ devorar(b, a); continue; }
      if (a.sup && b.sup){
        const mx = Math.max(va, vb), dif = va - vb;
        if (mx >= CFG.impactoMin && Math.abs(dif) >= CFG.empate){
          const gana = dif > 0 ? a : b, pierde = dif > 0 ? b : a;
          registrar('duelo', {gana: gana.nombre, pierde: pierde.nombre, vGana: +Math.max(va, vb).toFixed(2), vPierde: +Math.min(va, vb).toFixed(2)});
          flash('¡CHOQUE SUPREMO!', `${gana.nombre} llegó más rápido`, gana.color);
          A.voz('eliminacion');
          eliminar(pierde, 'choque supremo', gana);
          continue;
        }
        registrar('empate', {a: a.nombre, b: b.nombre, va: +va.toFixed(2), vb: +vb.toFixed(2)});
      }
    }
    const f = rebotar(a, b, n, d);
    if (nuevo && f > 0.5){
      A.sfx.rebote(f);
      const p = new V3(a.p.x + n.x * a.r, Math.min(a.r, b.r), a.p.z + n.z * a.r);
      for (let i = 0; i < Math.min(20, f * 4); i++) chispa(p, new V3((Math.random() - .5) * 4, Math.random() * 3, (Math.random() - .5) * 4), 0.4, a.sup && b.sup ? 0xffd84a : 0xffffff);
    }
  }
}
function devorar(c, v){
  crecer(c, v);
  registrar('devorada', {por: c.nombre, victima: v.nombre, radio: +c.rObj.toFixed(3)});
  flash('¡DEVORADA!', `${c.nombre} se comió a ${v.nombre}`, c.color);
  A.sfx.devorar(); A.voz('devorar', '¡Devorada!');
  eliminar(v, 'devorada', c);
}

// ---------------------------------------------------------------------
// La máquina
// ---------------------------------------------------------------------
function iaPaso(j, dt){
  const e = j.iaE; e.t -= dt; e.ruido += dt;
  if (e.t <= 0){
    e.t = 0.25 + Math.random() * 0.2;
    const otros = vivos().filter(o => o !== j);
    const cerca = (lista) => lista.sort((a, b) => a.p.distanceTo(j.p) - b.p.distanceTo(j.p))[0];
    let dir = null, turbo = false;
    if (!j.sup){
      const amenaza = cerca(otros.filter(o => o.sup && o.p.distanceTo(j.p) < CFG.ia.huirDe));
      if (amenaza && (!fuente.activa || amenaza.p.distanceTo(j.p) < 4)){
        dir = j.p.clone().sub(amenaza.p); turbo = amenaza.p.distanceTo(j.p) < CFG.ia.turboCerca;
        // no huir contra el borde
        const c = new V3(CFG.arena.x - j.p.x, 0, CFG.arena.z - j.p.z);
        if (j.p.distanceTo(new V3(CFG.arena.x, 0, CFG.arena.z)) > CFG.arena.radio * 0.75) dir.add(c.normalize().multiplyScalar(dir.length()));
      } else if (fuente.activa) dir = fuente.p.clone().sub(j.p);
      else { const presa = cerca(otros.filter(o => !o.sup)); dir = presa ? j.p.clone().sub(presa.p).multiplyScalar(-0.2) : new V3(Math.cos(e.ruido), 0, Math.sin(e.ruido)); }
    } else {
      const presa = cerca(otros.filter(o => !o.sup)) || cerca(otros);
      if (presa){
        const lleva = presa.p.clone().addScaledVector(presa.v, 0.35);
        dir = lleva.sub(j.p);
        turbo = presa.p.distanceTo(j.p) < CFG.ia.turboCerca;
      } else dir = new V3();
    }
    dir.y = 0;
    if (dir.lengthSq() > 1e-6){ dir.normalize(); const err = (Math.random() - .5) * CFG.ia.error; const c = Math.cos(err), s = Math.sin(err); dir.set(dir.x * c - dir.z * s, 0, dir.x * s + dir.z * c); }
    e.dir.copy(dir); e.turbo = turbo;
  }
  j.input.x = e.dir.x; j.input.z = e.dir.z; j.input.turbo = e.turbo; j.input.freno = false;
}

// ---------------------------------------------------------------------
// Cámaras y dibujo
// ---------------------------------------------------------------------
function camaraDe(j, dt, girada){
  const sigue = j.vivo ? j : (vivos().sort((a, b) => b.r - a.r)[0] || j);
  const vel = Math.hypot(sigue.v.x, sigue.v.z);
  const h = 6 + sigue.r * 10 + vel * 0.35;
  const tp = new V3(sigue.p.x, h, sigue.p.z + h * 0.55), tm = new V3(sigue.p.x, 0, sigue.p.z - h * 0.08);
  const k = 1 - Math.exp(-dt * 4);
  j.cam.pos.lerp(tp, k); j.cam.mira.lerp(tm, k);
  j.cam.cam.position.copy(j.cam.pos); j.cam.cam.up.set(0, 1, 0); j.cam.cam.lookAt(j.cam.mira);
  if (girada) j.cam.cam.rotateZ(Math.PI);
}
function camaras(dt){
  const hs = js.filter(j => j.humano);
  hs.forEach((j, k) => camaraDe(j, dt, frente && k === 1));
  const principal = hs[0] || js[0];
  if (!hs.length && principal) camaraDe(principal, dt, false);
  if (!frente && principal){ camera.position.copy(principal.cam.cam.position); camera.quaternion.copy(principal.cam.cam.quaternion); }
  if (principal){ N.sol.target.position.copy(principal.cam.mira); N.sol.position.copy(principal.cam.mira).add(new V3(5, 12, 6)); }
}
function dibujar(){
  if (!activa || !frente) return false;
  const hs = js.filter(j => j.humano), r = N.renderer, W = innerWidth, H = innerHeight, h2 = Math.floor(H / 2);
  r.setScissorTest(true);
  [[hs[0], 0, h2], [hs[1], h2, H - h2]].forEach(([j, y, alto]) => {
    const c = j.cam.cam; c.aspect = W / alto; c.updateProjectionMatrix();
    r.setScissor(0, y, W, alto); r.setViewport(0, y, W, alto); r.render(scene, c);
  });
  r.setScissorTest(false); r.setViewport(0, 0, W, H);
  return true;
}
const qTmp = new THREE.Quaternion();
function pasoMallas(dt){
  js.forEach(j => {
    if (!j.vivo) return;
    j.r += (j.rObj - j.r) * (1 - Math.exp(-dt * 3));
    j.pulso = Math.max(0, j.pulso - dt * 2.5);
    const s = j.r / R * (1 + Math.sin(j.pulso * 14) * 0.12 * j.pulso);
    const ant = j.mesh.position.clone();
    j.mesh.position.set(j.p.x, j.r, j.p.z); j.mesh.scale.setScalar(s);
    const dx = j.p.x - ant.x, dz = j.p.z - ant.z, d = Math.hypot(dx, dz);
    if (d > 1e-6 && d < 2) j.mesh.quaternion.premultiply(qTmp.setFromAxisAngle(new V3(dz / d, 0, -dx / d), d / j.r));
    j.anillo.position.set(j.p.x, 0.01, j.p.z); j.anillo.scale.setScalar(j.r * 1.15); j.anillo.visible = true;
    j.aura.visible = j.sup;
    if (j.sup){ j.aura.position.set(j.p.x, j.r, j.p.z); j.aura.scale.setScalar(j.r * (4.5 + Math.sin(tiempo * 6 + j.i) * 0.6)); j.aura.material.color.setHex(j.turbo > 0 ? 0x9fffd0 : 0xffd860); }
    // derrape: polvo y chirrido
    if (j.derrape){
      if (Math.random() < 0.6) chispa(new V3(j.p.x, 0.05, j.p.z), new V3((Math.random() - .5), 0.6 + Math.random(), (Math.random() - .5)), 0.6, 0xc9a07a, 1.5);
      if (tiempo - j.ultDerrape > 0.18){ j.ultDerrape = tiempo; if (j.humano) A.sfx.derrape(); }
    }
    if (j.turbo > 0) chispa(new V3(j.p.x - j.v.x * 0.03, j.r, j.p.z - j.v.z * 0.03), new V3(-j.v.x * 0.15, 0.4, -j.v.z * 0.15), 0.4, j.sup ? 0xffd84a : 0x5cff8a, 0);
  });
}

// ---------------------------------------------------------------------
// Cuadro a cuadro
// ---------------------------------------------------------------------
function paso(dt){
  if (!activa) return;
  tiempo += dt;
  if (cuenta > 0){
    cuenta -= dt; const n = Math.ceil(cuenta);
    if (n !== cuentaPrev){ cuentaPrev = n; $('#svCuenta').textContent = n > 0 ? String(n) : '¡YA!'; A.sfx.cuenta(n); if (n <= 0) setTimeout(() => { $('#svCuenta').textContent = ''; }, 700); }
  }
  leerTeclado();
  if (!fin && cuenta <= 0) js.forEach(j => { if (j.vivo && j.ia) iaPaso(j, dt); });
  const sub = 4, h = dt / sub;
  for (let s = 0; s < sub; s++){
    if (cuenta <= 0) js.forEach(j => { if (j.vivo) conducir(j, h); });
    choques();
  }
  pasoFuente(dt);
  pasoMallas(dt);
  pasoParticulas(dt);
  camaras(dt);
  if (flashT > 0){ flashT -= dt; if (flashT <= 0) $('#svFlash').classList.remove('ver'); }
  // música: tranquila, alguien con poder, cacería cerca de la persona, final con dos
  const hum = js.find(j => j.humano && j.vivo);
  let nv = vivos().some(j => j.sup) ? 1 : 0;
  if (hum && vivos().some(o => o !== hum && (o.sup || hum.sup) && o.p.distanceTo(hum.p) < 5)) nv = 2;
  if (js.length > 2 && vivos().length === 2) nv = 3;
  A.ponerIntensidad(nv);
  A.rodar(vivos().reduce((t, j) => t + Math.hypot(j.v.x, j.v.z), 0) * 0.5);
  pintarZonas();
  if (fin && finT > 0){ finT -= dt; if (finT <= 0) mostrarFin(); }
}
function mostrarFin(){
  const g = vivos().length === 1 ? vivos()[0] : null;
  const humanoVivo = js.some(j => j.humano && j.vivo);
  if (g){ g.puesto = 1; }
  A.sfx.victoria(); A.celebrar();
  if (g && g.humano){ A.voz('victoria'); setTimeout(() => A.voz('rey', '¡Eres el rey de las chiras!'), 1300); }
  $('#svFinTit').textContent = g ? (g.humano ? `¡${g.nombre} sobrevivió!` : `Ganó ${g.nombre}`) : (humanoVivo ? '¡Sobrevivió!' : 'Lo devoraron');
  const ranking = js.slice().sort((a, b) => (a.puesto || 99) - (b.puesto || 99)).map(j => `${j.puesto || '-'}. ${j.nombre} (${j.devoradas} devoradas)`).join('\n');
  $('#svFinTxt').textContent = ranking; $('#svFinTxt').style.whiteSpace = 'pre-line';
  $('#svFin').hidden = false; ocultarJoys();
  registrar('fin', {ganador: g ? g.nombre : null, tiempo: +tiempo.toFixed(1)});
  if (PRUEBA){
    partidas++;
    const cuenta2 = {}; registro.forEach(e => { if (/devorada|duelo|empate|poder/.test(e.tipo)) cuenta2[e.tipo] = (cuenta2[e.tipo] || 0) + 1; });
    console.log(`[fin] partida ${partidas}: ganó ${g ? g.nombre : 'nadie'} en ${tiempo.toFixed(1)} s · ${JSON.stringify(cuenta2)}`);
    if (partidas < 5) setTimeout(() => iniciar(opciones), 300); else console.log('[resumen] ' + partidas + ' partidas terminadas');
  }
}
$('#svSalir').addEventListener('click', salir);
$('#svMenu').addEventListener('click', salir);
$('#svRevancha').addEventListener('click', () => { N.initAudio(); A.iniciarMusica(); iniciar(opciones); });

window.ChirasSupervivencia = {
  CFG, paso, dibujar, iniciar, iniciarDesdeMenu, salir, elegida: () => tipo === 'super',
  jugadores: () => js, registro: () => registro, fuente, ponerFuente, estado: () => ({activa, fin, tiempo, vivos: vivos().length})
};
if (PRUEBA) addEventListener('load', () => iniciar({humanos: 0, bots: 6, nombres: []}));
if (location.hash === '#prueba-super-reglas') addEventListener('load', () => { const s = document.createElement('script'); s.src = 'pruebas-supervivencia.js'; document.body.appendChild(s); });
})();
