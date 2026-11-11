// =====================================================================
// CHIRAS PELAS — Modo Batalla (sin turnos)
// Usa el mismo escenario, física, hueco y canicas del modo clásico
// (window.ChirasNucleo). Los poderes y números ajustables están en
// poderes.js; los sonidos y el narrador en audio.js.
// =====================================================================
(function(){
const N = window.ChirasNucleo, P = window.ChirasPoderes, A = window.ChirasAudio;
if (!N || !P || !A){ console.error('Batalla: faltan módulos'); return; }
const {THREE, scene, camera, R, HOLE, HOLE_R} = N;
const V3 = THREE.Vector3, C = P.CONFIG;
const $ = s => document.querySelector(s);
const HASH = location.hash;
const PRUEBA = HASH === '#prueba-batalla';

// ---------------------------------------------------------------------
// Interfaz (se agrega al cargar)
// ---------------------------------------------------------------------
const css = document.createElement('style');
css.textContent = `
.bt{position:fixed;inset:0;pointer-events:none;z-index:4;font-family:var(--body)}
.bt-arriba{position:absolute;left:0;right:0;top:0;padding:calc(env(safe-area-inset-top,0px) + 6px) 10px 0;display:flex;flex-direction:column;align-items:center;gap:5px}
.bt-arriba.frente{flex-direction:column-reverse}
.bt-abajo{position:absolute;left:0;right:0;bottom:0;padding:0 10px calc(env(safe-area-inset-bottom,0px) + 8px);display:flex;justify-content:center}
.bt-titulo{font-family:var(--display);font-size:19px;letter-spacing:1px;color:var(--amarillo);text-shadow:0 2px 0 var(--rojo),0 4px 0 var(--azul);line-height:1;padding:2px 10px 6px}
.bt-panel{--c:#fff;width:min(100%,460px);min-width:0;max-width:100%;background:rgba(20,12,6,.74);border-radius:14px;padding:6px 8px;display:flex;flex-direction:column;gap:5px;pointer-events:auto;border:2px solid var(--c)}
.bt-panel.girado{transform:rotate(180deg)}
.bt.partida .bt-titulo{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);text-shadow:0 2px 0 var(--rojo),0 4px 0 var(--azul),0 0 10px rgba(0,0,0,.6)}
.bt-panel.compacto .bt-pods{display:none}
.bt-f1{display:flex;align-items:center;gap:6px;font-size:13px;min-height:20px}
.bt-f1 i{width:12px;height:12px;border-radius:50%;background:var(--c);flex:none}
.bt-f1 b{font-family:var(--display);font-weight:400;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:38%}
.bt-estado{opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bt-verdad{margin-left:auto;font-family:var(--display);font-size:12px;padding:1px 7px;border-radius:6px;background:rgba(247,234,208,.12);color:rgba(247,234,208,.45);white-space:nowrap;flex:none}
.bt-verdad.si{background:var(--amarillo);color:var(--tierra);box-shadow:0 0 10px var(--amarillo)}
.bt-pot{height:6px;border-radius:3px;background:rgba(247,234,208,.15);overflow:hidden}
.bt-pot div{height:100%;width:0;background:linear-gradient(90deg,var(--amarillo),var(--rojo))}
.bt-pods{display:flex;gap:6px;min-width:0}
.bt-pods.muchos{gap:4px}
.bt-pods.muchos .bt-pod{font-size:10px}
.bt-pods.muchos .bt-pod .ic{font-size:16px}
.bt-pod{--pc:#fff;flex:1 1 0;width:0;min-width:0;position:relative;overflow:hidden;border:0;border-radius:10px;padding:5px 2px 4px;background:var(--pc);color:#1a0f07;font-family:var(--display);font-size:12px;line-height:1.05;display:flex;flex-direction:column;align-items:center;gap:1px;box-shadow:0 3px 0 rgba(0,0,0,.35);touch-action:manipulation}
.bt-pod .ic{font-size:18px;line-height:1}
.bt-pod .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.bt-pod .us{position:absolute;top:2px;right:4px;font-size:10px}
.bt-pod .cd{position:absolute;inset:0;background:rgba(10,6,3,.72);transform-origin:bottom;transform:scaleY(0)}
.bt-pod .tx{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;text-shadow:0 1px 2px #000}
.bt-pod.off{filter:grayscale(.85) brightness(.6)}
.bt-pod:active{transform:translateY(2px)}
.bt-pod.ia{pointer-events:none}
.bt-efx{display:flex;gap:5px;flex-wrap:wrap;font-size:11px}
.bt-efx:empty{display:none}
.bt-efx span{background:rgba(247,234,208,.14);border-radius:6px;padding:1px 6px}
.bt-efx span.malo{background:#2c5bff;color:#fff}
.bt-msg{font-size:12px;color:var(--amarillo)}
.bt-msg:empty{display:none}
.bt-lado{position:absolute;right:max(8px,env(safe-area-inset-right,0px));top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:8px;pointer-events:auto}
.bt-lado button{width:42px;height:42px;border-radius:12px;border:2px solid rgba(247,234,208,.35);background:rgba(20,12,6,.74);color:var(--crema);font-size:18px;padding:0}
.bt-vol{position:absolute;right:60px;top:50%;transform:translateY(-50%);background:rgba(20,12,6,.92);border-radius:14px;padding:12px;pointer-events:auto;width:230px}
.bt-flash{--c:#d7263d;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.8);text-align:center;font-family:var(--display);font-size:clamp(26px,8vw,46px);color:#fff;text-shadow:0 3px 0 var(--c),0 0 22px var(--c);opacity:0;transition:opacity .15s,transform .15s;width:min(92vw,560px);pointer-events:none;line-height:1.05}
.bt-flash small{display:block;font-size:.45em;color:var(--amarillo);text-shadow:0 2px 0 #000;margin-top:4px}
.bt-flash.ver{opacity:1;transform:translate(-50%,-50%) scale(1)}
.bt-cuenta{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:var(--display);font-size:90px;color:var(--amarillo);text-shadow:0 5px 0 var(--rojo),0 9px 0 var(--azul);pointer-events:none}
.bt-blanco{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .3s}
@media (prefers-reduced-motion:reduce){.bt-flash,.bt-blanco{transition:none}}
`;
document.head.appendChild(css);
const raiz = document.createElement('div');
raiz.innerHTML = `
<div class="bt" id="bt" hidden>
  <div class="bt-blanco" id="btBlanco"></div>
  <div class="bt-arriba" id="btArriba"><div class="bt-titulo">CHIRAS PELAS</div><div class="bt-panel" id="btP2"></div></div>
  <div class="bt-abajo"><div class="bt-panel" id="btP1"></div></div>
  <div class="bt-lado">
    <button type="button" id="btSalir" aria-label="Volver al menú">✕</button>
    <button type="button" id="btVolBtn" aria-label="Volumen" aria-expanded="false">🔊</button>
    <button type="button" id="btCamBtn" aria-label="Cambiar cámara">🗺️</button>
  </div>
  <div class="bt-vol vols" id="btVol" hidden>
    <label for="btVolMusica">Música</label><input type="range" id="btVolMusica" min="0" max="100">
    <label for="btVolEfectos">Efectos</label><input type="range" id="btVolEfectos" min="0" max="100">
    <label for="btVolVoz">Narrador</label><input type="range" id="btVolVoz" min="0" max="100">
  </div>
  <div class="bt-flash" id="btFlash" role="status" aria-live="polite"></div>
  <div class="bt-cuenta" id="btCuenta"></div>
</div>
<div class="capa" id="btFin" hidden>
  <div class="tarjeta">
    <h1 id="btFinTit">¡Victoria!</h1>
    <p class="sub" id="btFinTxt"></p>
    <button class="jugar" id="btRevancha" type="button">Revancha</button>
    <button class="jugar" id="btAlMenu" type="button" style="background:var(--azul);box-shadow:0 5px 0 #0d2f6b">Menú</button>
  </div>
</div>`;
while (raiz.firstElementChild) document.body.appendChild(raiz.firstElementChild);

// ---------------------------------------------------------------------
// Estado de la batalla
// ---------------------------------------------------------------------
let activa = false, fin = false, finT = 0, ganador = null, tiempo = 0, cuenta = 0, cuentaPrev = 0;
let js = [], opciones = {}, extras = false, frente = false, seq = 0, registro = [], partidas = 0;
let congelo = null;   // {por: jugador que encholó, t}: los demás no pueden tirar hasta que él tire
const camPos = new V3(), camMira = new V3();
let altura = 20, esc = 1;
const rand = (a, b) => a + Math.random() * (b - a);
const fuerzaDeVel = vel => Math.max(0.02, Math.min(1, Math.pow(Math.max(0, vel - 0.4) / (N.MAXV - 0.4), 1 / N.CURVA)));
const vivos = () => js.filter(j => j.vivo);
const quienVerdad = () => js.find(j => j.vivo && j.verdad) || null;
const poderesActivos = () => opciones.sinPoderes ? [] : P.PODERES.filter(p => p.habilitado && (p.principal || extras));

function registrar(tipo, datos){
  const e = Object.assign({seq: ++seq, t: +tiempo.toFixed(3), tipo}, datos || {});
  registro.push(e);
  if (N.MODO_PRUEBA) console.log('[bt] ' + JSON.stringify(e));
  emitir(tipo, e);
  return e;
}
// Avisos para los módulos de espectáculo, progreso y academia (no cambian las reglas)
const oyentes = {};
function on(tipo, fn){ (oyentes[tipo] = oyentes[tipo] || []).push(fn); }
function emitir(tipo, datos){ (oyentes[tipo] || []).forEach(fn => { try { fn(datos); } catch (er) { console.error('[oyente ' + tipo + ']', er); } }); }

// ---------------------------------------------------------------------
// Mallas compartidas (se reutilizan para no gastar memoria)
// ---------------------------------------------------------------------
const geoPunto = new THREE.CircleGeometry(0.04, 10);
const geoEscudo = new THREE.SphereGeometry(R * 2.3, 18, 12);
const geoBloqueo = new THREE.RingGeometry(R * 2.5, R * 3.1, 28);
const geoPin = new THREE.ConeGeometry(0.08, 0.22, 8); geoPin.rotateX(Math.PI);
const matGris = new THREE.MeshBasicMaterial({color: 0x9a9a9a, transparent: true, opacity: .7});

function crearJugador(i, nombre, ia, estilo){
  const color = N.COLORES[i];
  const mesh = typeof estilo === 'function' ? estilo() : N.hacerBola(estilo);
  const bola = N.nuevaBolaFisica(mesh);
  const j = {
    i, nombre, color, ia, estilo, bola, vivo: true, verdad: false, pendiente: null,
    usos: {}, recarga: {}, bloqueo: 0, bloqueadoPor: null, escudo: 0, efectos: {}, tiro: null, espera: 0,
    apunta: {puntero: null, x0: 0, y0: 0, ang: 0, fuerza: 0, mostrar: false, nivel: 0, maxAvisado: false},
    iaE: {espera: rand(0.2, 0.8), defensa: null, apuntando: null, ceroHecho: false},
    msg: '', msgT: 0, cazadas: 0, ui: null, m: {}
  };
  bola.dueno = j;
  if (opciones.iman) bola.iman = C.iman;
  const mat = new THREE.MeshBasicMaterial({color, transparent: true, opacity: .9});
  j.m.anillo = new THREE.Mesh(N.geoAnillo, mat); j.m.anillo.rotation.x = -Math.PI / 2;
  j.m.pin = new THREE.Mesh(geoPin, new THREE.MeshBasicMaterial({color}));
  j.m.escudo = new THREE.Mesh(geoEscudo, new THREE.MeshBasicMaterial({color, transparent: true, opacity: .28, depthWrite: false}));
  const alambre = new THREE.Mesh(geoEscudo, new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true, transparent: true, opacity: .35, depthWrite: false}));
  j.m.escudo.add(alambre);
  j.m.bloqueo = new THREE.Mesh(geoBloqueo, new THREE.MeshBasicMaterial({color: 0x6fc3ff, transparent: true, opacity: .8, side: THREE.DoubleSide}));
  j.m.bloqueo.rotation.x = -Math.PI / 2;
  j.m.matPunto = new THREE.MeshBasicMaterial({color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), .35), transparent: true, opacity: .95});
  j.m.puntos = [];
  for (let k = 0; k < 12; k++){ const p = new THREE.Mesh(geoPunto, j.m.matPunto); p.rotation.x = -Math.PI / 2; p.visible = false; scene.add(p); j.m.puntos.push(p); }
  [j.m.anillo, j.m.pin, j.m.escudo, j.m.bloqueo].forEach(m => { m.visible = false; scene.add(m); });
  poderesActivos().forEach(p => { j.usos[p.id] = p.usos; j.recarga[p.id] = 0; });
  // la bola empieza en la mano, sobre la raya
  bola.activa = true; bola.enMano = true; mesh.visible = true;
  bola.p.set(i === 0 ? -0.8 : 0.8, 1.05, 0.35); bola.last.copy(bola.p);
  return j;
}

