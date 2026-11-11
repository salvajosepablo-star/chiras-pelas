// =====================================================================
// CHIRAS PELAS — Narrador con personalidad (Modo Clásico)
// Pícaro, divertido y emocionante. Solo comenta: no cambia nada del juego.
// Reconoce: tiros espectaculares y errores, quién va ganando o perdiendo,
// remontadas, venganzas, poderes, rivalidades de la partida, victorias
// inesperadas y momentos decisivos. Muestra subtítulos además de la voz.
// =====================================================================
(function(){
const N = window.ChirasNucleo, A = window.ChirasAudio;
if (!N || !A){ console.error('Narrador: faltan módulos'); return; }
const {HOLE, R} = N;
const $ = s => document.querySelector(s);
const log = t => { if (N.MODO_PRUEBA) console.log('[narrador] ' + t); };
const stats = {comentarios: 0, porTipo: {}};

// ---------------------------------------------------------------------
// Frases ({n} = jugador, {o} = otro jugador, {k} = número)
// ---------------------------------------------------------------------
const FRASES = {
  porUnPelo: ['¡Uy, por un pelito! {n} la peinó.', '¡Ay, mi madre! Pasó rozando.', '¡Le faltó un tris a {n}!', '¡Por un pelito de rana calva!', '¡Casi, casi! La canica le pasó saludando.'],
  seLeFue: ['¡Se le fue la mano a {n}!', '¡{n} tenía todo para cazar y la mandó a pasear!', '¡Uy! Ese tiro todavía va buscando dueño.', '¡Con el poder y sin puntería, {n}!', '¡Tiro para la tribuna!'],
  enLaPuerta: ['¡Se quedó en la puerta del hueco!', '¡Le tocó la puerta al hueco y nadie le abrió!', '¡A un dedo del hueco, qué dolor!'],
  manda: ['{n} llega con {k} canicas: ¡aquí el que manda es {n}!', 'Ojo con {n}, que trae la bolsa llena.', '{n} va de primero con {k} canicas. ¿Quién le gana?'],
  pilas: ['{n} anda con poquitas canicas: ¡pilas que se queda pelado!', '¡{n} está con el agua al cuello!', 'A {n} le quedan {k}… ¡a jugar con el corazón!'],
  poderBarrera: ['¡{n} se atrincheró detrás de su tablita!', '¡Barrera arriba! {n} no se deja.', '¡{n} sacó el escudo!'],
  poderDesquadris: ['¡{n} se hizo a un ladito, qué viveza!', '¡Desquadris! {n} se corrió como gato.', '¡{n} se movió justo a tiempo!'],
  poderOchera: ['¡Ojo! {n} cantó Ochera: el que se meta al hueco, se muere.', '¡Ochera muere! Pilas con ese hueco.', '{n} puso la trampa del hueco.'],
  poderCarambola: ['¡{n} cantó Carambola! Nada de pegarle a dos.', '¡Carambola muere! A tirar con cuidadito.'],
  poderArena: ['¡{n} puso arena movediza! Cuidado dónde pisan.', '¡Remolino de arena! El que entre, se va lejos.', '¡{n} armó su trampa de arena!'],
  poderBoloncho: ['¡{n} sacó el Boloncho! Esa bola parece un melón.', '¡Boloncho! {n} viene a romper barreras.', '¡Qué bolota la de {n}! Quítense del camino.'],
  barreraRota: ['¡CRAC! Se acabó la tablita.', '¡Rompió la barrera como si fuera de papel!', '¡No hubo escudo que aguantara!'],
  poderViento: ['¡Se vino el ventarrón! {n} trajo el tornado.', '¡Qué brisa tan brava! Agárrense la canica.', '¡{n} sopló duro!'],
  poderNada: ['¡{n} dijo Nada de nada y dejó a todos mudos!', '¡Silencio total! {n} anuló los poderes.', '¡Nada de nada! {n} madrugó.'],
  rivalidad: ['Entre {n} y {o} ya hay cuentas pendientes…', '¡Esto entre {n} y {o} ya es personal!', '{n} y {o} no se quieren ver ni en pintura.'],
  decisivo: ['¡Quedan dos! ¡Esto se define aquí!', '¡Mano a mano! Ya no hay para dónde correr.', '¡Momento de la verdad! Solo quedan dos.'],
  ultimoTiro: ['¡Si {n} le pega, se acaba la ronda!', '¡Todo se decide en este tiro de {n}!', '¡Pulso firme, {n}! Este es el tiro.'],
  remontada: ['¡Remontada! {n} venía de último y se lo llevó.', '¡Nadie daba un peso por {n} y mire!', '¡De las cenizas! {n} remontó.'],
  revanchaGloria: ['¡De la revancha a la gloria! {n} volvió y ganó.', '¡{n} volvió del más allá y se llevó todo!'],
  revanchaEntra: ['¡{n} no se rinde! Vuelve con la revancha.', '¡Ahí viene {n} otra vez, con sed de desquite!', '¡{n} apostó otra canica! Esto se pone bueno.'],
  pierdePoder: ['¡{o} le quitó el poder a {n}! Se le acabó la fiesta.', '¡Le bajaron los humos a {n}!'],
  primerPoder: ['¡{n} tiene el poder! Todos a esconderse.', '¡Atención, {n} tiene el poder y viene con hambre!', '¡Pilas que {n} viene con todo!'],
  victoriaNormal: ['¡{n} se llevó la ronda, con toda!', '¡Ganó {n}! Así se juega a las chiras.']
};
const recientes = {};
function frase(tipo, vars){
  const pool = FRASES[tipo]; if (!pool) return '';
  const r = recientes[tipo] = recientes[tipo] || [];
  const libres = pool.filter((_, i) => !r.includes(i));
  const opciones = libres.length ? libres : pool;
  const elegida = opciones[Math.floor(Math.random() * opciones.length)];
  r.push(pool.indexOf(elegida)); if (r.length > Math.min(3, pool.length - 1)) r.shift();
  return elegida.replace(/\{(\w)\}/g, (_, k) => vars && vars[k] !== undefined ? vars[k] : '');
}

// ---------------------------------------------------------------------
// Subtítulos y voz: un comentario a la vez, con pausa (para no hablar encima)
// ---------------------------------------------------------------------
const css = document.createElement('style');
css.textContent = `.narr{position:fixed;left:50%;transform:translateX(-50%) translateY(-6px);top:calc(env(safe-area-inset-top,0px) + 112px);z-index:8;max-width:min(92vw,520px);background:rgba(20,12,6,.86);border:2px solid #ff9d5c;border-radius:14px;padding:6px 12px;font-family:var(--body);font-weight:700;font-size:15px;color:var(--crema);text-align:center;pointer-events:none;opacity:0;transition:opacity .25s,transform .25s}
.narr.ver{opacity:1;transform:translateX(-50%) translateY(0)}
.narr::before{content:'🎙️ ';}`;
document.head.appendChild(css);
const sub = document.createElement('div'); sub.className = 'narr'; sub.setAttribute('role', 'status'); sub.setAttribute('aria-live', 'polite'); document.body.appendChild(sub);
let cola = [], hablando = 0, subT = 0, ultimo = 0;
const PAUSA = 3.2;   // segundos mínimos entre comentarios
function decir(tipo, vars, retraso, prioridad){
  const texto = frase(tipo, vars); if (!texto) return;
  cola.push({tipo, texto, en: (retraso || 0), prioridad: prioridad || 1});
  cola.sort((a, b) => b.prioridad - a.prioridad);
  if (cola.length > 3) cola.length = 3;
}
function pasoCola(dt){
  cola.forEach(c => { c.en -= dt; });
  if (hablando > 0){ hablando -= dt; }
  if (subT > 0){ subT -= dt; if (subT <= 0) sub.classList.remove('ver'); }
  if (hablando > 0) return;
  const i = cola.findIndex(c => c.en <= 0); if (i < 0) return;
  const c = cola.splice(i, 1)[0];
  sub.textContent = c.texto; sub.classList.add('ver'); subT = 3.2; hablando = PAUSA;
  A.voz('narrador', c.texto);
  stats.comentarios++; stats.porTipo[c.tipo] = (stats.porTipo[c.tipo] || 0) + 1;
  log(`${c.tipo}: ${c.texto}`);
}

// ---------------------------------------------------------------------
// Lo que pasa en la partida
// ---------------------------------------------------------------------
const enClasico = () => !['menu', 'batalla', 'supervivencia'].includes(N.getEstado());
let bolsaInicio = {}, revividos = new Set(), conPoderAntes = new Set(), rivalPartida = {}, avisoDecisivo = false, tiro = null;

// inicio de ronda: quién manda y quién está en apuros
const antesRonda = N.ganchos.alIniciarRonda;
N.ganchos.alIniciarRonda = () => {
  if (antesRonda) antesRonda();
  const js = N.getJugadores();
  bolsaInicio = {}; js.forEach(j => { bolsaInicio[j.nombre] = j.bolsa.length; });
  revividos = new Set(); conPoderAntes = new Set(); rivalPartida = {}; avisoDecisivo = false; tiro = null;
  const orden = js.slice().sort((a, b) => b.bolsa.length - a.bolsa.length);
  if (orden.length > 1 && orden[0].bolsa.length > orden[1].bolsa.length) decir('manda', {n: orden[0].nombre, k: orden[0].bolsa.length}, 2.5);
  const ult = orden[orden.length - 1];
  if (ult && ult.bolsa.length <= 3 && ult !== orden[0]) decir('pilas', {n: ult.nombre, k: ult.bolsa.length}, 6);
};

// durante el tiro: qué tan cerca pasó de las otras bolas
const antesTiro = N.ganchos.alTiro;
N.ganchos.alTiro = (b, f, t) => { if (antesTiro) antesTiro(b, f, t); tiro = {quien: t, conPoder: !!(t && t.poder), minDist: 99}; };
const antesSub = N.ganchos.trasSubpaso;
N.ganchos.trasSubpaso = () => {
  if (antesSub) antesSub();
  if (!tiro || !tiro.quien) return;
  const b = tiro.quien.bola;
  N.getJugadores().forEach(o => { if (o !== tiro.quien && o.vivo && o.bola.activa){ const d = N.distH(b.p, o.bola.p) - 2 * R; if (d < tiro.minDist) tiro.minDist = d; } });
};

// resultado de cada tiro
const antesResolver = N.ganchos.alResolver;
N.ganchos.alResolver = e => {
  if (antesResolver) antesResolver(e);
  if (!enClasico()) return;
  const s = e.tirador, vict = e.victimas || [], js = N.getJugadores(), vivos = js.filter(j => j.vivo);
  const t = tiro && tiro.quien === s ? tiro : null; tiro = null;
  // rivalidad que se calienta en la partida
  vict.filter(v => !v.vivo).forEach(v => {
    const k = [s.nombre, v.nombre].sort().join('|'); rivalPartida[k] = (rivalPartida[k] || 0) + 1;
    if (rivalPartida[k] === 2) decir('rivalidad', {n: s.nombre, o: v.nombre}, 3.5, 2);
  });
  if (e.robo){ const quitado = vict.find(v => !v.poder && conPoderAntes.has(v.nombre)); if (quitado) decir('pierdePoder', {n: quitado.nombre, o: s.nombre}, 2.2, 2); }
  // errores y casi-aciertos
  if (!vict.length && !e.encholo && t){
    if (t.minDist < 0.25) decir('porUnPelo', {n: s.nombre}, 1.2, 2);
    else if (t.conPoder) decir('seLeFue', {n: s.nombre}, 1.2, 1);
    else if (N.distH(s.bola.p, HOLE) < 0.6 && s.bola.activa) decir('enLaPuerta', {n: s.nombre}, 1.2, 1);
  }
  // alguien gana el poder
  js.forEach(j => { if (j.vivo && j.poder && !conPoderAntes.has(j.nombre)) decir('primerPoder', {n: j.nombre}, 3, 1); });
  conPoderAntes = new Set(js.filter(j => j.poder).map(j => j.nombre));
  // momento decisivo: quedan dos
  if (!avisoDecisivo && js.length > 2 && vivos.length === 2){ avisoDecisivo = true; decir('decisivo', {}, 2.6, 3); }
};

// antes de cada tiro decisivo: el del poder contra el último rival
setInterval(() => {
  if (!enClasico() || N.getEstado() !== 'apuntar') return;
  const t = N.getTirador(), vivos = N.getJugadores().filter(j => j.vivo);
  if (t && t.poder && vivos.length === 2 && N.getFase() === 'juego' && t._ultimoAviso !== vivos.map(v => v.nombre).join()){
    t._ultimoAviso = vivos.map(v => v.nombre).join();
    decir('ultimoTiro', {n: t.nombre}, 0.3, 2);
  }
}, 500);

// poderes
N.ganchos.alCanto = (d, k) => {
  const tipo = {barrera: 'poderBarrera', desquadris: 'poderDesquadris', ochera: 'poderOchera', carambola: 'poderCarambola', arena: 'poderArena', viento: 'poderViento', boloncho: 'poderBoloncho'}[k];
  if (tipo) decir(tipo, {n: d.nombre}, 1.1, 1);
};
const antesRomper = N.ganchos.alRomperBarrera;
N.ganchos.alRomperBarrera = p => { if (antesRomper) antesRomper(p); decir('barreraRota', {}, 0.6, 2); };
N.ganchos.alNada = por => decir('poderNada', {n: por.nombre}, 1.1, 2);

// revancha
const antesRevancha = N.ganchos.alRevancha;
N.ganchos.alRevancha = j => { if (antesRevancha) antesRevancha(j); revividos.add(j.nombre); decir('revanchaEntra', {n: j.nombre}, 2.2, 2); };

// victoria: remontada, de la revancha a la gloria, o normal
const antesTerminar = N.ganchos.alTerminar;
N.ganchos.alTerminar = g => {
  if (antesTerminar) antesTerminar(g);
  if (!g) return;
  const valores = Object.values(bolsaInicio), minimo = Math.min(...valores);
  if (revividos.has(g.nombre)) decir('revanchaGloria', {n: g.nombre}, 4.5, 3);
  else if (valores.length > 1 && bolsaInicio[g.nombre] === minimo && Math.max(...valores) > minimo) decir('remontada', {n: g.nombre}, 4.5, 3);
  else decir('victoriaNormal', {n: g.nombre}, 4.5, 1);
};
const antesSalir = N.ganchos.alSalir;
N.ganchos.alSalir = () => { if (antesSalir) antesSalir(); cola = []; sub.classList.remove('ver'); };

// reloj propio (solo para los comentarios)
let antes = performance.now();
function cuadro(ahora){
  const dt = Math.min(0.1, (ahora - antes) / 1000); antes = ahora;
  if (enClasico()) pasoCola(dt); else { cola = []; if (subT > 0){ subT = 0; sub.classList.remove('ver'); } }
  if (N.MODO_PRUEBA) setTimeout(() => cuadro(performance.now()), 50); else requestAnimationFrame(cuadro);
}
if (N.MODO_PRUEBA) setTimeout(() => cuadro(performance.now()), 50); else requestAnimationFrame(cuadro);

window.ChirasNarrador = {FRASES, frase, decir, stats, cola: () => cola};
})();
