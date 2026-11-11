// =====================================================================
// CHIRAS PELAS — Espectáculo del modo Batalla
// Solo escucha lo que pasa en la batalla y le agrega efectos, sonidos,
// anuncios y la repetición. No cambia las reglas ni el orden de juego.
// (Las únicas partes que cambian el juego son opcionales: los eventos
// sorpresa, solo en "Partida especial", y los combos, que necesitan los
// poderes extra.) Los números se ajustan en poderes.js -> ESPECTACULO.
// =====================================================================
(function(){
const N = window.ChirasNucleo, B = window.ChirasBatalla, P = window.ChirasPoderes, A = window.ChirasAudio;
if (!N || !B || !P || !A){ console.error('Espectáculo: faltan módulos'); return; }
const {THREE, scene, camera, renderer, R, HOLE} = N;
const V3 = THREE.Vector3, E = P.ESPECTACULO;
const $ = s => document.querySelector(s);
const porNombre = n => B.jugadores().find(j => j.nombre === n);
const rand = (a, b) => a + Math.random() * (b - a);
const stats = {transformaciones: 0, maestros: 0, repeticiones: 0, combos: 0, eventos: 0, aplastados: 0, estallidos: 0};
const oyentes = {};
const on = (t, fn) => (oyentes[t] = oyentes[t] || []).push(fn);
const emitir = (t, d) => (oyentes[t] || []).forEach(fn => { try { fn(d); } catch (e) { console.error(e); } });
const log = t => { if (N.MODO_PRUEBA) console.log('[esp] ' + t); };
const despues = (seg, fn) => setTimeout(fn, seg * 1000);

// ---------- interfaz propia (marco de repetición y aviso de evento) ----------
const css = document.createElement('style');
css.textContent = `
.esp-rep{position:fixed;border:3px solid var(--amarillo);border-radius:12px;pointer-events:none;z-index:5;box-shadow:0 0 0 2px #000,0 6px 18px rgba(0,0,0,.5)}
.esp-rep span{position:absolute;left:8px;top:-12px;background:var(--rojo);color:#fff;font-family:var(--display);font-size:13px;padding:1px 8px;border-radius:6px;letter-spacing:.5px}
.esp-evento{position:fixed;left:50%;top:50%;transform:translate(-50%,calc(-50% + 70px));background:rgba(20,12,6,.8);border:2px solid var(--amarillo);border-radius:12px;padding:4px 12px;font-family:var(--display);font-size:16px;color:var(--crema);pointer-events:none;z-index:4;display:flex;gap:8px;align-items:center}
.esp-evento b{display:inline-block;font-size:20px;color:var(--amarillo)}
`;
document.head.appendChild(css);
const marco = document.createElement('div'); marco.className = 'esp-rep'; marco.hidden = true; marco.innerHTML = '<span>⟲ REPETICIÓN</span>';
const bannerEv = document.createElement('div'); bannerEv.className = 'esp-evento'; bannerEv.hidden = true; bannerEv.setAttribute('role', 'status');
document.body.append(marco, bannerEv);

// ---------------------------------------------------------------------
// 1 y 6. Transformación al encholar + corona del Rey de las Chiras
// ---------------------------------------------------------------------
const matOro = new THREE.MeshStandardMaterial({color: 0xffcc33, emissive: 0xa06a00, metalness: .85, roughness: .25});
const matGemas = [0xff3355, 0x33c4ff, 0x4dff88].map(c => new THREE.MeshBasicMaterial({color: c}));
const geoAro = new THREE.TorusGeometry(0.11, 0.022, 8, 24), geoPico = new THREE.ConeGeometry(0.028, 0.09, 6), geoGema = new THREE.SphereGeometry(0.02, 8, 6);
const texHalo = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,220,120,.6)'); gr.addColorStop(1, 'rgba(255,200,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
function hacerCorona(){
  const g = new THREE.Group();
  const aro = new THREE.Mesh(geoAro, matOro); aro.rotation.x = Math.PI / 2; g.add(aro);
  for (let i = 0; i < 5; i++){
    const a = i / 5 * Math.PI * 2, x = Math.cos(a) * 0.11, z = Math.sin(a) * 0.11;
    const p = new THREE.Mesh(geoPico, matOro); p.position.set(x, 0.05, z); g.add(p);
    const gm = new THREE.Mesh(geoGema, matGemas[i % 3]); gm.position.set(x, 0.1, z); g.add(gm);
  }
  return g;
}
const reyes = new Map();
function coronar(j){
  if (!j || reyes.has(j)) return;
  const corona = hacerCorona();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({map: texHalo, color: 0xffd860, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  scene.add(corona, halo);
  reyes.set(j, {corona, halo, t: 0, fin: false, tf: 0});
  stats.transformaciones++;
  B.explotar(j.bola.p.clone().setY(R), 0xffd84a, true);
  A.sfx.transformacion(); despues(0.5, () => A.sfx.corona());
  despues(1.0, () => A.voz('me_enchole'));
  log('transformación y corona para ' + j.nombre);
  emitir('corona', j);
}
function descoronar(j, ya){
  const r = reyes.get(j); if (!r) return;
  if (ya){ quitarRey(j); return; }
  r.fin = true;
}
function quitarRey(j){
  const r = reyes.get(j); if (!r) return;
  scene.remove(r.corona, r.halo); r.halo.material.dispose();
  j.bola.mesh.scale.setScalar(1);
  reyes.delete(j);
}
function pasoReyes(dt){
  const esc = B.escala();
  reyes.forEach((r, j) => {
    if (!j.vivo){ quitarRey(j); return; }
    r.t += dt; if (r.fin) r.tf += dt;
    const k = r.fin ? Math.max(0, 1 - r.tf * 3) : Math.min(1, r.t * 2.2);
    if (r.fin && k <= 0){ quitarRey(j); return; }
    const b = j.bola;
    // la canica crece y brilla (solo a la vista: el tamaño para la física no cambia)
    b.mesh.scale.setScalar(1 + (E.crecer - 1) * k * (1 + Math.sin(r.t * 5) * 0.03));
    const s = Math.max(1, esc * 0.9);
    r.corona.position.set(b.p.x, Math.max(b.p.y, R) + (0.55 + Math.sin(r.t * 3) * 0.04) * s + 0.25 * esc, b.p.z);
    r.corona.scale.setScalar(s * 1.3 * k); r.corona.rotation.y += dt * 1.6;
    r.halo.position.set(b.p.x, Math.max(b.p.y, R), b.p.z);
    r.halo.scale.setScalar((0.55 + Math.sin(r.t * 4) * 0.08) * Math.max(1, esc * 0.7) * k);
    r.halo.material.opacity = 0.85 * k;
  });
}

// ---------------------------------------------------------------------
// 3. Golpes espectaculares: aplastar o estallar en cientos de fragmentos
// ---------------------------------------------------------------------
const geoTri = new THREE.BufferGeometry();
geoTri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0.05, 0, -0.035, -0.03, 0, 0.04, -0.025, 0]), 3));
const estallidos = [];
for (let k = 0; k < 2; k++){
  const n = E.fragmentos, geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({size: 0.09, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  pts.frustumCulled = false; pts.visible = false; scene.add(pts);
  const mats = [new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, side: THREE.DoubleSide}),
                new THREE.MeshBasicMaterial({color: 0x9fe8ff, transparent: true, side: THREE.DoubleSide}),
                new THREE.MeshBasicMaterial({color: 0xffd84a, transparent: true, side: THREE.DoubleSide})];
  const vidrios = [];
  for (let i = 0; i < 36; i++){ const m = new THREE.Mesh(geoTri, mats[i % 3]); m.visible = false; scene.add(m); vidrios.push({m, v: new V3(), w: new V3()}); }
  estallidos.push({pts, geo, n, vel: new Float32Array(n * 3), mats, vidrios, vida: 0, dur: 1.8});
}
const manchas = [];
const geoMancha = new THREE.CircleGeometry(0.2, 20);
for (let i = 0; i < 3; i++){ const m = new THREE.Mesh(geoMancha, new THREE.MeshBasicMaterial({transparent: true, depthWrite: false})); m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); manchas.push({m, vida: 0}); }
const aplastados = [];

