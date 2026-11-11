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
N.ganchos.alResolver = e => {
  const s = e.tirador;
  if (e.castigo){ voz('canto', /Ochera/.test((e.msgs || []).join(' ')) ? '¡Ochera muere!' : '¡Carambola muere!'); sacudida = 0.25; estallar(s.bola.p.clone().setY(R), N.COLORES[0], 90); }
  else if (e.cazo){
    voz('eliminacion'); A.sfx.explosion(); sacudida = 0.3;
    e.victimas.filter(v => !v.vivo).forEach(v => estallar(v.bola.p.clone().setY(R), v.color, 110));
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
  limpiarPoderes(); tiro = null; sacudida = 0; golpeFov = 0;
  N.initAudio(); A.iniciarMusica(); A.ponerIntensidad(0);
};
N.ganchos.alSalir = () => {
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
N.ganchos.alArena = (desde, destino) => {
  estallar(new V3(desde.x, 0.15, desde.z), 0xc9a07a, 60);
  setTimeout(() => estallar(new V3(destino.x, 0.3, destino.z), 0xc9a07a, 60), 150);
  sacudida = 0.2;
  log(`arena movediza: de (${desde.x.toFixed(1)}, ${desde.z.toFixed(1)}) a (${destino.x.toFixed(1)}, ${destino.z.toFixed(1)})`);
};
N.ganchos.cuadroClasico = dt => {
  pasoTiro(dt); pasoParticulas(dt); pasoPoderes(dt); pasoCamara(dt);
  tNada += dt; pasoNada(tNada);
  const est = N.getEstado(), tir = N.getTirador(), js = N.getJugadores();
  // música más intensa cuando alguien tiene el poder, y más cuando el que tiene el poder va a tirar
  let n = js.some(j => j.vivo && j.poder) ? 1 : 0;
  if (tir && tir.poder && (est === 'apuntar' || est === 'rodando')) n = 2;
  // batalla final: empezaron más de dos y ya solo quedan dos
  if (js.length > 2 && js.filter(j => j.vivo).length === 2) n = 3;
  A.ponerIntensidad(n);
  let rueda = 0;
  if (est === 'rodando') js.forEach(j => { const b = j.bola; if (j.vivo && b.activa && !b.enMano && b.p.y <= R + 0.01) rueda += Math.hypot(b.v.x, b.v.z); });
  A.rodar(rueda);
};
// si arranca una batalla, no dejar nada del clásico en la cancha
if (window.ChirasBatalla) window.ChirasBatalla.on('inicio', () => { iconosNada.forEach(x => { x.visible = false; }); limpiarPoderes(); tiro = null; brillo.visible = false; sacudida = 0; golpeFov = 0; camera.fov = 55; camera.updateProjectionMatrix(); });

window.ChirasClasicoExtra = {CFG, stats, enCancha: () => enCancha, aparecerPoderes, limpiarPoderes};
})();
