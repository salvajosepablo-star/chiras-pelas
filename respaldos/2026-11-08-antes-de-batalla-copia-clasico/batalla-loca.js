// =====================================================================
// CHIRAS PELAS — BATALLA "A LA LOCA"
// El mismo juego del Clásico (encholar da el poder, los mismos poderes,
// tiros a pulso, narrador), pero:
//  - SIN TURNOS: cada uno tira y usa poderes cuando quiera (con recarga).
//  - Con el poder, al pegarle a otro SE LO TRAGA: crece y se queda con su
//    canica; el tragado queda eliminado.
//  - Una bola que ya se ha tragado a alguien es GRANDE: con un golpe normal
//    no se la pueden tragar. Solo la revienta el poder 🚀 COHETE, y al
//    reventarla se le caen todas las canicas que llevaba.
//  - El cohete solo se desvía con poderes de contra: Arena movediza,
//    Viento (tornado) o Barrera.
// Usa el motor de batalla.js como "variante" (no cambia el Clásico).
// =====================================================================
(function(){
const N = window.ChirasNucleo, B = window.ChirasBatalla, A = window.ChirasAudio, P = window.ChirasPoderes;
if (!N || !B || !A || !P){ console.error('Batalla a la loca: faltan módulos'); return; }
const {THREE, scene, R, HOLE, HOLE_R} = N;
const V3 = THREE.Vector3, C = P.CONFIG;
const $ = s => document.querySelector(s);
const log = t => { if (N.MODO_PRUEBA) console.log('[loca] ' + t); };
const rand = (a, b) => a + Math.random() * (b - a);
const t = () => B.tiempo();
const vivos = () => B.jugadores().filter(j => j.vivo);
const porNombre = n => B.jugadores().find(j => j.nombre === n);
const stats = {tragadas: 0, cohetes: 0, reventadas: 0, cohetesDesviados: 0, tablasRotas: 0, arenas: 0, ochera: 0, carambola: 0};

// Ajustes
const CFG = {
  crecePorTragada: 0.32, radioMax: 3,          // cuánto crece por cada canica tragada (veces el radio normal)
  boloncho: {tam: 1.8, masa: 4},
  cohete: {vel: 12, giro: 2.4, dur: 5},
  duracion: {barrera: 8, arena: 8, ochera: 8, carambola: 8, viento: 4, nada: 4},
  barrera: {largo: 0.9}, arenaR: 0.75, cuarta: 0.6, vientoAcel: 0.7,
  canicasPago: 3          // canicas de pago de cada uno para volver con La Revancha
};

// ---------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------
let muertas = [];   // canicas sin vida en el suelo (de una bola reventada): solo las absorbe el que tenga el poder
let tablas = [], arenas = [], cantos = {ochera: new Map(), carambola: new Map()}, viento = null, nada = null, regados = [];
const grande = j => (j.tragadas || []).length > 0;
const activo = (k, x) => (cantos[k].get(x) || 0) > t();
const amenaza = j => {
  const otros = vivos().filter(o => o !== j && o.bola.activa && !o.bola.enMano);
  const cerca = l => l.sort((a, b) => N.distH(a.bola.p, j.bola.p) - N.distH(b.bola.p, j.bola.p))[0] || null;
  return cerca(otros.filter(o => o.verdad || o.cohete)) || cerca(otros);
};
const objetivoCohete = j => vivos().filter(o => o !== j && grande(o)).sort((a, b) => b.tragadas.length - a.tragadas.length)[0] || null;
const bloqueadoNada = j => nada && nada.hasta > t() && nada.por !== j;
const libre = j => j.vivo && j.bola.activa && !j.bola.enMano && !j.bola.cayendo && !j.bola.enHueco && !j.cohete;

// ---------------------------------------------------------------------
// Mallas: tablita, arena, cohete
// ---------------------------------------------------------------------
const matTabla = new THREE.MeshLambertMaterial({color: 0x8a5a2b});
const geoTabla = new THREE.BoxGeometry(CFG.barrera.largo, 0.16, 0.07);
const texArena = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(45,25,10,.95)'); gr.addColorStop(.75, 'rgba(120,80,40,.75)'); gr.addColorStop(1, 'rgba(150,100,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(235,200,140,.6)'; g.lineWidth = 3;
  for (let a = 0; a < 3; a++){ g.beginPath(); for (let k = 0; k < 40; k++){ const r = k * 1.4, th = k * 0.35 + a * 2.1; g.lineTo(64 + Math.cos(th) * r, 64 + Math.sin(th) * r); } g.stroke(); }
  return new THREE.CanvasTexture(c);
})();
function hacerCohete(color){
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.3, 12), new THREE.MeshStandardMaterial({color: 0xf2f2f2, metalness: .4, roughness: .3}));
  const punta = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.13, 12), new THREE.MeshStandardMaterial({color, metalness: .3, roughness: .35})); punta.position.y = 0.215;
  const franja = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.05, 12), new THREE.MeshStandardMaterial({color})); franja.position.y = 0.04;
  g.add(cuerpo, punta, franja);
  for (let i = 0; i < 3; i++){ const a = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.07), new THREE.MeshStandardMaterial({color})); const th = i / 3 * Math.PI * 2; a.position.set(Math.cos(th) * 0.07, -0.12, Math.sin(th) * 0.07); a.rotation.y = -th; g.add(a); }
  const llama = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 10), new THREE.MeshBasicMaterial({color: 0xffa21f, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false}));
  llama.rotation.x = Math.PI; llama.position.y = -0.26; g.add(llama); g.userData.llama = llama;
  g.visible = false; scene.add(g); return g;
}