function estallar(pos, color){
  const ex = estallidos.reduce((a, b) => (a.vida <= b.vida ? a : b));
  const esc = Math.max(1, B.escala() * 0.8);
  ex.vida = ex.dur;
  const p = ex.geo.attributes.position.array, c = ex.geo.attributes.color.array, v = ex.vel;
  const tonos = [new THREE.Color(color), new THREE.Color(0xffffff), new THREE.Color(0xffd84a), new THREE.Color(0x9fe8ff), new THREE.Color(0xff7b2e)];
  for (let i = 0; i < ex.n; i++){
    p[i*3] = pos.x; p[i*3+1] = pos.y; p[i*3+2] = pos.z;
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.5, ve = rand(1.5, 7) * Math.sqrt(esc);
    v[i*3] = Math.cos(th) * Math.cos(ph) * ve; v[i*3+1] = Math.sin(ph) * ve + 1.5; v[i*3+2] = Math.sin(th) * Math.cos(ph) * ve;
    const t = tonos[i % tonos.length]; c[i*3] = t.r; c[i*3+1] = t.g; c[i*3+2] = t.b;
  }
  ex.geo.attributes.position.needsUpdate = ex.geo.attributes.color.needsUpdate = true;
  ex.pts.visible = true; ex.pts.material.opacity = 1; ex.pts.material.size = 0.09 * esc;
  ex.mats[0].color.set(color);
  ex.vidrios.forEach(f => {
    f.m.visible = true; f.m.position.copy(pos); f.m.scale.setScalar(esc * rand(0.7, 1.4));
    const th = Math.random() * Math.PI * 2, ve = rand(2, 5) * Math.sqrt(esc);
    f.v.set(Math.cos(th) * ve, rand(2.5, 6) * Math.sqrt(esc), Math.sin(th) * ve); f.w.set(rand(-12, 12), rand(-12, 12), rand(-12, 12));
  });
  ex.mats.forEach(m => m.opacity = 1);
  stats.estallidos++;
  A.sfx.estallido();
}
function aplastar(j, pos){
  const copia = j.bola.mesh.clone(); copia.visible = true; copia.position.copy(pos); copia.scale.setScalar(1);
  scene.add(copia);
  aplastados.push({m: copia, t: 0, pos: pos.clone(), color: j.color});
  stats.aplastados++;
  A.sfx.aplastar();
}
function pasoGolpes(dt){
  estallidos.forEach(ex => {
    if (ex.vida <= 0) return;
    ex.vida -= dt;
    const k = Math.max(0, ex.vida / ex.dur), p = ex.geo.attributes.position.array, v = ex.vel;
    for (let i = 0; i < ex.n; i++){
      v[i*3+1] -= 7 * dt; p[i*3] += v[i*3] * dt; p[i*3+2] += v[i*3+2] * dt;
      p[i*3+1] += v[i*3+1] * dt; if (p[i*3+1] < 0.02){ p[i*3+1] = 0.02; v[i*3+1] *= -0.3; v[i*3] *= 0.7; v[i*3+2] *= 0.7; }
    }
    ex.geo.attributes.position.needsUpdate = true;
    ex.pts.material.opacity = k;
    ex.mats.forEach(m => m.opacity = Math.min(1, k * 1.5));
    ex.vidrios.forEach(f => {
      f.v.y -= 9.8 * dt; f.m.position.addScaledVector(f.v, dt);
      if (f.m.position.y < 0.02){ f.m.position.y = 0.02; f.v.multiplyScalar(0.35); f.v.y = Math.abs(f.v.y); f.w.multiplyScalar(0.5); }
      f.m.rotation.x += f.w.x * dt; f.m.rotation.y += f.w.y * dt; f.m.rotation.z += f.w.z * dt;
    });
    if (ex.vida <= 0){ ex.pts.visible = false; ex.vidrios.forEach(f => f.m.visible = false); }
  });
  for (let i = aplastados.length - 1; i >= 0; i--){
    const a = aplastados[i]; a.t += dt;
    const k = Math.min(1, a.t / 0.28), e = k * k;
    a.m.scale.set(1 + e * 0.9, Math.max(0.12, 1 - e * 0.88), 1 + e * 0.9);
    a.m.position.y = a.pos.y - (R * 0.85) * e;
    if (a.t >= 0.28){
      scene.remove(a.m); aplastados.splice(i, 1);
      const mc = manchas.reduce((x, y) => (x.vida <= y.vida ? x : y));
      mc.vida = 4; mc.m.visible = true; mc.m.material.color.set(a.color); mc.m.material.opacity = 0.75;
      mc.m.position.set(a.pos.x, 0.009, a.pos.z); mc.m.scale.setScalar(Math.max(1, B.escala() * 0.5));
      B.explotar(a.pos, a.color, true);
    }
  }
  manchas.forEach(mc => { if (mc.vida <= 0) return; mc.vida -= dt; mc.m.material.opacity = Math.min(0.75, mc.vida / 2); if (mc.vida <= 0) mc.m.visible = false; });
}

