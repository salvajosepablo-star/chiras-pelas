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
  tragada: ['¡{n} se tragó a {o}! Ya va engordando.', '¡Ñam! {n} se comió a {o}.', '¡{o} desapareció en la panza de {n}!', '¡{n} no deja ni las migas!'],
  aroLuz: ['¡{n} pasó por el aro de luz y quedó cargadito!', '¡Uy! {n} se bañó de luz. ¡Ya tiene el poder!', '¡Brillo, brillo! {n} viene con poder.'],
  carrera: ['¡A la loca! El más rápido tira.', '¡Pilas! El que madrugue, tira.', '¡Aquí no hay turnos, mijo!'],
  depredador: ['¡Modo depredador! Las canicas quedaron sueltas.', '¡Canicas sin dueño! El que tenga el poder, que coma.', '¡A comer! Hay canicas regadas por la cancha.'],
  absorbe: ['¡{n} se tragó una canica suelta!', '¡{n} recoge el botín!', '¡{n} sigue engordando!'],
  gigante: ['¡{n} está gigante! Solo un cohete lo para.', '¡Miren el tamaño de {n}! Eso ya no es una canica, es un balón.'],
  cohete: ['¡{n} se volvió cohete y va por {o}!', '¡Despeguen! El cohete de {n} va directo a {o}.', '¡Cuidado, {o}! Ahí va el cohete de {n}.'],
  coheteFallo: ['¡Desviaron el cohete!', '¡El cohete se fue de paseo!', '¡Uy! Ese cohete se perdió en el espacio.'],
  reventado: ['¡REVENTADO! A {o} se le cayeron todas las canicas.', '¡{n} reventó a {o} y regó canicas por toda la cancha!', '¡Boom! Se acabó el reinado de {o}.'],
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
const BT = window.ChirasBatalla;
const enLoca = () => N.getEstado() === 'batalla' && BT && BT.variante() && BT.variante() === (window.ChirasVariantes || {}).loca;
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
  // batalla: se lo tragó
  if (N.esBatalla()){ const comidos = vict.filter(v => !v.vivo); if (comidos.length) decir((s.tragadas || []).length >= 2 ? 'gigante' : 'tragada', {n: s.nombre, o: comidos[0].nombre}, 1.1, 2); }
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

// batalla a la loca (copia del Clásico): comer, cohete, reventar, depredador
const encadenar = (nombre, fn) => { const antes = N.ganchos[nombre]; N.ganchos[nombre] = (...a) => { if (antes) antes(...a); fn(...a); }; };
encadenar('alCohete', (j, obj) => decir('cohete', {n: j.nombre, o: obj.nombre}, 0.3, 3));
encadenar('alCoheteFin', (j, motivo) => { if (motivo !== 'acerto' && motivo !== 'sin objetivo') decir('coheteFallo', {n: j.nombre}, 0.3, 3); });
encadenar('alReventar', (obj, j) => decir('reventado', {n: j.nombre, o: obj.nombre}, 0.8, 3));
encadenar('alDepredador', () => decir('depredador', {}, 0.2, 3));
encadenar('alAbsorber', j => decir('absorbe', {n: j.nombre}, 0.4, 1));
encadenar('alAroLuz', j => decir('aroLuz', {n: j.nombre}, 0.8, 2));
encadenar('alCarrera', c => { if (Math.random() < 0.35) decir('carrera', {}, 0.2, 1); });
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
  if (enClasico() || enLoca()) pasoCola(dt); else { cola = []; if (subT > 0){ subT = 0; sub.classList.remove('ver'); } }
  if (N.MODO_PRUEBA) setTimeout(() => cuadro(performance.now()), 50); else requestAnimationFrame(cuadro);
}
if (N.MODO_PRUEBA) setTimeout(() => cuadro(performance.now()), 50); else requestAnimationFrame(cuadro);

// ---- Batalla a la loca: el mismo narrador
if (BT){
  let decisivoLoca = false, totalLoca = 0;
  const siLoca = fn => e => { if (enLoca()) fn(e); };
  BT.on('inicio', () => { decisivoLoca = false; totalLoca = BT.jugadores().length; cola = []; });
  BT.on('poder', siLoca(e => {
    const tipo = {barrera: 'poderBarrera', desquadris: 'poderDesquadris', ochera: 'poderOchera', carambola: 'poderCarambola', arena: 'poderArena', viento: 'poderViento', boloncho: 'poderBoloncho', nada: 'poderNada'}[e.poder];
    if (tipo) decir(tipo, {n: e.jugador}, 1.1, e.poder === 'nada' ? 2 : 1);
  }));
  BT.on('verdad', siLoca(e => decir('primerPoder', {n: e.jugador}, 1.5, 1)));
  BT.on('verdad-quitada', siLoca(e => decir('pierdePoder', {n: e.a, o: e.por}, 1.2, 2)));
  BT.on('tragada', siLoca(e => { decir(e.canicas === 2 ? 'gigante' : 'tragada', {n: e.por, o: e.victima}, 0.8, 2); }));
  BT.on('cohete', siLoca(e => decir('cohete', {n: e.jugador, o: e.objetivo}, 0.2, 3)));
  BT.on('cohete-fallo', siLoca(e => { if (e.motivo !== 'sin objetivo') decir('coheteFallo', {n: e.jugador}, 0.3, 3); }));
  BT.on('reventado', siLoca(e => decir('reventado', {n: e.por, o: e.victima}, 0.8, 3)));
  BT.on('depredador', siLoca(() => decir('depredador', {}, 0.2, 3)));
  BT.on('absorbe', siLoca(e => decir('absorbe', {n: e.jugador}, 0.4, 1)));
  BT.on('revancha', siLoca(e => decir('revanchaEntra', {n: e.jugador}, 1.5, 2)));
  BT.on('barrera-rota', siLoca(() => decir('barreraRota', {}, 0.5, 2)));
  BT.on('eliminado', siLoca(() => { if (!decisivoLoca && totalLoca > 2 && BT.jugadores().filter(j => j.vivo).length === 2){ decisivoLoca = true; decir('decisivo', {}, 2.4, 3); } }));
  BT.on('fin', siLoca(e => { if (e.ganador) decir('victoriaNormal', {n: e.ganador}, 3.5, 2); }));
}
window.ChirasNarrador = {FRASES, frase, decir, stats, cola: () => cola};
})();