// ---------------------------------------------------------------------
// Poderes (los mismos del Clásico + Cohete). Sin turnos: usos sin límite, con recarga.
// ---------------------------------------------------------------------
function ponerTabla(j){
  const ref = amenaza(j); if (!ref) return;
  const c = ref.bola.p, b = j.bola.p;
  let dx = c.x - b.x, dz = c.z - b.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
  const off = Math.min(0.45 + ((j.bola.radio || R) - R), L * 0.5), cx = b.x + dx * off, cz = b.z + dz * off;
  const mesh = new THREE.Mesh(geoTabla, matTabla); mesh.position.set(cx, 0.08, cz); mesh.rotation.y = Math.atan2(dx, dz); mesh.castShadow = true; scene.add(mesh);
  tablas.push({cx, cz, ux: dz, uz: -dx, mesh, por: j, hasta: t() + CFG.duracion.barrera});
}
function romperTabla(w){
  if (w.rota) return; w.rota = true; scene.remove(w.mesh); tablas = tablas.filter(x => x !== w);
  stats.tablasRotas++;
  const p = new V3(w.cx, 0.1, w.cz);
  if (window.ChirasGraficos){ for (let i = 0; i < 30; i++){ const th = Math.random() * 6.28, ve = 1.5 + Math.random() * 3; window.ChirasGraficos.polvo(p.clone(), new V3(Math.cos(th) * ve, 1 + Math.random() * 3, Math.sin(th) * ve), i % 2 ? 0x8a5a2b : 0xc89a5a, 1); } window.ChirasGraficos.onda(p, 0xc89a5a, 2); }
  A.sfx.barreraRota(); A.sfx.aplastar();
  B.registrar('barrera-rota', {x: +w.cx.toFixed(2), z: +w.cz.toFixed(2)});
}
function moverCuarta(j){
  const ref = amenaza(j); if (!ref) return;
  const c = ref.bola.p, b = j.bola, r = N.distH(b.p, c); if (r < 0.05) return;
  const a0 = Math.atan2(b.p.x - c.x, b.p.z - c.z);
  const ap = ref.apunta && ref.apunta.mostrar ? N.dirDe(ref.apunta.ang) : new V3(b.p.x - c.x, 0, b.p.z - c.z);
  let dif = a0 - Math.atan2(ap.x, ap.z); dif = Math.atan2(Math.sin(dif), Math.cos(dif));
  const lado = dif >= 0 ? 1 : -1;
  for (const sg of [lado, -lado]){
    const a = a0 + sg * CFG.cuarta / r, nx = c.x + Math.sin(a) * r, nz = c.z + Math.cos(a) * r;
    if (Math.hypot(nx - HOLE.x, nz - HOLE.z) > HOLE_R + R + 0.05){ b.p.set(nx, R, nz); b.last.copy(b.p); return; }
  }
}
function ponerArena(j){
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(CFG.arenaR, 40), new THREE.MeshBasicMaterial({map: texArena, transparent: true, depthWrite: false}));
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(j.bola.p.x, 0.013, j.bola.p.z); scene.add(mesh);
  arenas.push({por: j, x: j.bola.p.x, z: j.bola.p.z, mesh, hasta: t() + CFG.duracion.arena});
}
function ponerBoloncho(j){ const b = j.bola; b.boloncho = true; aplicarTamano(j); j._quitarBol = 0; }
function quitarBoloncho(j){ const b = j.bola; if (!b.boloncho) return; b.boloncho = false; aplicarTamano(j); }
function aplicarTamano(j){
  const b = j.bola, base = Math.min(CFG.radioMax, 1 + CFG.crecePorTragada * (j.tragadas || []).length);
  const tam = b.boloncho ? Math.max(base * 1.35, CFG.boloncho.tam) : base;
  b.radio = tam > 1.0001 ? R * tam : 0;
  b.masa = tam > 1.0001 ? Math.max(b.boloncho ? CFG.boloncho.masa : 1, Math.min(8, tam * tam)) : 0;
}
const PODERES = [
  {id: 'barrera', nombre: 'Barrera', corto: 'Barrera', icono: '🛡️', color: '#3ad1ff', sonido: 'barrera', voz: '¡Barrera!', recarga: 8,
   puede: (c, j) => libre(j) && amenaza(j) ? null : 'Ahora no se puede', activar: (c, j) => ponerTabla(j)},
  {id: 'desquadris', nombre: 'Desquadris', corto: 'Desquadris', icono: '🔄', color: '#c77dff', sonido: 'teleport', voz: '¡Desquadris!', recarga: 8,
   puede: (c, j) => libre(j) && amenaza(j) ? null : 'Ahora no se puede', activar: (c, j) => moverCuarta(j)},
  {id: 'ochera', nombre: 'Ochera muere', corto: 'Ochera', icono: '🕳️', color: '#ffb347', sonido: 'evento', voz: '¡Ochera muere!', recarga: 10,
   activar: (c, j) => { cantos.ochera.set(j, t() + CFG.duracion.ochera); }},
  {id: 'carambola', nombre: 'Carambola muere', corto: 'Carambola', icono: '💥', color: '#ff5d73', sonido: 'evento', voz: '¡Carambola muere!', recarga: 10,
   activar: (c, j) => { cantos.carambola.set(j, t() + CFG.duracion.carambola); }},
  {id: 'arena', nombre: 'Arena movediza', corto: 'Arena', icono: '🌀', color: '#c9a07a', sonido: 'teleport', voz: '¡Arena movediza!', recarga: 10,
   puede: (c, j) => libre(j) ? null : 'Ahora no se puede', activar: (c, j) => ponerArena(j)},
  {id: 'viento', nombre: 'Viento', corto: 'Viento', icono: '🌪️', color: '#bfe3ff', sonido: 'viento', voz: '¡Tornado! ¡Viento!', recarga: 12,
   activar: (c, j) => { viento = {por: j, hasta: t() + CFG.duracion.viento, signo: Math.random() < .5 ? 1 : -1}; }},
  {id: 'boloncho', nombre: 'Boloncho', corto: 'Boloncho', icono: '🔴', color: '#ff3b2f', sonido: 'superpotencia', voz: '¡Boloncho!', recarga: 12,
   puede: (c, j) => j.bola.boloncho ? 'Ya tiene el Boloncho' : libre(j) || j.bola.enHueco ? null : 'Ahora no se puede', activar: (c, j) => ponerBoloncho(j)},
  {id: 'cohete', nombre: 'Cohete', corto: 'Cohete', icono: '🚀', color: '#ff9d2e', sonido: 'turbo', voz: '¡Modo cohete!', recarga: 15,
   puede: (c, j) => !objetivoCohete(j) ? 'No hay ninguna bola grande para reventar' : !libre(j) ? 'Su bola tiene que estar quieta en la cancha' : null,
   activar: (c, j) => lanzarCohete(j)},
  {id: 'nada', nombre: 'Nada de nada', corto: 'Nada', icono: '🚫', color: '#d7263d', sonido: 'nada', voz: '¡Nada de nada!', recarga: 12,
   puede: () => nada && nada.hasta > t() ? 'Ya cantaron Nada de nada' : null,
   activar: (c, j) => { nada = {por: j, hasta: t() + CFG.duracion.nada}; }}
].map(p => Object.assign({principal: true, habilitado: true, usos: 999, duracion: 0}, p));
const porId = id => PODERES.find(p => p.id === id);

