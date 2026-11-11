// Pruebas de las mejoras de espectáculo, progreso y academia.
// Se abren con index.html#prueba-nuevas y escriben en la consola.
(function(){
const B = window.ChirasBatalla, N = window.ChirasNucleo, P = window.ChirasPoderes, S = window.ChirasEspectaculo, G = window.ChirasProgreso, AC = window.ChirasAcademia;
let ok = 0, mal = 0;
const check = (nombre, cond, detalle) => { cond ? ok++ : mal++; console.log(`[test] ${cond ? 'PASA ' : 'FALLA'} ${nombre}${detalle ? ' — ' + detalle : ''}`); };
const nueva = o => { B.iniciar(Object.assign({contraIA: false, nombres: ['Ana', 'Beto'], extras: false, sinCuenta: true}, o || {})); return B.jugadores(); };
function poner(j, x, z){ const b = j.bola; Object.assign(b, {enMano: false, enHueco: false, cayendo: false, ignorarHueco: false}); b.p.set(x, N.R, z); b.v.set(0, 0, 0); b.last.copy(b.p); }
const correr = seg => { for (let i = 0; i < Math.round(seg * 60); i++) B.paso(1 / 60); };
function tirar(j, x, z, extra, desvio){
  const ang = N.angHacia(j.bola.p, {x, z}) + (desvio || 0), d = Math.hypot(x - j.bola.p.x, z - j.bola.p.z);
  return B.disparar(j, ang, B.fuerzaDeVel(N.velocidadPara(j.bola.p, ang, d + (extra || 0), j.bola.enMano)));
}
const H = N.HOLE;
let a, b, antes;

try {
// ---- 1 y 6: transformación y corona
[a, b] = nueva(); poner(a, 0, -16); poner(b, 5, -10);
tirar(a, H.x, H.z, 0.05); correr(3);
check('Al encholar: LA VERDAD, corona y la canica crece', a.verdad && S.reyes().includes('Ana') && a.bola.mesh.scale.x > 1.25, `escala ${a.bola.mesh.scale.x.toFixed(2)}`);
check('Al encholar: anuncio de transformación', S.stats.transformaciones >= 1);
// sacarle el hueco y que Beto le quite la verdad
B.colocar(a, {x: 0, z: -12}); B.colocar(b, {x: 0, z: -10}); a.bola.mesh.scale.setScalar(a.bola.mesh.scale.x);
tirar(b, 0, -12, 2); correr(4);
check('Si le quitan LA VERDAD, pierde la corona y vuelve a su tamaño', !a.verdad && !S.reyes().includes('Ana') && Math.abs(a.bola.mesh.scale.x - 1) < 1e-6);

// ---- 3: golpes espectaculares
P.ESPECTACULO.eliminacion = 'explotar';
[a, b] = nueva(); a.verdad = true; poner(a, 0, -5); poner(b, 0, -7);
antes = S.stats.estallidos; tirar(a, 0, -7, 2); correr(7);
check('Eliminación: estalla en cientos de fragmentos', !b.vivo && S.stats.estallidos === antes + 1, `${P.ESPECTACULO.fragmentos} chispas y 36 vidrios`);
P.ESPECTACULO.eliminacion = 'aplastar';
[a, b] = nueva(); a.verdad = true; poner(a, 0, -5); poner(b, 0, -7);
antes = S.stats.aplastados; tirar(a, 0, -7, 2); correr(7);
check('Eliminación: aplastada', !b.vivo && S.stats.aplastados === antes + 1);
P.ESPECTACULO.eliminacion = 'azar';
[a, b] = nueva(); poner(a, 0, -5); poner(b, 0, -7);
antes = S.stats.estallidos + S.stats.aplastados; tirar(a, 0, -7, 2); correr(6);
check('Un choque sin LA VERDAD no hace explosión', b.vivo && S.stats.estallidos + S.stats.aplastados === antes);

// ---- tiros maestros y repetición
[a, b] = nueva(); a.verdad = true; poner(a, 0, -2); poner(b, 0, -12);
antes = S.stats.maestros;
let huboRepeticion = false;
B.on('eliminado', () => { huboRepeticion = huboRepeticion || S.repeticionActiva(); });
tirar(a, 0, -12, 2); correr(8);
check('Tiro maestro: golpe desde 10 m', S.stats.maestros === antes + 1);
check('Repetición épica tras eliminación extraordinaria', !b.vivo && huboRepeticion && S.stats.repeticiones >= 1);
check('La repetición dura ~2 s y la partida sigue', (correr(2.5), !S.repeticionActiva()));
[a, b] = nueva(); poner(a, 0, -6); poner(b, 6, 0);
antes = S.stats.maestros; tirar(a, H.x, H.z, 0.05); correr(5);
check('Tiro maestro: enchole desde 14 m', a.verdad && S.stats.maestros === antes + 1);
[a, b] = nueva(); a.verdad = true; poner(a, 0, -5); poner(b, 0, -7);
antes = S.stats.maestros; huboRepeticion = false; tirar(a, 0, -7, 2); correr(7);
check('Un golpe corto normal no es tiro maestro ni tiene repetición', S.stats.maestros === antes && !huboRepeticion);

// ---- combos
[a, b] = nueva({extras: true}); poner(a, 0, -5); poner(b, 0, -9);
antes = S.stats.combos;
B.activarPoder(a, 'turbo'); B.activarPoder(a, 'barrera'); correr(0.1);
check('Combo Escape blindado: Turbo + Barrera', S.stats.combos === antes + 1 && a.escudo > 7.5, `barrera ${a.escudo.toFixed(1)} s`);
check('Combo respeta recargas (no las reinicia)', a.recarga.turbo > 20 && a.recarga.barrera > 9);
[a, b] = nueva({extras: true}); poner(a, 0, -5); poner(b, 0, -9);
antes = S.stats.combos; B.activarPoder(a, 'barrera'); correr(0.1);
check('Un solo poder no hace combo', S.stats.combos === antes);

// ---- eventos sorpresa
[a, b] = nueva({especial: false}); poner(a, -3, -5); poner(b, 3, -5);
antes = S.stats.eventos; correr(45);
check('Partida normal: no hay eventos sorpresa', S.stats.eventos === antes);
[a, b] = nueva({especial: true}); poner(a, 0, -5); poner(b, 6, -5);
antes = S.stats.eventos; correr(30);
check('Partida especial: aparecen eventos sorpresa solos', S.stats.eventos > antes, `${S.stats.eventos - antes} eventos en 30 s`);
S.terminarEvento(); S.lanzarEvento('viento'); S.eventoActual().dir.set(1, 0, 0);
poner(a, 0, -2); tirar(a, 0, -12); correr(4);
check('Viento: desvía la canica que rueda', a.bola.p.x > 0.1, `se corrió ${a.bola.p.x.toFixed(2)} m`);
S.terminarEvento(); S.lanzarEvento('movediza'); S.eventoActual().centro.set(a.bola.p.x, 0, a.bola.p.z); correr(1 / 60);
check('Arena movediza: frena más dentro de la zona', a.bola.freno === P.ESPECTACULO.eventos.movedizaFreno);
S.terminarEvento(); correr(1 / 60);
check('Al acabar el evento todo vuelve a lo normal', a.bola.freno === 1 && !S.eventoActual());

// ---- canicas legendarias
let errLeg = null;
try {
  G.LEGENDARIAS.forEach(L => G.desbloquear(L.id));
  ['sol', 'dragon', 'agujero', 'diamante'].forEach((id, k) => {
    [a, b] = nueva({canicas: [() => G.crearLegendaria(id), () => G.crearLegendaria(['diamante', 'sol', 'dragon', 'agujero'][k])]});
    poner(a, 0, -5); poner(b, 2, -9); tirar(a, 0, -12); correr(1.5);
  });
} catch (e){ errLeg = e.message; }
check('Las 4 canicas legendarias se crean, ruedan y se animan', !errLeg, errLeg || 'Sol Dorado, Dragón de Fuego, Agujero Negro, Diamante Cósmico');
[a, b] = nueva({canicas: [() => G.crearLegendaria('dragon')]}); poner(a, 0, -5);
const velLeg = (B.disparar(a, 0, 0.5), a.bola.v.length());
[a, b] = nueva(); poner(a, 0, -5);
const velNor = (B.disparar(a, 0, 0.5), a.bola.v.length());
check('Las legendarias no dan ventaja (misma fuerza y física)', Math.abs(velLeg - velNor) < 1e-9);

// ---- ligas y trofeos
const ganarContraIA = () => {
  const [h, m] = nueva({contraIA: true, nombres: ['Liga']});
  h.verdad = true; poner(h, 0, -5); poner(m, 0, -7); m.iaE.espera = 99; m.usos.barrera = 0; m.usos.descuadris = 0;
  tirar(h, 0, -7, 2); correr(6);
  return !m.vivo;
};
ganarContraIA();
check('Liga: la victoria se cuenta y da trofeo', G.perfil('Liga').victorias === 1 && G.perfil('Liga').partidas === 1 && G.perfil('Liga').trofeos.includes('primera'));
check('Fin de partida muestra el progreso', !!document.querySelector('#btFinProg') && /Liga/.test(document.querySelector('#btFinProg').textContent));
ganarContraIA(); ganarContraIA();
check('Liga: con 3 victorias sube a Experto', G.nivelDe(G.perfil('Liga')).id === 'experto');
nueva({contraIA: true, nombres: ['Liga']});
check('Liga: la máquina juega mejor en Experto', Math.abs(P.CONFIG.ia.errorAng - 0.045 * 0.85) < 1e-9, `error ${P.CONFIG.ia.errorAng.toFixed(4)}`);
nueva({contraIA: true, nombres: ['Nuevo']});
check('Liga: un Novato tiene la máquina de siempre', Math.abs(P.CONFIG.ia.errorAng - 0.045) < 1e-9);

// ---- academia
document.querySelector('#btNom1').value = 'Alumno';
AC.empezar(AC.RETOS[0]); a = B.jugadores()[0];
tirar(a, H.x, H.z, 0.05); correr(5);
check('Academia: enchole a 5 m al primer intento = 3 estrellas', G.perfil('Alumno').academia.r5 === 3 && !document.querySelector('#acaRes').hidden);
AC.empezar(AC.RETOS[1]); a = B.jugadores()[0];
tirar(a, H.x, H.z, 0, 0.6); correr(8);
check('Academia: si falla, vuelve a poner la bola y cuenta el intento', AC.estado().intento === 1 && Math.abs(a.bola.p.x - 4) < 0.01 && Math.abs(a.bola.p.z + 8.7) < 0.01);
AC.empezar(AC.RETOS[3]); a = B.jugadores()[0];
const bl = B.jugadores()[1];
tirar(a, bl.bola.p.x, bl.bola.p.z, 2); correr(6);
check('Academia: golpear la canica blanco', G.perfil('Alumno').academia.blanco === 3);
AC.empezar(AC.RETOS[4]); a = B.jugadores()[0];
tirar(a, -8, -45); correr(10);
check('Academia: potencia exacta en el círculo', G.perfil('Alumno').academia.exacto === 3);
check('Academia: la canica blanco nunca tira sola', !B.registro().some(e => e.tipo === 'tiro' && e.jugador === 'Blanco'));
} catch (e){ mal++; console.log('[test] FALLA excepción: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }

console.log(`[test] RESUMEN ${ok} pasan, ${mal} fallan`);
})();