// ---------------------------------------------------------------------
// Tiros maestros
// ---------------------------------------------------------------------
const tiros = new Map();   // nombre -> {x, z, golpes:Set, maestro}
function distDesde(nombre){
  const s = tiros.get(nombre), j = porNombre(nombre);
  return s && j ? Math.hypot(j.bola.p.x - s.x, j.bola.p.z - s.z) : 0;
}
function revisarGolpe(atacante, victima){
  const s = tiros.get(atacante); if (!s) return;
  s.golpes.add(victima);
  const d = distDesde(atacante);
  if (s.golpes.size >= 2) maestro(atacante, 'Carambola: le pegó a dos canicas de un solo tiro');
  else if (d >= E.maestro.golpe) maestro(atacante, `Golpe desde ${Math.round(d)} m`);
}
function maestro(nombre, detalle){
  const s = tiros.get(nombre); if (!s || s.maestro) return;
  s.maestro = true; stats.maestros++;
  const j = porNombre(nombre);
  log('tiro maestro: ' + nombre + ' — ' + detalle);
  despues(1.1, () => { B.flash('¡TIRO MAESTRO!', `${nombre}: ${detalle}`, j ? j.color : 0xffd84a); A.sfx.maestro(); A.voz('maestro'); });
  emitir('maestro', {jugador: nombre, detalle});
}