// ---------------------------------------------------------------------
// Tragar, crecer y reventar
// ---------------------------------------------------------------------
const tragando = [];
function tragar(a, v){
  const copia = v.bola.mesh.clone(); copia.visible = true; scene.add(copia);
  tragando.push({m: copia, a, t: 0, desde: v.bola.p.clone()});
  a.tragadas.push({nombre: v.nombre, estilo: v.estilo, color: v.color});
  aplicarTamano(a); a._pulso = 1;
  stats.tragadas++;
  A.sfx.devorar();
  B.registrar('tragada', {por: a.nombre, victima: v.nombre, canicas: a.tragadas.length});
  B.eliminar(v, `${a.nombre} se tragó a ${v.nombre}`, a, '¡SE LA TRAGÓ!', {sinExplosion: true, sinVoz: true, datos: {tragada: true}});
  log(`${a.nombre} se tragó a ${v.nombre} (lleva ${a.tragadas.length})`);
}
function muere(x, por, motivo, titulo){
  if (!x.vivo) return;
  B.eliminar(x, motivo, por || null, titulo);
  log(`${x.nombre} muere: ${motivo}`);
}
function reventar(obj, j){
  const caen = obj.tragadas.slice();
  const p = obj.bola.p.clone();
  // las canicas que llevaba caen al suelo SIN VIDA: quedan quietas y nadie las puede mover
  caen.forEach((c, i) => {
    const th = i / Math.max(1, caen.length) * Math.PI * 2 + Math.random() * 0.5, d = 0.8 + Math.random() * 1.8;
    const destino = new V3(p.x + Math.cos(th) * d, R, p.z + Math.sin(th) * d);
    if (Math.hypot(destino.x - HOLE.x, destino.z - HOLE.z) < 0.6){ destino.x += 0.8; }
    const m = N.hacerBola(c.estilo); m.position.set(p.x, R + 0.1, p.z);
    const aro = new THREE.Mesh(new THREE.RingGeometry(R * 1.3, R * 1.7, 24), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false}));
    aro.rotation.x = -Math.PI / 2; aro.position.set(destino.x, 0.012, destino.z); aro.visible = false; scene.add(aro);
    muertas.push({m, aro, nombre: c.nombre, estilo: c.estilo, color: c.color, p: destino, desde: p.clone(), t: 0});
  });
  stats.reventadas++;
  if (window.ChirasGraficos){ window.ChirasGraficos.explosionVistosa(p, 0xff9d2e, 2); window.ChirasGraficos.onda(p, 0xffd84a, 6); }
  A.sfx.trueno();
  B.registrar('reventado', {por: j.nombre, victima: obj.nombre, canicas: caen.length});
  if (caen.length) setTimeout(() => {
    B.flash('¡MODO DEPREDADOR!', 'Canicas sueltas: el que tenga el poder se las traga', 0xff3b2f);
    A.voz('depredador', '¡Modo depredador!'); A.sfx.epico();
    B.registrar('depredador', {canicas: caen.length});
  }, 1600);
  obj.tragadas = []; aplicarTamano(obj);
  B.eliminar(obj, `${j.nombre} lo reventó con el cohete y se le cayeron ${caen.length} canica${caen.length === 1 ? '' : 's'}`, j, '¡REVENTADO!', {datos: {reventado: true}});
}

