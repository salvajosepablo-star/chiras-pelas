// =====================================================================
// CHIRAS PELAS — Extras del modo Clásico
//  - Tiro con poder: la bola sale como un planeta pasando (estela de
//    fuego, brillo, sacudida de cámara y sonido "shoo").
//  - Poderes en la cancha: cada pipe hace aparecer poderes en la tierra;
//    el que pase su bola por encima se los lleva (más cantos).
//  - Emoción: narrador, música dinámica, sonido de rodar.
// No cambia las reglas del clásico.
// =====================================================================
(function(){
const N = window.ChirasNucleo, A = window.ChirasAudio;
if (!N || !A){ console.error('Clásico extra: faltan módulos'); return; }
const {THREE, scene, camera, R, HOLE} = N;
const V3 = THREE.Vector3;
const log = t => { if (N.MODO_PRUEBA) console.log('[clasico] ' + t); };

// Ajustes
const CFG = {
  poderesPorPipe: 0,         // poderes que aparecen en la cancha con cada pipe (0 = apagado: ahora los cantos son ilimitados)
  maxEnCancha: 4,            // máximo de poderes tirados en la tierra al tiempo
  radioRecoger: 0.32,        // qué tan cerca debe pasar la bola para llevárselo
  maxPorCanto: 3,            // máximo que se puede guardar de cada canto
  tipos: [['barrera', 0.5], ['desquadris', 0.2], ['ochera', 0.15], ['carambola', 0.15]]
};
const ICONOS = {barrera: ['🛡️', '#3ad1ff'], desquadris: ['🔄', '#c77dff'], ochera: ['🕳️', '#ffb347'], carambola: ['💥', '#ff5d73']};

// ---------------------------------------------------------------------
// Partículas (una sola malla para todo: estela y estallidos)
// ---------------------------------------------------------------------
const texSuave = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const NP = 320;
const geoP = new THREE.BufferGeometry();
const posP = new Float32Array(NP * 3), colP = new Float32Array(NP * 3);
geoP.setAttribute('position', new THREE.BufferAttribute(posP, 3));
geoP.setAttribute('color', new THREE.BufferAttribute(colP, 3));
const puntos = new THREE.Points(geoP, new THREE.PointsMaterial({size: 0.16, map: texSuave, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
puntos.frustumCulled = false; scene.add(puntos);
const parts = Array.from({length: NP}, () => ({vida: 0, dur: 1, v: new V3(), c: new THREE.Color(), fuego: true}));
let sigP = 0;
for (let i = 0; i < NP; i++) posP[i * 3 + 1] = -50;
function emitir(p, v, dur, color, fuego){
  const k = sigP; sigP = (sigP + 1) % NP;
  const q = parts[k];
  q.vida = q.dur = dur; q.v.copy(v); q.fuego = fuego; if (color) q.c.set(color);
  posP[k * 3] = p.x; posP[k * 3 + 1] = p.y; posP[k * 3 + 2] = p.z;
}
const caliente = new THREE.Color(1, 0.95, 0.8), naranja = new THREE.Color(1, 0.45, 0.08), rojo = new THREE.Color(0.55, 0.08, 0.02), tmpC = new THREE.Color();
function pasoParticulas(dt){
  for (let i = 0; i < NP; i++){
    const q = parts[i];
    if (q.vida <= 0){ colP[i*3] = colP[i*3+1] = colP[i*3+2] = 0; continue; }
    q.vida -= dt;
    const k = Math.max(0, q.vida / q.dur);
    q.v.y -= (q.fuego ? -0.6 : 4) * dt;          // el fuego sube un poquito; las chispas caen
    posP[i*3] += q.v.x * dt; posP[i*3+1] = Math.max(0.02, posP[i*3+1] + q.v.y * dt); posP[i*3+2] += q.v.z * dt;
    if (q.fuego){ if (k > 0.6) tmpC.copy(naranja).lerp(caliente, (k - 0.6) / 0.4); else tmpC.copy(rojo).lerp(naranja, k / 0.6); }
    else tmpC.copy(q.c);
    colP[i*3] = tmpC.r * k; colP[i*3+1] = tmpC.g * k; colP[i*3+2] = tmpC.b * k;
  }
  geoP.attributes.position.needsUpdate = true; geoP.attributes.color.needsUpdate = true;
}
function estallar(p, color, n){
  for (let i = 0; i < (n || 70); i++){
    const th = Math.random() * Math.PI * 2, ve = 1.5 + Math.random() * 4;
    emitir(p, new V3(Math.cos(th) * ve, 1.5 + Math.random() * 4, Math.sin(th) * ve), 0.7 + Math.random() * 0.7, i % 3 ? color : 0xffffff, false);
  }
}

// ---------------------------------------------------------------------
// Tiro con poder: estela de planeta, brillo, onda, sacudida y sonido
// ---------------------------------------------------------------------
const brillo = new THREE.Sprite(new THREE.SpriteMaterial({map: texSuave, color: 0xffa040, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
brillo.visible = false; scene.add(brillo);
const onda = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({color: 0xffd27a, transparent: true, depthWrite: false, side: THREE.DoubleSide}));
onda.rotation.x = -Math.PI / 2; onda.visible = false; scene.add(onda);
let tiro = null, sacudida = 0, golpeFov = 0, ondaT = 0;
const stats = {tiros: 0, particulas: 0, poderesAparecidos: 0, poderesRecogidos: 0, voces: 0};
N.ganchos.alTiro = (b, fuerza) => {
  N.getJugadores().forEach(j => { j._estallo = false; });
  tiro = {b, f: fuerza, t: 0};
  sacudida = 0.04 + fuerza * 0.16; golpeFov = 3 + fuerza * 9;
  onda.position.set(b.p.x, 0.02, b.p.z); onda.scale.setScalar(0.2); onda.visible = true; ondaT = 0;
  A.sfx.meteoro(fuerza);
  stats.tiros++;
};
function pasoTiro(dt){
  if (ondaT < 0.6 && onda.visible){ ondaT += dt; const k = ondaT / 0.6; onda.scale.setScalar(0.2 + k * (1.5 + (tiro ? tiro.f : 0.5) * 2.5)); onda.material.opacity = 0.8 * (1 - k); if (k >= 1) onda.visible = false; }
  if (!tiro){ brillo.visible = false; return; }
  tiro.t += dt;
  const b = tiro.b, v = b.v.length();
  if (!b.activa || b.enHueco || b.cayendo || v < 0.6 || tiro.t > 12){ brillo.visible = false; if (v < 0.3 || !b.activa || tiro.t > 12) tiro = null; return; }
  // brillo alrededor de la bola, más grande mientras más rápido va
  const fuerza = Math.min(1, v / 12);
  brillo.visible = true; brillo.position.copy(b.p);
  brillo.scale.setScalar(R * (3 + fuerza * 9) * (0.92 + Math.random() * 0.16));
  brillo.material.opacity = 0.35 + fuerza * 0.6;
  // estela de fuego (más partículas a más velocidad)
  const n = Math.min(6, Math.ceil(v * 0.45));
  for (let i = 0; i < n; i++){
    const atras = b.v.clone().multiplyScalar(-0.06 - Math.random() * 0.05);
    const p = b.p.clone().add(new V3((Math.random() - .5) * R, (Math.random() - .3) * R, (Math.random() - .5) * R)).addScaledVector(b.v, -Math.random() * dt);
    emitir(p, atras.add(new V3((Math.random() - .5) * .4, 0.2 + Math.random() * .4, (Math.random() - .5) * .4)), 0.35 + fuerza * 0.6, null, true);
  }
  stats.particulas += n;
}
function pasoCamara(dt){
  // sacudida y "golpe" de lente al soltar (se suman a la cámara normal, sin acumularse)
  if (sacudida > 0.001){
    camera.position.add(new V3((Math.random() - .5) * sacudida, (Math.random() - .5) * sacudida, (Math.random() - .5) * sacudida));
    sacudida *= Math.exp(-dt * 7);
  }
  const fov = 55 + golpeFov;
  if (Math.abs(camera.fov - fov) > 0.01){ camera.fov = fov; camera.updateProjectionMatrix(); }
  golpeFov *= Math.exp(-dt * 3.5); if (golpeFov < 0.02) golpeFov = 0;
}

// ---------------------------------------------------------------------
// Poderes en la cancha
// ---------------------------------------------------------------------
const texIcono = {};
Object.keys(ICONOS).forEach(k => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const [emoji, color] = ICONOS[k];
  const gr = g.createRadialGradient(64, 64, 10, 64, 64, 62); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.55, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
  g.font = '64px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, 64, 70);
  texIcono[k] = new THREE.CanvasTexture(c);
});
const geoAroPoder = new THREE.RingGeometry(0.2, 0.26, 32);
let enCancha = [];
function sortearTipo(){
  let x = Math.random(), suma = 0;
  for (const [k, p] of CFG.tipos){ suma += p; if (x < suma) return k; }
  return 'barrera';
}
function lugarLibre(cerca){
  const js = N.getJugadores();
  for (let i = 0; i < 30; i++){
    const a = Math.random() * Math.PI * 2, d = 1.5 + Math.random() * 3;
    const p = new V3(cerca.x + Math.cos(a) * d, 0, cerca.z + Math.sin(a) * d);
    if (Math.abs(p.x) > 33 || p.z > 23 || p.z < -108) continue;
    if (Math.hypot(p.x - HOLE.x, p.z - HOLE.z) < 0.6) continue;
    if (js.some(j => j.bola.activa && Math.hypot(j.bola.p.x - p.x, j.bola.p.z - p.z) < 0.6)) continue;
    if (enCancha.some(o => o.p.distanceTo(p) < 0.8)) continue;
    return p;
  }
  return null;
}
function aparecerPoderes(cerca){
  for (let i = 0; i < CFG.poderesPorPipe && enCancha.length < CFG.maxEnCancha; i++){
    const p = lugarLibre(cerca); if (!p) continue;
    const tipo = sortearTipo();
    const icono = new THREE.Sprite(new THREE.SpriteMaterial({map: texIcono[tipo], transparent: true, depthWrite: false}));
    icono.scale.setScalar(0.42); icono.position.set(p.x, 0.32, p.z);
    const aro = new THREE.Mesh(geoAroPoder, new THREE.MeshBasicMaterial({color: ICONOS[tipo][1], transparent: true, opacity: .85, side: THREE.DoubleSide}));
    aro.rotation.x = -Math.PI / 2; aro.position.set(p.x, 0.012, p.z);
    scene.add(icono, aro);
    enCancha.push({tipo, p, icono, aro, t: Math.random() * 6});
    estallar(new V3(p.x, 0.2, p.z), ICONOS[tipo][1], 25);
    stats.poderesAparecidos++;
    log(`apareció ${tipo} en (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`);
  }
  if (enCancha.length) A.sfx.corona();
}
function quitarPoder(o){
  scene.remove(o.icono, o.aro); o.icono.material.dispose(); o.aro.material.dispose();
  enCancha = enCancha.filter(x => x !== o);
}
function limpiarPoderes(){ [...enCancha].forEach(quitarPoder); }
N.ganchos.trasSubpaso = () => {
  if (!enCancha.length) return;
  N.getJugadores().forEach(j => {
    const b = j.bola;
    if (!j.vivo || !b.activa || b.enMano || b.cayendo || b.enHueco || b.p.y > R + 0.08) return;
    if (b.v.lengthSq() < 0.0025) return;
    for (const o of [...enCancha]){
      if (Math.hypot(b.p.x - o.p.x, b.p.z - o.p.z) < CFG.radioRecoger){
        const antes = j.cantos[o.tipo] || 0;
        j.cantos[o.tipo] = Math.min(CFG.maxPorCanto, antes + 1);
        const nombre = N.CANTOS[o.tipo];
        N.aviso(`${j.nombre} recogió: ¡${nombre}!` + (j.cantos[o.tipo] > 1 ? ` (tiene ${j.cantos[o.tipo]})` : ''));
        A.sfx.recoger(); voz('poder', `¡${nombre}!`);
        estallar(new V3(o.p.x, 0.3, o.p.z), ICONOS[o.tipo][1], 40);
        quitarPoder(o);
        stats.poderesRecogidos++;
        log(`${j.nombre} recogió ${o.tipo} (${antes} -> ${j.cantos[o.tipo]})`);
        N.actualizarHUD();
      }
    }
  });
};
function pasoPoderes(dt){
  enCancha.forEach(o => {
    o.t += dt;
    o.icono.position.y = 0.32 + Math.sin(o.t * 3) * 0.06;
    o.aro.scale.setScalar(1 + Math.sin(o.t * 4) * 0.12);
    o.aro.material.opacity = 0.55 + Math.sin(o.t * 4) * 0.3;
  });
}

// ---------------------------------------------------------------------
// Emoción: narrador, música y sonido de rodar
// ---------------------------------------------------------------------
function voz(clave, texto){ stats.voces++; A.voz(clave, texto); }
// Boloncho: la bola crece con un "boing" y un destello; al romper una barrera salen astillas
N.ganchos.alBoloncho = d => {
  const p = d.bola.p.clone();
  estallar(new V3(p.x, 0.3, p.z), 0xff3b2f, 45);
  if (window.ChirasGraficos){ window.ChirasGraficos.onda(p, 0xff3b2f, 2.5); window.ChirasGraficos.destello(p, 0xff3b2f, 1); }
  A.sfx.superpotencia(); sacudida = Math.max(sacudida, 0.12);
  stats.bolonchos = (stats.bolonchos || 0) + 1; log('boloncho de ' + d.nombre);
};
N.ganchos.alRomperBarrera = p => {
  for (let i = 0; i < 40; i++){ const th = Math.random() * Math.PI * 2, ve = 1.5 + Math.random() * 3; emitir(p.clone(), new V3(Math.cos(th) * ve, 1 + Math.random() * 3, Math.sin(th) * ve), 0.8 + Math.random() * 0.5, i % 2 ? 0x8a5a2b : 0xc89a5a, false); }
  if (window.ChirasGraficos) window.ChirasGraficos.onda(p, 0xc89a5a, 2);
  A.sfx.barreraRota(); A.sfx.aplastar(); sacudida = Math.max(sacudida, 0.25);
  try { navigator.vibrate && navigator.vibrate(80); } catch (e) {}
  stats.barrerasRotas = (stats.barrerasRotas || 0) + 1; log('barrera rota');
};
// Estallido JUSTO en el impacto: cuando el que tiene el poder le pega a otra bola.
// Solo es el efecto: la eliminación la sigue decidiendo el juego al final del tiro, como siempre.
// Si al final se salva (por ejemplo, Ochera muere), la bola vuelve a aparecer.
N.ganchos.alImpacto = (s, v, f, p) => {
  const grandeV = N.esBatalla() && (v.tragadas || []).length > 0;
  if (N.getFase() !== 'juego' || !s.poder || !v.vivo || v === s || grandeV) {
    // pipe sin poder: chispas y golpe seco en el momento
    for (let i = 0; i < 18; i++){ const th = Math.random() * Math.PI * 2, ve = 1 + Math.random() * 2.5; emitir(new V3(p.x, R, p.z), new V3(Math.cos(th) * ve, 0.8 + Math.random() * 2, Math.sin(th) * ve), 0.5, i % 2 ? 0xffffff : 0xffe08a, false); }
    sacudida = Math.max(sacudida, Math.min(0.2, 0.05 + f * 0.02));
    return;
  }
  v._estallo = true;
  v.bola.mesh.visible = false; if (v.bola.anillo) v.bola.anillo.visible = false;
  if (N.esBatalla()){
    // batalla: no revienta, SE LA TRAGA (la bola se encoge y entra en la del que tiene el poder)
    const copia = v.bola.mesh.clone(); copia.visible = true; scene.add(copia);
    tragandoFx.push({m: copia, a: s, t: 0, desde: v.bola.mesh.position.clone()});
    A.sfx.devorar(); voz('tragar', '¡Ñam! ¡Se la tragó!');
    stats.tragadas = (stats.tragadas || 0) + 1; log(`se la tragó: ${s.nombre} → ${v.nombre}`);
    return;
  }
  estallar(new V3(p.x, R, p.z), v.color, 130);
  if (window.ChirasGraficos) window.ChirasGraficos.explosionVistosa(p, v.color, 1.3);
  A.sfx.explosion(); A.sfx.estallido(); sacudida = Math.max(sacudida, 0.32);
  try { navigator.vibrate && navigator.vibrate([90, 30, 60]); } catch (e) {}
  stats.estallidosImpacto = (stats.estallidosImpacto || 0) + 1;
  log(`estallido en el impacto: ${s.nombre} → ${v.nombre}`);
};
// ---- Batalla a la loca: tragar, cohete, reventar y canicas sin vida ----
const tragandoFx = [];
const texLlama = new THREE.MeshBasicMaterial({color: 0xffa21f, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false});
const coheteM = (() => {
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.3, 12), new THREE.MeshStandardMaterial({color: 0xf2f2f2, metalness: .4, roughness: .3}));
  const punta = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.13, 12), new THREE.MeshStandardMaterial({color: 0xd7263d})); punta.position.y = 0.215;
  g.add(cuerpo, punta);
  for (let i = 0; i < 3; i++){ const a = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.07), new THREE.MeshStandardMaterial({color: 0xd7263d})); const th = i / 3 * Math.PI * 2; a.position.set(Math.cos(th) * 0.07, -0.12, Math.sin(th) * 0.07); a.rotation.y = -th; g.add(a); }
  const llama = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 10), texLlama); llama.rotation.x = Math.PI; llama.position.y = -0.26; g.add(llama); g.userData.llama = llama;
  g.visible = false; scene.add(g); return g;
})();
N.ganchos.alCohete = j => { coheteM.children[1].material.color.set(j.color); A.sfx.turbo(); voz('cohete', '¡Modo cohete!'); sacudida = Math.max(sacudida, 0.15); log('cohete de ' + j.nombre); stats.cohetes = (stats.cohetes || 0) + 1; };
N.ganchos.alCoheteFin = (j, motivo) => { coheteM.visible = false; if (motivo !== 'acerto'){ A.sfx.negado(); stats.cohetesFallidos = (stats.cohetesFallidos || 0) + 1; log('cohete falló: ' + motivo); } };
N.ganchos.alReventar = (obj, j, pos, n) => {
  estallar(new V3(pos.x, R, pos.z), obj.color, 160);
  if (window.ChirasGraficos){ window.ChirasGraficos.explosionVistosa(pos, 0xff9d2e, 2); window.ChirasGraficos.onda(pos, 0xffd84a, 6); }
  A.sfx.explosion(); A.sfx.trueno(); sacudida = Math.max(sacudida, 0.4);
  try { navigator.vibrate && navigator.vibrate([120, 40, 120]); } catch (e) {}
  voz('reventado', '¡Reventado!');
  if (window.ChirasEmociones) window.ChirasEmociones.registrarEliminacion(j.nombre, obj.nombre, pos, obj.color);
  stats.reventadas = (stats.reventadas || 0) + 1; log(`${j.nombre} reventó a ${obj.nombre} (${n} canicas sin vida)`);
};
N.ganchos.alDepredador = n => { voz('depredador', '¡Modo depredador!'); A.sfx.epico(); log('modo depredador'); };
N.ganchos.alAbsorber = (j, p) => { A.sfx.devorar(); estallar(new V3(p.x, R, p.z), 0xffffff, 25); stats.absorbidas = (stats.absorbidas || 0) + 1; log(j.nombre + ' absorbió una canica sin vida'); };
function pasoBatallaFx(dt){
  const c = N.getCohete();
  if (c){
    const b = c.j.bola, esc = Math.max(1, camera.position.distanceTo(b.p) / 6);
    coheteM.visible = true; coheteM.position.copy(b.p);
    coheteM.quaternion.setFromUnitVectors(new V3(0, 1, 0), c.dir.clone().setY(0.15).normalize());
    coheteM.scale.setScalar(Math.min(2.2, esc)); coheteM.userData.llama.scale.set(1, 0.8 + Math.random() * 0.6, 1);
    emitir(b.p.clone().addScaledVector(c.dir, -0.25), new V3(-c.dir.x * 2 + (Math.random() - .5), 0.4, -c.dir.z * 2 + (Math.random() - .5)), 0.4, null, true);
  } else coheteM.visible = false;
  for (let i = tragandoFx.length - 1; i >= 0; i--){
    const x = tragandoFx[i]; x.t += dt; const k = Math.min(1, x.t / 0.45);
    x.m.position.lerpVectors(x.desde, x.a.bola.mesh.position, k); x.m.scale.setScalar(1 - k * 0.9);
    if (k >= 1){ scene.remove(x.m); tragandoFx.splice(i, 1); }
  }
}
// La Revancha: efectos al volver (fuego, onda, destello, sonido y narrador)
N.ganchos.alRevancha = j => {
  const p = j.bola.p.clone();
  for (let i = 0; i < 70; i++){ const th = Math.random() * Math.PI * 2, ve = 1 + Math.random() * 3.5; emitir(new V3(p.x, 0.1, p.z), new V3(Math.cos(th) * ve * 0.4, 1 + Math.random() * 4, Math.sin(th) * ve * 0.4), 0.6 + Math.random() * 0.7, null, true); }
  estallar(new V3(p.x, 0.3, p.z), j.color, 60);
  if (window.ChirasGraficos){ window.ChirasGraficos.onda(p, 0xff7b2e, 4); window.ChirasGraficos.onda(p, 0xffd84a, 2.5); window.ChirasGraficos.destello(p, 0xff7b2e, 1.6); }
  A.sfx.epico(); A.sfx.transformacion(); sacudida = Math.max(sacudida, 0.2);
  setTimeout(() => voz('revancha', '¡La revancha! ¡Vuelve a la partida!'), 600);
  stats.revanchas = (stats.revanchas || 0) + 1;
  log('revancha de ' + j.nombre);
};
// la máquina eliminada a veces pide revancha (una vez por ronda y apostando su canica más barata)
function pensarRevanchaIA(v){
  if (!v.ia || v.revanchaIA || Math.random() > 0.35) return;
  v.revanchaIA = true;
  setTimeout(() => {
    if (!N.puedeRevancha(v)) return;
    const barata = v.bolsa.slice().sort((a, b) => N.ESTILO_DE(a).valor - N.ESTILO_DE(b).valor)[0];
    N.revancha(v, barata);
  }, 2500 + Math.random() * 2000);
}
N.ganchos.alResolver = e => {
  const s = e.tirador;
  // si una bola estalló en el impacto pero al final se salvó (Ochera / Carambola muere), vuelve a aparecer
  (e.victimas || []).forEach(v => {
    if (v._estallo && v.vivo){
      v._estallo = false; v.bola.mesh.visible = true;
      estallar(v.bola.p.clone().setY(R), 0xffffff, 40);
      setTimeout(() => N.aviso(`¡${v.nombre} se salvó!`), 300);
    }
  });
  (e.victimas || []).filter(v => !v.vivo).forEach(pensarRevanchaIA);
  if (e.castigo && !s.vivo) pensarRevanchaIA(s);
  if (e.castigo){ voz('canto', /Ochera/.test((e.msgs || []).join(' ')) ? '¡Ochera muere!' : '¡Carambola muere!'); sacudida = 0.25; estallar(s.bola.p.clone().setY(R), N.COLORES[0], 90); }
  else if (e.cazo){
    if (N.esBatalla()) A.sfx.devorar(); else { voz('eliminacion'); A.sfx.explosion(); } sacudida = 0.3;
    e.victimas.filter(v => !v.vivo && !v._estallo).forEach(v => estallar(v.bola.p.clone().setY(R), v.color, 110));
  }
  else if (e.robo){ voz('quitar', '¡Le quitó el poder!'); A.sfx.quitar(); sacudida = 0.15; }
  else if (e.victimas.length){ voz('pipe', '¡Pipe! ¡Vuelve a tirar!'); sacudida = 0.1; }
  if (e.encholo && !e.castigo){
    A.sfx.epico();
    setTimeout(() => { voz('me_enchole'); A.sfx.transformacion(); }, e.victimas.length ? 1300 : 0);
    estallar(new V3(HOLE.x, 0.15, HOLE.z), 0xffd84a, 80);
  }
  // cada pipe hace aparecer poderes en la cancha
  if (e.victimas.length && !e.castigo) aparecerPoderes(e.victimas[0].bola.activa ? e.victimas[0].bola.p : s.bola.p);
};
N.ganchos.alTerminar = g => {
  A.sfx.victoria(); voz('victoria'); A.celebrar();
  setTimeout(() => voz('rey', g && g.humano ? '¡Eres el rey de las chiras!' : `¡${g ? g.nombre : 'Nadie'} es el rey de las chiras!`), 1300);
};
N.ganchos.alIniciarRonda = () => {
  N.getJugadores().forEach(j => { j.revanchaIA = false; j.revanchas = 0; });
  limpiarPoderes(); tiro = null; sacudida = 0; golpeFov = 0;
  N.initAudio(); A.iniciarMusica(); A.ponerIntensidad(0);
};
N.ganchos.alSalir = () => {
  embudo.visible = false; avisoV.hidden = true;
  iconosNada.forEach(x => { x.visible = false; });
  limpiarPoderes(); tiro = null; sacudida = 0; golpeFov = 0; brillo.visible = false;
  camera.fov = 55; camera.updateProjectionMatrix();
  A.rodar(0); A.pararRodar(); A.pararMusica();
};
const texNada = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,40,70,.92)'; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 12; g.beginPath(); g.arc(64, 64, 40, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(36, 36); g.lineTo(92, 92); g.stroke();
  return new THREE.CanvasTexture(c);
})();
const iconosNada = [];
function pasoNada(t){
  const anulados = N.getJugadores().filter(j => j.nada && j.vivo && j.bola.activa);
  while (iconosNada.length < anulados.length){ const s = new THREE.Sprite(new THREE.SpriteMaterial({map: texNada, transparent: true, depthWrite: false})); scene.add(s); iconosNada.push(s); }
  iconosNada.forEach((s, k) => {
    const j = anulados[k]; s.visible = !!j; if (!j) return;
    s.position.set(j.bola.p.x, j.bola.p.y + 0.45, j.bola.p.z); s.scale.setScalar(0.3 * (1 + Math.sin(t * 10) * 0.08));
  });
}
let tNada = 0;
// ---------- Viento / Tornado: efectos ----------
const cssV = document.createElement('style');
cssV.textContent = `.viento-aviso{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 120px);transform:translateX(-50%);background:rgba(20,30,50,.8);border:2px solid #bfe3ff;border-radius:12px;padding:4px 14px;font-family:var(--display);font-size:18px;color:#eaf6ff;z-index:6;pointer-events:none;display:flex;align-items:center;gap:8px}
.viento-aviso b{display:inline-block;font-size:24px;transition:transform .2s}`;
document.head.appendChild(cssV);
const avisoV = document.createElement('div'); avisoV.className = 'viento-aviso'; avisoV.hidden = true; avisoV.setAttribute('role', 'status');
avisoV.innerHTML = '🌪️ ¡VIENTO! <b>➜</b>'; document.body.appendChild(avisoV);
const texEmbudo = (() => {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
  for (let i = 0; i < 14; i++){ g.strokeStyle = `rgba(230,240,255,${0.15 + Math.random() * 0.35})`; g.lineWidth = 2 + Math.random() * 3; g.beginPath(); const y = Math.random() * 128; g.moveTo(0, y); g.bezierCurveTo(20, y - 20, 44, y + 20, 64, y - 6); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
})();
const embudo = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.12, 2.6, 24, 1, true),
  new THREE.MeshBasicMaterial({map: texEmbudo, color: 0xdfeaf5, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false}));