const aroIman = new THREE.Mesh(new THREE.RingGeometry(HOLE_R + 0.04, HOLE_R + R * 0.5 + C.iman.radio, 48),
  new THREE.MeshBasicMaterial({color: 0x7fe3ff, transparent: true, opacity: .2, depthWrite: false}));
aroIman.rotation.x = -Math.PI / 2; aroIman.position.set(HOLE.x, 0.006, HOLE.z); aroIman.visible = false; scene.add(aroIman);
function limpiar(){
  aroIman.visible = false;
  js.forEach(j => {
    scene.remove(j.bola.mesh, j.m.anillo, j.m.pin, j.m.escudo, j.m.bloqueo);
    j.m.puntos.forEach(p => scene.remove(p));
  });
  js = []; N.setJugadores([]);
  explosiones.forEach(e => { e.vida = 0; e.pts.visible = false; e.flash.visible = false; e.frags.forEach(f => f.visible = false); });
}

// ---------------------------------------------------------------------
// Empezar / salir
// ---------------------------------------------------------------------
function iniciar(opts){
  limpiar();
  opciones = Object.assign({contraIA: false, nombres: [], extras: false, ambosIA: false, sinCuenta: false,
    solo: false, blanco: false, sinPoderes: false, inicio: null, puntosCamara: [], canicas: [], especial: false, camara: 'clasica', iman: false}, opts || {});
  congelo = null;
  extras = !!opciones.extras;
  frente = !opciones.contraIA && !opciones.ambosIA && !opciones.solo;
  N.ocultarClasico(); N.setTirador(null);
  $('#btFin').hidden = true;
  // dos canicas distintas al azar del catálogo
  const pool = N.ESTILOS.map(e => e.id).sort(() => Math.random() - .5);
  const n1 = (opciones.nombres[0] || '').trim() || 'Jugador 1';
  const n2 = opciones.contraIA ? 'La máquina' : ((opciones.nombres[1] || '').trim() || 'Jugador 2');
  js = [crearJugador(0, n1, !!opciones.ambosIA, opciones.canicas[0] || pool[0])];
  if (!opciones.solo) js.push(crearJugador(1, opciones.blanco ? 'Blanco' : n2, opciones.contraIA || opciones.ambosIA || opciones.blanco, opciones.canicas[1] || pool[1]));
  if (opciones.blanco) js[1].quieto = true;
  if (opciones.inicio) opciones.inicio.forEach((p, k) => { if (js[k] && p) colocar(js[k], p); });
  N.setJugadores(js);
  N.ganchos.alChocar = alChocar;
  activa = true; fin = false; finT = 0; ganador = null; tiempo = 0; seq = 0; registro = [];
  cuenta = opciones.sinCuenta ? 0 : C.cuentaInicial; cuentaPrev = Math.ceil(cuenta) + 1;
  // interfaz
  $('#bt').hidden = false; $('#btVol').hidden = true;
  $('#btArriba').classList.toggle('frente', frente);
  construirPanel(js[0], $('#btP1'), false);
  $('#btP2').hidden = !js[1];
  if (js[1]) construirPanel(js[1], $('#btP2'), frente);
  $('#btCuenta').textContent = '';
  camPos.copy(camera.position); camMira.set(0, 0, -10);
  camsJ.forEach(c => { c.nueva = true; });
  $('#btCamBtn').textContent = camaraClasica() ? '🗺️' : '🎥';
  $('#bt').classList.toggle('partida', frente && camaraClasica());
  N.setEstado('batalla');
  aroIman.visible = !!opciones.iman;
  if (!opciones.sinCuenta) A.sfx.inicio();
  registrar('inicio', {jugadores: js.map(j => j.nombre), extras, nochera: C.nochera.activa, carambola: P.REGLAS.carambola.activa});
}