// ---------------------------------------------------------------------
// Cohete
// ---------------------------------------------------------------------
function lanzarCohete(j){
  const obj = objetivoCohete(j); if (!obj) return;
  const b = j.bola;
  if (!j.mCohete) j.mCohete = hacerCohete(j.color);
  b.enMano = true; b.v.set(0, 0, 0); b.p.y = R + 0.15;
  const dir = new V3(obj.bola.p.x - b.p.x, 0, obj.bola.p.z - b.p.z).normalize();
  j.cohete = {obj, t: 0, dir, sinGuia: 0};
  b.mesh.visible = false; j.mCohete.visible = true;
  stats.cohetes++;
  B.registrar('cohete', {jugador: j.nombre, objetivo: obj.nombre});
  log(`${j.nombre} lanza el cohete contra ${obj.nombre}`);
}
function terminarCohete(j, motivo){
  const b = j.bola, c = j.cohete; if (!c) return;
  j.cohete = null;
  b.enMano = false; b.p.y = R; b.v.set(0, 0, 0); b.last.copy(b.p);
  b.mesh.visible = j.vivo; if (j.mCohete) j.mCohete.visible = false;
  if (motivo !== 'acerto'){ stats.cohetesDesviados++; B.registrar('cohete-fallo', {jugador: j.nombre, motivo}); }
}
function lugarRetirado(){
  let mejor = null, md = -1; const C2 = N.CANCHA;
  for (let i = 0; i < 50; i++){
    const p = new V3((Math.random() * 2 - 1) * (C2.x - 4), R, -2 - Math.random() * 60);
    if (N.distH(p, HOLE) < 3) continue;
    const d = Math.min(...vivos().map(o => N.distH(o.bola.p, p)), 999);
    if (d > md){ md = d; mejor = p; }
  }
  return mejor || new V3(20, R, -40);
}
function distTabla(p, w){
  const dx = p.x - w.cx, dz = p.z - w.cz, u = Math.max(-CFG.barrera.largo / 2, Math.min(CFG.barrera.largo / 2, dx * w.ux + dz * w.uz));
  return Math.hypot(dx - w.ux * u, dz - w.uz * u);
}
function pasoCohete(j, h){
  const c = j.cohete, b = j.bola;
  c.t += h;
  if (!c.obj.vivo){ const nuevo = objetivoCohete(j); if (nuevo) c.obj = nuevo; else return terminarCohete(j, 'sin objetivo'); }
  // el viento de otro lo saca de rumbo
  if (viento && viento.hasta > t() && viento.por !== j){ c.sinGuia = Math.max(c.sinGuia, 0.9); const g = viento.signo * 1.4 * h, cs = Math.cos(g), sn = Math.sin(g); c.dir.set(c.dir.x * cs - c.dir.z * sn, 0, c.dir.x * sn + c.dir.z * cs); }
  if (c.sinGuia > 0) c.sinGuia -= h;
  else {
    const q = new V3(c.obj.bola.p.x - b.p.x, 0, c.obj.bola.p.z - b.p.z).normalize();
    let d = Math.atan2(q.x, q.z) - Math.atan2(c.dir.x, c.dir.z); d = Math.atan2(Math.sin(d), Math.cos(d));
    const g = Math.max(-CFG.cohete.giro * h, Math.min(CFG.cohete.giro * h, d)), cs = Math.cos(g), sn = Math.sin(g);
    c.dir.set(c.dir.x * cs + c.dir.z * sn, 0, -c.dir.x * sn + c.dir.z * cs).normalize();
  }
  b.p.x += c.dir.x * CFG.cohete.vel * h; b.p.z += c.dir.z * CFG.cohete.vel * h; b.last.copy(b.p);
  // barrera de otro: el cohete revienta contra la tablita
  for (const w of tablas){ if (w.por !== j && distTabla(b.p, w) < 0.18){ romperTabla(w); B.flash('¡LA BARRERA PARÓ EL COHETE!', '', w.por.color); if (window.ChirasGraficos) window.ChirasGraficos.explosionVistosa(b.p, 0xff9d2e, 1); A.sfx.explosion(); return terminarCohete(j, 'barrera'); } }
  // arena movediza de otro: se lo traga y lo escupe lejos
  for (const z of arenas){ if (z.por !== j && Math.hypot(b.p.x - z.x, b.p.z - z.z) < CFG.arenaR){ b.p.copy(lugarRetirado()); B.flash('¡LA ARENA SE TRAGÓ EL COHETE!', '', z.por.color); A.sfx.teleport(); return terminarCohete(j, 'arena'); } }
  // le dio al grande
  const ro = c.obj.bola.radio || R;
  if (N.distH(b.p, c.obj.bola.p) < ro + 0.15){ const obj = c.obj; terminarCohete(j, 'acerto'); return reventar(obj, j); }
  if (c.t > CFG.cohete.dur || Math.abs(b.p.x) > 59 || b.p.z < -149 || b.p.z > 49) return terminarCohete(j, 'se apagó');
}