// ---------------------------------------------------------------------
// Cámara de repetición épica (ventanita, la partida sigue)
// ---------------------------------------------------------------------
const HIST = 150;            // 2,5 s a 60 cuadros por segundo
let hist = [], histN = 0, rep = null;
const camRep = new THREE.PerspectiveCamera(48, 4 / 3, 0.05, 300);
function grabar(){
  const js = B.jugadores();
  if (hist.length !== js.length) { hist = js.map(() => new Float32Array(HIST * 8)); histN = 0; }
  const i = histN % HIST;
  js.forEach((j, k) => {
    const b = j.bola, q = b.mesh.quaternion, h = hist[k];
    h.set([b.p.x, Math.max(b.p.y, R * 0.2), b.p.z, q.x, q.y, q.z, q.w, (j.vivo && b.activa && !b.enMano) ? 1 : 0], i * 8);
  });
  histN++;
}
function iniciarRepeticion(victima, atacante){
  if (E.repeticion === 'nunca' || histN < 30) return;
  const js = B.jugadores();
  const n = Math.min(HIST, histN, 96);   // 1,6 s de lo que pasó
  const cuadros = [];
  for (let c = n; c > 0; c--){
    const i = (histN - c) % HIST;
    cuadros.push(js.map((j, k) => Array.from(hist[k].subarray(i * 8, i * 8 + 8))));
  }
  rep = {cuadros, t: 0, dur: 2.2, foco: js.indexOf(victima), otro: js.indexOf(atacante), ang: Math.random() * Math.PI * 2};
  stats.repeticiones++;
  A.sfx.repeticion();
  log('repetición de la eliminación de ' + (victima ? victima.nombre : '?'));
}
function rectRep(){
  const w = Math.min(innerWidth * 0.46, 240), h = w * 0.72;
  return {x: 10, y: innerHeight * 0.5 - h - 30, w, h};
}
N.ganchos.trasRender = () => {
  if (!rep || N.getEstado() !== 'batalla') { marco.hidden = true; return; }
  const js = B.jugadores();
  const f = rep.cuadros[Math.min(rep.cuadros.length - 1, Math.floor(rep.t / rep.dur * rep.cuadros.length))];
  if (!f) return;
  const guard = js.map(j => ({p: j.bola.mesh.position.clone(), q: j.bola.mesh.quaternion.clone(), v: j.bola.mesh.visible}));
  js.forEach((j, k) => { const d = f[k]; if (!d) return; j.bola.mesh.position.set(d[0], d[1], d[2]); j.bola.mesh.quaternion.set(d[3], d[4], d[5], d[6]); j.bola.mesh.visible = d[7] > 0; });
  const fc = f[rep.foco >= 0 ? rep.foco : 0], fo = f[rep.otro >= 0 ? rep.otro : 0] || fc;
  const foco = new V3((fc[0] * 2 + fo[0]) / 3, 0.05, (fc[2] * 2 + fo[2]) / 3);
  const sep = Math.max(1.2, Math.hypot(fc[0] - fo[0], fc[2] - fo[2]) * 0.8);
  const a = rep.ang + rep.t * 0.6;
  camRep.position.set(foco.x + Math.sin(a) * sep, 0.35 + sep * 0.35, foco.z + Math.cos(a) * sep);
  camRep.lookAt(foco);
  const r = rectRep();
  camRep.aspect = r.w / r.h; camRep.updateProjectionMatrix();
  renderer.setScissorTest(true);
  renderer.setScissor(r.x, innerHeight - r.y - r.h, r.w, r.h);
  renderer.setViewport(r.x, innerHeight - r.y - r.h, r.w, r.h);
  renderer.render(scene, camRep);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, innerWidth, innerHeight);
  js.forEach((j, k) => { j.bola.mesh.position.copy(guard[k].p); j.bola.mesh.quaternion.copy(guard[k].q); j.bola.mesh.visible = guard[k].v; });
  Object.assign(marco.style, {left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px'});
  marco.hidden = false;
};
function pasoRepeticion(dt){
  if (!rep) return;
  rep.t += dt;
  if (rep.t >= rep.dur){ rep = null; marco.hidden = true; }
}

// ---------------------------------------------------------------------
// 5. Música dinámica y sonidos de cristal / cauchera
// ---------------------------------------------------------------------
let ultimoCristal = -1;
function pasoMusica(){
  const js = B.jugadores();
  const dueno = js.find(j => j.vivo && j.verdad);
  let n = dueno ? 1 : 0;
  if (dueno && ((dueno.apunta.mostrar && dueno.apunta.fuerza > 0.3) || (dueno.tiro && !dueno.tiro.fin) || js.some(j => j.pendiente))) n = 2;
  A.ponerIntensidad(n);
}

// ---------------------------------------------------------------------
// Eventos sorpresa (solo en "Partida especial")
// ---------------------------------------------------------------------
let ev = {activo: false, prox: 0, actual: null};
const geoMov = new THREE.CircleGeometry(1, 40);
const texMov = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(60,35,15,.95)'); gr.addColorStop(.8, 'rgba(120,80,40,.7)'); gr.addColorStop(1, 'rgba(150,100,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(230,190,130,.55)'; g.lineWidth = 3;
  for (let a = 0; a < 3; a++){ g.beginPath(); for (let t = 0; t < 40; t++){ const r = t * 1.4, th = t * 0.35 + a * 2.1; g.lineTo(64 + Math.cos(th) * r, 64 + Math.sin(th) * r); } g.stroke(); }
  return new THREE.CanvasTexture(c);
})();
const mallaMov = new THREE.Mesh(geoMov, new THREE.MeshBasicMaterial({map: texMov, transparent: true, depthWrite: false}));
mallaMov.rotation.x = -Math.PI / 2; mallaMov.visible = false; scene.add(mallaMov);
const EVENTOS = {
  viento: {nombre: 'Viento', icono: '🌬️', dur: 6},
  movediza: {nombre: 'Arena movediza', icono: '🌀', dur: 10},
  rapido: {nombre: 'Terreno rápido', icono: '⚡', dur: 8}
};
function lanzarEvento(tipo){
  const def = EVENTOS[tipo]; if (!def) return;
  const js = B.jugadores().filter(j => j.vivo && j.bola.activa);
  const a = {tipo, resta: def.dur};
  if (tipo === 'viento'){ const th = Math.random() * Math.PI * 2; a.dir = new V3(Math.cos(th), 0, Math.sin(th)); }
  if (tipo === 'movediza'){
    let c = new V3();
    js.forEach(j => c.add(j.bola.p)); if (js.length) c.divideScalar(js.length);
    for (let i = 0; i < 20; i++){
      const p = c.clone().add(new V3(rand(-4, 4), 0, rand(-4, 4)));
      if (Math.hypot(p.x - HOLE.x, p.z - HOLE.z) > E.eventos.movedizaRadio + 1.5){ c = p; break; }
    }
    a.centro = c.setY(0);
    mallaMov.position.set(c.x, 0.011, c.z); mallaMov.scale.setScalar(E.eventos.movedizaRadio); mallaMov.visible = true;
  }
  ev.actual = a; stats.eventos++;
  B.flash(`${def.icono} ¡${def.nombre.toUpperCase()}!`, 'Evento sorpresa', 0x1d55b3);
  A.sfx.evento(); if (tipo === 'viento') A.sfx.viento();
  A.voz(tipo);
  const flecha = a.dir ? ` <b style="transform:rotate(${Math.atan2(a.dir.z, a.dir.x)}rad)">➜</b>` : '';
  bannerEv.innerHTML = `${def.icono} ${def.nombre}${flecha}`; bannerEv.hidden = false;
  log('evento ' + tipo);
  emitir('evento', a);
}
function terminarEvento(){ ev.actual = null; mallaMov.visible = false; bannerEv.hidden = true; }
function pasoEventos(dt){
  if (!ev.activo || B.estado().fin || B.cuenta() > 0) return;
  const a = ev.actual;
  if (a){
    a.resta -= dt;
    if (a.tipo === 'movediza') mallaMov.rotation.z += dt * 0.8;
    if (a.resta <= 0) terminarEvento();
    return;
  }
  ev.prox -= dt;
  if (ev.prox <= 0){
    ev.prox = rand(E.eventos.cadaMin, E.eventos.cadaMax);
    lanzarEvento(Object.keys(EVENTOS)[Math.floor(Math.random() * 3)]);
  }
}
B.on('antesFisica', dt => {
  const a = ev.actual; if (!a) return;
  B.jugadores().forEach(j => {
    const b = j.bola; if (!j.vivo || !b.activa || b.enMano || b.enHueco || b.cayendo) return;
    if (a.tipo === 'viento'){
      if (Math.hypot(b.v.x, b.v.z) > 0.05){ b.v.x += a.dir.x * E.eventos.viento * dt; b.v.z += a.dir.z * E.eventos.viento * dt; }
    } else if (a.tipo === 'movediza'){
      if (Math.hypot(b.p.x - a.centro.x, b.p.z - a.centro.z) < E.eventos.movedizaRadio) b.freno = (b.freno || 1) * E.eventos.movedizaFreno;
    } else if (a.tipo === 'rapido') b.freno = (b.freno || 1) * E.eventos.rapidoFreno;
  });
});

