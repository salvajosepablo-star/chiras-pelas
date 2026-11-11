// =====================================================================
// CHIRAS PELAS — Progreso: ligas, trofeos, canicas legendarias y
// Academia de puntería. Todo se guarda en este celular (localStorage).
// Las canicas legendarias se ven distintas pero tienen la misma física:
// no dan ventaja de precisión.
// =====================================================================
(function(){
const N = window.ChirasNucleo, B = window.ChirasBatalla, P = window.ChirasPoderes, A = window.ChirasAudio, S = window.ChirasEspectaculo;
if (!N || !B || !P || !A){ console.error('Progreso: faltan módulos'); return; }
const {THREE, scene, R, HOLE} = N;
const V3 = THREE.Vector3;
const $ = s => document.querySelector(s);
const log = t => { if (N.MODO_PRUEBA) console.log('[prog] ' + t); };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// ---------------------------------------------------------------------
// Datos guardados
// ---------------------------------------------------------------------
const CLAVE = 'chiras-progreso';
let datos = {jugadores: {}, coleccion: []};
try { const d = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (d && d.jugadores) datos = Object.assign({coleccion: []}, d); } catch (e) {}
if (location.hash.startsWith('#prueba')) datos = {jugadores: {}, coleccion: []};   // las pruebas no tocan lo guardado
function guardar(){ if (location.hash.startsWith('#prueba')) return; try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {} }
function perfil(nombre){
  return datos.jugadores[nombre] = datos.jugadores[nombre] || {victorias: 0, partidas: 0, maestros: 0, trofeos: [], academia: {}};
}

// ---------------------------------------------------------------------
// Ligas
// ---------------------------------------------------------------------
const NIVELES = [
  {id: 'novato',  nombre: 'Novato',            min: 0,  ia: 1.00, reaccion: 1.0},
  {id: 'experto', nombre: 'Experto',           min: 3,  ia: 0.85, reaccion: 0.9},
  {id: 'maestro', nombre: 'Maestro',           min: 8,  ia: 0.70, reaccion: 0.8},
  {id: 'leyenda', nombre: 'Leyenda',           min: 15, ia: 0.55, reaccion: 0.7},
  {id: 'rey',     nombre: 'Rey de las Chiras', min: 25, ia: 0.45, reaccion: 0.6}
];
const nivelDe = p => NIVELES.filter(n => p.victorias >= n.min).pop();
const siguiente = p => NIVELES.find(n => n.min > p.victorias) || null;
const IA_BASE = Object.assign({}, P.CONFIG.ia);
function dificultadPara(nombre){
  const n = nivelDe(perfil(nombre));
  const ia = P.CONFIG.ia;
  ia.errorAng = IA_BASE.errorAng * n.ia; ia.errorVel = IA_BASE.errorVel * n.ia;
  ia.reaccionMin = IA_BASE.reaccionMin * n.reaccion; ia.reaccionMax = IA_BASE.reaccionMax * n.reaccion;
  return n;
}
function dificultadNormal(){ Object.assign(P.CONFIG.ia, IA_BASE); }

// ---------------------------------------------------------------------
// Trofeos
// ---------------------------------------------------------------------
const TROFEOS = {
  primera:  {nombre: 'Primera victoria', icono: '🥇'},
  maestro:  {nombre: 'Tiro maestro', icono: '🎯'},
  barrera:  {nombre: 'Barrera de acero', icono: '🛡️'},
  salvado:  {nombre: 'Salvado por Nochera', icono: '🕳️'},
  graduado: {nombre: 'Graduado de la academia', icono: '🎓'},
  pulso:    {nombre: 'Pulso perfecto', icono: '✨'},
  rey:      {nombre: 'Rey de las Chiras', icono: '👑'}
};
let nuevosTrofeos = [];
function darTrofeo(nombre, id){
  const p = perfil(nombre);
  if (p.trofeos.includes(id)) return false;
  p.trofeos.push(id); nuevosTrofeos.push({nombre, id});
  log(`trofeo ${id} para ${nombre}`);
  guardar(); return true;
}

// ---------------------------------------------------------------------
// Canicas legendarias
// ---------------------------------------------------------------------
const LEGENDARIAS = [
  {id: 'sol',      nombre: 'Sol Dorado',        requisito: 'Llegar a Experto',              colores: ['#fff3a0', '#ffb300', '#ff6d00']},
  {id: 'dragon',   nombre: 'Dragón de Fuego',   requisito: 'Llegar a Maestro',              colores: ['#ffd27a', '#ff3d00', '#5a0000']},
  {id: 'agujero',  nombre: 'Agujero Negro',     requisito: 'Llegar a Leyenda',              colores: ['#ff9e3d', '#7a2cff', '#000000']},
  {id: 'diamante', nombre: 'Diamante Cósmico',  requisito: 'Rey de las Chiras o Pulso perfecto en la academia', colores: ['#ffffff', '#9fe8ff', '#b28cff']}
];
const desbloqueada = id => datos.coleccion.includes(id);
function desbloquear(id){
  if (desbloqueada(id)) return false;
  datos.coleccion.push(id); guardar();
  log('canica legendaria desbloqueada: ' + id);
  return true;
}
function texCanvas(w, h, draw){
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
const cacheTex = {};
function textura(id){
  if (cacheTex[id]) return cacheTex[id];
  return cacheTex[id] = texCanvas(256, 128, (g, w, h) => {
    if (id === 'sol'){
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(.5, '#ffb300'); gr.addColorStop(1, '#ff8f00');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++){ g.strokeStyle = `rgba(255,${120 + Math.random() * 100},0,.7)`; g.lineWidth = 2 + Math.random() * 4; g.beginPath(); const x = Math.random() * w; g.moveTo(x, 0); g.bezierCurveTo(x + 30, h * .3, x - 30, h * .7, x + 10, h); g.stroke(); }
    } else if (id === 'dragon'){
      g.fillStyle = '#7a0b00'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 10) for (let x = (y / 10 % 2) * 8; x < w; x += 16){
        g.fillStyle = `hsl(${10 + Math.random() * 25},100%,${35 + Math.random() * 25}%)`;
        g.beginPath(); g.arc(x, y, 7, 0, Math.PI); g.fill();
      }
      g.strokeStyle = 'rgba(255,220,120,.8)'; g.lineWidth = 3;
      for (let i = 0; i < 6; i++){ g.beginPath(); g.moveTo(0, Math.random() * h); for (let x = 0; x < w; x += 16) g.lineTo(x, h / 2 + Math.sin(x * .05 + i) * h * .4); g.stroke(); }
    } else if (id === 'agujero'){
      g.fillStyle = '#020004'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++){ g.fillStyle = `rgba(${150 + Math.random() * 100},${120 + Math.random() * 100},255,${Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    } else {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e9fbff'); gr.addColorStop(.5, '#b9a6ff'); gr.addColorStop(1, '#8ff0ff');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
  });
}
const texBrillo = texCanvas(64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});
const animadas = new Set();
const geoBola = new THREE.SphereGeometry(R, 28, 20);
// Las piezas de efecto van en un grupo "nivelado" que no gira con la canica al rodar.
function crearLegendaria(id){
  const g = new THREE.Group(), niv = new THREE.Group(); g.add(niv);
  const brillo = (color, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: texBrillo, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})); sp.scale.setScalar(s); niv.add(sp); return sp; };
  let animar = () => {};
  if (id === 'sol'){
    const m = new THREE.Mesh(geoBola, new THREE.MeshStandardMaterial({map: textura('sol'), emissive: 0xff9800, emissiveIntensity: .55, metalness: .5, roughness: .3}));
    m.castShadow = true; g.add(m);
    const h = brillo(0xffc400, R * 5);
    animar = (dt, t) => { h.scale.setScalar(R * (4.5 + Math.sin(t * 3) * 0.8)); h.material.opacity = 0.7 + Math.sin(t * 5) * 0.2; };
  } else if (id === 'dragon'){
    const m = new THREE.Mesh(geoBola, new THREE.MeshStandardMaterial({map: textura('dragon'), emissive: 0xff2a00, emissiveIntensity: .45, roughness: .35, metalness: .3}));
    m.castShadow = true; g.add(m);
    const n = 18, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), fase = [];
    for (let i = 0; i < n; i++) fase.push(Math.random());
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const brasas = new THREE.Points(geo, new THREE.PointsMaterial({color: 0xff8a1c, size: 0.035, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
    brasas.frustumCulled = false; niv.add(brasas);
    const h = brillo(0xff3d00, R * 3.5);
    animar = (dt, t) => {
      for (let i = 0; i < n; i++){ const k = (fase[i] + t * 0.6) % 1, a = fase[i] * 40 + t; pos[i*3] = Math.cos(a) * R * (1.1 - k * .5); pos[i*3+1] = R * 0.6 + k * R * 3; pos[i*3+2] = Math.sin(a) * R * (1.1 - k * .5); }
      geo.attributes.position.needsUpdate = true;
      h.material.opacity = 0.55 + Math.random() * 0.25;
    };
  } else if (id === 'agujero'){
    const m = new THREE.Mesh(geoBola, new THREE.MeshStandardMaterial({map: textura('agujero'), color: 0x222222, metalness: 1, roughness: .08}));
    m.castShadow = true; g.add(m);
    const anillo = new THREE.Mesh(new THREE.RingGeometry(R * 1.2, R * 2.1, 48), new THREE.MeshBasicMaterial({
      map: texCanvas(128, 8, (gg, w) => { const gr = gg.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#ffb347'); gr.addColorStop(.5, '#ff3d7f'); gr.addColorStop(1, '#6a2cff'); gg.fillStyle = gr; gg.fillRect(0, 0, w, 8); }),
      transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending}));
    anillo.rotation.x = -Math.PI / 2 + 0.35; niv.add(anillo);
    const h = brillo(0x7a2cff, R * 4);
    animar = (dt, t) => { anillo.rotation.z += dt * 2.5; h.material.opacity = 0.5 + Math.sin(t * 2) * 0.2; };
  } else {
    const nucleo = new THREE.Mesh(new THREE.OctahedronGeometry(R * 0.62, 0), new THREE.MeshStandardMaterial({color: 0x9fe8ff, emissive: 0x6a3cff, emissiveIntensity: .5, metalness: .9, roughness: .05, flatShading: true}));
    g.add(nucleo);
    const vidrio = new THREE.Mesh(geoBola, new THREE.MeshPhysicalMaterial({map: textura('diamante'), color: 0xeefaff, transparent: true, opacity: .45, roughness: 0, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 3, depthWrite: false}));
    vidrio.castShadow = true; vidrio.renderOrder = 2; g.add(vidrio);
    const chispas = [0, 1, 2, 3].map(i => brillo([0xffffff, 0x9fe8ff, 0xd0b0ff, 0xffffff][i], R * 1.2));
    animar = (dt, t) => {
      nucleo.rotation.y += dt * 1.5; nucleo.rotation.x += dt * 0.7;
      chispas.forEach((c, i) => { const a = t * 1.3 + i * 1.6; c.position.set(Math.cos(a) * R * 1.3, Math.sin(t * 2 + i) * R, Math.sin(a) * R * 1.3); c.material.opacity = 0.5 + 0.5 * Math.sin(t * 6 + i * 2); });
    };
  }
  g.userData.animar = (dt, t) => { niv.quaternion.copy(g.quaternion).invert(); animar(dt, t); };
  scene.add(g); animadas.add(g);
  return g;
}
let tAnim = 0;
B.on('cuadro', dt => {
  tAnim += dt;
  animadas.forEach(g => { if (!g.parent){ animadas.delete(g); return; } g.userData.animar(dt, tAnim); });
});
const cacheIcono = {};
function iconoLegendaria(id){
  if (cacheIcono[id]) return cacheIcono[id];
  const L = LEGENDARIAS.find(l => l.id === id);
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(24, 22, 2, 32, 32, 30);
  gr.addColorStop(0, L.colores[0]); gr.addColorStop(.55, L.colores[1]); gr.addColorStop(1, L.colores[2]);
  g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(23, 20, 8, 5, -0.6, 0, Math.PI * 2); g.fill();
  return cacheIcono[id] = c.toDataURL();
}

// ---------------------------------------------------------------------
// Interfaz: selector de canicas, trofeos y ligas, academia
// ---------------------------------------------------------------------
const css = document.createElement('style');
css.textContent = `
.prog-btn{font-family:var(--display);font-size:18px;padding:10px;border-radius:14px;border:2px solid var(--amarillo);background:transparent;color:var(--amarillo)}
.prog-jug{background:var(--tierra-2);border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}
.prog-jug b{font-family:var(--display);font-weight:400;font-size:20px}
.prog-nivel{display:inline-block;background:var(--amarillo);color:var(--tierra);border-radius:8px;padding:1px 8px;font-family:var(--display);font-size:14px;margin-left:6px}
.prog-barra{height:8px;border-radius:4px;background:rgba(247,234,208,.15);overflow:hidden}
.prog-barra div{height:100%;background:linear-gradient(90deg,var(--amarillo),var(--rojo))}
.prog-trofeos{display:flex;flex-wrap:wrap;gap:6px;font-size:13px}
.prog-trofeos span{background:rgba(247,234,208,.12);border-radius:8px;padding:2px 8px}
.prog-col{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.prog-col div{display:grid;grid-template-columns:44px 1fr;gap:8px;align-items:center;background:var(--tierra-2);border-radius:12px;padding:8px;font-size:13px}
.prog-col img{width:44px;height:44px}
.prog-col .no img{filter:grayscale(1) brightness(.35)}
.prog-col small{display:block;opacity:.75;font-size:11px}
.aca-lista{display:flex;flex-direction:column;gap:8px}
.aca-lista button{display:flex;justify-content:space-between;gap:10px;align-items:center;text-align:left;background:var(--tierra-2);color:var(--crema);border:2px solid rgba(247,234,208,.25);border-radius:14px;padding:10px 12px;font-family:var(--body);font-size:15px}
.aca-lista .est{font-size:18px;letter-spacing:2px;color:var(--amarillo);white-space:nowrap}
.aca-hud{position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 40px);background:rgba(20,12,6,.8);border:2px solid var(--amarillo);border-radius:12px;padding:5px 12px;font-family:var(--display);font-size:15px;z-index:5;pointer-events:none;text-align:center;max-width:92vw}
.aca-hud small{display:block;font-family:var(--body);font-size:12px;opacity:.85}
.estrellas{font-size:44px;letter-spacing:6px;color:var(--amarillo);text-align:center}
`;
document.head.appendChild(css);
const capas = document.createElement('div');
capas.innerHTML = `
<div class="capa" id="progCapa" hidden><div class="tarjeta">
  <h1 class="chico">Trofeos y ligas</h1>
  <p class="sub">Novato → Experto (3 victorias) → Maestro (8) → Leyenda (15) → Rey de las Chiras (25). Contra la máquina, mientras más alto el nivel, mejor juega ella.</p>
  <div id="progJugadores" class="grupo"></div>
  <h2>Canicas legendarias</h2>
  <p class="nota">Se ven distintas, pero ruedan igual que las demás: no dan ventaja.</p>
  <div class="prog-col" id="progCol"></div>
  <button class="jugar" id="progCerrar" type="button">Volver</button>
</div></div>
<div class="capa" id="acaCapa" hidden><div class="tarjeta">
  <h1 class="chico">Academia de puntería</h1>
  <p class="sub" id="acaAlumno"></p>
  <div class="aca-lista" id="acaLista"></div>
  <button class="jugar" id="acaVolver" type="button" style="background:var(--azul);box-shadow:0 5px 0 #0d2f6b">Menú</button>
</div></div>
<div class="capa" id="acaRes" hidden><div class="tarjeta">
  <h1 class="chico" id="acaResTit"></h1>
  <div class="estrellas" id="acaResEst"></div>
  <p class="sub" id="acaResTxt"></p>
  <button class="jugar" id="acaRepetir" type="button">Repetir reto</button>
  <button class="jugar" id="acaOtros" type="button" style="background:var(--azul);box-shadow:0 5px 0 #0d2f6b">Otros retos</button>
</div></div>
<div class="aca-hud" id="acaHud" hidden></div>`;
while (capas.firstElementChild) document.body.appendChild(capas.firstElementChild);

// botón de trofeos en el menú
const btnTrofeos = document.createElement('button');
btnTrofeos.type = 'button'; btnTrofeos.className = 'prog-btn'; btnTrofeos.textContent = '🏆 Trofeos, ligas y canicas legendarias';
$('#modos').insertAdjacentElement('afterend', btnTrofeos);
btnTrofeos.addEventListener('click', mostrarTrofeos);
$('#progCerrar').addEventListener('click', () => { $('#progCapa').hidden = true; });

function mostrarTrofeos(){
  const cont = $('#progJugadores'); cont.innerHTML = '';
  const nombres = Object.keys(datos.jugadores);
  if (!nombres.length) cont.innerHTML = '<p class="nota">Todavía no hay partidas. Gane batallas para subir de nivel.</p>';
  nombres.forEach(nm => {
    const p = perfil(nm), n = nivelDe(p), sig = siguiente(p);
    const pct = sig ? Math.round((p.victorias - n.min) / (sig.min - n.min) * 100) : 100;
    const d = document.createElement('div'); d.className = 'prog-jug';
    d.innerHTML = `<div><b>${esc(nm)}</b><span class="prog-nivel">${n.nombre}</span></div>
      <div class="nota" style="opacity:.9">${p.victorias} victorias de ${p.partidas} partidas · ${p.maestros} tiros maestros${sig ? ` · faltan ${sig.min - p.victorias} para ${sig.nombre}` : ' · nivel máximo'}</div>
      <div class="prog-barra"><div style="width:${pct}%"></div></div>
      <div class="prog-trofeos">${p.trofeos.map(t => `<span>${TROFEOS[t].icono} ${TROFEOS[t].nombre}</span>`).join('') || '<span>Sin trofeos todavía</span>'}</div>`;
    cont.appendChild(d);
  });
  const col = $('#progCol'); col.innerHTML = '';
  LEGENDARIAS.forEach(L => {
    const d = document.createElement('div'); d.className = desbloqueada(L.id) ? '' : 'no';
    d.innerHTML = `<img alt="" src="${iconoLegendaria(L.id)}"><span><b>${L.nombre}</b><small>${desbloqueada(L.id) ? 'Desbloqueada' : '🔒 ' + L.requisito}</small></span>`;
    col.appendChild(d);
  });
  $('#progCapa').hidden = false;
}

// selectores de canica legendaria en el menú de batalla
function pintarSelectores(){
  const cont = $('#btCanicas'); if (!cont) return;
  const tiene = datos.coleccion.length > 0;
  const opciones = '<option value="">Canica al azar</option>' + LEGENDARIAS.filter(L => desbloqueada(L.id)).map(L => `<option value="${L.id}">${L.nombre} (legendaria)</option>`).join('');
  const viejo = [$('#btCan1') && $('#btCan1').value, $('#btCan2') && $('#btCan2').value];
  cont.innerHTML = tiene
    ? `<label><i style="background:#d7263d"></i><select id="btCan1" aria-label="Canica del jugador 1">${opciones}</select></label>
       <label id="btCanFila2"><i style="background:#1f6fd1"></i><select id="btCan2" aria-label="Canica del jugador 2">${opciones}</select></label>`
    : '<p class="nota">Gane batallas para desbloquear canicas legendarias.</p>';
  if (tiene){
    if (viejo[0]) $('#btCan1').value = viejo[0]; if (viejo[1]) $('#btCan2').value = viejo[1];
    $('#btCanFila2').hidden = !!($('#btFila2') && $('#btFila2').hidden);
    cont.querySelectorAll('select').forEach(s => Object.assign(s.style, {font: 'inherit', fontSize: '16px', padding: '9px 10px', borderRadius: '12px', border: '2px solid rgba(247,234,208,.3)', background: 'var(--tierra-2)', color: 'var(--crema)', width: '100%'}));
  }
}
pintarSelectores();
$('#btContra').addEventListener('click', () => setTimeout(pintarSelectores, 0));
function canicasElegidas(o){
  const v = [$('#btCan1') ? $('#btCan1').value : '', $('#btCan2') && !(o && o.contraIA) ? $('#btCan2').value : ''];
  return v.map(id => (id && desbloqueada(id)) ? () => crearLegendaria(id) : null);
}

// ---------------------------------------------------------------------
// Escuchar la batalla: dificultad por liga, victorias, trofeos
// ---------------------------------------------------------------------
let partidaHumanos = [], contandoPartida = false;
B.on('inicio', () => {
  const o = B.opciones(), js = B.jugadores();
  contandoPartida = !o.ambosIA && !o.blanco && !o.solo && !academiaIniciando;
  partidaHumanos = contandoPartida ? js.filter(j => !j.ia).map(j => j.nombre) : [];
  if (o.contraIA && contandoPartida){ const n = dificultadPara(partidaHumanos[0]); log(`máquina en nivel ${n.nombre}`); }
  else dificultadNormal();
  nuevosTrofeos = [];
  const extra = $('#btFinProg'); if (extra) extra.remove();
});
B.on('barrera-aguanto', e => { if (partidaHumanos.includes(e.defensor)) darTrofeo(e.defensor, 'barrera'); });
B.on('nochera-muere', e => (e.salvados || []).forEach(n => { if (partidaHumanos.includes(n)) darTrofeo(n, 'salvado'); }));
if (S) S.on('maestro', e => {
  if (!partidaHumanos.includes(e.jugador)) return;
  perfil(e.jugador).maestros++; darTrofeo(e.jugador, 'maestro'); guardar();
});
B.on('fin', e => {
  if (!contandoPartida) return;
  const lineas = [];
  let subio = false;
  partidaHumanos.forEach(nm => {
    const p = perfil(nm), antes = nivelDe(p);
    p.partidas++;
    if (e.ganador === nm){ p.victorias++; darTrofeo(nm, 'primera'); }
    const ahora = nivelDe(p);
    if (ahora.id !== antes.id){
      subio = true;
      lineas.push(`⬆️ ${nm} subió a ${ahora.nombre}`);
      const leg = {experto: 'sol', maestro: 'dragon', leyenda: 'agujero', rey: 'diamante'}[ahora.id];
      if (leg && desbloquear(leg)) lineas.push(`🔓 Canica legendaria: ${LEGENDARIAS.find(L => L.id === leg).nombre}`);
      if (ahora.id === 'rey') darTrofeo(nm, 'rey');
    }
    const sig = siguiente(p);
    lineas.push(`${nm}: ${ahora.nombre} · ${p.victorias} victorias${sig ? ` (faltan ${sig.min - p.victorias} para ${sig.nombre})` : ''}`);
  });
  nuevosTrofeos.forEach(t => lineas.push(`🏆 ${t.nombre}: ${TROFEOS[t.id].nombre}`));
  guardar();
  const tarjeta = $('#btFin .tarjeta');
  const p = document.createElement('div'); p.id = 'btFinProg'; p.className = 'nota'; p.style.cssText = 'opacity:1;font-size:14px;line-height:1.5';
  lineas.forEach(l => { const d = document.createElement('div'); d.textContent = l; p.appendChild(d); });
  tarjeta.insertBefore(p, $('#btRevancha'));
  if (subio){ setTimeout(() => { A.sfx.nivel(); A.voz('subio'); }, 2600); }
  pintarSelectores();
  log('fin: ' + lineas.join(' | '));
});

// ---------------------------------------------------------------------
// Academia de puntería
// ---------------------------------------------------------------------
const RETOS = [
  {id: 'r5',     nombre: 'Enchole a 5 m',                       tipo: 'hueco', desde: {x: 0, z: -15}, intentos: 5},
  {id: 'r12',    nombre: 'Enchole a 12 m',                      tipo: 'hueco', desde: {x: 4, z: -8.7}, intentos: 5},
  {id: 'r20',    nombre: 'Enchole desde la raya (20 m)',        tipo: 'hueco', desde: {x: 0, z: 0.35, enMano: true}, intentos: 5},
  {id: 'blanco', nombre: 'Péguele a la canica blanco (8 m)',    tipo: 'golpe', desde: {x: -2, z: -6}, blanco: {x: 3, z: -12.2}, intentos: 5},
  {id: 'exacto', nombre: 'Potencia exacta: pare la bola en el círculo (15 m)', tipo: 'zona', desde: {x: -8, z: -30}, zona: {x: -8, z: -45, r: 1.2}, intentos: 5}
];
let reto = null, st = null, academiaIniciando = false;
const alumno = () => ($('#btNom1').value || '').trim() || 'Jugador 1';
const estrellasTxt = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const zonaMalla = new THREE.Group();
(() => {
  const aro = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 48), new THREE.MeshBasicMaterial({color: 0xffe14a, transparent: true, opacity: .9}));
  const centro = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({color: 0xffe14a, transparent: true, opacity: .18, depthWrite: false}));
  [aro, centro].forEach(m => { m.rotation.x = -Math.PI / 2; zonaMalla.add(m); });
  zonaMalla.visible = false; scene.add(zonaMalla);
})();

function abrir(){
  limpiarAcademia();
  $('#menu').hidden = true; $('#acaRes').hidden = true;
  const p = perfil(alumno());
  $('#acaAlumno').textContent = `Alumno: ${alumno()} (se cambia en el nombre del jugador 1 de Batalla)`;
  const lista = $('#acaLista'); lista.innerHTML = '';
  RETOS.forEach(r => {
    const b = document.createElement('button'); b.type = 'button';
    b.innerHTML = `<span>${esc(r.nombre)}<br><small style="opacity:.75">${r.intentos} intentos</small></span><span class="est">${estrellasTxt(p.academia[r.id] || 0)}</span>`;
    b.addEventListener('click', () => { N.initAudio(); empezar(r); });
    lista.appendChild(b);
  });
  $('#acaCapa').hidden = false;
}
function empezar(r){
  $('#acaCapa').hidden = true; $('#acaRes').hidden = true;
  reto = r; st = {intento: 0, exito: false, enTiro: false, resetEn: 0, terminarEn: 0};
  academiaIniciando = true;
  B.iniciar({
    solo: r.tipo !== 'golpe', blanco: r.tipo === 'golpe', contraIA: r.tipo === 'golpe',
    sinPoderes: true, sinCuenta: true, nombres: [alumno()],
    inicio: [r.desde, r.blanco || null],
    puntosCamara: r.zona ? [new V3(r.zona.x, 0, r.zona.z)] : r.tipo === 'golpe' ? [] : [HOLE]
  });
  academiaIniciando = false;
  if (r.zona){ zonaMalla.position.set(r.zona.x, 0.012, r.zona.z); zonaMalla.scale.setScalar(r.zona.r); zonaMalla.visible = true; }
  pintarHud();
  $('#acaHud').hidden = false;
  log('reto ' + r.id);
}
function pintarHud(){
  if (!reto) return;
  $('#acaHud').innerHTML = `${esc(reto.nombre)}<small>Intento ${Math.min(st.intento + (st.enTiro ? 0 : 1), reto.intentos)} de ${reto.intentos}</small>`;
}
const yo = () => B.jugadores()[0];
B.on('tiro', e => { if (reto && e.jugador === yo().nombre){ st.intento++; st.enTiro = true; pintarHud(); } });
B.on('hueco', e => { if (reto && reto.tipo === 'hueco' && st.enTiro && e.jugador === yo().nombre) st.exito = true; });
B.on('choque', e => {
  if (!reto || reto.tipo !== 'golpe' || !st.enTiro) return;
  const j = yo();
  if ((e.a === j && e.activoA) || (e.b === j && e.activoB)) st.exito = true;
});
B.on('tiro-fin', e => {
  if (!reto || e.jugador !== yo().nombre || !st.enTiro) return;
  st.enTiro = false;
  if (reto.tipo === 'zona' && Math.hypot(e.x - reto.zona.x, e.z - reto.zona.z) <= reto.zona.r) st.exito = true;
  if (st.exito){ st.terminarEn = 1.2; B.flash('¡LO LOGRÓ!', `Intento ${st.intento}`, 0x20a65a); A.sfx.maestro(); }
  else if (st.intento >= reto.intentos){ st.terminarEn = 1.2; B.flash('SE ACABARON LOS INTENTOS', '', 0xd7263d); A.sfx.negado(); }
  else { st.resetEn = 1.0; B.flash('¡OTRA VEZ!', `Le quedan ${reto.intentos - st.intento} intentos`, 0xf2b705); }
});
B.on('cuadro', dt => {
  if (!reto) return;
  if (st.resetEn > 0){
    st.resetEn -= dt;
    if (st.resetEn <= 0){
      const js = B.jugadores();
      js[0].verdad = false; B.colocar(js[0], reto.desde);
      if (reto.blanco && js[1]) B.colocar(js[1], reto.blanco);
      pintarHud();
    }
  }
  if (st.terminarEn > 0){ st.terminarEn -= dt; if (st.terminarEn <= 0) terminarReto(); }
});
function terminarReto(){
  const r = reto, exito = st.exito, n = st.intento;
  const estrellas = !exito ? 0 : n <= 1 ? 3 : n <= 3 ? 2 : 1;
  const nm = alumno(), p = perfil(nm);
  const mejor = Math.max(p.academia[r.id] || 0, estrellas);
  p.academia[r.id] = mejor;
  const extra = [];
  if (RETOS.every(x => (p.academia[x.id] || 0) >= 1) && darTrofeo(nm, 'graduado')) extra.push('🎓 Trofeo: Graduado de la academia');
  if (RETOS.every(x => (p.academia[x.id] || 0) >= 3)){
    if (darTrofeo(nm, 'pulso')) extra.push('✨ Trofeo: Pulso perfecto');
    if (desbloquear('diamante')) extra.push('🔓 Canica legendaria: Diamante Cósmico');
  }
  guardar();
  log(`reto ${r.id}: ${exito ? 'logrado' : 'no logrado'} en ${n} intentos, ${estrellas} estrellas`);
  limpiarAcademia();
  B.salir();
  $('#menu').hidden = true;
  $('#acaResTit').textContent = exito ? '¡Reto logrado!' : 'Casi…';
  $('#acaResEst').textContent = estrellasTxt(estrellas);
  $('#acaResTxt').textContent = (exito ? `Lo logró en el intento ${n}. ` : 'Siga practicando: el pulso se gana tirando. ') + `Su mejor marca: ${estrellasTxt(mejor)}` + (extra.length ? '\n' + extra.join('\n') : '');
  $('#acaResTxt').style.whiteSpace = 'pre-line';
  $('#acaRes').hidden = false;
  $('#acaRepetir').onclick = () => empezar(r);
  if (estrellas === 3) A.sfx.victoria();
  pintarSelectores();
}
function limpiarAcademia(){ reto = null; st = null; zonaMalla.visible = false; $('#acaHud').hidden = true; }
$('#acaOtros').addEventListener('click', abrir);
$('#acaVolver').addEventListener('click', () => { $('#acaCapa').hidden = true; N.verMenu(); });
$('#btSalir').addEventListener('click', limpiarAcademia);

window.ChirasProgreso = {datos: () => datos, perfil, NIVELES, nivelDe, TROFEOS, LEGENDARIAS, crearLegendaria, desbloquear, canicasElegidas, dificultadPara};
window.ChirasAcademia = {abrir, empezar, RETOS, reto: () => reto, estado: () => st};
})();