function iniciarDesdeMenu(){
  const contraIA = $('#btContra button[aria-pressed="true"]').dataset.c === 'ia';
  const o = {contraIA, nombres: [$('#btNom1').value, $('#btNom2').value], extras: $('#btExtras').checked,
    especial: !!($('#btEspecial') && $('#btEspecial').checked),
    camara: ($('#btCamara button[aria-pressed="true"]') || {dataset: {cam: 'clasica'}}).dataset.cam,
    iman: !!($('#btIman') && $('#btIman').checked)};
  try { localStorage.setItem('chiras-batalla', JSON.stringify(o)); } catch (e) {}
  N.initAudio(); A.iniciarMusica();
  iniciar(Object.assign({}, o, {canicas: window.ChirasProgreso ? window.ChirasProgreso.canicasElegidas(o) : []}));
}

function salir(){
  activa = false; fin = false;
  limpiar(); N.ganchos.alChocar = null;
  A.pararRodar(); A.pararMusica();
  $('#bt').hidden = true; $('#btFin').hidden = true;
  ['musica', 'efectos', 'voz'].forEach(k => { const el = $('#vol' + k[0].toUpperCase() + k.slice(1)); if (el) el.value = Math.round(N.volumen[k] * 100); });
  N.verMenu();
}

// ---------------------------------------------------------------------
// Disparos
// ---------------------------------------------------------------------
function motivoNoTiro(j){
  if (!activa || fin) return 'La partida terminó';
  if (cuenta > 0) return 'Espere la salida';
  if (!j.vivo) return 'Su canica fue eliminada';
  if (j.pendiente) return 'Su canica está tocada';
  if (congelo && congelo.por !== j) return `Congelado: le toca a ${congelo.por.nombre}`;
  if (j.espera > 0) return 'Espere un momento';
  const b = j.bola;
  if (b.enMano || b.enHueco) return null;
  if (b.cayendo) return 'Su bola está cayendo al hueco';
  if (b.p.y > R + 0.01 || b.v.length() > C.disparo.velQuieta) return 'Espere a que su bola pare';
  return null;
}
const puedeDisparar = j => motivoNoTiro(j) === null;

function disparar(j, ang, fuerza){
  if (!puedeDisparar(j)) return false;
  const b = j.bola;
  let vel = N.velDeFuerza(fuerza), trueno = false;
  const e = j.efectos;
  if (e.superpotencia){ vel *= e.superpotencia.factor; delete e.superpotencia; }
  if (e.trueno){ vel *= e.trueno.fuerza; trueno = e.trueno.empuje; delete e.trueno; }
  if (e.congelado) vel *= e.congelado.fuerzaTiro;
  if (b.enHueco){ b.enHueco = false; b.p.set(HOLE.x, R, HOLE.z); b.ignorarHueco = true; }
  if (b.enMano){ b.enMano = false; N.ponerVelocidad(b, ang, vel, true); }
  else { b.p.y = R; N.ponerVelocidad(b, ang, vel, false); }
  j.tiro = {id: seq + 1, t: tiempo, golpeoRival: false, golpeConVerdad: false, victimas: [], tGolpe: 0, trueno, truenoUsado: false, fin: false};
  j.espera = C.disparo.esperaTrasTiro;
  A.sfx.soltar(fuerza);
  if (congelo && congelo.por === j) descongelar('ya tiró');
  registrar('tiro', {jugador: j.nombre, fuerza: +fuerza.toFixed(2), vel: +vel.toFixed(2), conVerdad: j.verdad, x: +b.p.x.toFixed(2), z: +b.p.z.toFixed(2)});
  return true;
}

// ---------------------------------------------------------------------
// Reglas: choques, hueco, eliminación
// ---------------------------------------------------------------------
const tiroActivo = j => j.tiro && !j.tiro.fin;
function alChocar(a, b, fuerza, va, vb){
  if (!activa) return;
  const ja = a.dueno, jb = b.dueno;
  if (!ja || !jb || ja === jb) return;
  emitir('choque', {a: ja, b: jb, fuerza, activoA: tiroActivo(ja), activoB: tiroActivo(jb)});
  if (fuerza > 3) A.sfx.choqueFuerte(fuerza);
  // ¿quién hizo la acción? la bola que viene de un tiro propio; si las dos, la más rápida
  let atac = null, vic = null;
  const ta = tiroActivo(ja), tb = tiroActivo(jb);
  if (ta && (!tb || va >= vb)){ atac = ja; vic = jb; }
  else if (tb){ atac = jb; vic = ja; }
  if (!atac || !atac.vivo) return;
  const t = atac.tiro;
  if (t.trueno && !t.truenoUsado){
    t.truenoUsado = true;
    (atac.bola === a ? b : a).v.multiplyScalar(t.trueno);
    A.sfx.trueno(); destello(); registrar('trueno', {jugador: atac.nombre, contra: vic.nombre});
  }
  if (fuerza < C.impactoMin) return;
  t.golpeoRival = true;
  if (atac.verdad){
    t.golpeConVerdad = true;
    if (!vic.vivo || vic.pendiente || t.victimas.includes(vic)) return;
    if (vic.escudo > 0){ absorber(vic, atac, 'ataque'); return; }
    t.victimas.push(vic); t.tGolpe = tiempo;
    registrar('golpe-valido', {atacante: atac.nombre, victima: vic.nombre, fuerza: +fuerza.toFixed(2)});
    if (P.REGLAS.nochera.activa){
      vic.pendiente = {por: atac, t: tiempo};
      aviso(vic, '¡Tocada!');
    } else eliminar(vic, `${atac.nombre} cazó a ${vic.nombre}`, atac);
  } else if (vic.verdad && C.verdad.quitarConGolpe && vic.vivo){
    if (vic.escudo > 0){ absorber(vic, atac, 'quitar-verdad'); return; }
    vic.verdad = false;
    A.sfx.quitar();
    flash(`¡LE QUITÓ LA VERDAD!`, `${atac.nombre} le pegó a ${vic.nombre}`, atac.color);
    registrar('verdad-quitada', {por: atac.nombre, a: vic.nombre});
  }
}

function absorber(vic, atac, que){
  vic.escudo = 0;
  A.sfx.barreraGolpe(); setTimeout(() => A.sfx.barreraRota(), 120);
  explotar(vic.bola.p, 0x9fe8ff, true);
  flash('¡LA BARRERA AGUANTÓ!', `${vic.nombre} se salvó`, vic.color);
  registrar('barrera-aguanto', {defensor: vic.nombre, atacante: atac.nombre, que});
}

function alEntrarHueco(j){
  const t = j.tiro;
  registrar('hueco', {jugador: j.nombre});
  const aplicaNochera = P.REGLAS.nochera.activa && t && !t.fin && t.golpeoRival && (!C.nochera.soloConVerdad || t.golpeConVerdad);
  if (aplicaNochera){
    const salvados = t.victimas.filter(v => v.pendiente && v.pendiente.por === j);
    salvados.forEach(v => { v.pendiente = null; });
    t.victimas = [];
    A.voz('nochera');
    registrar('nochera-muere', {jugador: j.nombre, salvados: salvados.map(v => v.nombre)});
    eliminar(j, `${j.nombre} golpeó y se metió al hueco`, null, '¡NOCHERA MUERE!');
    return;
  }
  // LA VERDAD es para el primero que enchole (el orden lo da la física, cuadro a cuadro)
  if (!quienVerdad()){
    j.verdad = true;
    A.voz('verdad'); A.sfx.verdad();
    flash('¡LA VERDAD!', `${j.nombre} encholó primero`, j.color);
    registrar('verdad', {jugador: j.nombre});
  }
  // Turno del enchole: el que enchola tira y los demás quedan congelados
  if (C.turnoEnchole.activo && !congelo && j.vivo && js.some(x => x !== j && x.vivo && !x.quieto)){
    congelo = {por: j, t: tiempo};
    js.forEach(x => { if (x !== j){ x.apunta.puntero = null; x.apunta.mostrar = false; x.apunta.fuerza = 0; } });
    registrar('congelados', {por: j.nombre});
    setTimeout(() => { if (congelo && congelo.por === j) flash(`¡TURNO DE ${j.nombre.toUpperCase()}!`, 'Los demás quedan congelados hasta que tire', j.color); }, 1500);
    A.sfx.congelacion();
  }
}
function descongelar(motivo){
  if (!congelo) return;
  registrar('descongelados', {por: congelo.por.nombre, motivo});
  congelo = null;
}