// ---------------------------------------------------------------------
// Reglas de la variante (lo que batalla.js le pregunta)
// ---------------------------------------------------------------------
const variante = {
  sinMira: true,
  motivoNoTiro: j => j.cohete ? 'Va volando en el cohete' : null,
  poderes: () => PODERES,
  porId,
  iniciar(js){
    limpiar();
    js.forEach(j => {
      j.tragadas = []; j.cohete = null; j._t0 = null; j.iaL = null; j._quitarBol = 0; j.pago = CFG.canicasPago; j._revIA = false;
      PODERES.forEach(p => { j.usos[p.id] = p.usos; j.recarga[p.id] = 0; });
    });
    construirTablero();
  },
  limpiar,
  ajustarTiro: (j, ang) => j.ia ? ang : ang + (j.apunta.temblor || 0),
  motivoNoPoder(j, p){
    if (bloqueadoNada(j)) return `¡Nada de nada! ${nada.por.nombre} anuló los poderes`;
    if (j.cohete) return 'Va volando en el cohete';
    return null;
  },
  apagado(j, p){
    if (bloqueadoNada(j)) return '🚫';
    if (p.id === 'cohete' && !objetivoCohete(j)) return '—';
    return '';
  },
  alChocar(atac, vic, fuerza){
    if (atac.cohete || vic.cohete) return;
    if (fuerza < C.impactoMin) return;
    const tr = atac.tiro; tr.golpeoRival = true; tr.golp = tr.golp || new Set(); tr.golp.add(vic.nombre);
    // Carambola muere: le pegó a dos y uno de ellos la cantó
    if (tr.golp.size >= 2){
      const quien = [...tr.golp].map(porNombre).find(x => x && x !== atac && activo('carambola', x));
      if (quien){ stats.carambola++; return muere(atac, quien, `${atac.nombre} le pegó a dos y ${quien.nombre} había cantado Carambola`, '¡CARAMBOLA MUERE!'); }
    }
    if (atac.verdad){
      if (!vic.vivo) return;
      if (grande(vic)){
        if (!vic._avisoGrande || t() - vic._avisoGrande > 3){ vic._avisoGrande = t(); B.flash('¡ESTÁ MUY GRANDE!', 'Solo el 🚀 Cohete la revienta', vic.color); }
        return;
      }
      tragar(atac, vic);
    } else if (vic.verdad){
      vic.verdad = false;
      A.sfx.quitar(); B.flash('¡LE QUITÓ EL PODER!', `${atac.nombre} le pegó a ${vic.nombre}`, atac.color);
      B.registrar('verdad-quitada', {por: atac.nombre, a: vic.nombre});
    }
  },
  alEntrarHueco(j){
    B.registrar('hueco', {jugador: j.nombre});
    const tr = B.tiroActivo(j) ? j.tiro : null;
    const ocheros = vivos().filter(x => activo('ochera', x));
    // Ochera muere (si alguien la cantó): el que tira muere si le pegó a alguien y se metió, o si tenía el poder y se volvió a meter
    if (tr && ocheros.some(x => x !== j) && (tr.golpeoRival || j.verdad)){
      const s = ocheros.find(x => x !== j && tr.golp && tr.golp.has(x.nombre)) || ocheros.find(x => x !== j);
      stats.ochera++; muere(j, s, `${j.nombre} ${tr.golpeoRival ? 'le pegó a alguien y se metió al hueco' : 'tenía el poder y se volvió a meter al hueco'}`, '¡OCHERA MUERE!');
      return true;
    }
    // …o si echó a un contrincante al hueco
    if (!tr){
      const atac = vivos().find(x => x !== j && B.tiroActivo(x) && x.tiro.golp && x.tiro.golp.has(j.nombre));
      const s = atac && ocheros.find(x => x !== atac);
      if (atac && s){ stats.ochera++; muere(atac, s, `${atac.nombre} echó a ${j.nombre} al hueco`, '¡OCHERA MUERE!'); }
      return true;
    }
    // el que enchola gana el poder (como en el Clásico: lo pueden tener varios)
    if (!j.verdad){
      j.verdad = true;
      A.sfx.verdad(); B.flash('¡ENCHOLÓ!', `${j.nombre} tiene el poder`, j.color);
      B.registrar('verdad', {jugador: j.nombre});
    }
    return true;
  },
  terminarTiro(j){ if (j.bola.boloncho) j._quitarBol = t() + 0.5; },
  subpaso(h){
    vivos().forEach(j => {
      const b = j.bola;
      if (j.cohete){ pasoCohete(j, h); return; }
      if (!b.activa || b.enMano || b.cayendo || b.enHueco || b.p.y > 0.16 + R) return;
      // modo depredador: con el poder, al pasar por encima de una canica sin vida se la absorbe
      if (j.verdad && muertas.length){
        for (const c of muertas.slice()){
          if (c.t < 0.6 || N.distH(b.p, c.p) > (b.radio || R) + R) continue;
          muertas = muertas.filter(x => x !== c);
          tragando.push({m: c.m, a: j, t: 0, desde: c.m.position.clone()}); scene.remove(c.aro);
          j.tragadas.push({nombre: c.nombre, estilo: c.estilo, color: c.color}); aplicarTamano(j); j._pulso = 1;
          A.sfx.devorar(); stats.absorbidas = (stats.absorbidas || 0) + 1;
          B.registrar('absorbe', {jugador: j.nombre, canicas: j.tragadas.length});
        }
      }
      // la bola gigante no cabe en el hueco: le basta pararse encima para coger el poder
      if (!j.verdad && b.radio > HOLE_R && Math.hypot(b.v.x, b.v.z) < 0.4 && N.distH(b.p, HOLE) < HOLE_R + 0.05){
        j.verdad = true;
        A.sfx.verdad(); B.flash('¡SE PARÓ EN EL HUECO!', `${j.nombre} es gigante: cogió el poder sin encholar`, j.color);
        B.registrar('verdad', {jugador: j.nombre, encima: true});
      }
      // barreras (tablitas): rebota; el Boloncho las rompe
      for (const w of tablas.slice()){
        const dx = b.p.x - w.cx, dz = b.p.z - w.cz, u = Math.max(-CFG.barrera.largo / 2, Math.min(CFG.barrera.largo / 2, dx * w.ux + dz * w.uz));
        const vx = dx - w.ux * u, vz = dz - w.uz * u, d = Math.hypot(vx, vz), lim = (b.radio || R) + 0.035;
        if (d >= lim || d < 1e-6) continue;
        if (b.boloncho){ romperTabla(w); b.v.multiplyScalar(0.85); B.flash('¡CRAC!', 'El Boloncho rompió la barrera', j.color); continue; }
        const nx = vx / d, nz = vz / d; b.p.x += nx * (lim - d); b.p.z += nz * (lim - d);
        const vn = b.v.x * nx + b.v.z * nz; if (vn < 0){ b.v.x -= 1.5 * vn * nx; b.v.z -= 1.5 * vn * nz; N.sfx.bote(-vn * 2); }
      }
      // arena movediza de otro: si entra rodando en su tiro, se la traga y la escupe lejos
      const moviendo = Math.hypot(b.v.x, b.v.z) > 0.3 && B.tiroActivo(j);
      b._arenas = b._arenas || new Set();
      for (const z of arenas){
        const dentro = Math.hypot(b.p.x - z.x, b.p.z - z.z) < CFG.arenaR;
        if (dentro && !b._arenas.has(z) && moviendo && z.por !== j){
          b.p.copy(lugarRetirado()); b.v.set(0, 0, 0); b.last.copy(b.p);
          stats.arenas++; B.flash('¡ARENA MOVEDIZA!', `Se tragó la bola de ${j.nombre} y la escupió lejos`, z.por.color); A.sfx.teleport(); A.sfx.aplastar();
          B.registrar('arena', {jugador: j.nombre, por: z.por.nombre});
          break;
        }
        if (dentro) b._arenas.add(z); else b._arenas.delete(z);
      }
    });
  },
  iaPaso
};
window.ChirasVariantes = Object.assign(window.ChirasVariantes || {}, {loca: variante});

