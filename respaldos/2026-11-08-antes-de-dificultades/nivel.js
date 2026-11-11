// =====================================================================
// CHIRAS PELAS — Nivel del jugador y dificultades que se desbloquean
// Cada partida da experiencia (XP). Con la XP se sube de nivel y cada
// 10 niveles se desbloquea una dificultad nueva de la máquina.
// Se guarda en este celular (más adelante se sube al servidor del juego en línea).
// =====================================================================
(function(){
'use strict';
const N = window.ChirasNucleo, A = window.ChirasAudio;
if (!N) return;
const $ = s => document.querySelector(s);
const CLAVE = 'chiras-nivel-v1';
// dificultad → nivel con el que se desbloquea y cuánta XP rinde
const DESBLOQUEO = {novato: 1, principiante: 10, regular: 20, profesional: 30, experto: 40, legendario: 50};
const MULT = {novato: 1, principiante: 1.2, regular: 1.5, profesional: 2, experto: 2.5, legendario: 3};
const XP = {partida: 10, gana: 40, elimina: 15, poder: 8};
const xpParaSubir = n => 80 + 20 * n;   // XP que pide el nivel n para pasar al n+1

// para probar todo sin subir de nivel: abrir el juego con ?desbloquear
const todoAbierto = /desbloquear/.test(location.search);

let datos = {xp: 0, nivel: 1, partidas: 0, victorias: 0};
try { Object.assign(datos, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch (e) {}
const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {} };

const permite = id => todoAbierto || datos.nivel >= (DESBLOQUEO[id] || 1);
function mejorPermitida(){ return Object.keys(DESBLOQUEO).filter(permite).pop(); }

// ---------- menú: insignia de nivel y candados ----------
const css = document.createElement('style');
css.textContent = `.miNivel{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;align-items:center;background:var(--tierra-2);border:2px solid rgba(247,234,208,.25);border-radius:12px;padding:8px 10px;margin-bottom:8px}
.miNivel .num{grid-row:span 2;font-family:var(--display);font-size:26px;color:var(--amarillo);line-height:1;text-align:center;min-width:52px}
.miNivel .num small{display:block;font-size:11px;color:var(--crema);opacity:.8}
.miNivel .barra{height:10px;border-radius:6px;background:rgba(0,0,0,.35);overflow:hidden}
.miNivel .barra i{display:block;height:100%;background:linear-gradient(90deg,var(--amarillo),#ff7b2e)}
.miNivel .txt{font-size:12px;opacity:.85}
#niveles button.bloqueado{opacity:.45}
#niveles button .cand{display:block;font-size:11px;font-family:var(--body);font-weight:700}`;
document.head.appendChild(css);
const insignia = document.createElement('div'); insignia.className = 'miNivel'; insignia.id = 'miNivel';
const cajaNiveles = $('#niveles');
if (cajaNiveles) cajaNiveles.insertAdjacentElement('beforebegin', insignia);

function pintar(){
  const falta = xpParaSubir(datos.nivel), pct = Math.min(100, Math.round(datos.xp / falta * 100));
  const prox = Object.entries(DESBLOQUEO).find(([, n]) => n > datos.nivel);
  insignia.innerHTML = `<div class="num">${datos.nivel}<small>NIVEL</small></div>
    <div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="${falta}" aria-valuenow="${datos.xp}" aria-label="Experiencia"><i style="width:${pct}%"></i></div>
    <div class="txt">${datos.xp} / ${falta} XP${prox && !todoAbierto ? ` · en el nivel ${prox[1]} se abre ${nombreDe(prox[0])}` : ''}</div>`;
  document.querySelectorAll('#niveles button').forEach(b => {
    const id = b.dataset.nv, ok = permite(id);
    b.disabled = false;   // se puede tocar para ver qué falta
    b.classList.toggle('bloqueado', !ok);
    const base = b.dataset.base || (b.dataset.base = b.textContent);
    b.innerHTML = ok ? base : `🔒 ${base.replace(/^\S+\s/, '')}<span class="cand">Nivel ${DESBLOQUEO[id]}</span>`;
  });
  // si la dificultad escogida está bloqueada, se usa la más alta que tenga
  const actual = N.getDificultad ? N.getDificultad() : null;
  if (actual && !permite(actual) && N.ponerDificultad) N.ponerDificultad(mejorPermitida());
}
const nombreDe = id => ({novato: '🐣 Novato', principiante: '🙂 Principiante', regular: '😎 Regular', profesional: '🔥 Profesional', experto: '🎯 Experto', legendario: '👑 Legendario'})[id] || id;

// tocar una dificultad bloqueada: decir cuánto falta (y no cambiarla)
document.querySelectorAll('#niveles button').forEach(b => b.addEventListener('click', e => {
  const id = b.dataset.nv;
  if (permite(id)) return;
  e.stopImmediatePropagation();
  const nota = $('#notaNivel');
  if (nota) nota.textContent = `🔒 ${nombreDe(id)} se desbloquea en el nivel ${DESBLOQUEO[id]}. Usted va en el nivel ${datos.nivel}: ¡a jugar para subir!`;
}, true));

// ---------- ganar XP ----------
// el jugador de este celular: la primera persona (en línea será el dueño del celular)
const yo = () => N.getJugadores().find(j => j.humano && !j.ia) || null;
let ronda = null;
const encadenar = (nombre, fn) => { const antes = N.ganchos[nombre]; N.ganchos[nombre] = (...a) => { if (antes) antes(...a); fn(...a); }; };
encadenar('alIniciarRonda', () => { ronda = {elimina: 0, poder: 0, conIA: N.getJugadores().some(j => j.ia)}; });
encadenar('alResolver', e => {
  const y = yo(); if (!y || !ronda || e.tirador !== y) return;
  ronda.elimina += (e.victimas || []).filter(v => !v.vivo && v !== y).length;
  if (e.encholo && !e.castigo) ronda.poder++;
});
encadenar('alReventar', (obj, j) => { const y = yo(); if (ronda && y && j === y && obj !== y) ronda.elimina++; });
encadenar('alAroLuz', j => { const y = yo(); if (ronda && y && j === y) ronda.poder++; });
encadenar('alTerminar', g => {
  const y = yo(); if (!y || !ronda) return;
  const dif = N.getDificultad ? N.getDificultad() : 'novato';
  const mult = ronda.conIA ? (MULT[dif] || 1) : 1;
  const gano = g === y;
  const base = XP.partida + (gano ? XP.gana : 0) + ronda.elimina * XP.elimina + Math.min(5, ronda.poder) * XP.poder;
  const gana = Math.round(base * mult);
  ronda = null;
  sumar(gana, gano);
});
function sumar(gana, gano){
  datos.partidas++; if (gano) datos.victorias++;
  datos.xp += gana;
  const antes = datos.nivel, abiertas = [];
  while (datos.xp >= xpParaSubir(datos.nivel)){
    datos.xp -= xpParaSubir(datos.nivel); datos.nivel++;
    Object.entries(DESBLOQUEO).forEach(([id, n]) => { if (n === datos.nivel) abiertas.push(id); });
  }
  guardar(); pintar();
  setTimeout(() => {
    N.aviso(`+${gana} XP`);
    if (datos.nivel > antes){
      setTimeout(() => {
        N.aviso(`⭐ ¡SUBIÓ AL NIVEL ${datos.nivel}!` + (abiertas.length ? `\nSe desbloqueó ${abiertas.map(nombreDe).join(' y ')}` : ''));
        if (A){ A.sfx.nivel && A.sfx.nivel(); A.voz('nivel', abiertas.length ? `¡Subió de nivel! Se desbloqueó ${nombreDe(abiertas[0]).replace(/^\S+\s/, '')}` : '¡Subió de nivel!'); }
      }, 1700);
    }
  }, 2200);
  if (N.MODO_PRUEBA) console.log(`[nivel] +${gana} XP → nivel ${datos.nivel} (${datos.xp}/${xpParaSubir(datos.nivel)})`);
}

pintar();
window.ChirasNivel = {datos: () => datos, permite, DESBLOQUEO, xpParaSubir, sumar, pintar,
  reiniciar: () => { datos = {xp: 0, nivel: 1, partidas: 0, victorias: 0}; guardar(); pintar(); }};
})();