function terminarTiro(j){
  const t = j.tiro; if (!t || t.fin) return;
  t.fin = true;
  registrar('tiro-fin', {jugador: j.nombre, x: +j.bola.p.x.toFixed(2), z: +j.bola.p.z.toFixed(2), enHueco: !!j.bola.enHueco, golpes: t.victimas.length});
  const car = P.REGLAS.carambola;
  if (car.activa && typeof car.evaluar === 'function'){
    const r = car.evaluar(CTX, t, j);
    if (r && r.muere){ A.voz('carambola'); eliminar(r.muere, r.motivo || 'Carambola muere', null, '¡CARAMBOLA MUERE!'); }
  }
  t.victimas.forEach(v => {
    if (v.vivo && v.pendiente && v.pendiente.por === j){
      v.pendiente = null;
      if (j.vivo) eliminar(v, `${j.nombre} cazó a ${v.nombre}`, j);
    }
  });
}

function eliminar(v, motivo, por, titulo){
  if (!v.vivo) return;
  const b = v.bola;
  const pos = (b.enHueco || b.cayendo) ? new V3(HOLE.x, R, HOLE.z) : b.p.clone();
  v.vivo = false; v.pendiente = null; v.verdad = false; v.escudo = 0; v.bloqueo = 0; v.apunta.puntero = null; v.apunta.mostrar = false;
  b.activa = false; b.cayendo = false; b.enHueco = false; b.v.set(0, 0, 0);
  b.mesh.visible = false; v.m.anillo.visible = v.m.pin.visible = v.m.escudo.visible = v.m.bloqueo.visible = false;
  v.m.puntos.forEach(p => p.visible = false);
  if (v.tiro) v.tiro.fin = true;
  explotar(pos, v.color, false);
  A.sfx.explosion(); setTimeout(() => A.sfx.eliminacion(), 250);
  if (!titulo) A.voz('eliminacion');
  if (por) por.cazadas++;
  flash(titulo || '¡ELIMINACIÓN!', motivo, v.color);
  registrar('eliminado', {jugador: v.nombre, motivo, por: por ? por.nombre : null});
  if (vivos().length <= 1 && !fin){ fin = true; finT = 2.2; ganador = vivos()[0] || null; }
}

function mostrarFin(){
  const g = ganador;
  A.sfx.victoria(); A.voz('victoria');
  setTimeout(() => A.voz('rey'), 1300);
  $('#btFinTit').textContent = g ? (g.ia && opciones.contraIA ? 'Ganó la máquina' : `¡${g.nombre} ganó!`) : '¡Empate!';
  $('#btFinTxt').textContent = g ? (g.ia && opciones.contraIA ? 'Pida la revancha.' : '¡VICTORIA! ¡Es el rey de las chiras!') : 'Nadie quedó en pie.';
  $('#btFin').hidden = false;
  registrar('fin', {ganador: g ? g.nombre : null, tiempo: +tiempo.toFixed(1)});
  if (PRUEBA){
    partidas++;
    console.log(`[fin] partida ${partidas}: ganó ${g ? g.nombre : 'nadie'} en ${tiempo.toFixed(1)} s`);
    if (partidas < 6) setTimeout(() => iniciar(opciones), 500);
    else console.log('[resumen] ' + partidas + ' partidas terminadas');
  }
}

// ---------------------------------------------------------------------
// Poderes
// ---------------------------------------------------------------------
const CTX = {
  rivales: j => js.filter(x => x !== j && x.vivo),
  ponerEscudo(j, dur){ j.escudo = dur; },
  bloquear(r, dur, por){ r.bloqueo = Math.max(r.bloqueo, dur); r.bloqueadoPor = por; registrar('bloqueado', {jugador: r.nombre, por: por.nombre, segundos: dur}); },
  efecto(j, k, dur, datos){ j.efectos[k] = Object.assign({resta: dur, total: dur}, datos); },
  revisarDescuadris(j, max){
    const libre = x => x.vivo && !x.pendiente && !x.bola.cayendo && !x.bola.enHueco && !x.bola.enMano && x.bola.p.y <= R + 0.05;
    if (!libre(j)) return {motivo: j.bola.enMano ? 'Primero haga la salida' : (j.bola.enHueco || j.bola.cayendo) ? 'Su bola está en el hueco' : 'Ahora no se puede mover'};
    const rs = CTX.rivales(j).filter(libre).sort((a, b) => N.distH(a.bola.p, j.bola.p) - N.distH(b.bola.p, j.bola.p));
    if (!rs.length) return {motivo: 'La canica del rival no se puede mover ahora'};
    const r = rs[0], d = N.distH(j.bola.p, r.bola.p);
    if (max > 0 && d > max) return {motivo: `El rival está muy lejos (${Math.round(d)} m, máximo ${max})`};
    if (!posValida(j.bola.p) || !posValida(r.bola.p)) return {motivo: 'Una de las posiciones no es válida'};
    return {motivo: null, rival: r};
  },
  intercambiar(a, b, conservar){
    const pa = a.bola.p.clone(), pb = b.bola.p.clone();
    explotar(pa, 0xc77dff, true); explotar(pb, 0xc77dff, true);
    a.bola.p.set(pb.x, R, pb.z); b.bola.p.set(pa.x, R, pa.z);
    if (!conservar){ a.bola.v.set(0, 0, 0); b.bola.v.set(0, 0, 0); }
    [a, b].forEach(x => { x.bola.v.y = 0; x.bola.ignorarHueco = false; x.bola.last.copy(x.bola.p); });
    registrar('descuadris', {jugador: a.nombre, con: b.nombre, de: [+pa.x.toFixed(2), +pa.z.toFixed(2)], a: [+pb.x.toFixed(2), +pb.z.toFixed(2)]});
  }
};
function posValida(p){
  return Math.abs(p.x) < 59.5 && p.z > -149.5 && p.z < 49.5 && Math.hypot(p.x - HOLE.x, p.z - HOLE.z) > HOLE_R + R * 1.5;
}

function motivoNoPoder(j, p){
  if (!p || !p.habilitado || (!p.principal && !extras)) return 'Ese poder no está disponible';
  if (!activa || fin) return 'La partida terminó';
  if (cuenta > 0) return 'Espere la salida';
  if (!j.vivo) return 'Su canica fue eliminada';
  if (j.pendiente) return 'Su canica está tocada';
  if (congelo && congelo.por !== j && !(C.turnoEnchole.permitirDefensa && p.id === 'barrera')) return `Congelado: le toca a ${congelo.por.nombre}`;
  if (j.bloqueo > 0) return `Bloqueado por Poder Cero (${j.bloqueo.toFixed(1)} s)`;
  if (!(j.usos[p.id] > 0)) return `Ya gastó ${p.nombre}`;
  if (j.recarga[p.id] > 0) return `${p.nombre} se está recargando (${Math.ceil(j.recarga[p.id])} s)`;
  return p.puede ? p.puede(CTX, j) : null;
}
function activarPoder(j, id){
  const p = P.porId(id);
  const motivo = motivoNoPoder(j, p);
  if (motivo){
    if (!j.ia) A.sfx.negado();
    aviso(j, motivo);
    registrar('poder-rechazado', {jugador: j.nombre, poder: id, motivo});
    return {ok: false, motivo};
  }
  j.usos[id]--; j.recarga[id] = p.recarga;
  registrar('poder', {jugador: j.nombre, poder: id, quedan: j.usos[id]});
  p.activar(CTX, j);
  if (A.sfx[p.sonido]) A.sfx[p.sonido]();
  A.voz(p.id);
  flash(p.voz.toUpperCase(), j.nombre, j.color);
  return {ok: true};
}