// ---------------------------------------------------------------------
// La Revancha: el tragado (o reventado) vuelve pagando una canica nueva
// ---------------------------------------------------------------------
const puedeRevancha = j => !!j && !j.vivo && (j.pago || 0) > 0 && B.estado().activa && !B.estado().fin && vivos().length >= 2;
function revancha(j){
  if (!puedeRevancha(j)) return false;
  j.pago--;
  const b = j.bola, estilos = N.ESTILOS.map(e => e.id), nuevo = estilos[Math.floor(Math.random() * estilos.length)];
  scene.remove(b.mesh); b.mesh = N.hacerBola(nuevo); j.estilo = nuevo;
  let x = 0; for (const cx of [0, -0.8, 0.8, -1.6, 1.6, -2.4, 2.4]){ if (!vivos().some(o => Math.hypot(o.bola.p.x - cx, o.bola.p.z - 0.35) < 0.6)){ x = cx; break; } }
  Object.assign(b, {activa: true, enMano: true, cayendo: false, enHueco: false, ignorarHueco: false, radio: 0, masa: 0, boloncho: false});
  b.p.set(x, 1.05, 0.35); b.v.set(0, 0, 0); b.last.copy(b.p);
  Object.assign(j, {vivo: true, verdad: false, pendiente: null, tiro: null, tragadas: [], cohete: null, _esc: 1, espera: 0});
  j.apunta.puntero = null; j.apunta.mostrar = false;
  if (window.ChirasGraficos){ window.ChirasGraficos.onda(b.p, 0xff7b2e, 4); window.ChirasGraficos.destello(b.p, 0xff7b2e, 1.6); }
  A.sfx.epico(); A.sfx.transformacion(); A.voz('revancha', '¡La revancha! ¡Vuelve a la batalla!');
  B.flash('🔥 ¡LA REVANCHA!', `${j.nombre} pagó una canica nueva y vuelve desde la raya`, j.color);
  B.registrar('revancha', {jugador: j.nombre, quedan: j.pago});
  return true;
}
const cssR = document.createElement('style');
cssR.textContent = `.loca-rev{position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 150px);z-index:7;display:flex;flex-direction:column;gap:8px}
.loca-rev button{font-family:var(--display);font-size:17px;padding:10px 16px;border-radius:14px;border:3px solid #fff;color:#fff;background:linear-gradient(180deg,#ff8a2b,#d7263d);box-shadow:0 6px 14px rgba(0,0,0,.45);touch-action:manipulation}`;
document.head.appendChild(cssR);
const revCont = document.createElement('div'); revCont.className = 'loca-rev'; document.body.appendChild(revCont);
const botonesRev = new Map();
function pintarRevancha(){
  const activa = B.variante() === variante && N.getEstado() === 'batalla';
  B.jugadores().forEach(j => {
    if (j.ia) return;
    let bt = botonesRev.get(j);
    const ver = activa && puedeRevancha(j);
    if (!bt && ver){ bt = document.createElement('button'); bt.type = 'button'; bt.addEventListener('pointerdown', e => { e.preventDefault(); revancha(j); }); revCont.appendChild(bt); botonesRev.set(j, bt); }
    if (bt){ bt.hidden = !ver; bt.textContent = `🔥 Revancha de ${j.nombre} (paga 1 de ${j.pago})`; }
  });
  botonesRev.forEach((bt, j) => { if (!B.jugadores().includes(j) || !activa){ bt.remove(); botonesRev.delete(j); } });
}
// la máquina también pide revancha (una vez por batalla)
B.on('eliminado', e => {
  if (B.variante() !== variante) return;
  const j = porNombre(e.jugador); if (!j || !j.ia || j._revIA) return;
  j._revIA = true;
  if (Math.random() < 0.4) setTimeout(() => revancha(j), 2500 + Math.random() * 2000);
});
function limpiar(){
  muertas.forEach(c => { scene.remove(c.m); scene.remove(c.aro); }); muertas = [];
  tablas.forEach(w => scene.remove(w.mesh)); arenas.forEach(z => scene.remove(z.mesh));
  tablas = []; arenas = []; cantos = {ochera: new Map(), carambola: new Map()}; viento = null; nada = null;
  regados.forEach(r => scene.remove(r.m)); regados = [];
  tragando.forEach(x => scene.remove(x.m)); tragando.length = 0;
  B.jugadores().forEach(j => { if (j.mCohete){ scene.remove(j.mCohete); j.mCohete = null; } j.cohete = null; });
  $('#locaTablero').hidden = true;
}

// el viento sopla en los tiros de los demás (cada cuadro)
B.on('antesFisica', dt => {
  if (B.variante() !== variante) return;
  if (!viento || viento.hasta <= t()) return;
  vivos().forEach(j => {
    if (j === viento.por) return;
    const b = j.bola; if (!b.activa || b.enMano || b.cayendo || b.enHueco) return;
    const v = Math.hypot(b.v.x, b.v.z); if (v < 0.05) return;
    const px = -b.v.z / v, pz = b.v.x / v;
    b.v.x += px * viento.signo * CFG.vientoAcel * dt; b.v.z += pz * viento.signo * CFG.vientoAcel * dt;
  });
});