// ---------------------------------------------------------------------
// Combos de poderes
// ---------------------------------------------------------------------
let combosPendientes = [];
function poderActivo(j, id){
  const riv = B.ctx.rivales(j);
  switch (id){
    case 'barrera': return j.escudo > 0;
    case 'turbo': return !!j.efectos.turbo;
    case 'superpotencia': return !!j.efectos.superpotencia;
    case 'trueno': return !!j.efectos.trueno;
    case 'congelacion': return riv.some(r => r.efectos.congelado);
    case 'cero': return riv.some(r => r.bloqueo > 0 && r.bloqueadoPor === j);
  }
  return false;
}
B.on('poder', e => {
  const j = porNombre(e.jugador); if (!j) return;
  (P.COMBOS || []).forEach(c => {
    if (!c.requiere.includes(e.poder)) return;
    const otro = c.requiere.find(x => x !== e.poder);
    if (poderActivo(j, otro)) combosPendientes.push({c, j});
  });
});
function pasoCombos(){
  // se aplican un cuadro después, cuando el poder nuevo ya está funcionando
  const lista = combosPendientes; combosPendientes = [];
  lista.forEach(({c, j}) => {
    if (!j.vivo || !c.requiere.every(id => poderActivo(j, id))) return;
    c.aplicar(B.ctx, j);
    stats.combos++;
    log('combo ' + c.id + ' de ' + j.nombre);
    despues(0.9, () => { B.flash(`¡COMBO ${c.nombre.toUpperCase()}!`, c.descripcion, j.color); A.sfx.combo(); A.voz('combo', c.voz); });
    emitir('combo', {jugador: j.nombre, combo: c.id});
  });
}

