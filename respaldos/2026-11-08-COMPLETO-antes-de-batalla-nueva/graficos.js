// =====================================================================
// CHIRAS PELAS — Mejoras gráficas (solo apariencia)
// No cambia reglas, física, turnos, poderes, controles ni modos.
// Los mapas y objetos quedan en el mismo lugar: solo se ven mejor.
//  - Iluminación de atardecer cinematográfica, cielo con degradado, colores vivos
//  - Texturas nuevas de tierra (con relieve) y pasto; hueco con profundidad
//  - Matas de pasto alrededor de la cancha (un solo dibujo para todas)
//  - Reflejos más ricos en las canicas
//  - Polvo de arena cuando ruedan las bolas; ondas y destellos en explosiones y poderes
//  - Calidad automática: si el celular va lento, baja la resolución y las sombras
// =====================================================================
(function(){
const N = window.ChirasNucleo;
if (!N){ console.error('Gráficos: falta el núcleo'); return; }
const {THREE, scene, camera, renderer, sol} = N;
const V3 = THREE.Vector3;
const esMovil = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || Math.min(innerWidth, innerHeight) < 600;

// ---------- Render: tono de cine y colores vivos ----------
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, esMovil ? 1.75 : 2));

// ---------- Cielo con degradado (no se mueve nada de lugar) ----------
const HORIZONTE = 0xd9ecf5;
const texCielo = (() => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#2f78d6'); gr.addColorStop(.35, '#69aee9'); gr.addColorStop(.47, '#bfe0f4'); gr.addColorStop(.5, '#f6e7c8'); gr.addColorStop(.53, '#d9ecf5'); gr.addColorStop(1, '#d9ecf5');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
})();
const cielo = new THREE.Mesh(new THREE.SphereGeometry(430, 32, 16), new THREE.MeshBasicMaterial({map: texCielo, side: THREE.BackSide, fog: false, depthWrite: false}));
cielo.position.set(0, 0, -40); cielo.renderOrder = -10; scene.add(cielo);
scene.background = new THREE.Color(HORIZONTE);
scene.fog = new THREE.Fog(HORIZONTE, 50, 240);

// ---------- Luces de atardecer ----------
let hemi = null; scene.traverse(o => { if (o.isHemisphereLight) hemi = o; });
if (hemi){ hemi.color.set(0xd6ecff); hemi.groundColor.set(0x6b4a2e); hemi.intensity = 0.72; }
sol.color.set(0xffdcae); sol.intensity = 1.35;
sol.shadow.mapSize.set(esMovil ? 1024 : 2048, esMovil ? 1024 : 2048);
if (sol.shadow.map){ sol.shadow.map.dispose(); sol.shadow.map = null; }
Object.assign(sol.shadow.camera, {left: -7, right: 7, top: 7, bottom: -7}); sol.shadow.camera.updateProjectionMatrix();
const relleno = new THREE.DirectionalLight(0x9cc8ff, 0.28); relleno.position.set(-8, 6, -10); scene.add(relleno);   // luz fría de contraluz