// ---------------------------------------------------------------------
// La máquina en la batalla a la loca
// ---------------------------------------------------------------------
function intentar(j, ids){ for (const id of ids){ const r = B.activarPoder(j, id); if (r && r.ok) return true; } return false; }
function iaPaso(j, dt){
  const e = j.iaL = j.iaL || {espera: rand(0.4, 1.2), def: 0};
  if (j.cohete) return true;
  // defensa: un cohete viene por mí, o uno con poder me está atacando
  const cohete = vivos().find(x => x.cohete && x.cohete.obj === j);
  const atacante = vivos().find(x => x !== j && x.verdad && !grande(j) && B.tiroActivo(x) && N.distH(x.bola.p, j.bola.p) < 7);
  if ((cohete || atacante) && t() > e.def){
    e.def = t() + rand(0.4, 1.0);
    if (Math.random() < (cohete ? 0.75 : 0.35)) intentar(j, cohete ? ['arena', 'barrera', 'viento'] : ['barrera', 'arena', 'desquadris']);
  }
  if (!B.puedeDisparar(j)) return true;
  if (e.espera > 0){ e.espera -= dt; return true; }
  e.espera = rand(C.ia.reaccionMin, C.ia.reaccionMax);
  // cohete contra el grande
  if (objetivoCohete(j) && Math.random() < 0.6 && intentar(j, ['cohete'])) return true;
  const b = j.bola, globo = b.enMano, desde = b.enHueco ? new V3(HOLE.x, R, HOLE.z) : b.p.clone();
  const presas = vivos().filter(o => o !== j && !o.cohete && !grande(o));
  const cerca = l => l.sort((x, y) => N.distH(x.bola.p, desde) - N.distH(y.bola.p, desde))[0];
  let obj = null, extra = 0;
  if (j.verdad && muertas.length && Math.random() < 0.6){
    const c = muertas.slice().sort((x, y) => N.distH(x.p, desde) - N.distH(y.p, desde))[0];
    obj = c.p; extra = 0.5;
  } else if (j.verdad && presas.length){
    obj = cerca(presas).bola.p; extra = 2;
    if (Math.random() < 0.25) intentar(j, ['nada']);
    if (Math.random() < 0.2) intentar(j, ['boloncho']);
  } else {
    const conPoder = vivos().filter(o => o !== j && o.verdad && N.distH(o.bola.p, desde) < 9);
    if (!j.verdad && conPoder.length && Math.random() < 0.5){ obj = cerca(conPoder).bola.p; extra = 2; }
    else if (b.enHueco) { e.espera = 0.8; return true; }
    else obj = HOLE;
  }
  let ang = N.angHacia(desde, obj);
  const dist = N.distH(desde, obj);
  let vel = N.velocidadPara(desde, ang, dist + extra, globo);
  const lejos = Math.min(1, dist / 20);
  ang += N.gauss() * (C.ia.errorAng + lejos * 0.02); vel *= 1 + N.gauss() * C.ia.errorVel;
  B.disparar(j, ang, B.fuerzaDeVel(vel));
  return true;
}

// ---------------------------------------------------------------------
// Pulso al apuntar (como el Clásico): mientras más fuerza, más tiembla un poquito
// ---------------------------------------------------------------------
const PULSO = {f1: 0.30, f2: 0.60, f3: 0.85, a2: 0.004, a3: 0.010, a4: 0.018};
function amplitudPulso(f){
  if (f <= PULSO.f1) return 0;
  if (f <= PULSO.f2) return PULSO.a2 * (f - PULSO.f1) / (PULSO.f2 - PULSO.f1);
  if (f <= PULSO.f3) return PULSO.a2 + (PULSO.a3 - PULSO.a2) * (f - PULSO.f2) / (PULSO.f3 - PULSO.f2);
  return PULSO.a3 + (PULSO.a4 - PULSO.a3) * Math.min(1, (f - PULSO.f3) / (1 - PULSO.f3));
}
const temblorDe = (f, s) => amplitudPulso(f) * (0.65 * Math.sin(2 * Math.PI * 1.1 * s) + 0.35 * Math.sin(2 * Math.PI * 1.9 * s + 1.3));

// ---------------------------------------------------------------------
// Tablero: tamaño, canicas tragadas y poder de cada uno
// ---------------------------------------------------------------------
const css = document.createElement('style');
css.textContent = `.loca-tab{position:fixed;left:max(8px,env(safe-area-inset-left,0px));top:50%;transform:translateY(-50%);z-index:5;display:flex;flex-direction:column;gap:4px;pointer-events:none}
.loca-tab div{--c:#fff;background:rgba(20,12,6,.72);border-left:4px solid var(--c);border-radius:8px;padding:2px 8px;font-size:12px;font-weight:700;color:var(--crema);white-space:nowrap}
.loca-tab div.fuera{opacity:.4;text-decoration:line-through}`;
document.head.appendChild(css);
const tablero = document.createElement('div'); tablero.className = 'loca-tab'; tablero.id = 'locaTablero'; tablero.hidden = true; document.body.appendChild(tablero);
function construirTablero(){ tablero.hidden = false; pintarTablero(); }
let cacheTab = '';
function pintarTablero(){
  const html = B.jugadores().map(j => `<div class="${j.vivo ? '' : 'fuera'}" style="--c:${N.hex(j.color)}">${j.nombre.replace(/[<>&]/g, '')}${j.verdad && j.vivo ? ' ⚡' : ''}${j.cohete ? ' 🚀' : ''} · 🟢 ${(j.tragadas || []).length}${grande(j) && j.vivo ? ' · GRANDE' : ''} · 💰${j.pago || 0}</div>`).join('');
  if (html !== cacheTab){ cacheTab = html; tablero.innerHTML = html; }
}