// ---------------------------------------------------------------------
// Escuchar la batalla
// ---------------------------------------------------------------------
B.on('inicio', () => {
  [...reyes.keys()].forEach(j => quitarRey(j));
  reyes.clear(); tiros.clear(); hist = []; histN = 0; rep = null; marco.hidden = true; combosPendientes = [];
  terminarEvento();
  ev = {activo: !!B.opciones().especial, prox: rand(E.eventos.cadaMin * 0.6, E.eventos.cadaMax * 0.6), actual: null};
  A.ponerIntensidad(0);
});
B.on('verdad', e => {
  const s = tiros.get(e.jugador);
  if (s && distDesde(e.jugador) >= E.maestro.enchole) maestro(e.jugador, `Enchole desde ${Math.round(distDesde(e.jugador))} m`);
  coronar(porNombre(e.jugador));
});
B.on('verdad-quitada', e => { descoronar(porNombre(e.a)); revisarGolpe(e.por, e.a); });
B.on('golpe-valido', e => revisarGolpe(e.atacante, e.victima));
B.on('barrera-aguanto', e => revisarGolpe(e.atacante, e.defensor));
B.on('tiro', e => { tiros.set(e.jugador, {x: e.x, z: e.z, golpes: new Set(), maestro: false}); A.sfx.cauchera(e.fuerza); });
B.on('choque', e => {
  const t = B.tiempo();
  if (e.fuerza > 0.3 && t - ultimoCristal > 0.05){ ultimoCristal = t; A.sfx.cristal(e.fuerza); }
});
B.on('eliminado', e => {
  const j = porNombre(e.jugador); if (!j) return;
  descoronar(j, true);
  const b = j.bola;
  const pos = new V3(b.p.x, Math.max(b.p.y, R), b.p.z);
  if (Math.hypot(pos.x - HOLE.x, pos.z - HOLE.z) < 0.3) pos.set(HOLE.x, R, HOLE.z);
  const modo = E.eliminacion === 'azar' ? (Math.random() < 0.5 ? 'aplastar' : 'explotar') : E.eliminacion;
  if (modo === 'aplastar') aplastar(j, pos); else estallar(pos, j.color);
  log(`eliminación: ${modo} a ${j.nombre}`);
  const por = e.por ? porNombre(e.por) : null;
  const esNochera = !e.por && /hueco/.test(e.motivo || '');
  const fueMaestro = por && tiros.get(por.nombre) && tiros.get(por.nombre).maestro;
  if (E.repeticion === 'todas' || fueMaestro || esNochera) iniciarRepeticion(j, por || j);
});
B.on('cuadro', dt => {
  grabar();
  pasoReyes(dt); pasoGolpes(dt); pasoRepeticion(dt); pasoEventos(dt); pasoCombos(); pasoMusica();
});

window.ChirasEspectaculo = {
  stats, on, lanzarEvento, terminarEvento, eventoActual: () => ev.actual,
  repeticionActiva: () => !!rep, reyes: () => [...reyes.keys()].map(j => j.nombre), iniciarRepeticion
};
})();