// ---------------------------------------------------------------------
// La máquina
// ---------------------------------------------------------------------
function listo(j, id){ return motivoNoPoder(j, P.porId(id)) === null; }
function acercandose(r, j){
  const v = r.bola.v; if (v.length() < 0.6) return false;
  const d = j.bola.p.clone().sub(r.bola.p); d.y = 0;
  return d.length() < 9 && v.x * d.x + v.z * d.z > 0;
}
function iaPaso(j, dt){
  if (j.quieto || !j.vivo || fin || cuenta > 0) return;
  const e = j.iaE;
  // defensa: reaccionar cuando el que tiene LA VERDAD lo ataca
  const amenaza = CTX.rivales(j).find(r => r.verdad && ((r.apunta.mostrar && r.apunta.fuerza > 0.2) || (tiroActivo(r) && acercandose(r, j))));
  if (amenaza && !j.verdad && !j.pendiente){
    if (e.defensa === null) e.defensa = rand(C.ia.defensaMin, C.ia.defensaMax);
    e.defensa -= dt;
    if (e.defensa <= 0){
      e.defensa = 1.5;
      if (j.escudo <= 0 && listo(j, 'barrera')) activarPoder(j, 'barrera');
      else if (extras && listo(j, 'congelacion') && Math.random() < .5) activarPoder(j, 'congelacion');
      else if (listo(j, 'descuadris') && N.distH(j.bola.p, amenaza.bola.p) < 5 && Math.random() < .4) activarPoder(j, 'descuadris');
    }
  } else e.defensa = null;

  // apuntando: la línea se ve un momento antes de soltar
  if (e.apuntando){
    const a = e.apuntando; a.t -= dt;
    j.apunta.mostrar = true; j.apunta.ang = a.ang; j.apunta.fuerza = a.f * Math.min(1, 1 - a.t / 0.6);
    if (a.t <= 0){
      e.apuntando = null; j.apunta.mostrar = false; j.apunta.fuerza = 0;
      if (disparar(j, a.ang, a.f)) e.ceroHecho = false;
      e.espera = rand(C.ia.reaccionMin, C.ia.reaccionMax);
    }
    return;
  }
  if (!puedeDisparar(j)) return;
  if (e.espera > 0){ e.espera -= dt; return; }

  const b = j.bola, globo = b.enMano;
  const desde = b.enHueco ? new V3(HOLE.x, R, HOLE.z) : b.p.clone();
  const dueno = quienVerdad();
  let obj = null, extra = 0;
  if (j.verdad){
    const r = CTX.rivales(j).sort((x, y) => N.distH(x.bola.p, desde) - N.distH(y.bola.p, desde))[0];
    if (!r) return;
    if (!e.ceroHecho && r.escudo <= 0 && r.usos.barrera > 0 && listo(j, 'cero') && Math.random() < .6){
      activarPoder(j, 'cero'); e.ceroHecho = true; e.espera = 0.3; return;
    }
    if (extras && Math.random() < .3){
      const k = ['superpotencia', 'trueno'].find(id => listo(j, id));
      if (k){ activarPoder(j, k); e.espera = 0.3; return; }
    }
    obj = r.bola.p; extra = 2.5;
  } else if (dueno && N.distH(desde, dueno.bola.p) < 12){ obj = dueno.bola.p; extra = 2; }
  else {
    if (b.enHueco){ e.espera = 1; return; }
    obj = HOLE;
  }
  let ang = N.angHacia(desde, obj);
  const dist = N.distH(desde, obj);
  let vel = N.velocidadPara(desde, ang, dist + extra, globo);
  if (j.efectos.superpotencia) vel /= j.efectos.superpotencia.factor;
  if (j.efectos.trueno) vel /= j.efectos.trueno.fuerza;
  const lejos = Math.min(1, dist / 20);
  ang += N.gauss() * (C.ia.errorAng + lejos * 0.02);
  vel *= 1 + N.gauss() * C.ia.errorVel;
  e.apuntando = {ang, f: fuerzaDeVel(vel), t: 0.6};
}

// ---------------------------------------------------------------------
// Controles táctiles: cada jugador usa su mitad de la pantalla (cauchera)
// ---------------------------------------------------------------------
const lienzo = N.lienzo;
function jugadorDeToque(y){
  if (frente) return y < innerHeight / 2 ? js[1] : js[0];
  return js.find(j => !j.ia) || null;
}
lienzo.addEventListener('pointerdown', e => {
  if (N.getEstado() !== 'batalla' || !activa || fin) return;
  const j = jugadorDeToque(e.clientY);
  if (!j || j.ia || !j.vivo || j.apunta.puntero !== null) return;
  Object.assign(j.apunta, {puntero: e.pointerId, x0: e.clientX, y0: e.clientY, ang0: j.apunta.ang, fuerza: 0, mostrar: false, nivel: 0, maxAvisado: false});
  try { lienzo.setPointerCapture(e.pointerId); } catch (er) {}
  A.sfx.apuntar();
});
lienzo.addEventListener('pointermove', e => {
  const j = js.find(x => x.apunta.puntero === e.pointerId); if (!j) return;
  const a = j.apunta, dx = e.clientX - a.x0, dy = e.clientY - a.y0, l = Math.hypot(dx, dy);
  if (camaraClasica()){
    // como en el clásico: abajo = fuerza, a los lados = apuntar (el jugador 2 de frente, al revés)
    const s = (frente && j.i === 1) ? -1 : 1;
    a.mostrar = true;
    a.ang = a.ang0 + dx * s * 0.004;
    a.fuerza = Math.max(0, Math.min(1, dy * s / (innerHeight * (frente ? 0.22 : 0.33))));
  } else {
    if (l < 10){ a.mostrar = false; a.fuerza = 0; return; }
    a.mostrar = true;
    a.ang = Math.atan2(-dx, dy);                 // la bola sale al lado contrario del arrastre
    a.fuerza = Math.min(1, l / (innerHeight * 0.28));
  }
  const nivel = Math.floor(a.fuerza * 10);
  if (nivel > a.nivel) A.sfx.carga(a.fuerza);
  a.nivel = nivel;
  if (a.fuerza >= 1 && !a.maxAvisado){ a.maxAvisado = true; A.sfx.maxima(); }
  if (a.fuerza < 0.95) a.maxAvisado = false;
});
function soltar(e){
  const j = js.find(x => x.apunta.puntero === e.pointerId); if (!j) return;
  const a = j.apunta, f = a.fuerza, ang = a.ang;
  a.puntero = null; a.mostrar = false; a.fuerza = 0;
  if (e.type !== 'pointerup' || f < 0.04) return;
  const m = motivoNoTiro(j);
  if (m){ A.sfx.negado(); aviso(j, m); return; }
  disparar(j, ang, f);
}
lienzo.addEventListener('pointerup', soltar);
lienzo.addEventListener('pointercancel', soltar);