// ---------- Texturas nuevas ----------
function canvasTex(w, h, dibujar, rx, ry){
  const c = document.createElement('canvas'); c.width = w; c.height = h; dibujar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t;
}
let semilla = 11; const rnd = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
const piedras = Array.from({length: 120}, () => ({x: rnd(), y: rnd(), r: 1 + rnd() * 4.5, a: rnd() * 3, l: 50 + rnd() * 30}));
const tierraColor = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#a8703f'; g.fillRect(0, 0, w, h);
  // manchas grandes (tierra más clara y más oscura)
  for (let i = 0; i < 70; i++){ const x = rnd() * w, y = rnd() * h, r = 20 + rnd() * 70; const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const claro = rnd() < .5; gr.addColorStop(0, claro ? 'rgba(214,170,120,.35)' : 'rgba(120,80,50,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  // granos de arena
  for (let i = 0; i < 9000; i++){ const l = 34 + rnd() * 36; g.fillStyle = `hsla(${22 + rnd() * 14},${45 + rnd() * 25}%,${l}%,${.25 + rnd() * .5})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 1.5, 1 + rnd() * 1.5); }
  // grietitas
  g.strokeStyle = 'rgba(80,52,32,.35)'; g.lineWidth = 1;
  for (let i = 0; i < 26; i++){ let x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++){ x += (rnd() - .5) * 26; y += (rnd() - .5) * 26; g.lineTo(x, y); } g.stroke(); }
  // piedritas con luz y sombra
  piedras.forEach(p => { const x = p.x * w, y = p.y * h;
    g.fillStyle = 'rgba(60,40,25,.45)'; g.beginPath(); g.ellipse(x + 1.2, y + 1.2, p.r, p.r * .75, p.a, 0, 7); g.fill();
    g.fillStyle = `hsl(30,14%,${p.l}%)`; g.beginPath(); g.ellipse(x, y, p.r, p.r * .75, p.a, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(x - p.r * .3, y - p.r * .3, p.r * .35, p.r * .22, p.a, 0, 7); g.fill(); });
}, 18, 34);
const tierraRelieve = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6000; i++){ const v = 100 + rnd() * 60 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  piedras.forEach(p => { const x = p.x * w, y = p.y * h; g.fillStyle = '#e0e0e0'; g.beginPath(); g.ellipse(x, y, p.r, p.r * .75, p.a, 0, 7); g.fill(); });
}, 18, 34);
tierraColor.encoding = THREE.sRGBEncoding;
const pastoColor = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#4f8f2f'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 50; i++){ const x = rnd() * w, y = rnd() * h, r = 30 + rnd() * 80; const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rnd() < .5 ? 'rgba(140,200,70,.3)' : 'rgba(40,90,30,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let i = 0; i < 7000; i++){ g.strokeStyle = `hsla(${80 + rnd() * 35},${45 + rnd() * 30}%,${22 + rnd() * 34}%,.7)`; const x = rnd() * w, y = rnd() * h;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 3, y - 3 - rnd() * 5); g.stroke(); }
}, 110, 110);
pastoColor.encoding = THREE.sRGBEncoding;
if (N.cancha) N.cancha.material = new THREE.MeshStandardMaterial({map: tierraColor, bumpMap: tierraRelieve, bumpScale: 0.035, roughness: 0.96, metalness: 0});
if (N.pasto) N.pasto.material = new THREE.MeshStandardMaterial({map: pastoColor, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4});
// el hueco con profundidad: más oscuro al centro y una orilla de tierra húmeda
if (N.hueco){
  const t = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#000'); gr.addColorStop(.7, '#120a05'); gr.addColorStop(1, '#3a2414'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }, 1, 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; N.hueco.material = new THREE.MeshBasicMaterial({map: t});
}
if (N.borde) N.borde.material = new THREE.MeshStandardMaterial({color: 0x4a2f1a, roughness: 0.85});

// ---------- Matas de pasto alrededor de la cancha (fuera de la tierra) ----------
let matas = null;
(() => {
  const n = esMovil ? 900 : 1800, C = N.CANCHA;
  const geo = new THREE.ConeGeometry(0.06, 0.38, 4); geo.translate(0, 0.19, 0);
  matas = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({color: 0xffffff}), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), p = new V3(), col = new THREE.Color();
  for (let i = 0; i < n; i++){
    // franja de pasto alrededor de la cancha de tierra
    let x, z;
    do { x = (rnd() * 2 - 1) * (C.x + 18); z = C.zMin - 14 + rnd() * (C.zMax - C.zMin + 28); } while (Math.abs(x) < C.x + 0.6 && z < C.zMax + 0.6 && z > C.zMin - 0.6);
    p.set(x, 0, z); q.setFromEuler(new THREE.Euler((rnd() - .5) * .5, rnd() * 6.3, (rnd() - .5) * .5)); s.setScalar(0.6 + rnd() * 0.9);
    m.compose(p, q, s); matas.setMatrixAt(i, m);
    col.setHSL(0.23 + rnd() * 0.08, 0.55 + rnd() * 0.2, 0.25 + rnd() * 0.18); matas.setColorAt(i, col);
  }
  matas.instanceMatrix.needsUpdate = true; if (matas.instanceColor) matas.instanceColor.needsUpdate = true;
  scene.add(matas);
})();

// ---------- Reflejos más ricos para las canicas ----------
(() => {
  const es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({map: texCielo, side: THREE.BackSide})));
  const suelo = new THREE.Mesh(new THREE.CircleGeometry(49, 24), new THREE.MeshBasicMaterial({color: 0x8a6440})); suelo.rotation.x = -Math.PI / 2; suelo.position.y = -2; es.add(suelo);
  const sunM = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 8), new THREE.MeshBasicMaterial({color: 0xfff1d0})); sunM.position.set(25, 22, 10); es.add(sunM);
  const ventana = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), new THREE.MeshBasicMaterial({color: 0xffffff})); ventana.position.set(-20, 18, -25); ventana.lookAt(0, 0, 0); es.add(ventana);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(es, 0.015).texture;
})();

// ---------- Partículas: polvo de arena, ondas y destellos ----------
const texSuave = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }, 1, 1);
const NP = esMovil ? 260 : 420;
const geoP = new THREE.BufferGeometry(), posP = new Float32Array(NP * 3), colP = new Float32Array(NP * 3);
geoP.setAttribute('position', new THREE.BufferAttribute(posP, 3)); geoP.setAttribute('color', new THREE.BufferAttribute(colP, 3));
const polvoMalla = new THREE.Points(geoP, new THREE.PointsMaterial({size: 0.12, map: texSuave, vertexColors: true, transparent: true, depthWrite: false}));
polvoMalla.frustumCulled = false; scene.add(polvoMalla);
const parts = Array.from({length: NP}, () => ({vida: 0, dur: 1, v: new V3(), c: new THREE.Color()}));
for (let i = 0; i < NP; i++) posP[i * 3 + 1] = -50;
let sig = 0;
function polvo(p, v, color, dur){
  const k = sig; sig = (sig + 1) % NP; const q = parts[k];
  q.vida = q.dur = dur || 0.9; q.v.copy(v); q.c.set(color || 0xc49a6c);
  posP[k*3] = p.x; posP[k*3+1] = p.y; posP[k*3+2] = p.z;
}
const ondas = Array.from({length: 4}, () => {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 48), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending}));
  m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); return {m, t: 0, dur: 0.7, tam: 3};
});
const luz = new THREE.PointLight(0xffb347, 0, 12, 2); scene.add(luz); let luzT = 0;
function onda(p, color, tam){
  const o = ondas.reduce((a, b) => (a.t >= a.dur ? a : b.t >= b.dur ? b : (a.t > b.t ? a : b)));
  o.t = 0; o.tam = tam || 3; o.m.position.set(p.x, 0.03, p.z); o.m.material.color.set(color || 0xffffff); o.m.visible = true;
}
function destello(p, color, fuerza){
  luz.position.set(p.x, 1.2, p.z); luz.color.set(color || 0xffb347); luz.intensity = (fuerza || 1) * 4; luzT = 0.35;
}
function explosionVistosa(p, color, tam){
  onda(p, color, (tam || 1) * 3.2); onda(p, 0xffffff, (tam || 1) * 1.8); destello(p, color, 1.4);
  for (let i = 0; i < 26; i++){ const th = Math.random() * Math.PI * 2, ve = 1 + Math.random() * 3;
    polvo(new V3(p.x, 0.1, p.z), new V3(Math.cos(th) * ve, 0.4 + Math.random() * 1.2, Math.sin(th) * ve), 0xc49a6c, 1 + Math.random() * 0.6); }
}

// ---------- Qué bolas hay en pantalla (en cualquier modo) para echar polvo ----------
function bolasEnJuego(){
  const e = N.getEstado(), L = [];
  if (e === 'supervivencia' && window.ChirasSupervivencia){
    window.ChirasSupervivencia.jugadores().forEach(j => { if (j.vivo) L.push({x: j.p.x, z: j.p.z, y: 0, vx: j.v.x, vz: j.v.z, r: j.r}); });
  } else if (e === 'batalla' && window.ChirasBatalla){
    window.ChirasBatalla.jugadores().forEach(j => { const b = j.bola; if (j.vivo && b.activa && !b.enMano && !b.enHueco) L.push({x: b.p.x, z: b.p.z, y: b.p.y, vx: b.v.x, vz: b.v.z, r: N.R}); });
  } else if (e !== 'menu'){
    (N.getJugadores() || []).forEach(j => { const b = j.bola; if (j.vivo && b.activa && !b.enMano && !b.enHueco) L.push({x: b.p.x, z: b.p.z, y: b.p.y, vx: b.v.x, vz: b.v.z, r: N.R}); });
  }
  return L;
}

// ---------- Avisos de explosiones y poderes (solo para dibujar) ----------
const B = window.ChirasBatalla;
if (B){
  B.on('eliminado', e => { const j = B.jugadores().find(x => x.nombre === e.jugador); if (j) explosionVistosa(j.bola.p, j.color, 1.2); });
  B.on('poder', e => { const j = B.jugadores().find(x => x.nombre === e.jugador); const p = window.ChirasPoderes && window.ChirasPoderes.porId(e.poder); if (j){ onda(j.bola.p, p ? p.color : 0xffffff, 2.2); destello(j.bola.p, p ? p.color : 0xffffff, 0.8); } });
  B.on('verdad', e => { const j = B.jugadores().find(x => x.nombre === e.jugador); if (j){ onda(N.HOLE, 0xffd84a, 4); destello(N.HOLE, 0xffd84a, 1.6); } });
  B.on('barrera-aguanto', e => { const j = B.jugadores().find(x => x.nombre === e.defensor); if (j){ onda(j.bola.p, 0x9fe8ff, 2); destello(j.bola.p, 0x9fe8ff, 1); } });
}
// clásico: se encadena con lo que ya hacía clasico-extra.js
const antesResolver = N.ganchos.alResolver;
N.ganchos.alResolver = e => {
  if (antesResolver) antesResolver(e);
  (e.victimas || []).filter(v => !v.vivo && !v._estallo).forEach(v => explosionVistosa(v.bola.p, v.color, 1.2));   // las que estallaron en el impacto ya tuvieron su explosión
  if (e.castigo && !e.tirador.vivo) explosionVistosa(e.tirador.bola.p, 0xff3355, 1.2);
  if (e.encholo){ onda(N.HOLE, 0xffd84a, 4); destello(N.HOLE, 0xffd84a, 1.4); }
  if (e.victimas && e.victimas.length) destello(e.victimas[0].bola.p, 0xffffff, 0.6);
};
const antesTiro = N.ganchos.alTiro;
N.ganchos.alTiro = (b, f, t) => { if (antesTiro) antesTiro(b, f, t); destello(b.p, 0xffa040, 0.4 + f); };
const antesArena = N.ganchos.alArena;
N.ganchos.alArena = (d, h, x) => { if (antesArena) antesArena(d, h, x); onda(d, 0xc9a07a, 2.5); onda(h, 0xc9a07a, 2.5); };
// supervivencia: mira su registro para saber cuándo hubo algo
let svVisto = 0;
function revisarSupervivencia(){
  const S = window.ChirasSupervivencia; if (!S || N.getEstado() !== 'supervivencia') { svVisto = 0; return; }
  const reg = S.registro(); if (reg.length < svVisto) svVisto = 0;
  for (; svVisto < reg.length; svVisto++){
    const e = reg[svVisto], js = S.jugadores();
    const j = js.find(x => x.nombre === (e.jugador || e.victima || e.pierde));
    if (!j) continue;
    if (e.tipo === 'eliminado') explosionVistosa(j.p, j.color, Math.max(1, j.r / 0.2));
    if (e.tipo === 'poder'){ onda(j.p, 0xffd84a, 3); destello(j.p, 0xffd84a, 1.4); }
  }
}

// ---------- Cuadro a cuadro (aparte del juego: solo dibujo) ----------
let antes = performance.now(), muestras = [], calidadBaja = false;
function cuadro(ahora){
  const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora;
  // polvo de arena: las bolas que ruedan levantan polvo (más mientras más rápido)
  bolasEnJuego().forEach(b => {
    const v = Math.hypot(b.vx, b.vz);
    if (v < 0.6 || b.y > b.r + 0.05) return;
    if (Math.random() < Math.min(0.9, v * 0.12)){
      const s = Math.max(1, b.r / 0.15);
      polvo(new V3(b.x - b.vx * 0.02, 0.04, b.z - b.vz * 0.02), new V3(-b.vx * 0.12 + (Math.random() - .5) * .5, 0.3 + Math.random() * 0.5, -b.vz * 0.12 + (Math.random() - .5) * .5), Math.random() < .5 ? 0xc49a6c : 0xd8b48a, 0.6 + Math.random() * 0.5 * s);
    }
  });
  revisarSupervivencia();
  for (let i = 0; i < NP; i++){
    const q = parts[i];
    if (q.vida <= 0){ colP[i*3] = colP[i*3+1] = colP[i*3+2] = 0; posP[i*3+1] = -50; continue; }
    q.vida -= dt; const k = Math.max(0, q.vida / q.dur);
    q.v.y -= 1.2 * dt; q.v.multiplyScalar(1 - dt * 1.5);
    posP[i*3] += q.v.x * dt; posP[i*3+1] = Math.max(0.02, posP[i*3+1] + q.v.y * dt); posP[i*3+2] += q.v.z * dt;
    const a = Math.sin(k * Math.PI) * 0.8;
    colP[i*3] = q.c.r * a; colP[i*3+1] = q.c.g * a; colP[i*3+2] = q.c.b * a;
  }
  geoP.attributes.position.needsUpdate = geoP.attributes.color.needsUpdate = true;
  polvoMalla.material.size = 0.12 * Math.max(1, camera.position.y / 8);
  ondas.forEach(o => { if (!o.m.visible) return; o.t += dt; const k = o.t / o.dur; o.m.scale.setScalar(0.2 + k * o.tam); o.m.material.opacity = 0.9 * (1 - k); if (k >= 1) o.m.visible = false; });
  if (luzT > 0){ luzT -= dt; luz.intensity *= Math.exp(-dt * 9); if (luzT <= 0) luz.intensity = 0; }
  // calidad automática: si en juego va a menos de ~40 cuadros por segundo, baja la resolución
  if (!calidadBaja && N.getEstado() !== 'menu' && !N.MODO_PRUEBA){
    muestras.push(dt); if (muestras.length > 150){
      const prom = muestras.reduce((a, b) => a + b, 0) / muestras.length; muestras = [];
      if (prom > 1 / 40){
        calidadBaja = true;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
        sol.shadow.mapSize.set(1024, 1024); if (sol.shadow.map){ sol.shadow.map.dispose(); sol.shadow.map = null; }
        if (matas) matas.visible = false;
        console.log('[gráficos] calidad automática: modo rápido');
      }
    }
  }
  siguiente();
}
// en el modo de prueba se usa un reloj normal (como el resto del juego) para no frenar las pruebas
const siguiente = () => N.MODO_PRUEBA ? setTimeout(() => cuadro(performance.now()), 50) : requestAnimationFrame(cuadro);
siguiente();
window.ChirasGraficos = {onda, destello, explosionVistosa, polvo, esMovil, calidadBaja: () => calidadBaja};
})();
