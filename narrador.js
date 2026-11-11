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
  // El narrador solo da LOS DATOS de la verdad: corto y claro
  manda: ['{n} va primero con {k} canicas.'],
  pilas: ['A {n} le quedan {k} canicas.'],
  poderBarrera: ['{n}: Barrera.'], poderDesquadris: ['{n}: Desquadris.'], poderOchera: ['{n} cantó Ochera muere.'], poderCarambola: ['{n} cantó Carambola muere.'],
  poderArena: ['{n}: Arena movediza.'], poderBoloncho: ['{n}: Boloncho.'], poderViento: ['{n}: Viento.'], poderNada: ['{n}: Nada de nada.'],
  barreraRota: ['Barrera rota.'],
  tragada: ['{n} se tragó a {o}.'], gigante: ['{n} está gigante.'], absorbe: ['{n} absorbió una canica.'],
  aroLuz: ['{n} tiene el poder.'], depredador: ['Modo depredador.'],
  cohete: ['Cohete de {n} contra {o}.'], coheteFallo: ['Cohete desviado.'], reventado: ['{n} reventó a {o}.'],
  decisivo: ['Quedan dos.'], ultimoTiro: ['{n} tira para ganar.'],
  remontada: ['Ganó {n}, remontando.'], revanchaGloria: ['Ganó {n}, desde la revancha.'], victoriaNormal: ['Ganó {n}.'],
  revanchaEntra: ['{n} vuelve con la revancha.'], pierdePoder: ['{o} le quitó el poder a {n}.'], primerPoder: ['{n} tiene el poder.'],
  arroyo: ['{n} sacó {k} del arroyuelo.']
};
// Las EMOCIONES van con expresiones cortas y sonidos (burla, risa, lástima, asombro), no con discursos.
// s = sonido · t = lo que se oye/lee · tips = consejo escrito (sin voz) para que provoque aprender
const EXPRESIONES = {
  mePegaron:  {e: [{t: '¡Jajajá!', s: 'risa', i: '😂'}, {t: '¡Uuups!', s: 'uups', i: '😜'}, {t: '¡Ñaña ñaña!', s: 'burla', i: '😝'}],
               tips: ['💡 Si un rival lo tiene en la mira, cante 🛡️ Barrera o 🔄 Desquadris antes de que tire.', '💡 Al que le pegan con el poder lo cazan: no se quede cerquita del que lo tiene.']},
  meAlejaron: {e: [{t: '¡Chao, chao!', s: 'uups', i: '👋'}, {t: '¡Jajajá!', s: 'risa', i: '😂'}, {t: '¡Fiuuu!', s: 'uups', i: '💨'}],
               tips: ['💡 🌀 Arena movediza manda lejos al que se le meta.', '💡 Lejos del hueco tiembla más el pulso: cargue solo la fuerza que necesita.']},
  meQuitaron: {e: [{t: '¡Ñaña ñaña!', s: 'burla', i: '😝'}, {t: '¡Uuups!', s: 'uups', i: '🙊'}],
               tips: ['💡 Con el poder, cante 🚫 Nada de nada para que nadie se defienda.', '💡 El que le pega al que tiene el poder, se lo quita: cuídese la espalda.']},
  meMataron:  {e: [{t: '¡Jajajajá!', s: 'risa', s2: 'trombon', i: '🤣'}, {t: '¡Pelado!', s: 'trombon', i: '😵'}, {t: '¡Buuu!', s: 'buu', i: '👎'}],
               tips: ['💡 La Revancha: ponga otra canica y vuelva desde la raya.', '💡 🕳️ Ochera muere castiga al que caza y se va al hueco.', '💡 🔄 Desquadris le corre la bola dos cuartas: ¡úselo cuando lo apunten!']},
  meTragaron: {e: [{t: '¡Ñam! ¡Jajá!', s: 'risa', i: '😋'}, {t: '¡Buuu!', s: 'buu', i: '👎'}],
               tips: ['💡 A las bolas grandes no se las pueden tragar: solo las revienta el 🚀 Cohete.']},
  desquite:   {e: [{t: '¡Tooome!', s: 'ohh', s2: 'aplauso', i: '😤'}, {t: '¡Ooooh!', s: 'ohh', i: '🔥'}, {t: '¡Toma!', s: 'aplauso', i: '💪'}]},
  porUnPelo:  {e: [{t: '¡Uyyy!', s: 'ohh', i: '😱'}, {t: '¡Ayyy!', s: 'ohh', i: '🤏'}],
               tips: ['💡 El pulso tiembla más entre más fuerza cargue: a veces menos es más.']},
  seLeFue:    {e: [{t: '¡Uuups!', s: 'trombon', i: '🙈'}, {t: '¡Jajá!', s: 'risa', i: '😂'}],
               tips: ['💡 Con el poder, apúntele a la bola más cercana: es la más fácil.']},
  enLaPuerta: {e: [{t: '¡Uyyy!', s: 'ohh', i: '😩'}]},
  meQuede:    {e: [{t: '¡Uuups! ¡Se quedó!', s: 'trombon', i: '🫠'}, {t: '¡Jajá! ¡Adentro!', s: 'risa', i: '😂'}],
               tips: ['💡 Pegue de lado: de frente su bola se queda quieta en el aro.', '💡 Con más fuerza y de ladito, su bola sale junto con la canica.']}
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
// solo se narra lo de la bola de este celular (los finales y momentos de todos sí se cuentan)
const PARA_TODOS = ['victoriaNormal', 'remontada', 'revanchaGloria', 'decisivo', 'depredador'];
function decir(tipo, vars, retraso, prioridad){
  if (!PARA_TODOS.includes(tipo) && vars && N.meToca && !N.meToca([vars.n, vars.o])) return;
  const ex = EXPRESIONES[tipo];
  if (ex){
    const e = ex.e[Math.floor(Math.random() * ex.e.length)];
    const tip = ex.tips && Math.random() < 0.4 ? ex.tips[Math.floor(Math.random() * ex.tips.length)] : null;
    cola.push({tipo, texto: e.t, icono: e.i, sonido: e.s, sonido2: e.s2, tip, en: Math.min(retraso || 0, 0.5), prioridad: (prioridad || 1) + 1, corto: true});
    cola.sort((a, b) => b.prioridad - a.prioridad); if (cola.length > 3) cola.length = 3;
    return;
  }
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
  if (c.corto){
    // expresión: sonido de burla/asombro + la palabra cortica (y a veces un consejo escrito)
    sub.textContent = `${c.icono || ''} ${c.texto}` + (c.tip ? `\n${c.tip}` : '');
    sub.style.whiteSpace = 'pre-line'; sub.classList.add('ver'); subT = c.tip ? 5 : 1.8; hablando = c.tip ? 2.2 : 1.6;
    if (A.sfx[c.sonido]) A.sfx[c.sonido]();
    if (c.sonido2 && A.sfx[c.sonido2]) setTimeout(() => A.sfx[c.sonido2](), 700);
    setTimeout(() => A.voz('expresion', c.texto), 120);
  } else {
    sub.textContent = c.texto; sub.classList.add('ver'); subT = 3.2; hablando = PAUSA;
    A.voz('narrador', c.texto);
  }
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
    // (la rivalidad la muestran los letreros; el narrador solo da datos)
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
// ---- Provocaciones: lo que los rivales le hacen a SU bola (solo se dice en su celular) ----
const esMia = j => !!j && j.humano && !j.ia;
const deudas = {};   // quién le debe a quién: nombre de la persona → último rival que le hizo daño
let antesDist = new Map();
encadenar('alTiro', (b, f, t) => { antesDist = new Map(N.getJugadores().map(j => [j, N.distH(j.bola.p, HOLE)])); });
encadenar('alResolver', e => {
  const s = e.tirador, vict = e.victimas || []; if (!s) return;
  if (!esMia(s)){
    vict.filter(esMia).forEach(v => {
      deudas[v.nombre] = s.nombre;
      if (!v.vivo) return decir(N.esBatalla() ? 'meTragaron' : 'meMataron', {n: s.nombre, o: v.nombre}, 1.6, 5);
      if (e.robo && !v.poder) return decir('meQuitaron', {n: s.nombre, o: v.nombre}, 1.4, 4);
      const a = antesDist.get(v), d = N.distH(v.bola.p, HOLE);
      if (a !== undefined && d - a > 3 && d > 5) return decir('meAlejaron', {n: s.nombre, o: v.nombre}, 1.4, 4);
      if (Math.random() < 0.7) decir('mePegaron', {n: s.nombre, o: v.nombre}, 1.3, 4);
    });
  } else {
    // ¿le devolvió el golpe al que le debía?
    const debe = deudas[s.nombre], cobrado = debe && vict.find(v => v.nombre === debe);
    if (cobrado){ delete deudas[s.nombre]; decir('desquite', {n: s.nombre, o: cobrado.nombre}, 1.2, 5); }
  }
  // Ochera / Carambola cantada por un rival que lo sacó a usted
  if (e.castigo && esMia(s) && !s.vivo && !esMia(e.castigo)){ deudas[s.nombre] = e.castigo.nombre; decir('meMataron', {n: e.castigo.nombre, o: s.nombre}, 1.6, 5); }
});
encadenar('alReventar', (obj, j) => {
  if (esMia(obj) && !esMia(j)){ deudas[obj.nombre] = j.nombre; decir('meMataron', {n: j.nombre, o: obj.nombre}, 1.6, 5); }
  else if (esMia(j) && deudas[j.nombre] === obj.nombre){ delete deudas[j.nombre]; decir('desquite', {n: j.nombre, o: obj.nombre}, 1.2, 5); }
});
encadenar('alResolver', e => { if (e.arroyo && e.tirador) decir('meQuede', {n: e.tirador.nombre}, 0.3, 4); });
encadenar('alSacarArroyo', (j, k) => decir('arroyo', {n: j.nombre, k}, 0.6, 2));
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