// ---------------------------------------------------------------------
// Explosiones ligeras (se reutilizan 4)
// ---------------------------------------------------------------------
const EXP_N = 44, explosiones = [];
const geoFlash = new THREE.SphereGeometry(1, 12, 8), geoFrag = new THREE.TetrahedronGeometry(0.05);
for (let k = 0; k < 4; k++){
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(EXP_N * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(EXP_N * 3), 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({size: 0.12, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  pts.frustumCulled = false; pts.visible = false; scene.add(pts);
  const flashM = new THREE.Mesh(geoFlash, new THREE.MeshBasicMaterial({color: 0xfff3c0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  flashM.visible = false; scene.add(flashM);
  const frags = [];
  for (let i = 0; i < 8; i++){ const f = new THREE.Mesh(geoFrag, new THREE.MeshBasicMaterial({color: 0xffffff})); f.visible = false; scene.add(f); frags.push({m: f, v: new V3()}); }
  explosiones.push({pts, geo, vel: new Float32Array(EXP_N * 3), flash: flashM, frags: frags.map(f => f.m), fv: frags, vida: 0, dur: 1, suave: false, e: 1});
}
function explotar(pos, color, suave){
  const ex = explosiones.reduce((a, b) => (a.vida <= b.vida ? a : b));
  const s = esc;
  ex.vida = ex.dur = suave ? 0.6 : 1.1; ex.suave = suave; ex.e = s;
  const p = ex.geo.attributes.position.array, c = ex.geo.attributes.color.array, v = ex.vel;
  const base = new THREE.Color(color), tonos = [base, new THREE.Color(0xffe14a), new THREE.Color(0xffffff), new THREE.Color(0xff7b2e)];
  const n = suave ? 22 : EXP_N;
  for (let i = 0; i < EXP_N; i++){
    p[i*3] = pos.x; p[i*3+1] = Math.max(R, pos.y); p[i*3+2] = pos.z;
    if (i >= n){ v[i*3] = v[i*3+1] = v[i*3+2] = 0; c[i*3] = c[i*3+1] = c[i*3+2] = 0; continue; }
    const th = Math.random() * Math.PI * 2, ve = (suave ? 1.2 : 2.5 + Math.random() * 3.5) * Math.sqrt(s);
    v[i*3] = Math.cos(th) * ve; v[i*3+1] = (suave ? 0.8 : 2 + Math.random() * 4) * Math.sqrt(s); v[i*3+2] = Math.sin(th) * ve;
    const col = tonos[i % tonos.length]; c[i*3] = col.r; c[i*3+1] = col.g; c[i*3+2] = col.b;
  }
  ex.geo.attributes.position.needsUpdate = true; ex.geo.attributes.color.needsUpdate = true;
  ex.pts.material.size = 0.13 * s; ex.pts.material.opacity = 1; ex.pts.visible = true;
  ex.flash.position.copy(pos); ex.flash.visible = !suave; ex.flash.scale.setScalar(0.1); ex.flash.material.opacity = 1;
  ex.fv.forEach((f, i) => {
    f.m.visible = !suave; f.m.position.copy(pos); f.m.scale.setScalar(s); f.m.material.color.copy(i % 2 ? base : tonos[1]);
    const th = Math.random() * Math.PI * 2; f.v.set(Math.cos(th) * 3 * Math.sqrt(s), (3 + Math.random() * 3) * Math.sqrt(s), Math.sin(th) * 3 * Math.sqrt(s));
  });
  if (!suave) destello();
}
function pasoExplosiones(dt){
  explosiones.forEach(ex => {
    if (ex.vida <= 0) return;
    ex.vida -= dt;
    const k = Math.max(0, ex.vida / ex.dur);
    const p = ex.geo.attributes.position.array, v = ex.vel;
    for (let i = 0; i < EXP_N; i++){
      v[i*3+1] -= 6 * dt;
      p[i*3] += v[i*3] * dt; p[i*3+1] = Math.max(0.02, p[i*3+1] + v[i*3+1] * dt); p[i*3+2] += v[i*3+2] * dt;
      v[i*3] *= 0.98; v[i*3+2] *= 0.98;
    }
    ex.geo.attributes.position.needsUpdate = true;
    ex.pts.material.opacity = k;
    const tf = 1 - k;
    if (ex.flash.visible){ ex.flash.scale.setScalar((0.2 + tf * 3) * ex.e * 0.5); ex.flash.material.opacity = Math.max(0, 1 - tf * 3); if (tf > 0.4) ex.flash.visible = false; }
    ex.fv.forEach(f => {
      if (!f.m.visible) return;
      f.v.y -= 9.8 * dt; f.m.position.addScaledVector(f.v, dt);
      if (f.m.position.y < 0.03){ f.m.position.y = 0.03; f.v.multiplyScalar(0.4); f.v.y = Math.abs(f.v.y) * 0.3; }
      f.m.rotation.x += dt * 8; f.m.rotation.y += dt * 6;
    });
    if (ex.vida <= 0){ ex.pts.visible = false; ex.flash.visible = false; ex.frags.forEach(f => f.visible = false); }
  });
}
function destello(){
  const el = $('#btBlanco'); if (!el) return;
  el.style.transition = 'none'; el.style.opacity = '0.55';
  requestAnimationFrame(() => { el.style.transition = ''; el.style.opacity = '0'; });
  if (N.MODO_PRUEBA) el.style.opacity = '0';
}

// ---------------------------------------------------------------------
// Avisos en pantalla
// ---------------------------------------------------------------------
let flashT = 0;
function flash(titulo, sub, color){
  const el = $('#btFlash');
  el.textContent = '';
  el.appendChild(document.createTextNode(titulo));
  if (sub){ const s = document.createElement('small'); s.textContent = sub; el.appendChild(s); }
  el.style.setProperty('--c', N.hex(color || 0xd7263d));
  el.classList.add('ver'); flashT = 1.4;
  if (N.MODO_PRUEBA) console.log('[pantalla] ' + titulo + (sub ? ' — ' + sub : ''));
}
function aviso(j, txt){ j.msg = txt; j.msgT = 2; }

// ---------------------------------------------------------------------
// Paneles de cada jugador
// ---------------------------------------------------------------------
function construirPanel(j, cont, girado){
  cont.innerHTML = '';
  cont.style.setProperty('--c', N.hex(j.color));
  cont.classList.toggle('girado', girado);
  cont.classList.toggle('compacto', j.ia && opciones.contraIA);
  const f1 = document.createElement('div'); f1.className = 'bt-f1';
  f1.innerHTML = '<i></i><b></b><span class="bt-estado"></span><span class="bt-verdad">LA VERDAD</span>';
  f1.querySelector('b').textContent = j.nombre;
  const pot = document.createElement('div'); pot.className = 'bt-pot'; pot.innerHTML = '<div></div>';
  const pods = document.createElement('div'); pods.className = 'bt-pods';
  const muchos = poderesActivos().length > 4;
  pods.classList.toggle('muchos', muchos);
  const ui = {estado: f1.querySelector('.bt-estado'), verdad: f1.querySelector('.bt-verdad'), pot: pot.firstChild, pods: {}, cache: {}};
  poderesActivos().forEach(p => {
    const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'bt-pod' + (j.ia ? ' ia' : '');
    bt.style.setProperty('--pc', p.color);
    bt.innerHTML = '<span class="ic"></span><span class="nm"></span><span class="us"></span><span class="cd"></span><span class="tx"></span>';
    bt.querySelector('.ic').textContent = p.icono; bt.querySelector('.nm').textContent = muchos && p.corto ? p.corto : p.nombre;
    bt.setAttribute('aria-label', p.nombre);
    bt.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); if (!j.ia) activarPoder(j, p.id); });
    pods.appendChild(bt);
    ui.pods[p.id] = {bt, us: bt.querySelector('.us'), cd: bt.querySelector('.cd'), tx: bt.querySelector('.tx')};
  });
  const efx = document.createElement('div'); efx.className = 'bt-efx';
  const msg = document.createElement('div'); msg.className = 'bt-msg';
  cont.append(f1, pot, pods, efx, msg);
  ui.efx = efx; ui.msg = msg;
  j.ui = ui;
}
function poner(ui, k, el, val, prop){
  if (ui.cache[k] === val) return;
  ui.cache[k] = val;
  if (prop === 'html') el.innerHTML = val;
  else if (prop) el.style[prop] = val;
  else el.textContent = val;
}
function estadoTexto(j){
  const b = j.bola;
  if (!j.vivo) return 'Eliminada';
  if (j.pendiente) return '¡Tocada!';
  if (congelo && congelo.por !== j) return `❄️ Congelado: tira ${congelo.por.nombre}`;
  if (congelo && congelo.por === j) return '¡Su turno! Tire';
  if (b.enMano) return 'En la mano';
  if (b.cayendo || b.enHueco) return 'En el hueco';
  if (puedeDisparar(j)) return 'Lista para tirar';
  return 'Rodando';
}
function pintarPaneles(){
  js.forEach(j => {
    const ui = j.ui; if (!ui) return;
    poner(ui, 'estado', ui.estado, estadoTexto(j));
    const v = j.verdad && j.vivo;
    if (ui.cache.verdad !== v){ ui.cache.verdad = v; ui.verdad.classList.toggle('si', v); }
    poner(ui, 'pot', ui.pot, (j.apunta.mostrar ? j.apunta.fuerza * 100 : 0).toFixed(0) + '%', 'width');
    poderesActivos().forEach(p => {
      const u = ui.pods[p.id]; if (!u) return;
      const n = j.usos[p.id] || 0, rec = j.recarga[p.id] || 0;
      poner(ui, 'us' + p.id, u.us, 'x' + n);
      poner(ui, 'cd' + p.id, u.cd, `scaleY(${rec > 0 ? (rec / p.recarga).toFixed(3) : 0})`, 'transform');
      const off = !j.vivo || n <= 0 || rec > 0 || j.bloqueo > 0 || !!j.pendiente;
      if (ui.cache['off' + p.id] !== off){ ui.cache['off' + p.id] = off; u.bt.classList.toggle('off', off); }
      poner(ui, 'tx' + p.id, u.tx, j.bloqueo > 0 ? '⚡' : rec > 0 ? String(Math.ceil(rec)) : n <= 0 ? '—' : '');
    });
    const chips = [];
    if (j.escudo > 0) chips.push(`<span>🛡️ Barrera ${j.escudo.toFixed(0)} s</span>`);
    if (j.bloqueo > 0) chips.push(`<span class="malo">⚡ Bloqueado ${j.bloqueo.toFixed(1)} s</span>`);
    if (congelo && congelo.por !== j && j.vivo) chips.push('<span class="malo">❄️ Congelado</span>');
    Object.keys(j.efectos).forEach(k => {
      const p = P.porId(k) || P.porId({congelado: 'congelacion'}[k]);
      if (p) chips.push(`<span${k === 'congelado' ? ' class="malo"' : ''}>${p.icono} ${p.nombre} ${j.efectos[k].resta.toFixed(0)} s</span>`);
    });
    poner(ui, 'efx', ui.efx, chips.join(''), 'html');
    poner(ui, 'msg', ui.msg, j.msgT > 0 ? j.msg : '');
  });
}

// ---------------------------------------------------------------------
// Cámara: desde arriba, encuadra las canicas (y el hueco mientras nadie tenga LA VERDAD)
// ---------------------------------------------------------------------
function camaraBatalla(dt){
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  const incluir = p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); };
  js.forEach(j => { if (j.vivo && j.bola.activa) incluir(j.bola.p); });
  if (!quienVerdad() || !isFinite(x0)) incluir(HOLE);
  (opciones.puntosCamara || []).forEach(incluir);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const tanH = Math.tan(camera.fov * Math.PI / 360), asp = innerWidth / innerHeight;
  const util = frente ? 0.5 : 0.62;                       // parte de la pantalla que no tapan los paneles
  const hz = (z1 - z0 + 4) / (2 * tanH * util), hx = (x1 - x0 + 4) / (2 * tanH * asp * 0.9);
  const h = Math.max(7, Math.min(140, Math.max(hz, hx)));
  const k = 1 - Math.exp(-dt * 2.5);
  altura += (h - altura) * k;
  esc = Math.max(1, altura / 9);
  const tp = new V3(cx, altura, cz + altura * 0.3), tm = new V3(cx, 0, cz - (frente ? 0 : altura * 0.04));
  camPos.lerp(tp, k); camMira.lerp(tm, k);
  camera.position.copy(camPos); camera.lookAt(camMira);
  N.sol.target.position.copy(camMira); N.sol.position.copy(camMira).add(new V3(5, 12, 6));
}

// ---------------------------------------------------------------------
// Cámara detrás de la bola (como el clásico). Con dos personas la
// pantalla se parte: abajo el jugador 1, arriba el jugador 2 (volteada).
// ---------------------------------------------------------------------
const camaraClasica = () => opciones.camara !== 'arriba' && !opciones.ambosIA;
const camsJ = [0, 1].map(() => ({cam: new THREE.PerspectiveCamera(55, 1, 0.05, 500), pos: new V3(), mira: new V3(), dir: new V3(0, 0, -1), nueva: true}));
function angObjetivo(j){
  const b = j.bola, desde = b.enHueco ? HOLE : b.p;
  if (j.verdad){
    const r = CTX.rivales(j).sort((x, y) => N.distH(x.bola.p, desde) - N.distH(y.bola.p, desde))[0];
    if (r) return N.angHacia(desde, r.bola.p);
  }
  return N.distH(desde, HOLE) < 0.05 ? 0 : N.angHacia(desde, HOLE);
}
function camaraDetras(j, c, dt){
  const b = j.bola;
  let tp, tm;
  if (!j.vivo || !b.activa){
    // eliminado: mira la cancha desde lo alto hacia el rival
    const r = CTX.rivales(j)[0], f = r ? r.bola.p : HOLE;
    tp = new V3(f.x, 9, f.z + 7); tm = new V3(f.x, 0, f.z);
  } else if (puedeDisparar(j) || j.apunta.puntero !== null){
    const desde = b.enHueco ? new V3(HOLE.x, R, HOLE.z) : b.p, d = N.dirDe(j.apunta.ang);
    tp = desde.clone().addScaledVector(d, -2.6); tp.y = desde.y + 1.25;
    tm = desde.clone().addScaledVector(d, 3); tm.y = 0;
    c.dir.copy(d);
  } else {
    // rodando: la sigue por detrás
    const v = Math.hypot(b.v.x, b.v.z);
    if (v > 0.3) c.dir.set(b.v.x / v, 0, b.v.z / v);
    tp = b.p.clone().addScaledVector(c.dir, -3.2); tp.y = Math.max(1.8, b.p.y + 1.2);
    tm = b.p.clone(); tm.y = 0;
  }
  if (c.nueva){ c.pos.copy(tp); c.mira.copy(tm); c.nueva = false; }
  const k = 1 - Math.exp(-dt * 4);
  c.pos.lerp(tp, k); c.mira.lerp(tm, k);
  c.cam.position.copy(c.pos); c.cam.lookAt(c.mira);
  if (frente && j.i === 1) c.cam.rotateZ(Math.PI);   // el jugador 2 está al otro lado de la mesa
}
function camarasDetras(dt){
  esc = 1;
  js.forEach((j, k) => { if (k < 2 && !j.ia) camaraDetras(j, camsJ[k], dt); });
  const c = camsJ[0];
  if (!frente){ camera.position.copy(c.cam.position); camera.quaternion.copy(c.cam.quaternion); }
  N.sol.target.position.copy(c.mira); N.sol.position.copy(c.mira).add(new V3(5, 12, 6));
}
// Dibuja la pantalla partida; devuelve false si basta con la cámara normal
function dibujar(){
  if (!activa || !camaraClasica() || !frente) return false;
  const r = N.renderer, W = innerWidth, H = innerHeight, h2 = Math.floor(H / 2);
  r.setScissorTest(true);
  [[camsJ[0], 0, h2], [camsJ[1], h2, H - h2]].forEach(([c, y, alto]) => {
    c.cam.aspect = W / alto; c.cam.updateProjectionMatrix();
    r.setScissor(0, y, W, alto); r.setViewport(0, y, W, alto);
    r.render(scene, c.cam);
  });
  r.setScissorTest(false); r.setViewport(0, 0, W, H);
  return true;
}

// ---------------------------------------------------------------------
// Cuadro a cuadro
// ---------------------------------------------------------------------
const qTmp = new THREE.Quaternion();
function paso(dt){
  if (!activa) return;
  tiempo += dt;
  // cuenta regresiva
  if (cuenta > 0){
    cuenta -= dt;
    const n = Math.ceil(cuenta);
    if (n !== cuentaPrev){
      cuentaPrev = n;
      $('#btCuenta').textContent = n > 0 ? String(n) : '¡YA!';
      A.sfx.cuenta(n);
      if (n <= 0) setTimeout(() => { if ($('#btCuenta').textContent === '¡YA!') $('#btCuenta').textContent = ''; }, 700);
    }
  }
  // tiempos de poderes y efectos
  js.forEach(j => {
    for (const k in j.recarga) if (j.recarga[k] > 0) j.recarga[k] = Math.max(0, j.recarga[k] - dt);
    if (j.bloqueo > 0){ j.bloqueo -= dt; if (j.bloqueo <= 0){ j.bloqueo = 0; j.bloqueadoPor = null; registrar('desbloqueado', {jugador: j.nombre}); } }
    if (j.escudo > 0){ j.escudo -= dt; if (j.escudo <= 0){ j.escudo = 0; registrar('barrera-se-acabo', {jugador: j.nombre}); } }
    for (const k in j.efectos){ j.efectos[k].resta -= dt; if (j.efectos[k].resta <= 0) delete j.efectos[k]; }
    j.bola.freno = (j.efectos.congelado ? j.efectos.congelado.freno : 1) * (j.efectos.turbo ? j.efectos.turbo.freno : 1);
    if (j.espera > 0) j.espera -= dt;
    if (j.msgT > 0) j.msgT -= dt;
  });
  // la máquina
  if (!fin) js.forEach(j => { if (j.ia) iaPaso(j, dt); });
  emitir('antesFisica', dt);
  // física: todas las canicas a la vez
  const sub = 6, h = dt / sub;
  for (let s = 0; s < sub; s++){
    js.forEach(j => {
      if (!j.vivo || !j.bola.activa) return;
      const antes = j.bola.cayendo;
      N.pasoBola(j.bola, h, false);
      if (!antes && j.bola.cayendo) alEntrarHueco(j);
    });
    N.choques();
  }
  // fin de cada tiro
  js.forEach(j => {
    const t = j.tiro; if (!t || t.fin) return;
    const b = j.bola;
    const parada = b.enHueco || (!b.cayendo && !b.enMano && b.p.y <= R + 0.002 && b.v.lengthSq() < 0.0009);
    const vencido = t.victimas.length && tiempo - t.tGolpe > C.nochera.esperaMax;
    if (parada || vencido || tiempo - t.t > 25) terminarTiro(j);
  });
  if (fin && finT > 0){ finT -= dt; if (finT <= 0) mostrarFin(); }
  if (congelo && (!congelo.por.vivo || tiempo - congelo.t > C.turnoEnchole.maxSeg)) descongelar(congelo.por.vivo ? 'tiempo' : 'eliminado');

  // sonido de rodar
  let rueda = 0;
  js.forEach(j => { const b = j.bola; if (j.vivo && b.activa && !b.enMano && b.p.y <= R + 0.01) rueda += Math.hypot(b.v.x, b.v.z); });
  A.rodar(rueda);

  if (camaraClasica()) camarasDetras(dt); else camaraBatalla(dt);
  // mover las mallas
  js.forEach(j => {
    const b = j.bola, m = j.m, vis = j.vivo && b.activa;
    if (vis){
      const dx = b.p.x - b.last.x, dz = b.p.z - b.last.z, d = Math.hypot(dx, dz);
      if (d > 1e-6 && d < 2 && b.p.y <= R + 0.01) b.mesh.quaternion.premultiply(qTmp.setFromAxisAngle(new V3(dz / d, 0, -dx / d), d / R));
      b.mesh.position.copy(b.p); b.last.copy(b.p);
    }
    m.anillo.visible = vis && !b.enMano;
    m.anillo.position.set(b.p.x, 0.008, b.p.z); m.anillo.scale.setScalar(esc);
    m.anillo.material.color.setHex(j.pendiente && Math.floor(tiempo * 8) % 2 ? 0xffffff : (congelo && congelo.por !== j ? 0x9fe8ff : j.color));
    if (congelo && congelo.por !== j) m.anillo.scale.setScalar(esc * (1.3 + Math.sin(tiempo * 5) * 0.1));
    m.pin.visible = vis;
    m.pin.position.set(b.p.x, Math.max(b.p.y, R) + (0.3 + Math.sin(tiempo * 4 + j.i) * 0.05) * esc, b.p.z); m.pin.scale.setScalar(esc);
    m.escudo.visible = vis && j.escudo > 0 && (j.escudo > 1.5 || Math.floor(tiempo * 8) % 2 === 0);
    m.escudo.position.copy(b.p); m.escudo.scale.setScalar(Math.max(1, esc * 0.6) * (1 + Math.sin(tiempo * 6) * 0.05)); m.escudo.rotation.y += dt;
    m.bloqueo.visible = vis && j.bloqueo > 0;
    m.bloqueo.position.set(b.p.x, 0.012, b.p.z); m.bloqueo.scale.setScalar(esc); m.bloqueo.rotation.z += dt * 6;
    m.bloqueo.material.opacity = 0.5 + Math.random() * 0.5;
    // línea de puntería
    // al quedar lista para tirar, la puntería mira al objetivo (como en el clásico)
    const listoAhora = puedeDisparar(j);
    if (!j.ia && listoAhora && !j.apunta.listoPrev && j.apunta.puntero === null) j.apunta.ang = angObjetivo(j);
    j.apunta.listoPrev = listoAhora;
    const ver = vis && (j.apunta.mostrar || (camaraClasica() && !j.ia && listoAhora));
    const listoTiro = puedeDisparar(j);
    const desde = b.enHueco ? HOLE : b.p, d = N.dirDe(j.apunta.ang);
    const largo = (0.5 + j.apunta.fuerza * 3.5) * esc * 0.7;
    m.puntos.forEach((p, i) => {
      p.visible = ver;
      if (!ver) return;
      p.material = listoTiro ? m.matPunto : matGris;
      const t = (0.25 + (i / 11) * 1) * largo;
      p.position.set(desde.x + d.x * t, 0.015, desde.z + d.z * t);
      p.scale.setScalar(esc * (i === 11 ? 1.8 : 1));
    });
  });
  pasoExplosiones(dt);
  if (aroIman.visible) aroIman.material.opacity = 0.14 + Math.sin(tiempo * 3) * 0.07;
  if (flashT > 0){ flashT -= dt; if (flashT <= 0) $('#btFlash').classList.remove('ver'); }
  pintarPaneles();
  emitir('cuadro', dt);
}
// Pone una canica en un punto (para la academia y las pruebas)
function colocar(j, p){
  const b = j.bola;
  Object.assign(b, {enMano: !!p.enMano, enHueco: false, cayendo: false, ignorarHueco: false, activa: true});
  b.p.set(p.x, p.enMano ? 1.05 : R, p.z); b.v.set(0, 0, 0); b.last.copy(b.p);
  if (j.tiro) j.tiro.fin = true;
}

// ---------------------------------------------------------------------
// Botones y menú
// ---------------------------------------------------------------------
$('#btSalir').addEventListener('click', salir);
$('#btCamBtn').addEventListener('click', () => {
  opciones.camara = camaraClasica() ? 'arriba' : 'clasica';
  camsJ.forEach(c => { c.nueva = true; }); camPos.copy(camera.position);
  $('#btCamBtn').textContent = camaraClasica() ? '🗺️' : '🎥';
  $('#bt').classList.toggle('partida', frente && camaraClasica());
});
$('#btCamara').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  document.querySelectorAll('#btCamara button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
});
$('#btAlMenu').addEventListener('click', salir);
$('#btRevancha').addEventListener('click', () => { N.initAudio(); iniciar(opciones); });
$('#btVolBtn').addEventListener('click', () => {
  const p = $('#btVol'); p.hidden = !p.hidden; $('#btVolBtn').setAttribute('aria-expanded', String(!p.hidden));
  ['musica', 'efectos', 'voz'].forEach(k => { $('#btVol' + k[0].toUpperCase() + k.slice(1)).value = Math.round(N.volumen[k] * 100); });
});
['musica', 'efectos', 'voz'].forEach(k => {
  const el = $('#btVol' + k[0].toUpperCase() + k.slice(1));
  el.addEventListener('input', () => { N.volumen[k] = el.value / 100; N.aplicarVolumen(); });
});
function pintarContra(c){
  document.querySelectorAll('#btContra button').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === c ? 'true' : 'false'));
  $('#btFila2').hidden = c === 'ia';
}
$('#btContra').addEventListener('click', e => { const b = e.target.closest('button'); if (b) pintarContra(b.dataset.c); });
try {
  const o = JSON.parse(localStorage.getItem('chiras-batalla') || 'null');
  if (o && o.camara) document.querySelectorAll('#btCamara button').forEach(x => x.setAttribute('aria-pressed', x.dataset.cam === o.camara ? 'true' : 'false'));
  if (o && $('#btIman')) $('#btIman').checked = o.iman !== false;
  if (o){ pintarContra(o.contraIA ? 'ia' : 'persona'); $('#btNom1').value = o.nombres[0] || ''; $('#btNom2').value = o.nombres[1] || ''; $('#btExtras').checked = !!o.extras; }
} catch (e) {}

window.ChirasBatalla = {
  paso, iniciar, iniciarDesdeMenu, salir, dibujar, camaraClasica, activarPoder, disparar, puedeDisparar, motivoNoTiro, fuerzaDeVel, alChocar,
  jugadores: () => js, registro: () => registro, ctx: CTX, on, colocar, flash, explotar, destello,
  escala: () => esc, opciones: () => opciones, tiempo: () => tiempo, cuenta: () => cuenta,
  congelado: () => congelo ? congelo.por.nombre : null, descongelar,
  estado: () => ({activa, fin, tiempo, verdad: quienVerdad() ? quienVerdad().nombre : null, ganador: ganador ? ganador.nombre : null})
};

// Pruebas automáticas
if (PRUEBA){
  console.log('[voz elegida] ' + A.nombreVoz());
  iniciar({ambosIA: true, nombres: ['Máquina A', 'Máquina B'], extras: true});
}
if (HASH === '#prueba-reglas' || HASH === '#prueba-nuevas'){
  addEventListener('load', () => {
    const s = document.createElement('script'); s.src = HASH === '#prueba-reglas' ? 'pruebas-batalla.js' : 'pruebas-nuevas.js'; document.body.appendChild(s);
  });
}
})();