// ---------------------------------------------------------------------
// Cada cuadro: tamaños, cohetes, arena, tablas, efectos
// ---------------------------------------------------------------------
B.on('cuadro', dt => {
  if (B.variante() !== variante) return;
  const ahora = t(), esc = B.escala();
  tablas.slice().forEach(w => { if (w.hasta <= ahora){ scene.remove(w.mesh); tablas = tablas.filter(x => x !== w); } });
  arenas.slice().forEach(z => { z.mesh.rotation.z += dt * 0.8; if (z.hasta <= ahora){ scene.remove(z.mesh); arenas = arenas.filter(x => x !== z); } });
  B.jugadores().forEach(j => {
    const b = j.bola;
    if (j._quitarBol && ahora >= j._quitarBol){ j._quitarBol = 0; quitarBoloncho(j); }
    // pulso al apuntar
    if (!j.ia && j.apunta.puntero !== null && j.apunta.mostrar){ if (j._t0 === null) j._t0 = ahora; j.apunta.temblor = temblorDe(j.apunta.fuerza, ahora - j._t0); }
    else if (j.apunta.puntero === null && !j.apunta.mostrar){ j._t0 = null; }
    if (!j.vivo) return;
    // tamaño (crece animado, con un saltito al tragar)
    j._pulso = Math.max(0, (j._pulso || 0) - dt * 2.5);
    const obj = (b.radio || R) / R, act = j._esc || 1;
    j._esc = act + (obj - act) * Math.min(1, dt * 4);
    const s = j._esc * (1 + Math.sin((j._pulso || 0) * 14) * 0.12 * (j._pulso || 0));
    b.mesh.scale.setScalar(s); b.mesh.position.y = b.p.y + R * (j._esc - 1);
    if (j.m && j.m.anillo) j.m.anillo.scale.setScalar(esc * j._esc);
    // cohete
    if (j.cohete && j.mCohete){
      j.mCohete.position.set(b.p.x, b.p.y, b.p.z);
      j.mCohete.quaternion.setFromUnitVectors(new V3(0, 1, 0), j.cohete.dir.clone().setY(0.15).normalize());
      j.mCohete.scale.setScalar(Math.max(1, esc * 0.8));
      j.mCohete.userData.llama.scale.set(1, 0.8 + Math.random() * 0.6, 1);
      if (window.ChirasGraficos) window.ChirasGraficos.polvo(b.p.clone().addScaledVector(j.cohete.dir, -0.25), new V3(-j.cohete.dir.x * 2 + (Math.random() - .5), 0.4, -j.cohete.dir.z * 2 + (Math.random() - .5)), Math.random() < .5 ? 0xffa21f : 0xfff1c0, 0.5);
    }
  });
  // la bola tragada se encoge y entra en la que se la comió
  for (let i = tragando.length - 1; i >= 0; i--){
    const x = tragando[i]; x.t += dt; const k = Math.min(1, x.t / 0.45);
    x.m.position.lerpVectors(x.desde, x.a.bola.p, k); x.m.scale.setScalar(1 - k * 0.9);
    if (k >= 1){ scene.remove(x.m); tragando.splice(i, 1); }
  }
  // canicas sin vida: salen volando de la reventada, caen y se quedan quietas (con un aro que titila)
  muertas.forEach(c => {
    c.t += dt;
    if (c.t < 0.6){ const k = c.t / 0.6; c.m.position.set(c.desde.x + (c.p.x - c.desde.x) * k, R + Math.sin(k * Math.PI) * 1.2, c.desde.z + (c.p.z - c.desde.z) * k); }
    else { c.m.position.copy(c.p); c.aro.visible = true; c.aro.material.opacity = 0.35 + Math.sin(ahora * 6) * 0.3; }
  });
  pintarRevancha();
  // canicas regadas al reventar
  for (let i = regados.length - 1; i >= 0; i--){
    const r = regados[i]; r.vida -= dt; r.v.y -= 9.8 * dt; r.m.position.addScaledVector(r.v, dt);
    if (r.m.position.y < R){ r.m.position.y = R; r.v.y = Math.abs(r.v.y) * 0.4; r.v.x *= 0.8; r.v.z *= 0.8; }
    if (r.vida <= 0){ scene.remove(r.m); regados.splice(i, 1); }
  }
  pintarTablero();
});
B.on('fin', () => { if (B.variante() === variante) pintarTablero(); });

// Pruebas automáticas: index.html#prueba-loca (máquinas contra máquinas)
if (location.hash === '#prueba-loca'){
  let partidas = 0;
  B.on('fin', e => {
    if (B.variante() !== variante) return;
    partidas++;
    console.log(`[fin] partida ${partidas}: ganó ${e.ganador} en ${e.tiempo} s · tragadas ${stats.tragadas}, cohetes ${stats.cohetes}, reventadas ${stats.reventadas}, desviados ${stats.cohetesDesviados}`);
    if (partidas < 4) setTimeout(() => B.iniciar({ambosIA: true, variante: 'loca', bots: 2, nombres: ['Máquina A', 'Máquina B']}), 500);
    else console.log('[resumen] ' + partidas + ' partidas a la loca terminadas');
  });
  addEventListener('load', () => B.iniciar({ambosIA: true, variante: 'loca', bots: 2, nombres: ['Máquina A', 'Máquina B']}));
}
if (location.hash === '#prueba-loca-reglas') addEventListener('load', () => { const s = document.createElement('script'); s.src = 'pruebas-loca.js'; document.body.appendChild(s); });

window.ChirasBatallaLoca = {CFG, stats, PODERES, tablas: () => tablas, arenas: () => arenas, muertas: () => muertas, objetivoCohete, grande, tragar, lanzarCohete, revancha, puedeRevancha};
})();