embudo.visible = false; scene.add(embudo);
let vientoSonido = 0, vientoT = 0;
N.ganchos.alViento = () => { A.sfx.viento(); vientoSonido = 1.6; sacudida = Math.max(sacudida, 0.08); log('viento activado'); };
function pasoViento(dt){
  const v = N.getViento && N.getViento();
  if (!v || !v.activo){ embudo.visible = false; avisoV.hidden = true; return; }
  vientoT += dt;
  const t = N.getTirador(), b = t ? t.bola : null; if (!b) return;
  // remolino que acompaña la bola por el lado de donde viene el viento
  embudo.visible = true;
  embudo.position.set(b.p.x - v.dir.x * 2.2, 1.3, b.p.z - v.dir.z * 2.2);
  embudo.rotation.y += dt * 9; texEmbudo.offset.y -= dt * 0.8;
  embudo.material.opacity = 0.45 + Math.sin(vientoT * 6) * 0.1;
  // rachas de viento y polvo alrededor de la bola
  for (let i = 0; i < 5; i++){
    const p = new V3(b.p.x + (Math.random() - .5) * 6 - v.dir.x * 3, 0.15 + Math.random() * 1.4, b.p.z + (Math.random() - .5) * 6 - v.dir.z * 3);
    emitir(p, new V3(v.dir.x * (7 + Math.random() * 4), 0.6, v.dir.z * (7 + Math.random() * 4)), 0.5 + Math.random() * 0.3, i % 2 ? 0xeaf6ff : 0xbfd8ee, false);
  }
  if (Math.random() < 0.5) emitir(new V3(b.p.x + (Math.random() - .5) * 2, 0.05, b.p.z + (Math.random() - .5) * 2), new V3(v.dir.x * 3, 1 + Math.random(), v.dir.z * 3), 0.7, 0xb08a64, false);
  sacudida = Math.max(sacudida, 0.025);
  // ruido de viento continuo
  vientoSonido -= dt; if (vientoSonido <= 0){ A.sfx.viento(); vientoSonido = 1.6; }
  // flecha con la dirección del viento (vista desde la cámara)
  const f = new V3(); camera.getWorldDirection(f); f.y = 0; f.normalize();
  const der = new V3(-f.z, 0, f.x);
  const x = v.dir.x * der.x + v.dir.z * der.z, y = v.dir.x * f.x + v.dir.z * f.z;
  avisoV.lastElementChild.style.transform = `rotate(${Math.atan2(-y, x)}rad)`;
  avisoV.hidden = false;
}
N.ganchos.alArena = (desde, destino) => {
  estallar(new V3(desde.x, 0.15, desde.z), 0xc9a07a, 60);
  setTimeout(() => estallar(new V3(destino.x, 0.3, destino.z), 0xc9a07a, 60), 150);
  sacudida = 0.2;
  log(`arena movediza: de (${desde.x.toFixed(1)}, ${desde.z.toFixed(1)}) a (${destino.x.toFixed(1)}, ${destino.z.toFixed(1)})`);
};
N.ganchos.cuadroClasico = dt => {
  pasoTiro(dt); pasoParticulas(dt); pasoPoderes(dt); pasoCamara(dt);
  tNada += dt; pasoNada(tNada); pasoViento(dt); pasoBatallaFx(dt);
  const est = N.getEstado(), tir = N.getTirador(), js = N.getJugadores();
  // música más intensa cuando alguien tiene el poder, y más cuando el que tiene el poder va a tirar
  let n = js.some(j => j.vivo && j.poder) ? 1 : 0;
  if (tir && tir.poder && (est === 'apuntar' || est === 'rodando')) n = 2;
  // batalla final: empezaron más de dos y ya solo quedan dos
  if (js.length > 2 && js.filter(j => j.vivo).length === 2) n = 3;
  A.ponerIntensidad(n);
  let rueda = 0;
  if (est === 'rodando' || est === 'libre') js.forEach(j => { const b = j.bola; if (j.vivo && b.activa && !b.enMano && b.p.y <= R + 0.01) rueda += Math.hypot(b.v.x, b.v.z); });
  A.rodar(rueda);
};
// si arranca una batalla, no dejar nada del clásico en la cancha
if (window.ChirasBatalla) window.ChirasBatalla.on('inicio', () => { iconosNada.forEach(x => { x.visible = false; }); limpiarPoderes(); tiro = null; brillo.visible = false; sacudida = 0; golpeFov = 0; camera.fov = 55; camera.updateProjectionMatrix(); });

window.ChirasClasicoExtra = {CFG, stats, enCancha: () => enCancha, aparecerPoderes, limpiarPoderes, sacudir: v => { sacudida = Math.max(sacudida, v); }};
})();
